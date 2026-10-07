import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clientIp, sendError } from "./http";

// Small in-memory rate limits. This is a single-user personal app with no
// database, so counters live in the function instance's memory. Vercel runs
// several instances, so this is best-effort, not exact: it's a brake on
// runaway loops and password guessing, not a hard quota. The real gate is the
// shared password plus the signed cookie.

const LIMITS = {
  // Login attempts per IP: slows guessing of the app password.
  login: { max: 10, windowSeconds: 15 * 60 },
  // Commands sent to the car, per app (keyed by a constant).
  command: { max: 20, windowSeconds: 60 },
} satisfies Record<string, { max: number; windowSeconds: number }>;

type LimitName = keyof typeof LIMITS;

const counters = new Map<string, { count: number; resetAt: number }>();

// Counts one request against a limit for subject. Returns 0 to go ahead,
// otherwise the seconds until the window resets.
const countHit = (name: LimitName, subject: string) => {
  const { max, windowSeconds } = LIMITS[name];
  const key = `${name}:${subject}`;
  const now = Date.now();
  const entry = counters.get(key);
  if (!entry || entry.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return 0;
  }
  entry.count += 1;
  if (entry.count <= max) return 0;
  return Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
};

// countHit for a JSON endpoint. Returns true to go ahead, or false after
// responding 429 with Retry-After.
const rateLimit = (res: VercelResponse, name: LimitName, subject: string) => {
  const wait = countHit(name, subject);
  if (wait === 0) return true;
  res.setHeader("Retry-After", String(wait));
  sendError(res, 429, "rate_limited", "Too many attempts, try again later");
  return false;
};

// For endpoints used before login. Vercel always sets the IP; "unknown" is
// only for local development.
const limitByIp = (req: VercelRequest, res: VercelResponse, name: LimitName) =>
  rateLimit(res, name, clientIp(req) ?? "unknown");

export { countHit, rateLimit, limitByIp };
