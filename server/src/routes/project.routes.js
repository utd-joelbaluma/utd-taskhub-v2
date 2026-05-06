import express from "express";
import {
	getProjects,
	createProject,
} from "../controllers/project.controller.js";

const router = express.Router();

router.get("/", getProjects);
router.post("/", createProject);

export default router;
