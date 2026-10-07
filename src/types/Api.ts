import type { z } from "zod";
import type {
  loginSchema,
  precondSchema,
  precondProgramSchema,
  precondProgramsSchema,
} from "../lib/apiSchemas";

// Shared by the api/ functions and the app.

// The JSON body of every error response.
type ApiError = {
  code: string;
  message: string;
};

// GET /api/auth/me: whether this browser is logged in.
type Me = {
  loggedIn: boolean;
};

// POST /api/auth/login. The single app password (not any Stellantis secret).
type LoginBody = z.infer<typeof loginSchema>;

// POST /api/car/precondition. Turn preconditioning on or off.
type PreconditionBody = z.infer<typeof precondSchema>;

// One weekly preconditioning schedule, in the car's wire shape.
type PrecondProgram = z.infer<typeof precondProgramSchema>;

// GET/PUT /api/car/schedules: all four schedules, in the car's wire shape.
type PrecondPrograms = z.infer<typeof precondProgramsSchema>;

// The command is fire-and-forget: psacc publishes it to the car and returns at
// once, so "sent" means dispatched, not confirmed by the car.
type PreconditionResult = {
  status: "sent";
  on: boolean;
};

// The car's preconditioning state, read back so the app can confirm a command
// took effect. "unknown" when the car hasn't reported a state psacc understands.
type PreconditionState = "on" | "off" | "unknown";

// The charge port / charging situation.
type ChargingInfo = {
  plugged: boolean;
  // True only while actively charging (not merely plugged in).
  charging: boolean;
  // Raw psacc status, e.g. "Disconnected" / "InProgress", for display.
  status: string | null;
};

// Where the car last reported being.
type CarLocation = {
  lat: number;
  lon: number;
};

// GET /api/car/status: a snapshot of the car, read from psacc's get_vehicleinfo.
// Every field is nullable because the car API leaves fields empty when it has
// nothing fresh to report.
type CarStatus = {
  precondition: PreconditionState;
  // The raw preconditioning status string (e.g. "Enabled"), for display/debug.
  preconditionRaw: string | null;
  batteryPercent: number | null;
  rangeKm: number | null;
  charging: ChargingInfo;
  outsideTempC: number | null;
  odometerKm: number | null;
  location: CarLocation | null;
  // When the car last reported this snapshot, as psacc gives it.
  updatedAt: string | null;
};

export type {
  ApiError,
  Me,
  LoginBody,
  PreconditionBody,
  PrecondProgram,
  PrecondPrograms,
  PreconditionResult,
  PreconditionState,
  ChargingInfo,
  CarLocation,
  CarStatus,
};
