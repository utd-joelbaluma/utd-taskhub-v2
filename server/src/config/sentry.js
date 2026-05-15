import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

if (process.env.SENTRY_DSN) {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: process.env.NODE_ENV || "development",
		integrations: [nodeProfilingIntegration()],
		tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.2),
		profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? 0.2),
		sendDefaultPii: false,
	});
}

export { Sentry };
