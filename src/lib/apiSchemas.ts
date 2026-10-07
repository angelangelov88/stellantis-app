import { z } from "zod";

// Request bodies shared by the app and the api/ functions. Parsed on the
// server; the app uses the inferred types.

const loginSchema = z.object({
  // The single shared app password. Length-bounded so a huge body can't be
  // forced through the comparison.
  password: z.string().min(1).max(256),
});

const precondSchema = z.object({
  on: z.boolean(),
});

// The four weekly preconditioning schedules, in the car's own wire shape (as
// psacc's /preconditioning_program expects). day is 7 Monday-first flags, hour
// is 0-23 or the car's 34 "unset" sentinel, on is 0/1.
const dayFlag = z.union([z.literal(0), z.literal(1)]);
const precondProgramSchema = z.object({
  day: z.array(dayFlag).length(7),
  hour: z
    .number()
    .int()
    .refine((h) => (h >= 0 && h <= 23) || h === 34),
  minute: z.number().int().min(0).max(59),
  on: dayFlag,
});
const precondProgramsSchema = z.object({
  program1: precondProgramSchema,
  program2: precondProgramSchema,
  program3: precondProgramSchema,
  program4: precondProgramSchema,
});

export {
  loginSchema,
  precondSchema,
  precondProgramSchema,
  precondProgramsSchema,
};
