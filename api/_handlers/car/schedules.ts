import type { PrecondPrograms } from "../../../src/types/Api";
import type { Handler } from "../../../src/types/Server";
import { precondProgramsSchema } from "../../../src/lib/apiSchemas";
import { checkOrigin } from "../../_lib/csrf";
import { allowMethods, sendError } from "../../_lib/http";
import { rateLimit } from "../../_lib/rateLimit";
import { requireUser } from "../../_lib/session";
import {
  getPreconditionPrograms,
  setPreconditionPrograms,
} from "../../_lib/psacc";

// GET /api/car/schedules — read the four weekly preconditioning schedules.
// PUT /api/car/schedules — replace them. A write goes to the car, so it takes
// the Origin check and the command rate limit; a read is safe and neither.
const handler: Handler = async (req, res) => {
  if (!allowMethods(req, res, ["GET", "PUT"])) return;
  if (!requireUser(req, res)) return;

  if (req.method === "GET") {
    const programs: PrecondPrograms = await getPreconditionPrograms();
    res.json(programs);
    return;
  }

  if (!checkOrigin(req, res)) return;
  if (!rateLimit(res, "command", "app")) return;

  const parsed = precondProgramsSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(
      res,
      400,
      "bad_request",
      "Those schedules aren't in a valid shape",
    );
    return;
  }
  await setPreconditionPrograms(parsed.data);
  res.json(parsed.data);
};

export default handler;
