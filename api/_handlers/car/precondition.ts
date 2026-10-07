import type { PreconditionResult } from "../../../src/types/Api";
import type { Handler } from "../../../src/types/Server";
import { precondSchema } from "../../../src/lib/apiSchemas";
import { checkOrigin } from "../../_lib/csrf";
import { allowMethods, sendError } from "../../_lib/http";
import { rateLimit } from "../../_lib/rateLimit";
import { requireUser } from "../../_lib/session";
import { setPreconditioning } from "../../_lib/psacc";

// POST /api/car/precondition { on }. The one update call: turn the car's
// preconditioning on or off, via psacc.
const handler: Handler = async (req, res) => {
  if (!allowMethods(req, res, ["POST"]) || !checkOrigin(req, res)) return;
  if (!requireUser(req, res)) return;
  // One shared account, so a single constant key for the whole app.
  if (!rateLimit(res, "command", "app")) return;

  const parsed = precondSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 400, "bad_request", "Say whether to turn preconditioning on or off");
    return;
  }
  await setPreconditioning(parsed.data.on);
  const body: PreconditionResult = { status: "sent", on: parsed.data.on };
  res.json(body);
};

export default handler;
