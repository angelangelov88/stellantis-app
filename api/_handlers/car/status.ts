import type { CarStatus } from "../../../src/types/Api";
import type { Handler } from "../../../src/types/Server";
import { allowMethods } from "../../_lib/http";
import { requireUser } from "../../_lib/session";
import { getCarStatus } from "../../_lib/psacc";

// GET /api/car/status. A snapshot of the car (preconditioning, battery, range,
// charging, ...), so the app can confirm a command took effect and show state.
// A read-only query, hence no Origin/CSRF check.
const handler: Handler = async (req, res) => {
  if (!allowMethods(req, res, ["GET"])) return;
  if (!requireUser(req, res)) return;
  const status: CarStatus = await getCarStatus();
  res.json(status);
};

export default handler;
