import login from "../_handlers/auth/login";
import logout from "../_handlers/auth/logout";
import me from "../_handlers/auth/me";
import { createRouter } from "../_lib/router";

// /api/auth/<action>. The code is in api/_handlers/auth/.
export default createRouter({ login, logout, me });
