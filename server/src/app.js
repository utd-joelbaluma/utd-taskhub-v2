import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import healthRoutes from "./routes/health.routes.js";
import projectRoutes from "./routes/project.routes.js";
import authRoutes from "./routes/auth.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import boardRoutes from "./routes/board.routes.js";
import boardColumnRoutes from "./routes/board-column.routes.js";
import taskRoutes from "./routes/task.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import projectMemberRoutes from "./routes/project-member.routes.js";
import userRoutes from "./routes/user.routes.js";
import roleRoutes from "./routes/role.routes.js";
import sprintRoutes from "./routes/sprint.routes.js";
import systemLogRoutes from "./routes/system-log.routes.js";
import workspaceSettingsRoutes from "./routes/workspace-settings.routes.js";
import notificationRoutes from "./routes/notifications.routes.js";
import {
	notFoundHandler,
	errorHandler,
} from "./middlewares/error.middleware.js";
import { getAllTasks } from "./controllers/task.controller.js";
import { getDashboard } from "./controllers/dashboard.controller.js";
import { requireAuth } from "./middlewares/auth.middleware.js";
import { bindSupabaseContext } from "./config/supabase.js";

const app = express();

app.use(helmet());
app.use(
	cors({
		origin(origin, callback) {
			// Allow requests with no origin (curl, Postman, server-to-server)
			if (!origin) return callback(null, true);

			const allowed =
				env.nodeEnv === "development"
					? /^http:\/\/localhost(:\d+)?$/.test(origin)
					: origin === env.appUrl;

			callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
		},
		credentials: true,
	}),
);
app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: true, limit: "3mb" }));
app.use(cookieParser(env.cookieSecret));
app.use(bindSupabaseContext);

if (env.nodeEnv === "development") {
	app.use(
		morgan("dev", {
			skip: (req) =>
				req.originalUrl.startsWith(`/api/${env.apiVersion}/notifications/stream`),
		}),
	);
}

app.get("/", (req, res) => {
	res.json({
		success: true,
		message: `${env.appName} is running`,
		version: env.apiVersion,
	});
});

app.use(`/api/${env.apiVersion}/health`, healthRoutes);
app.use(`/api/${env.apiVersion}/auth`, authRoutes);
app.use(`/api/${env.apiVersion}/projects`, projectRoutes);
app.use(`/api/${env.apiVersion}/invitations`, invitationRoutes);
app.use(`/api/${env.apiVersion}/profiles`, profileRoutes);
app.use(`/api/${env.apiVersion}/projects/:projectId/boards`, boardRoutes);
app.use(`/api/${env.apiVersion}/projects/:projectId/boards/:boardId/columns`, boardColumnRoutes);
app.use(`/api/${env.apiVersion}/projects/:projectId/tasks`, taskRoutes);
app.use(`/api/${env.apiVersion}/projects/:projectId/tickets`, ticketRoutes);
app.use(`/api/${env.apiVersion}/projects/:projectId/members`, projectMemberRoutes);
app.use(`/api/${env.apiVersion}/sprints`, sprintRoutes);
app.use(`/api/${env.apiVersion}/users`, userRoutes);
app.use(`/api/${env.apiVersion}/roles`, roleRoutes);
app.use(`/api/${env.apiVersion}/system-logs`, systemLogRoutes);
app.use(`/api/${env.apiVersion}/workspace-settings`, workspaceSettingsRoutes);
app.use(`/api/${env.apiVersion}/notifications`, notificationRoutes);

app.get(`/api/${env.apiVersion}/tasks`, requireAuth, getAllTasks);
app.get(`/api/${env.apiVersion}/dashboard`, requireAuth, getDashboard);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
