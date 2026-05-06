import express from "express";
import {
	getTasks,
	getTaskById,
	createTask,
	updateTask,
	deleteTask,
	moveTask,
} from "../controllers/task.controller.js";
import {
	makeGetComments,
	makeCreateComment,
	makeUpdateComment,
	makeDeleteComment,
} from "../controllers/comment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
	requireProjectMember,
	requireProjectRole,
} from "../middlewares/project.middleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", requireAuth, requireProjectMember, getTasks);

router.get("/:taskId", requireAuth, requireProjectMember, getTaskById);

router.post("/", requireAuth, requireProjectMember, createTask);

router.patch("/:taskId", requireAuth, requireProjectMember, updateTask);

router.delete(
	"/:taskId",
	requireAuth,
	requireProjectMember,
	requireProjectRole("owner", "manager"),
	deleteTask
);

router.patch(
	"/:taskId/move",
	requireAuth,
	requireProjectMember,
	moveTask
);

router.get("/:taskId/comments", requireAuth, requireProjectMember, makeGetComments("taskId"));
router.post("/:taskId/comments", requireAuth, requireProjectMember, makeCreateComment("taskId"));
router.patch("/:taskId/comments/:commentId", requireAuth, requireProjectMember, makeUpdateComment("taskId"));
router.delete("/:taskId/comments/:commentId", requireAuth, requireProjectMember, makeDeleteComment("taskId"));

export default router;
