import type { UiTask } from "@/components/tasks/types";
import type { EndSprintTaskAction } from "@/services/sprint.service";
import type {
	TaskActionMap,
	TaskActionState,
	SprintSummary,
} from "./types";

export function isComplete(task: UiTask): boolean {
	return task.apiStatus === "done";
}

export function defaultActions(tasks: UiTask[]): TaskActionMap {
	const map: TaskActionMap = {};
	for (const t of tasks) map[t.id] = { kind: "keep" };
	return map;
}

export function summarize(tasks: UiTask[]): SprintSummary {
	const completed = tasks.filter(isComplete).length;
	return {
		total: tasks.length,
		completed,
		incomplete: tasks.length - completed,
	};
}

export function isActionValid(state: TaskActionState): boolean {
	if (state.kind === "move") return !!state.targetStatus;
	return true;
}

export function validate(actions: TaskActionMap): boolean {
	return Object.values(actions).every(isActionValid);
}

export function toPayload(actions: TaskActionMap): EndSprintTaskAction[] {
	return Object.entries(actions).map(([taskId, state]) => {
		if (state.kind === "move") {
			return {
				taskId,
				action: "move" as const,
				targetStatus: state.targetStatus,
			};
		}
		return { taskId, action: state.kind };
	});
}
