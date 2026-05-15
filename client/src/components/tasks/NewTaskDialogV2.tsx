import { toast } from "sonner";
import {
	type CreateTaskPayload,
} from "@/services/task.service";
import { type Project } from "@/services/project.service";
import { type Profile } from "@/services/profile.service";
import { TaskFormDialogV2 } from "./task-form-dialog-v2";

interface Props {
	open: boolean;
	onClose: () => void;
	onCreate: (projectId: string, payload: CreateTaskPayload) => Promise<void>;
	projects: Project[];
	profiles: Profile[];
	parentTaskId?: string;
	lockedProjectId?: string;
}

export function NewTaskDialogV2({
	open,
	onClose,
	onCreate,
	projects,
	profiles,
	parentTaskId,
	lockedProjectId,
}: Props) {
	return (
		<TaskFormDialogV2
			mode="create"
			open={open}
			onClose={onClose}
			projects={projects}
			profiles={profiles}
			parentTaskId={parentTaskId}
			lockedProjectId={lockedProjectId}
			onSubmit={async (out) => {
				if (out.mode !== "create") return;
				try {
					await onCreate(out.projectId, out.payload);
				} catch (e) {
					toast.error("Failed to create task", {
						description: (e as Error).message || "Please try again.",
					});
					throw e;
				}
			}}
		/>
	);
}
