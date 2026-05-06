import express from "express";
import { listProfiles, getProfile, updateProfile } from "../controllers/profile.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listProfiles);
router.get("/:id", requireAuth, getProfile);
router.patch("/:id", requireAuth, updateProfile);

export default router;
