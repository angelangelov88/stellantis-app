import type { PreconditionStatus } from "../../src/types/Api";
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

// Reads the car's preconditioning state out of psacc's vehicle info. The field
// is spelled "preconditionning" by the car API, and its status is a free-form
// string ("Enabled", "Disabled", "Finished", "Failed", ...), so map defensively
// and keep the raw value.
const readStatus = (info: unknown): PreconditionStatus => {
  const ac = asRecord(
    asRecord(asRecord(info)?.preconditionning)?.air_conditioning,
  );
  const raw = typeof ac?.status === "string" ? ac.status : null;
  const updatedAt = typeof ac?.updated_at === "string" ? ac.updated_at : null;
  const lower = raw?.toLowerCase() ?? "";
  const state: PreconditionStatus["state"] =
    raw === null
      ? "unknown"
      : lower.startsWith("enabl")
        ? "on"
        : lower === "disabled" || lower === "finished"
          ? "off"
          : "unknown";
  return { state, raw, updatedAt };
};

// The car's current preconditioning state. We deliberately do NOT use psacc's
// from_cache copy: that cache can lag the car by hours, so a command would
// never appear to confirm. A plain get_vehicleinfo returns psacc's latest known
// state (refreshed from the car's reports) and is fast — it reads server state,
// it does not wake the car.
const getPreconditionStatus = async (): Promise<PreconditionStatus> => {
  const vin = await vehicleVin();
  const info = await psaccGet(`/get_vehicleinfo/${encodeURIComponent(vin)}`);
  return readStatus(info);
};

export { setPreconditioning, getPreconditionStatus };
