import { api } from "@/lib/api";

export type SystemLogAction = "INSERT" | "UPDATE" | "DELETE";

export type SystemLogTable =
	| "projects"
	| "tasks"
	| "tickets"
	| "boards"
	| "board_columns"
	| "comments"
	| "project_members"
	| "profiles"
	| "sprints"
	| "workspace_settings";

export interface SystemLogActor {
	id: string;
	full_name: string | null;
	email: string | null;
}

export interface SystemLog {
	id: string;
	action: SystemLogAction;
	table_name: SystemLogTable;
	record_id: string;
	old_data: Record<string, unknown> | null;
	new_data: Record<string, unknown> | null;
	changed_by: string | null;
	changed_at: string;
	changer: SystemLogActor | null;
}

export interface ListSystemLogsParams {
	table?: SystemLogTable;
	action?: SystemLogAction;
	userId?: string;
	fromDate?: string;
	toDate?: string;
	page?: number;
	limit?: number;
}

export interface SystemLogList {
	count: number;
	page: number;
	limit: number;
	totalPages: number;
	data: SystemLog[];
}

export async function listSystemLogs(
	params: ListSystemLogsParams = {},
): Promise<SystemLogList> {
	const query = new URLSearchParams();

	if (params.table) query.set("table", params.table);
	if (params.action) query.set("action", params.action);
	if (params.userId) query.set("userId", params.userId);
	if (params.fromDate) query.set("fromDate", params.fromDate);
	if (params.toDate) query.set("toDate", params.toDate);
	if (params.page) query.set("page", String(params.page));
	if (params.limit) query.set("limit", String(params.limit));

	const qs = query.toString();
	const res = await api.get<{ success: boolean } & SystemLogList>(
		`/system-logs${qs ? `?${qs}` : ""}`,
	);

	return {
		count: res.count ?? 0,
		page: res.page ?? 1,
		limit: res.limit ?? params.limit ?? 50,
		totalPages: res.totalPages ?? 1,
		data: res.data,
	};
}
