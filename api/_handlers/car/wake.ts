import type { Handler } from "../../../src/types/Server";
import { checkOrigin } from "../../_lib/csrf";
import { allowMethods } from "../../_lib/http";
import { rateLimit } from "../../_lib/rateLimit";
import { requireUser } from "../../_lib/session";
import { wakeUpCar } from "../../_lib/psacc";

// POST /api/car/wake. Prompts the car to come online and report a fresh state
// so the dashboard can refresh. It reaches the car, so it takes the Origin
// check and the command rate limit, like preconditioning.
const handler: Handler = async (req, res) => {
  if (!allowMethods(req, res, ["POST"]) || !checkOrigin(req, res)) return;
  if (!requireUser(req, res)) return;
  if (!rateLimit(res, "command", "app")) return;

  await wakeUpCar();
  res.json({ status: "sent" });
};

export default handler;
