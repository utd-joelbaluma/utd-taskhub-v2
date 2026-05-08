import express from "express";
import {
	listSprints,
	createSprint,
	updateSprint,
	deleteSprint,
} from "../controllers/sprint.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, listSprints);
router.post("/", requireAuth, createSprint);
router.patch("/:sprintId", requireAuth, updateSprint);
router.delete("/:sprintId", requireAuth, deleteSprint);

export default router;
