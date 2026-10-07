import { timingSafeEqual } from "node:crypto";
import type { Handler } from "../../../src/types/Server";
import { loginSchema } from "../../../src/lib/apiSchemas";
import { checkOrigin } from "../../_lib/csrf";
import { allowMethods, sendError } from "../../_lib/http";
import { limitByIp } from "../../_lib/rateLimit";
import { createSession } from "../../_lib/session";

// Constant-time string compare, so a wrong password can't be guessed from how
// long the check takes.
const sameSecret = (a: string, b: string) => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};

// POST /api/auth/login { password }. One shared password gates the whole app.
const handler: Handler = (req, res) => {
  if (!allowMethods(req, res, ["POST"]) || !checkOrigin(req, res)) return;
  if (!limitByIp(req, res, "login")) return;

  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    sendError(res, 503, "not_configured", "The app isn't set up yet");
    return;
  }
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, "bad_request", "Enter your password");
    return;
  }
  if (!sameSecret(parsed.data.password, expected)) {
    sendError(res, 401, "wrong_password", "Wrong password");
    return;
  }
  createSession(res);
  res.status(204).end();
};

export default handler;
