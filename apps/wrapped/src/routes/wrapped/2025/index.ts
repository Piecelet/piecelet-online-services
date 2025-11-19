import { Hono } from "hono";
import type { CloudflareBindings } from "../../../env";
import type { AuthContext } from "../../../middleware/auth";
import marks from "./marks";

const app2025 = new Hono<{ Bindings: CloudflareBindings; Variables: AuthContext }>();

app2025.route("/marks", marks);

export default app2025;
