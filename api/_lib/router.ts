import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Handler } from "../../src/types/Server";
import { AppError } from "./appError";
import { sendError } from "./http";

// Builds one Vercel function that serves several endpoints, picked by the last
// part of the path: /api/auth/login runs handlers.login. Read from the URL
// rather than req.query, so a ?action= query parameter can't change it.
const createRouter =
  (handlers: Record<string, Handler>) =>
  async (req: VercelRequest, res: VercelResponse) => {
    // No reply from these endpoints should be cached; handlers can override it.
    res.setHeader("Cache-Control", "private, no-store");
    const name = new URL(req.url ?? "/", "http://localhost").pathname
      .split("/")
      .at(-1);
    const handler =
      name && Object.hasOwn(handlers, name) ? handlers[name] : undefined;
    if (!handler) {
      sendError(res, 404, "not_found", "Not found");
      return;
    }
    try {
      await handler(req, res);
    } catch (error) {
      if (res.headersSent) return;
      if (error instanceof AppError) {
        sendError(res, error.status, error.code, error.message);
        return;
      }
      // Only the kind of error: messages can hold tokens or request details.
      console.error(
        `${name ?? "route"} failed:`,
        error instanceof Error ? error.name : "unknown",
      );
      sendError(res, 500, "server_error", "Something went wrong");
    }
  };

export { createRouter };
