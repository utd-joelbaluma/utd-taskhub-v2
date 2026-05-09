import express from "express";
import { getSettings, updateSettings } from "../controllers/workspace-settings.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, getSettings);
router.patch("/", requireAuth, updateSettings);

export default router;
