import express from "express";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/:id", requireAuth, getProfile);
router.patch("/:id", requireAuth, updateProfile);

export default router;
