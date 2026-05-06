import express from "express";
import {
	register,
	login,
	logout,
	me,
	googleSignIn,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

// Prepared — not yet implemented
router.post("/google", googleSignIn);

export default router;
