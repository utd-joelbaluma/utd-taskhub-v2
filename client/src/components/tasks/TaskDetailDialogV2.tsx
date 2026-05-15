import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
	Loader2,
	Plus,
	Pencil,
	Trash2,
	Calendar,
	Clock,
	Link2,
	Paperclip,
	MessageSquare,
	ListChecks,
	Check,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
	ProjectDescriptionEditor,
	ProjectDescriptionPreview,
} from "@/components/projects/project-description";
import { projectDescriptionText } from "@/components/projects/project-description-utils";
import { PermissionGate } from "@/components/PermissionGate";
import { usePermission } from "@/hooks/usePermission";
import { type Project } from "@/services/project.service";
import { type ApiTaskStatus } from "@/services/task.service";
import {
	type UiTask,
	STATUS_BADGE,
	formatTime,
	getInitials,
	profileColorClass,
} from "./types";

const STATUS_OPTIONS: ApiTaskStatus[] = [
	"backlog",
	"todo",
	"in_progress",
	"review",
	"done",
	"cancelled",
];

const PRIORITY_LABEL: Record<UiTask["priority"], string> = {
	low: "LOW PRIORITY",
	medium: "MEDIUM PRIORITY",
	high: "HIGH PRIORITY",
	urgent: "URGENT",
};

const PRIORITY_CHIP: Record<UiTask["priority"], string> = {
	low: "bg-slate-100 text-slate-700",
	medium: "bg-primary/10 text-primary",
	high: "bg-rose-100 text-rose-700",
	urgent: "bg-red-100 text-red-700",
};

function shortTaskRef(task: UiTask, project?: Project): string {
	const prefix = project?.name
		? project.name
				.split(/\s+/)
				.map((w) => w[0])
				.join("")
				.slice(0, 4)
				.toUpperCase()
		: "TASK";
	return `${prefix}-${task.id.slice(0, 4).toUpperCase()}`;
}

interface Props {
	task: UiTask | null;
	projects: Project[];
	allTasks?: UiTask[];
	onClose: () => void;
	onSaveNotes: (task: UiTask, notes: string) => Promise<void>;
	onChangeStatus?: (task: UiTask, status: ApiTaskStatus) => Promise<void>;
	onAddChild?: (parent: UiTask) => void;
	onOpenTask?: (task: UiTask) => void;
	onEdit?: (task: UiTask) => void;
	onDelete?: (task: UiTask) => void;
	onToggleChildDone?: (child: UiTask) => Promise<void>;
}

export function TaskDetailDialogV2({
	task,
	projects,
	allTasks = [],
	onClose,
	onSaveNotes,
	onChangeStatus,
	onAddChild,
	onOpenTask,
	onEdit,
	onDelete,
	onToggleChildDone,
}: Props) {
	const [notes, setNotes] = useState("");
	const [saving, setSaving] = useState(false);
	const [statusSaving, setStatusSaving] = useState(false);
	const [showNotesEditor, setShowNotesEditor] = useState(false);
	const { can } = usePermission();
	const canEditStatus = !!onChangeStatus && can("Create & edit tasks");

	useEffect(() => {
		if (task) {
			setNotes(task.developer_notes ?? "");
			setShowNotesEditor(false);
		}
	}, [task]);

	const project = projects.find((p) => p.id === task?.project_id);
	const assignee = task?.assigned_to;

	const children = useMemo(
		() =>
			task ? allTasks.filter((t) => t.parent_task_id === task.id) : [],
		[allTasks, task],
	);

	const completedCount = children.filter(
		(c) => c.apiStatus === "done",
	).length;
	const progress = children.length
		? Math.round((completedCount / children.length) * 100)
		: 0;

	async function handleSave() {
		if (!task) return;
		setSaving(true);
		try {
			await onSaveNotes(task, notes);
			setShowNotesEditor(false);
		} finally {
			setSaving(false);
		}
	}

	async function handleStatusChange(next: string) {
		if (!task || !onChangeStatus) return;
		const nextStatus = next as ApiTaskStatus;
		if (nextStatus === task.apiStatus) return;
		setStatusSaving(true);
		try {
			await onChangeStatus(task, nextStatus);
		} catch (e) {
			toast.error("Failed to update status", {
				description: (e as Error).message || "Please try again.",
			});
		} finally {
			setStatusSaving(false);
		}
	}

	function handleCopyLink() {
		if (!task) return;
		const url = `${window.location.origin}/tasks?taskId=${task.id}`;
		navigator.clipboard
			.writeText(url)
			.then(() =>
				toast.success("Link copied", {
					description: "Task URL on clipboard",
				}),
			)
			.catch(() => toast.error("Failed to copy link"));
	}

	const dueDateLabel = task?.due_date
		? format(new Date(task.due_date), "MMM d, yyyy")
		: "—";

	return (
		<Dialog
			open={!!task}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
			}}
		>
			<DialogContent className="max-w-5xl p-0 overflow-hidden">
				{/* Top bar */}
				<div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-3">
					<div className="flex items-center gap-3 min-w-0">
						<DialogClose className="rounded-md p-1 text-danger hover:text-foreground hover:bg-muted-subtle"></DialogClose>
						{task && (
							<>
								<span
									className={`text-[10px] font-bold tracking-wider px-2 py-1 rounded ${PRIORITY_CHIP[task.priority]}`}
								>
									{PRIORITY_LABEL[task.priority]}
								</span>
								<span className="text-sm text-muted">/</span>
								<span className="text-sm font-medium text-foreground truncate">
									{shortTaskRef(task, project)}
								</span>
							</>
						)}
					</div>
					<div className="flex items-center gap-2 shrink-0 pr-8">
						{task && onEdit && (
							<PermissionGate feature="Create & edit tasks">
								<Button
									variant="primary_outline"
									size="sm"
									className="text-foreground"
									onClick={() => onEdit(task)}
								>
									<Pencil className="h-3.5 w-3.5" />
									<span className="text-[12px]">Edit</span>
								</Button>
							</PermissionGate>
						)}
						{task && onDelete && (
							<PermissionGate feature="Create & edit tasks">
								<Button
									variant="destructive_outline"
									size="sm"
									className="text-foreground hover:text-danger"
									onClick={() => onDelete(task)}
								>
									<Trash2 className="h-3.5 w-3.5" />
									<span className="text-[12px]">Delete</span>
								</Button>
							</PermissionGate>
						)}
					</div>
				</div>

				{/* Body */}
				<div className="grid grid-cols-1 md:grid-cols-[1fr_300px] max-h-[80vh] overflow-hidden">
					{/* Main column */}
					<div className="overflow-y-auto px-6 py-6 space-y-7">
						{/* Title + description */}
						<div>
							<h2 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
								{task?.title}
							</h2>
							{task?.description &&
							projectDescriptionText(task.description) ? (
								<div className="text-sm text-muted leading-relaxed">
									<ProjectDescriptionPreview
										value={task.description}
									/>
								</div>
							) : (
								<p className="text-sm text-muted italic">
									No description provided.
								</p>
							)}
						</div>

						{/* Subtasks */}
						<section>
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-2">
									<ListChecks className="h-4 w-4 text-muted" />
									<h3 className="text-sm font-semibold text-foreground">
										Subtasks
									</h3>
									<span className="text-xs text-muted">
										({children.length})
									</span>
								</div>
								{children.length > 0 && (
									<span className="text-xs font-medium text-primary">
										{progress}% Complete
									</span>
								)}
							</div>
							{children.length > 0 && (
								<div className="h-1.5 w-full rounded-full bg-muted-subtle overflow-hidden mb-3">
									<div
										className="h-full bg-primary transition-all"
										style={{ width: `${progress}%` }}
									/>
								</div>
							)}
							{children.length === 0 ? (
								<div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
									<p className="text-xs text-muted mb-2">
										No subtasks yet
									</p>
									{task && onAddChild && (
										<PermissionGate feature="Create & edit tasks">
											<Button
												variant="outline"
												size="sm"
												onClick={() => onAddChild(task)}
											>
												<Plus className="h-3 w-3 mr-1" />
												Add subtask
											</Button>
										</PermissionGate>
									)}
								</div>
							) : (
								<div className="rounded-lg border border-border bg-muted-subtle/30 p-3 space-y-1.5">
									{children.map((child) => {
										const done = child.apiStatus === "done";
										return (
											<div
												key={child.id}
												className="flex items-center gap-2.5 group"
											>
												<button
													type="button"
													onClick={() =>
														onToggleChildDone?.(
															child,
														)
													}
													className={`h-4 w-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
														done
															? "bg-primary border-primary text-white"
															: "border-border-strong bg-surface hover:border-primary"
													}`}
													aria-label={
														done
															? "Mark not done"
															: "Mark done"
													}
													disabled={
														!onToggleChildDone
													}
												>
													{done && (
														<Check className="h-3 w-3" />
													)}
												</button>
												<button
													type="button"
													onClick={() =>
														onOpenTask?.(child)
													}
													className={`flex-1 text-left text-sm truncate transition-colors ${
														done
															? "line-through text-muted"
															: "text-foreground hover:text-primary"
													}`}
												>
													{child.title}
												</button>
												<Badge
													variant={
														STATUS_BADGE[
															child.apiStatus
														].variant
													}
													className="text-[9px] shrink-0"
												>
													{
														STATUS_BADGE[
															child.apiStatus
														].label
													}
												</Badge>
											</div>
										);
									})}
									{task && onAddChild && (
										<PermissionGate feature="Create & edit tasks">
											<button
												type="button"
												onClick={() => onAddChild(task)}
												className="flex items-center gap-2 text-xs text-muted hover:text-primary pt-1.5"
											>
												<Plus className="h-3 w-3" />
												Add subtask
											</button>
										</PermissionGate>
									)}
								</div>
							)}
						</section>

						{/* Attachments (placeholder) */}
						<section>
							<div className="flex items-center gap-2 mb-3">
								<Paperclip className="h-4 w-4 text-muted" />
								<h3 className="text-sm font-semibold text-foreground">
									Attachments
								</h3>
							</div>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								<button
									type="button"
									disabled
									className="aspect-[4/3] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
								>
									<Plus className="h-5 w-5 mb-1" />
									<span className="text-xs font-medium">
										Add New
									</span>
								</button>
							</div>
							<p className="text-[11px] text-muted mt-2 italic">
								Attachments coming soon.
							</p>
						</section>

						{/* Developer notes */}
						<section>
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-2">
									<MessageSquare className="h-4 w-4 text-muted" />
									<h3 className="text-sm font-semibold text-foreground">
										Developer's Notes
									</h3>
								</div>
								<PermissionGate feature="Create & edit tasks">
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											setShowNotesEditor((v) => !v)
										}
									>
										{showNotesEditor
											? "Cancel"
											: "Edit notes"}
									</Button>
								</PermissionGate>
							</div>
							{showNotesEditor ? (
								<>
									<ProjectDescriptionEditor
										value={notes}
										onChange={setNotes}
										placeholder="Add implementation details, technical context, or notes for the dev team..."
									/>
									<div className="flex justify-end mt-3">
										<Button
											onClick={handleSave}
											disabled={saving}
										>
											{saving && (
												<Loader2 className="h-4 w-4 animate-spin mr-2" />
											)}
											Save Notes
										</Button>
									</div>
								</>
							) : projectDescriptionText(notes) ? (
								<div className="text-sm text-foreground bg-muted-subtle/40 rounded-lg p-3">
									<ProjectDescriptionPreview value={notes} />
								</div>
							) : (
								<p className="text-xs text-muted italic">
									No notes yet.
								</p>
							)}
						</section>
					</div>

					{/* Sidebar */}
					<aside className="border-l border-border bg-muted-subtle/30 overflow-y-auto px-5 py-6 space-y-5">
						{/* Status */}
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
								Status
							</p>
							{canEditStatus && task ? (
								<div className="flex items-center gap-2">
									<Select
										value={task.apiStatus}
										onValueChange={handleStatusChange}
										disabled={statusSaving}
									>
										<SelectTrigger className="h-8 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{STATUS_OPTIONS.map((s) => (
												<SelectItem key={s} value={s}>
													{STATUS_BADGE[s].label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{statusSaving && (
										<Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
									)}
								</div>
							) : (
								<Badge
									variant={
										STATUS_BADGE[task?.apiStatus ?? "todo"]
											.variant
									}
								>
									{
										STATUS_BADGE[task?.apiStatus ?? "todo"]
											.label
									}
								</Badge>
							)}
						</div>

						<Separator />

						{/* Assignees */}
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
								Assignee
							</p>
							{assignee ? (
								<div className="flex items-center gap-2">
									<Avatar className="h-8 w-8">
										<AvatarFallback
											className={`text-[10px] text-white ${profileColorClass(assignee.id)}`}
										>
											{getInitials(
												assignee.full_name ??
													assignee.email,
											)}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm font-medium text-foreground truncate">
										{assignee.full_name ?? assignee.email}
									</span>
								</div>
							) : (
								<p className="text-sm text-muted">Unassigned</p>
							)}
						</div>

						<Separator />

						{/* Project + Sprint */}
						<div className="space-y-3">
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
									Project
								</p>
								<p className="text-sm font-medium text-foreground">
									{project?.name ?? "—"}
								</p>
							</div>
							<div>
								<p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1">
									Sprint
								</p>
								<p className="text-sm font-medium text-foreground">
									{task?.sprint?.name ?? "—"}
								</p>
							</div>
						</div>

						<Separator />

						{/* Due date */}
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
								Due Date
							</p>
							<div className="flex items-center gap-2 text-sm text-foreground">
								<Calendar className="h-4 w-4 text-muted" />
								{dueDateLabel}
							</div>
						</div>

						{/* Estimation */}
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
								Estimation
							</p>
							<div className="flex items-center gap-2 text-sm text-foreground">
								<Clock className="h-4 w-4 text-muted" />
								{task?.estimated_time
									? formatTime(task.estimated_time)
									: "—"}
							</div>
						</div>

						<Separator />

						{/* Tags */}
						<div>
							<p className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
								Tags
							</p>
							{task && task.tags.length > 0 ? (
								<div className="flex flex-wrap gap-1.5">
									{task.tags.map((tag) => (
										<span
											key={tag}
											className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium"
										>
											{tag}
										</span>
									))}
								</div>
							) : (
								<p className="text-xs text-muted">No tags</p>
							)}
						</div>

						{/* Copy link */}
						<Button
							variant="outline"
							className="w-full justify-start"
							onClick={handleCopyLink}
						>
							<Link2 className="h-4 w-4 mr-2" />
							Copy Task Link
						</Button>
					</aside>
				</div>
			</DialogContent>
		</Dialog>
	);
}
