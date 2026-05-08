import express from "express";
import { listProfiles, getProfile, updateAvatar, updateProfile } from "../controllers/profile.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listProfiles);
router.get("/:id", requireAuth, getProfile);
router.post("/:id/avatar", requireAuth, updateAvatar);
router.patch("/:id", requireAuth, updateProfile);

export default router;
