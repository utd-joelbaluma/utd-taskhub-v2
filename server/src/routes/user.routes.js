import express from "express";
import {
	listUsers,
	listUserInvitations,
	cancelUserInvitation,
	updateUserRole,
	deleteUser,
} from "../controllers/user.controller.js";
import {
	getMySprintCapacity,
	getTeamSprintCapacity,
} from "../controllers/sprintCapacity.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";
import { inviteUser } from "../services/invitation.service.js";

const router = express.Router();

router.get("/", requireAuth, requirePermission("users.read"), listUsers);

// Literal routes before param routes to avoid conflict
router.get("/sprint-capacity", requireAuth, requirePermission("users.read"), getTeamSprintCapacity);
router.get("/:userId/sprint-capacity", requireAuth, getMySprintCapacity);
router.post(
	"/invite",
	requireAuth,
	requirePermission("users.invite"),
	inviteUser,
);
router.get(
	"/invitations",
	requireAuth,
	requirePermission("users.invite"),
	listUserInvitations,
);
router.delete(
	"/invitations/:userId",
	requireAuth,
	requirePermission("users.manage"),
	cancelUserInvitation,
);
router.patch(
	"/:id/role",
	requireAuth,
	requirePermission("users.manage"),
	updateUserRole,
);
router.delete(
	"/:id",
	requireAuth,
	requirePermission("users.manage"),
	deleteUser,
);

export default router;
