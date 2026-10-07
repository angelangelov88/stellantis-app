import type {
  CarStatus,
  PreconditionState,
  PrecondPrograms,
} from "../../src/types/Api";
import { precondProgramsSchema } from "../../src/lib/apiSchemas";
import { AppError, carUnavailable } from "./appError";

// Client for the psa_car_controller (psacc) instance that actually talks to
// the car. psacc runs on its own always-on host and does the Stellantis login,
// the OTP step and the MQTT remote commands. We only call its local HTTP API.
//
// psacc has no auth of its own, so it must never be exposed to the internet
// raw: it sits behind a reverse proxy that requires PSACC_TOKEN, and this is
// the only caller that holds that token.

// A preconditioning command goes to the car over MQTT. psacc blocks until the
// car answers, and an asleep car must be woken first, so this can take ~60s.
const TIMEOUT_MS = 90_000;

const baseUrl = () => {
  const url = process.env.PSACC_URL;
  if (!url) throw new Error("PSACC_URL must be set");
  return url.replace(/\/$/, "");
};

const authHeaders = (): Record<string, string> => {
  const token = process.env.PSACC_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const psaccGet = async (path: string): Promise<unknown> => {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Network error or timeout: never surface the cause (it can carry the URL).
    throw carUnavailable();
  }
  if (!res.ok) throw carUnavailable();
  try {
    return (await res.json()) as unknown;
  } catch {
    throw carUnavailable();
  }
};

const psaccPost = async (path: string, body: unknown): Promise<unknown> => {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw carUnavailable();
  }
  if (!res.ok) throw carUnavailable();
  try {
    return (await res.json()) as unknown;
  } catch {
    throw carUnavailable();
  }
};

// The VIN of the car to control: the VEHICLE_VIN override, else the first car
// psacc knows about. Cached for the life of the instance.
let cachedVin: string | null = null;
const vehicleVin = async () => {
  const override = process.env.VEHICLE_VIN;
  if (override) return override;
  if (cachedVin) return cachedVin;
  const list = await psaccGet("/get_vehicles");
  const first = Array.isArray(list) ? (list[0] as { vin?: unknown }) : null;
  const vin = first && typeof first.vin === "string" ? first.vin : null;
  if (!vin)
    throw new AppError(502, "no_vehicle", "No car found in the car service");
  cachedVin = vin;
  return vin;
};

// Wakes the car so it comes online and reports a fresh state (battery, charge,
// schedules) over MQTT. No preconditioning is started and nothing is changed on
// the car — it just prompts a report. psacc rate-limits this on its own side.
const wakeUpCar = async () => {
  const vin = await vehicleVin();
  await psaccGet(`/wakeup/${encodeURIComponent(vin)}`);
};

// Turns preconditioning on or off. psacc publishes the command to the car and
// returns at once, so this resolves when the command is dispatched, not when
// the car confirms it.
const setPreconditioning = async (on: boolean) => {
  const vin = await vehicleVin();
  await psaccGet(
    `/preconditioning/${encodeURIComponent(vin)}/${on ? "1" : "0"}`,
  );
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

// The preconditioning status is a free-form string from the car ("Enabled",
// "Disabled", "Finished", "Failed", ...), so map defensively.
const toPreconditionState = (raw: string | null): PreconditionState => {
  const lower = raw?.toLowerCase() ?? "";
  if (raw === null) return "unknown";
  if (lower.startsWith("enabl")) return "on";
  if (lower === "disabled" || lower === "finished") return "off";
  return "unknown";
};

// Reads a car snapshot out of psacc's get_vehicleinfo. Every field is optional
// in the car API, so each is parsed defensively and falls back to null.
const readStatus = (info: unknown): CarStatus => {
  const root = asRecord(info);

  // "preconditionning" is the car API's spelling.
  const ac = asRecord(asRecord(root?.preconditionning)?.air_conditioning);
  const preconditionRaw = asString(ac?.status);

  // energy is an array; the electric entry carries battery and charging.
  const energyList = Array.isArray(root?.energy) ? root.energy : [];
  const energy = asRecord(energyList[0]);
  const charging = asRecord(energy?.charging);
  const chargeStatus = asString(charging?.status);

  const coords = asRecord(asRecord(root?.last_position)?.geometry)?.coordinates;
  const lon = Array.isArray(coords) ? asNumber(coords[0]) : null;
  const lat = Array.isArray(coords) ? asNumber(coords[1]) : null;

  return {
    precondition: toPreconditionState(preconditionRaw),
    preconditionRaw,
    batteryPercent: asNumber(energy?.level),
    rangeKm: asNumber(energy?.autonomy),
    charging: {
      plugged: charging?.plugged === true,
      charging: chargeStatus === "InProgress",
      status: chargeStatus,
    },
    outsideTempC: asNumber(asRecord(asRecord(root?.environment)?.air)?.temp),
    odometerKm: asNumber(asRecord(root?.timed_odometer)?.mileage),
    location: lat !== null && lon !== null ? { lat, lon } : null,
    updatedAt: asString(energy?.updated_at) ?? asString(ac?.updated_at),
  };
};

// The car's current snapshot. We deliberately do NOT use psacc's from_cache
// copy: that cache can lag the car by hours, so a command would never appear to
// confirm. A plain get_vehicleinfo returns psacc's latest known state
// (refreshed from the car's reports) and is fast — it reads server state, it
// does not wake the car.
const getCarStatus = async (): Promise<CarStatus> => {
  const vin = await vehicleVin();
  const info = await psaccGet(`/get_vehicleinfo/${encodeURIComponent(vin)}`);
  return readStatus(info);
};

// The four weekly preconditioning schedules as psacc knows them. psacc only
// learns these from the car's MQTT reports, so this can be empty/default until
// the car has reported — validated into our wire shape, carUnavailable if not.
const getPreconditionPrograms = async (): Promise<PrecondPrograms> => {
  const vin = await vehicleVin();
  const data = await psaccGet(
    `/preconditioning_program/${encodeURIComponent(vin)}`,
  );
  const parsed = precondProgramsSchema.safeParse(data);
  if (!parsed.success) throw carUnavailable();
  return parsed.data;
};

// Writes the four schedules back to the car via psacc. The caller validates the
// body; psacc pushes it to the car over MQTT and returns at once.
const setPreconditionPrograms = async (programs: PrecondPrograms) => {
  const vin = await vehicleVin();
  await psaccPost(
    `/preconditioning_program/${encodeURIComponent(vin)}`,
    programs,
  );
};

export {
  wakeUpCar,
  setPreconditioning,
  getCarStatus,
  getPreconditionPrograms,
  setPreconditionPrograms,
};
