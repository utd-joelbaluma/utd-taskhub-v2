import express from "express";
import {
	listMembers,
	addMember,
	updateMemberRole,
	removeMember,
} from "../controllers/project-member.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
	requireProjectMember,
	requireProjectRole,
} from "../middlewares/project.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth, requireProjectMember);

router.get("/", listMembers);
router.post("/", requireProjectRole("owner", "manager"), addMember);
router.patch("/:userId", requireProjectRole("owner", "manager"), updateMemberRole);
router.delete("/:userId", requireProjectRole("owner", "manager"), removeMember);

export default router;
