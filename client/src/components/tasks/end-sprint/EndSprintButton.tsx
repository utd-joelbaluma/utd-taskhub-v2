import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UiTask } from "@/components/tasks/types";
import type { Sprint, EndSprintResponse } from "@/services/sprint.service";
import { EndSprintModal } from "./EndSprintModal";

interface Props {
	activeSprint: Sprint | null;
	sprintTasks: UiTask[];
	onEnded: (result: EndSprintResponse) => void;
}

export function EndSprintButton({
	activeSprint,
	sprintTasks,
	onEnded,
}: Props) {
	const [open, setOpen] = useState(false);
	if (!activeSprint) return null;

	return (
		<>
			<Button
				variant="outline"
				className="flex items-center gap-2"
				onClick={() => setOpen(true)}
			>
				<Flag className="h-4 w-4" />
				End Sprint
			</Button>
			<EndSprintModal
				open={open}
				onClose={() => setOpen(false)}
				sprint={activeSprint}
				tasks={sprintTasks}
				onEnded={onEnded}
			/>
		</>
	);
}
