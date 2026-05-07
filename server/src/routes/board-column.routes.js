import express from "express";
import {
	getColumns,
	createColumn,
	updateColumn,
	deleteColumn,
	reorderColumns,
} from "../controllers/board-column.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
	requireProjectMember,
} from "../middlewares/project.middleware.js";
import { requireProjectPermission } from "../middlewares/permission.middleware.js";

// mergeParams gives access to :projectId and :boardId from the parent routes
const router = express.Router({ mergeParams: true });

const canManage = [
	requireAuth,
	requireProjectMember,
	requireProjectPermission("columns.manage"),
];

router.get("/", requireAuth, requireProjectMember, requireProjectPermission("columns.read"), getColumns);

router.post("/", ...canManage, createColumn);

// /reorder must be declared before /:columnId to avoid Express
// treating the literal "reorder" as a columnId value
router.patch("/reorder", ...canManage, reorderColumns);

router.patch("/:columnId", ...canManage, updateColumn);

router.delete("/:columnId", ...canManage, deleteColumn);

export default router;
