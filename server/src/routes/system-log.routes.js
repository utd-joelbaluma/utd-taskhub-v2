import express from "express";
import { listSystemLogs } from "../controllers/system-log.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", requirePermission("logs.read"), listSystemLogs);

export default router;
