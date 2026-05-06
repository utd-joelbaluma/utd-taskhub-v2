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
	requireProjectRole,
} from "../middlewares/project.middleware.js";

// mergeParams allows access to :projectId from the parent route
const router = express.Router({ mergeParams: true });

router.get(
	"/",
	requireAuth,
	requireProjectMember,
	getBoards
);

router.get(
	"/:boardId",
	requireAuth,
	requireProjectMember,
	getBoardById
);

router.post(
	"/",
	requireAuth,
	requireProjectMember,
	requireProjectRole("owner", "manager"),
	createBoard
);

router.patch(
	"/:boardId",
	requireAuth,
	requireProjectMember,
	requireProjectRole("owner", "manager"),
	updateBoard
);

router.delete(
	"/:boardId",
	requireAuth,
	requireProjectMember,
	requireProjectRole("owner", "manager"),
	deleteBoard
);

export default router;
