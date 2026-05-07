import express from "express";
import {
	listUsers,
	inviteUser,
	listUserInvitations,
	cancelUserInvitation,
} from "../controllers/user.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, listUsers);
router.post("/invite", requireAuth, requireAdmin, inviteUser);
router.get("/invitations", requireAuth, requireAdmin, listUserInvitations);
router.delete("/invitations/:userId", requireAuth, requireAdmin, cancelUserInvitation);

export default router;
