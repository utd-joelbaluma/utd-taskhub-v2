import type { ApiTaskStatus } from "@/services/task.service";

export type ActionKind = "keep" | "backlog" | "move";

export type MoveStatus = Exclude<ApiTaskStatus, "cancelled">;

export interface TaskActionState {
	kind: ActionKind;
	targetStatus?: MoveStatus;
}

export type TaskActionMap = Record<string, TaskActionState>;

export interface SprintSummary {
	total: number;
	completed: number;
	incomplete: number;
}
