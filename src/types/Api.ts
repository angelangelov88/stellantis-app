import type { z } from "zod";
import type { loginSchema, precondSchema } from "../lib/apiSchemas";

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

// The command is fire-and-forget: psacc publishes it to the car and returns at
// once, so "sent" means dispatched, not confirmed by the car.
type PreconditionResult = {
  status: "sent";
  on: boolean;
};

// GET /api/car/status: the car's live preconditioning state, read back from the
// car so the app can confirm a command actually took effect.
// "unknown" when the car hasn't reported a state psacc understands.
type PreconditionState = "on" | "off" | "unknown";

type PreconditionStatus = {
  state: PreconditionState;
  // The raw status string from the car (e.g. "Enabled"), for display/debugging.
  raw: string | null;
  // When the car last reported this, as psacc gives it.
  updatedAt: string | null;
};

export type {
  ApiError,
  Me,
  LoginBody,
  PreconditionBody,
  PreconditionResult,
  PreconditionState,
  PreconditionStatus,
};
