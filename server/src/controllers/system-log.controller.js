import { supabase } from "../config/supabase.js";

const VALID_ACTIONS = ["INSERT", "UPDATE", "DELETE"];
const VALID_TABLES = [
	"projects",
	"tasks",
	"tickets",
	"boards",
	"board_columns",
	"comments",
	"project_members",
	"profiles",
	"sprints",
	"workspace_settings",
];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function listSystemLogs(req, res, next) {
	try {
		const { table, action, userId, fromDate, toDate } = req.query;

		const rawPage = parseInt(req.query.page, 10);
		const rawLimit = parseInt(req.query.limit, 10);
		const page = rawPage > 0 ? rawPage : 1;
		const limit =
			rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;
		const from = (page - 1) * limit;
		const to = from + limit - 1;

		if (action && !VALID_ACTIONS.includes(action.toUpperCase())) {
			return res.status(400).json({
				success: false,
				message: `action must be one of: ${VALID_ACTIONS.join(", ")}.`,
			});
		}

		if (table && !VALID_TABLES.includes(table)) {
			return res.status(400).json({
				success: false,
				message: `table must be one of: ${VALID_TABLES.join(", ")}.`,
			});
		}

		let query = supabase
			.from("system_logs")
			.select(
				"id, action, table_name, record_id, old_data, new_data, changed_by, changed_at, " +
					"changer:profiles!system_logs_changed_by_fkey(id, full_name, email)",
				{ count: "exact" },
			)
			.order("changed_at", { ascending: false })
			.range(from, to);

		if (table) query = query.eq("table_name", table);
		if (action) query = query.eq("action", action.toUpperCase());
		if (userId) query = query.eq("changed_by", userId);
		if (fromDate) query = query.gte("changed_at", fromDate);
		if (toDate) query = query.lte("changed_at", toDate);

		const { data, error, count } = await query;
		if (error) throw error;

		res.status(200).json({
			success: true,
			count,
			page,
			limit,
			totalPages: Math.ceil((count ?? 0) / limit),
			data,
		});
	} catch (error) {
		next(error);
	}
}
