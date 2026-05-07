import express from "express";
import {
	getTickets,
	getTicketById,
	createTicket,
	updateTicket,
	deleteTicket,
	convertTicketToTask,
} from "../controllers/ticket.controller.js";
import {
	makeGetComments,
	makeCreateComment,
	makeUpdateComment,
	makeDeleteComment,
} from "../controllers/comment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
	requireProjectMember,
} from "../middlewares/project.middleware.js";
import { requireProjectPermission } from "../middlewares/permission.middleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", requireAuth, requireProjectMember, requireProjectPermission("tickets.read"), getTickets);

router.get("/:ticketId", requireAuth, requireProjectMember, requireProjectPermission("tickets.read"), getTicketById);

router.post("/", requireAuth, requireProjectMember, requireProjectPermission("tickets.create"), createTicket);

router.patch(
	"/:ticketId",
	requireAuth,
	requireProjectMember,
	requireProjectPermission("tickets.update"),
	updateTicket
);

router.delete(
	"/:ticketId",
	requireAuth,
	requireProjectMember,
	requireProjectPermission("tickets.delete"),
	deleteTicket
);

router.post(
	"/:ticketId/convert",
	requireAuth,
	requireProjectMember,
	requireProjectPermission("tickets.convert"),
	convertTicketToTask
);

router.get("/:ticketId/comments", requireAuth, requireProjectMember, requireProjectPermission("comments.read"), makeGetComments("ticketId"));
router.post("/:ticketId/comments", requireAuth, requireProjectMember, requireProjectPermission("comments.create"), makeCreateComment("ticketId"));
router.patch("/:ticketId/comments/:commentId", requireAuth, requireProjectMember, requireProjectPermission("comments.update_own"), makeUpdateComment("ticketId"));
router.delete("/:ticketId/comments/:commentId", requireAuth, requireProjectMember, makeDeleteComment("ticketId"));

export default router;
