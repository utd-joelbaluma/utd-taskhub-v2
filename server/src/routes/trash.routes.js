import express from "express";
import {
	listTrash,
	restoreTrash,
	purgeTrash,
} from "../controllers/trash.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

const router = express.Router();

router.use(requireAuth, requirePermission("trash.manage"));

router.get("/", listTrash);
router.post("/:id/restore", restoreTrash);
router.delete("/:id", purgeTrash);

export default router;
