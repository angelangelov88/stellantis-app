import type { PreconditionStatus } from "../../../src/types/Api";
import type { Handler } from "../../../src/types/Server";
import { allowMethods } from "../../_lib/http";
import { requireUser } from "../../_lib/session";
import { getPreconditionStatus } from "../../_lib/psacc";

// GET /api/car/status. The car's live preconditioning state, so the app can
// confirm a command took effect. A read-only query, hence no Origin/CSRF check.
const handler: Handler = async (req, res) => {
  if (!allowMethods(req, res, ["GET"])) return;
  if (!requireUser(req, res)) return;
  const status: PreconditionStatus = await getPreconditionStatus();
  res.json(status);
};

export default handler;
