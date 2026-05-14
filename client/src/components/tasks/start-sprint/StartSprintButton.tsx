import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Sprint } from "@/services/sprint.service";
import { StartSprintModal } from "./StartSprintModal";

interface Props {
	nextSprint: Sprint | null;
	onStarted: (updated: Sprint) => void;
}

export function StartSprintButton({ nextSprint, onStarted }: Props) {
	const [open, setOpen] = useState(false);
	if (!nextSprint) return null;

	return (
		<>
			<Button
				variant="outline"
				className="flex items-center gap-2"
				onClick={() => setOpen(true)}
			>
				<Play className="h-4 w-4" />
				Start Sprint
			</Button>
			<StartSprintModal
				open={open}
				onClose={() => setOpen(false)}
				sprint={nextSprint}
				onStarted={onStarted}
			/>
		</>
	);
}
