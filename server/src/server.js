import "./config/sentry.js";
import app from "./app.js";
import { env } from "./config/env.js";
import { startDueDateNotifier } from "./jobs/dueDateNotifier.js";

app.listen(env.port, () => {
	console.log(`${env.appName} running on http://localhost:${env.port}`);
	startDueDateNotifier();
});
