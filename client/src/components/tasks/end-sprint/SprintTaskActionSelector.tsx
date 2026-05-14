import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	COLUMN_IDS,
	COLUMN_LABELS,
	columnIdToApiStatus,
	type ColumnId,
} from "@/components/tasks/types";
import type { ActionKind, MoveStatus, TaskActionState } from "./types";

interface Props {
	id: string;
	value: TaskActionState;
	onChange: (next: TaskActionState) => void;
	disabled?: boolean;
	allowCloseTicket?: boolean;
}

const ACTION_LABEL: Record<ActionKind, string> = {
	keep: "Keep on current board",
	backlog: "Put to backlog",
	move: "Move to",
	close_ticket: "Close linked ticket",
};

const MOVE_COLUMN_IDS: ColumnId[] = COLUMN_IDS.filter((c) => c !== "backlog");

export function SprintTaskActionSelector({
	id,
	value,
	onChange,
	disabled,
	allowCloseTicket,
}: Props) {
	function handleKindChange(kind: string) {
		const next = kind as ActionKind;
		if (next === "move") {
			onChange({ kind: "move", targetStatus: value.targetStatus });
		} else {
			onChange({ kind: next });
		}
	}

	function handleStatusChange(status: string) {
		onChange({ kind: "move", targetStatus: status as MoveStatus });
	}

	const visibleKinds: ActionKind[] = (
		Object.keys(ACTION_LABEL) as ActionKind[]
	).filter((k) => k !== "close_ticket" || allowCloseTicket);

	return (
		<fieldset className="flex flex-col gap-1.5">
			<legend className="sr-only">Sprint task action</legend>
			<RadioGroup
				value={value.kind}
				onValueChange={handleKindChange}
				disabled={disabled}
				className="grid gap-1.5"
			>
				{visibleKinds.map((kind) => {
					const itemId = `${id}-${kind}`;
					return (
						<div key={kind} className="flex items-center gap-2">
							<RadioGroupItem id={itemId} value={kind} />
							<label
								htmlFor={itemId}
								className="text-xs text-foreground cursor-pointer"
							>
								{ACTION_LABEL[kind]}
							</label>
							{kind === "move" && value.kind === "move" && (
								<Select
									value={value.targetStatus ?? ""}
									onValueChange={handleStatusChange}
									disabled={disabled}
								>
									<SelectTrigger className="h-7 w-[150px] text-xs">
										<SelectValue placeholder="Select column" />
									</SelectTrigger>
									<SelectContent>
										{MOVE_COLUMN_IDS.map((colId) => (
											<SelectItem
												key={colId}
												value={columnIdToApiStatus(colId)}
											>
												{COLUMN_LABELS[colId]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					);
				})}
			</RadioGroup>
		</fieldset>
	);
}
