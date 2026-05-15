import {
	type Task as ApiTask,
	type TaskSprint,
	type ApiTaskStatus,
	type ApiTaskPriority,
} from "@/services/task.service";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ColumnId = "backlog" | "todo" | "in-progress" | "review" | "done";
export type Columns = Record<ColumnId, UiTask[]>;

export interface UiTask {
	id: string;
	project_id: string;
	ticket_id: string | null;
	title: string;
	description: string | null;
	developer_notes: string | null;
	apiStatus: ApiTaskStatus;
	columnId: ColumnId;
	priority: ApiTaskPriority;
	assigned_to: ApiTask["assigned_to"];
	due_date: string | null;
	tags: string[];
	estimated_time: number;
	sprint: TaskSprint | null;
	parent_task_id: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const COLUMN_IDS: ColumnId[] = [
	"backlog",
	"todo",
	"in-progress",
	"review",
	"done",
];

export const COLUMN_LABELS: Record<ColumnId, string> = {
	backlog: "Backlog",
	todo: "To Do",
	"in-progress": "In Progress",
	review: "QA",
	done: "Done",
};

export const COLUMN_BADGE: Record<
	ColumnId,
	{
		variant: "backlog" | "todo" | "in-progress" | "review" | "done";
		dot: string;
	}
> = {
	backlog: { variant: "backlog", dot: "bg-muted" },
	todo: { variant: "todo", dot: "bg-muted" },
	"in-progress": { variant: "in-progress", dot: "bg-primary" },
	review: { variant: "review", dot: "bg-secondary" },
	done: { variant: "done", dot: "bg-secondary" },
};

export const PRIORITY_BORDER: Record<ApiTaskPriority, string> = {
	urgent: "border border-danger/20 hover:border-danger/50 hover:shadow-danger/20",
	high: "border border-warning/20 hover:border-warning/50 hover:shadow-warning/20",
	medium: "border border-primary/20 hover:border-primary/50 hover:shadow-primary/20",
	low: "border border-gray-500/20 hover:border-gray-500/50 hover:shadow-gray-500/20",
};

export const STATUS_BADGE: Record<
	ApiTaskStatus,
	{
		variant: "backlog" | "todo" | "in-progress" | "review" | "done";
		label: string;
	}
> = {
	backlog: { variant: "backlog", label: "Backlog" },
	todo: { variant: "todo", label: "To Do" },
	in_progress: { variant: "in-progress", label: "In Progress" },
	review: { variant: "review", label: "QA" },
	done: { variant: "done", label: "Done" },
	cancelled: { variant: "done", label: "Cancelled" },
};

export const AVATAR_COLORS = [
	"bg-primary",
	"bg-accent",
	"bg-secondary",
	"bg-warning",
	"bg-danger",
];

export const TIME_INCREMENTS: { label: string; delta: number }[] = [
	{ label: "+5 mins", delta: 5 },
	{ label: "+15 mins", delta: 15 },
	{ label: "+30 mins", delta: 30 },
	{ label: "+1 hour", delta: 60 },
	{ label: "+8 hour", delta: 60 * 8 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function apiStatusToColumnId(status: ApiTaskStatus): ColumnId | null {
	switch (status) {
		case "backlog":
			return "backlog";
		case "todo":
			return "todo";
		case "in_progress":
			return "in-progress";
		case "review":
			return "review";
		case "done":
			return "done";
		default:
			return null;
	}
}

export function columnIdToApiStatus(colId: ColumnId): ApiTaskStatus {
	switch (colId) {
		case "backlog":
			return "backlog";
		case "todo":
			return "todo";
		case "in-progress":
			return "in_progress";
		case "review":
			return "review";
		case "done":
			return "done";
	}
}

export function toUiTask(t: ApiTask): UiTask | null {
	const columnId = apiStatusToColumnId(t.status);
	if (!columnId) return null;
	return {
		id: t.id,
		project_id: t.project_id,
		ticket_id: t.ticket_id ?? null,
		title: t.title,
		description: t.description,
		developer_notes: t.developer_notes,
		apiStatus: t.status,
		columnId,
		priority: t.priority,
		assigned_to: t.assigned_to,
		due_date: t.due_date,
		tags: t.tags ?? [],
		estimated_time: t.estimated_time ?? 0,
		sprint: t.sprint ?? null,
		parent_task_id: t.parent_task_id ?? null,
	};
}

export function emptyColumns(): Columns {
	// return Object.fromEntries(COLUMN_IDS.map((c) => [c, []])) as Columns;
	return {
		backlog: [],
		todo: [],
		"in-progress": [],
		review: [],
		done: [],
	};
}

export function buildColumns(tasks: UiTask[]): Columns {
	const cols = emptyColumns();
	for (const task of tasks) cols[task.columnId].push(task);
	return cols;
}

export function getInitials(name: string | null | undefined): string {
	if (!name) return "?";
	return name
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function profileColorClass(id: string): string {
	const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
	return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function formatTime(minutes: number): string {
	if (!minutes) return "0 min";
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const rem = minutes % 60;
	if (rem === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
	return `${hours} hr${hours > 1 ? "s" : ""} ${rem} min`;
}
