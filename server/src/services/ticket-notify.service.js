import { supabaseAdmin } from "../config/supabase.js";
import {
	createNotifications,
	NotificationType,
} from "./notification.service.js";

export async function notifyTicketClosed({ projectId, ticket, actorId }) {
	const [{ data: globals }, { data: projMgrs }] = await Promise.all([
		supabaseAdmin
			.from("profiles")
			.select("id")
			.in("role", ["admin", "manager"])
			.eq("status", "active"),
		supabaseAdmin
			.from("project_members")
			.select("user_id")
			.eq("project_id", projectId)
			.in("role", ["owner", "manager"]),
	]);

	const recipients = [
		...new Set([
			...(globals ?? []).map((g) => g.id),
			...(projMgrs ?? []).map((p) => p.user_id),
		]),
	].filter((id) => id !== actorId);

	if (recipients.length === 0) return;

	await createNotifications({
		userIds: recipients,
		type: NotificationType.TICKET_CLOSED,
		title: "Ticket closed",
		body: ticket.title,
		data: {
			project_id: projectId,
			ticket_id: ticket.id,
			resolution: ticket.resolution ?? null,
		},
	});
}
