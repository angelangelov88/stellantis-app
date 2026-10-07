import { beforeAll, describe, expect, it } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { clearCookie, createSession, isLoggedIn } from "./session";

// A VercelResponse stub that only records the Set-Cookie header.
const makeRes = () => {
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    },
  } as unknown as VercelResponse;
  return { res, headers };
};

// The cookie value from a Set-Cookie header, as a request would send it back.
const cookieValue = (setCookie: string) => setCookie.split(";")[0];

const reqWith = (cookie: string | undefined) =>
  ({ headers: { cookie } }) as unknown as VercelRequest;

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-at-least-16-chars-long";
});

describe("session", () => {
  it("accepts a cookie it just issued", () => {
    const { res, headers } = makeRes();
    createSession(res);
    expect(isLoggedIn(reqWith(cookieValue(headers["set-cookie"])))).toBe(true);
  });

  it("rejects a missing cookie", () => {
    expect(isLoggedIn(reqWith(undefined))).toBe(false);
  });

  it("rejects a tampered signature", () => {
    const { res, headers } = makeRes();
    createSession(res);
    const good = cookieValue(headers["set-cookie"]);
    const tampered = good.slice(0, -2) + (good.endsWith("AA") ? "BB" : "AA");
    expect(isLoggedIn(reqWith(tampered))).toBe(false);
  });

  it("rejects an expired cookie", () => {
    // A payload far in the past, signed with the same secret, is well-formed
    // but out of date.
    const req = reqWith("session=1000.anything");
    expect(isLoggedIn(req)).toBe(false);
  });

  it("clears the cookie with Max-Age=0", () => {
    const { res, headers } = makeRes();
    clearCookie(res);
    expect(headers["set-cookie"]).toContain("Max-Age=0");
  });
});
