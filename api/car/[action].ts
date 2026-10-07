import precondition from "../_handlers/car/precondition";
import schedules from "../_handlers/car/schedules";
import status from "../_handlers/car/status";
import wake from "../_handlers/car/wake";
import { createRouter } from "../_lib/router";

// Sending a command to the car over MQTT can take ~60s when the car is asleep.
export const config = { maxDuration: 60 };

// /api/car/<action>. The code is in api/_handlers/car/.
export default createRouter({ precondition, schedules, status, wake });
