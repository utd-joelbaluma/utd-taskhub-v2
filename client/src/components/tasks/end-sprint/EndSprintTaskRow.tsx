import { Badge } from "@/components/ui/badge";
import {
	STATUS_BADGE,
	getInitials,
	profileColorClass,
	type UiTask,
} from "@/components/tasks/types";
import { SprintTaskActionSelector } from "./SprintTaskActionSelector";
import type { TaskActionState } from "./types";

interface Props {
	task: UiTask;
	value: TaskActionState;
	onChange: (next: TaskActionState) => void;
	disabled?: boolean;
}

export function EndSprintTaskRow({ task, value, onChange, disabled }: Props) {
	const badge = STATUS_BADGE[task.apiStatus];
	const assignee = task.assigned_to;
	const initials = getInitials(assignee?.full_name ?? assignee?.email ?? null);
	const avatarColor = assignee ? profileColorClass(assignee.id) : "bg-muted";

	return (
		<div className="grid grid-cols-[1fr_auto_auto] items-start gap-4 border-b border-border py-3 last:border-b-0">
			<div className="min-w-0">
				<p className="text-sm font-medium text-foreground truncate">
					{task.title}
				</p>
				<div className="mt-1">
					<Badge variant={badge.variant}>{badge.label}</Badge>
				</div>
			</div>
			<div className="flex items-center gap-2 shrink-0 pt-0.5">
				{assignee ? (
					<>
						<span
							className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium text-white ${avatarColor}`}
						>
							{initials}
						</span>
						<span className="text-xs text-muted max-w-[120px] truncate">
							{assignee.full_name ?? assignee.email}
						</span>
					</>
				) : (
					<span className="text-xs text-muted">Unassigned</span>
				)}
			</div>
			<div className="shrink-0">
				<SprintTaskActionSelector
					id={`end-sprint-${task.id}`}
					value={value}
					onChange={onChange}
					disabled={disabled}
				/>
			</div>
		</div>
	);
}
