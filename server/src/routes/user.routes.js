import express from "express";
import {
	listUsers,
	inviteUser,
	listUserInvitations,
	cancelUserInvitation,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

const router = express.Router();

router.get("/", requireAuth, requirePermission("users.read"), listUsers);
router.post("/invite", requireAuth, requirePermission("users.invite"), inviteUser);
router.get("/invitations", requireAuth, requirePermission("users.invite"), listUserInvitations);
router.delete("/invitations/:userId", requireAuth, requirePermission("users.manage"), cancelUserInvitation);

export default router;
