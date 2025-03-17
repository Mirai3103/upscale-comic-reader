import { Hono } from "hono";
import { PORT } from "./config/env";
import processRouter from "./routes/processRoutes";
import { combinedTemplate } from "./utils/processListTemplate";
import { cors } from "hono/cors";
// Create the main application
const app = new Hono();
app.use("/api/*", cors({ origin: "*" }));
// Register routes
app.route("/api", processRouter);
app.get("/", (c) => c.html(combinedTemplate()));

// Start the server
export default {
	port: PORT,
	fetch: app.fetch,
};

console.log(`Server running on port ${PORT}`);
