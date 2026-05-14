// server/src/routes/admin-report.routes.js
import express from "express";
import { getAdminReports } from "../controllers/admin-report.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/reports", requireAuth, getAdminReports);

export default router;
