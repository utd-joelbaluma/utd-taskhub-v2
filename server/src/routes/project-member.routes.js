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
} from "../middlewares/project.middleware.js";
import { requireProjectPermission } from "../middlewares/permission.middleware.js";

const router = express.Router({ mergeParams: true });

router.use(requireAuth, requireProjectMember);

router.get("/", requireProjectPermission("members.read"), listMembers);
router.post("/", requireProjectPermission("members.manage"), addMember);
router.patch("/:userId", requireProjectPermission("members.manage"), updateMemberRole);
router.delete("/:userId", requireProjectPermission("members.manage"), removeMember);

export default router;
