import type { Me } from "../../../src/types/Api";
import type { Handler } from "../../../src/types/Server";
import { allowMethods } from "../../_lib/http";
import { isLoggedIn } from "../../_lib/session";

// GET /api/auth/me. Lets the app decide whether to show the login screen.
const handler: Handler = (req, res) => {
  if (!allowMethods(req, res, ["GET"])) return;
  const body: Me = { loggedIn: isLoggedIn(req) };
  res.json(body);
};

export default handler;
