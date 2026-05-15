// server/src/routes/admin-report-real.routes.js
import express from "express";
import { getAdminReportsReal } from "../controllers/admin-report-real.controller.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/reports", requireAuth, requireAdmin, getAdminReportsReal);

export default router;
