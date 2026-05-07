import express from "express";
import {
	listSprints,
	createSprint,
	updateSprint,
	deleteSprint,
} from "../controllers/sprint.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireProjectMember } from "../middlewares/project.middleware.js";
import { requireProjectPermission } from "../middlewares/permission.middleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", requireAuth, requireProjectMember, listSprints);

router.post("/", requireAuth, requireProjectMember, requireProjectPermission("project.update"), createSprint);

router.patch("/:sprintId", requireAuth, requireProjectMember, requireProjectPermission("project.update"), updateSprint);

router.delete("/:sprintId", requireAuth, requireProjectMember, requireProjectPermission("project.update"), deleteSprint);

export default router;
