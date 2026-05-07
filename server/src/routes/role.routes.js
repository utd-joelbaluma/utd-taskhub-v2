import express from "express";
import {
	createRole,
	deleteRole,
	getRole,
	listRoles,
	setRolePermissions,
	updateRole,
} from "../controllers/role.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permission.middleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", requirePermission("roles.read"), listRoles);
router.get("/:id", requirePermission("roles.read"), getRole);
router.post("/", requirePermission("roles.manage"), createRole);
router.patch("/:id", requirePermission("roles.manage"), updateRole);
router.delete("/:id", requirePermission("roles.manage"), deleteRole);
router.put("/:id/permissions", requirePermission("roles.manage"), setRolePermissions);

export default router;
