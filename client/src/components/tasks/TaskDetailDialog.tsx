import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import {
	ProjectDescriptionEditor,
	ProjectDescriptionPreview,
} from "@/components/projects/project-description";
import { projectDescriptionText } from "@/components/projects/project-description-utils";
import { type Project } from "@/services/project.service";
import {
	type UiTask,
	STATUS_BADGE,
	formatTime,
	getInitials,
	profileColorClass,
} from "./types";

export function TaskDetailDialog({
	task,
	projects,
	onClose,
	onSaveNotes,
}: {
	task: UiTask | null;
	projects: Project[];
	onClose: () => void;
	onSaveNotes: (task: UiTask, notes: string) => Promise<void>;
}) {
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (task) setNotes(task.developer_notes ?? "");
	}, [task]);

	const project = projects.find((p) => p.id === task?.project_id);
	const assignee = task?.assigned_to;

	async function handleSave() {
		if (!task) return;
		setSaving(true);
		try {
			await onSaveNotes(task, notes);
		} finally {
			setSaving(false);
		}
	}

	return (
		<Dialog
			open={!!task}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
			}}
		>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-lg font-bold text-primary leading-snug pr-6">
						{task?.title}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-5">
					{/* Status + Priority */}
					<div className="flex items-center gap-2">
						<Badge
							variant={
								STATUS_BADGE[task?.apiStatus ?? "todo"].variant
							}
						>
							{STATUS_BADGE[task?.apiStatus ?? "todo"].label}
						</Badge>
						<Badge variant={task?.priority ?? "medium"}>
							{task?.priority &&
								task.priority.charAt(0).toUpperCase() +
									task.priority.slice(1)}
						</Badge>
					</div>

					{/* Meta grid */}
					<div className="grid grid-cols-2 gap-x-8 gap-y-4">
						<div>
							<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
								Project
							</p>
							<p className="text-sm text-foreground font-bold">
								{project?.name ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
								Sprint
							</p>
							<p className="text-sm text-foreground font-bold">
								{task?.sprint?.name ?? "—"}
							</p>
						</div>
						<div>
							<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
								Assignee
							</p>
							{assignee ? (
								<div className="flex items-center gap-1.5">
									<Avatar className="h-5 w-5">
										<AvatarFallback
											className={`text-[9px] text-white ${profileColorClass(assignee.id)}`}
										>
											{getInitials(
												assignee.full_name ??
													assignee.email,
											)}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm font-bold text-primary">
										{assignee.full_name ?? assignee.email}
									</span>
								</div>
							) : (
								<p className="text-sm text-muted">Unassigned</p>
							)}
						</div>
						<div>
							<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
								Due Date
							</p>
							<p className="text-sm text-foreground">
								{task?.due_date
									? task.due_date.slice(0, 10)
									: "—"}
							</p>
						</div>
						<div>
							<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
								Estimated Time
							</p>
							<p className="text-sm text-foreground font-bold">
								{task?.estimated_time
									? formatTime(task.estimated_time)
									: "—"}
							</p>
						</div>
					</div>

					{/* Tags */}
					{task && task.tags.length > 0 && (
						<div>
							<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
								Tags
							</p>
							<div className="flex flex-wrap gap-1.5">
								{task.tags.map((tag) => (
									<span
										key={tag}
										className="text-[11px] bg-muted-subtle text-muted-foreground px-2 py-0.5 rounded-full font-medium"
									>
										{tag}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Description */}
					{task?.description &&
						projectDescriptionText(task.description) && (
							<div>
								<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
									Description
								</p>
								<div className="text-sm text-black bg-slate-100 p-2 rounded">
									<ProjectDescriptionPreview
										value={task.description}
									/>
								</div>
							</div>
						)}

					{/* Developer's Notes */}
					<div>
						<label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
							Developer's Notes
						</label>
						<ProjectDescriptionEditor
							value={notes}
							onChange={setNotes}
							placeholder="Add implementation details, technical context, or notes for the dev team..."
						/>
					</div>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" disabled={saving}>
							Close
						</Button>
					</DialogClose>
					<Button onClick={handleSave} disabled={saving}>
						{saving && (
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
						)}
						Save Notes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
