import express from "express";
import {
	register,
	login,
	refreshSession,
	logout,
	me,
	completeInvite,
	startGoogleSignIn,
	googleSignInCallback,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshSession);
router.post("/logout", requireAuth, logout);
router.post("/complete-invite", requireAuth, completeInvite);
router.get("/me", requireAuth, me);

router.get("/google", startGoogleSignIn);
router.get("/google/callback", googleSignInCallback);

export default router;
