import { toast } from "sonner";
import { type UpdateTaskPayload } from "@/services/task.service";
import { type Project } from "@/services/project.service";
import { type Profile } from "@/services/profile.service";
import { type UiTask } from "./types";
import { TaskFormDialogV2 } from "./task-form-dialog-v2";

interface Props {
	task: UiTask | null;
	onClose: () => void;
	onSave: (task: UiTask, payload: UpdateTaskPayload) => Promise<void>;
	projects: Project[];
	profiles: Profile[];
}

export function EditTaskDialogV2({
	task,
	onClose,
	onSave,
	projects,
	profiles,
}: Props) {
	return (
		<TaskFormDialogV2
			mode="edit"
			open={!!task}
			onClose={onClose}
			projects={projects}
			profiles={profiles}
			task={task}
			onSubmit={async (out) => {
				if (out.mode !== "edit") return;
				try {
					await onSave(out.task, out.payload);
				} catch (e) {
					toast.error("Failed to update task", {
						description: (e as Error).message || "Please try again.",
					});
					throw e;
				}
			}}
		/>
	);
}
