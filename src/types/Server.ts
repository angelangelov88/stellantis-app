import type { VercelRequest, VercelResponse } from "@vercel/node";

// Types for the Vercel functions in api/. Server-only: never imported by the app.

// One endpoint. Several share a Vercel function through a router, because the
// Hobby plan allows at most 12 functions per deployment.
type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void> | void;

export type { Handler };
