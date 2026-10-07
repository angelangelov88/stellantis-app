import type { Handler } from "../../../src/types/Server";
import { checkOrigin } from "../../_lib/csrf";
import { allowMethods } from "../../_lib/http";
import { clearCookie } from "../../_lib/session";

// POST /api/auth/logout. Clears the cookie. Always succeeds.
const handler: Handler = (req, res) => {
  if (!allowMethods(req, res, ["POST"]) || !checkOrigin(req, res)) return;
  clearCookie(res);
  res.status(204).end();
};

export default handler;
