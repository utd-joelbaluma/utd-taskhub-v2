import express from "express";
import {
	listUsers,
	listUserInvitations,
	cancelUserInvitation,
	updateUserRole,
	deleteUser,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";
import { inviteUser } from "../services/invitation.service.js";

const router = express.Router();

router.get("/", requireAuth, requirePermission("users.read"), listUsers);
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
