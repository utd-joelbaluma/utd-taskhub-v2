import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UiTask } from "@/components/tasks/types";
import type { Sprint, EndSprintResponse } from "@/services/sprint.service";
import { usePermission } from "@/hooks/usePermission";
import { EndSprintModal } from "./EndSprintModal";

const ALLOWED_ROLES = new Set(["admin", "manager"]);

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
	const { roleKey } = usePermission();
	if (!activeSprint) return null;
	if (!roleKey || !ALLOWED_ROLES.has(roleKey)) return null;

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
