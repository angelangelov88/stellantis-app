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

export { loginSchema, precondSchema };
