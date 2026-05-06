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
	requireProjectRole,
} from "../middlewares/project.middleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", requireAuth, requireProjectMember, getTickets);

router.get("/:ticketId", requireAuth, requireProjectMember, getTicketById);

router.post("/", requireAuth, requireProjectMember, createTicket);

router.patch(
	"/:ticketId",
	requireAuth,
	requireProjectMember,
	requireProjectRole("owner", "manager"),
	updateTicket
);

router.delete(
	"/:ticketId",
	requireAuth,
	requireProjectMember,
	requireProjectRole("owner", "manager"),
	deleteTicket
);

router.post(
	"/:ticketId/convert",
	requireAuth,
	requireProjectMember,
	requireProjectRole("owner", "manager"),
	convertTicketToTask
);

router.get("/:ticketId/comments", requireAuth, requireProjectMember, makeGetComments("ticketId"));
router.post("/:ticketId/comments", requireAuth, requireProjectMember, makeCreateComment("ticketId"));
router.patch("/:ticketId/comments/:commentId", requireAuth, requireProjectMember, makeUpdateComment("ticketId"));
router.delete("/:ticketId/comments/:commentId", requireAuth, requireProjectMember, makeDeleteComment("ticketId"));

export default router;
