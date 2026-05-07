import express from "express";
import {
	getBoards,
	getBoardById,
	createBoard,
	updateBoard,
	deleteBoard,
} from "../controllers/board.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
	requireProjectMember,
} from "../middlewares/project.middleware.js";
import { requireProjectPermission } from "../middlewares/permission.middleware.js";

// mergeParams allows access to :projectId from the parent route
const router = express.Router({ mergeParams: true });

router.get(
	"/",
	requireAuth,
	requireProjectMember,
	requireProjectPermission("boards.read"),
	getBoards
);

router.get(
	"/:boardId",
	requireAuth,
	requireProjectMember,
	requireProjectPermission("boards.read"),
	getBoardById
);

router.post(
	"/",
	requireAuth,
	requireProjectMember,
	requireProjectPermission("boards.manage"),
	createBoard
);

router.patch(
	"/:boardId",
	requireAuth,
	requireProjectMember,
	requireProjectPermission("boards.manage"),
	updateBoard
);

router.delete(
	"/:boardId",
	requireAuth,
	requireProjectMember,
	requireProjectPermission("boards.manage"),
	deleteBoard
);

export default router;
