import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendError } from "./http";

// A stateless signed-cookie session. There is one shared app password and no
// database: a valid cookie is just an expiry time signed with SESSION_SECRET,
// so the server keeps no session state and nothing in the cookie is secret to
// forge. The HMAC can't be produced without the secret, so it can't be faked.

const DAYS = 30;
const MAX_AGE = DAYS * 24 * 60 * 60;

// Secure cookies need HTTPS, which localhost doesn't have. Deployed, the
// __Host- prefix also stops a subdomain from setting the cookie.
const secure = !!process.env.VERCEL;
const COOKIE = secure ? "__Host-session" : "session";

const secret = () => {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16)
    throw new Error("SESSION_SECRET must be set (at least 16 characters)");
  return value;
};

const sign = (payload: string) =>
  createHmac("sha256", secret()).update(payload).digest("base64url");

// token = "<expiry ms>.<hmac>". Lives in the cookie; no server state.
const makeToken = () => {
  const payload = String(Date.now() + MAX_AGE * 1000);
  return `${payload}.${sign(payload)}`;
};

const tokenValid = (token: string) => {
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!/^\d+$/.test(payload)) return false;
  const expected = sign(payload);
  const given = Buffer.from(mac);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) return false;
  return Number(payload) > Date.now();
};

const cookieHeader = (value: string, maxAgeSeconds: number) =>
  [
    `${COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${String(maxAgeSeconds)}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");

// The session token from the request's cookies, if it looks like one of ours.
const readToken = (req: VercelRequest) => {
  for (const part of (req.headers.cookie ?? "").split(";")) {
    const [name, ...rest] = part.trim().split("=");
    const value = rest.join("=");
    if (name === COOKIE && /^\d+\.[A-Za-z0-9_-]+$/.test(value)) return value;
  }
  return null;
};

// Logs this browser in: sets the signed cookie.
const createSession = (res: VercelResponse) => {
  res.setHeader("Set-Cookie", cookieHeader(makeToken(), MAX_AGE));
};

const clearCookie = (res: VercelResponse) => {
  res.setHeader("Set-Cookie", cookieHeader("", 0));
};

const isLoggedIn = (req: VercelRequest) => {
  const token = readToken(req);
  return token !== null && tokenValid(token);
};

// true when logged in; otherwise responds 401 and returns false.
const requireUser = (req: VercelRequest, res: VercelResponse) => {
  if (isLoggedIn(req)) return true;
  if (readToken(req)) clearCookie(res);
  sendError(res, 401, "unauthenticated", "Please log in");
  return false;
};

export { createSession, clearCookie, isLoggedIn, requireUser };
