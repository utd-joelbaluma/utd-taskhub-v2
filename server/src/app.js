import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

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
import {
	notFoundHandler,
	errorHandler,
} from "./middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv === "development") {
	app.use(morgan("dev"));
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

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
