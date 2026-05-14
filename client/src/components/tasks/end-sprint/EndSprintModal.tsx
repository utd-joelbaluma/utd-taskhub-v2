import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UiTask } from "@/components/tasks/types";
import {
	endSprint,
	type Sprint,
	type EndSprintResponse,
} from "@/services/sprint.service";
import { EndSprintTaskRow } from "./EndSprintTaskRow";
import {
	defaultActions,
	summarize,
	toPayload,
	validate,
} from "./helpers";
import type { TaskActionMap, TaskActionState } from "./types";

interface Props {
	open: boolean;
	onClose: () => void;
	sprint: Sprint;
	tasks: UiTask[];
	onEnded: (result: EndSprintResponse) => void;
}

export function EndSprintModal({
	open,
	onClose,
	sprint,
	tasks,
	onEnded,
}: Props) {
	const [actions, setActions] = useState<TaskActionMap>(() =>
		defaultActions(tasks),
	);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			setActions(defaultActions(tasks));
			setSubmitting(false);
		}
	}, [open, tasks]);

	const summary = useMemo(() => summarize(tasks), [tasks]);
	const canConfirm = !submitting && validate(actions);
	const closingTicketCount = useMemo(
		() =>
			Object.values(actions).filter((a) => a.kind === "close_ticket").length,
		[actions],
	);

	function updateAction(taskId: string, next: TaskActionState) {
		setActions((prev) => ({ ...prev, [taskId]: next }));
	}

	async function handleConfirm() {
		if (!canConfirm) return;
		setSubmitting(true);
		try {
			const result = await endSprint(sprint.id, {
				taskActions: toPayload(actions),
			});
			toast.success("Sprint ended", { description: sprint.name });
			onEnded(result);
			onClose();
		} catch (e) {
			toast.error("Failed to end sprint", {
				description: (e as Error).message || "Please try again.",
			});
			setSubmitting(false);
		}
	}

	function handleOpenChange(next: boolean) {
		if (submitting) return;
		if (!next) onClose();
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle>End Sprint: {sprint.name}</DialogTitle>
					<DialogDescription>
						Decide what happens to each task before closing the sprint.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-wrap items-center gap-2 mb-4">
					<Badge variant="todo">Total {summary.total}</Badge>
					<Badge variant="done">Completed {summary.completed}</Badge>
					<Badge variant="in-progress">Incomplete {summary.incomplete}</Badge>
					{closingTicketCount > 0 && (
						<Badge variant="review">
							{closingTicketCount} linked ticket
							{closingTicketCount > 1 ? "s" : ""} will be closed
						</Badge>
					)}
				</div>

				{tasks.length === 0 ? (
					<div className="rounded-lg border border-border bg-muted-subtle/40 px-4 py-8 text-center">
						<p className="text-sm font-medium text-foreground">
							No tasks in this sprint
						</p>
						<p className="text-xs text-muted mt-1">
							You can safely close it.
						</p>
					</div>
				) : (
					<div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border px-4">
						{tasks.map((task) => (
							<EndSprintTaskRow
								key={task.id}
								task={task}
								value={actions[task.id] ?? { kind: "keep" }}
								onChange={(next) => updateAction(task.id, next)}
								disabled={submitting}
							/>
						))}
					</div>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={onClose}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button onClick={handleConfirm} disabled={!canConfirm}>
						{submitting && (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						)}
						End Sprint
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
