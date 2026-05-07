import express from "express";
import {
	getProjects,
	getProjectById,
	createProject,
	updateProject,
	deleteProject,
} from "../controllers/project.controller.js";
import {
	sendInvitation,
	listInvitations,
	cancelInvitation,
} from "../controllers/invitation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
	requireProjectMember,
	requireProjectRole,
} from "../middlewares/project.middleware.js";

const router = express.Router();

// Project CRUD
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", requireAuth, createProject);
router.patch("/:id", requireAuth, updateProject);
router.delete("/:id", requireAuth, deleteProject);

// Project invitations
router.get(
	"/:id/invitations",
	requireAuth,
	requireProjectMember,
	listInvitations
);
router.post(
	"/:id/invitations",
	requireAuth,
	requireProjectMember,
	requireProjectRole("owner", "manager"),
	sendInvitation
);
router.delete(
	"/:id/invitations/:invitationId",
	requireAuth,
	requireProjectMember,
	requireProjectRole("owner", "manager"),
	cancelInvitation
);

export default router;
