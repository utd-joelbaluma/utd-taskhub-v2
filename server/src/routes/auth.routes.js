import express from "express";
import {
	register,
	login,
	refreshSession,
	logout,
	me,
	completeInvite,
	googleSignIn,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshSession);
router.post("/logout", requireAuth, logout);
router.post("/complete-invite", requireAuth, completeInvite);
router.get("/me", requireAuth, me);

// Prepared — not yet implemented
router.post("/google", googleSignIn);

export default router;
