import { supabaseAdmin } from "../config/supabase.js";
import {
	createNotifications,
	NotificationType,
} from "../services/notification.service.js";

const HOUR_MS = 60 * 60 * 1000;
const HORIZON_MS = 24 * HOUR_MS;

async function alreadyNotified(userId, taskId, type) {
	const { count, error } = await supabaseAdmin
		.from("notifications")
		.select("id", { count: "exact", head: true })
		.eq("user_id", userId)
		.eq("type", type)
		.eq("data->>task_id", taskId);

	if (error) {
		console.error("[due-job] idempotency check failed:", error.message);
		return true;
	}
	return (count ?? 0) > 0;
}

async function runOnce() {
	const now = new Date();
	const horizon = new Date(now.getTime() + HORIZON_MS).toISOString();

	const { data: tasks, error } = await supabaseAdmin
		.from("tasks")
		.select("id, project_id, title, assigned_to, due_date, status")
		.not("assigned_to", "is", null)
		.not("due_date", "is", null)
		.not("status", "in", "(done,cancelled)")
		.lte("due_date", horizon);

	if (error) {
		console.error("[due-job] query failed:", error.message);
		return;
	}

	for (const t of tasks ?? []) {
		const overdue = new Date(t.due_date) < now;
		const type = overdue
			? NotificationType.TASK_OVERDUE
			: NotificationType.TASK_DUE_SOON;

		if (await alreadyNotified(t.assigned_to, t.id, type)) continue;

		await createNotifications({
			userIds: [t.assigned_to],
			type,
			title: overdue ? "Task overdue" : "Task due soon",
			body: t.title,
			data: {
				project_id: t.project_id,
				task_id: t.id,
				due_date: t.due_date,
			},
		});
	}
}

export function startDueDateNotifier() {
	runOnce().catch((e) => console.error("[due-job]", e.message));
	setInterval(() => {
		runOnce().catch((e) => console.error("[due-job]", e.message));
	}, HOUR_MS);
}
