import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
	type ApiTaskPriority,
	type UpdateTaskPayload,
} from "@/services/task.service";
import { type Profile } from "@/services/profile.service";
import { listSprints, type Sprint } from "@/services/sprint.service";
import {
	ProjectDescriptionEditor,
} from "@/components/projects/project-description";
import { projectDescriptionText } from "@/components/projects/project-description-utils";
import { cn } from "@/lib/utils";
import { EstimatedTimeField } from "./TaskForm";
import {
	type UiTask,
	type ColumnId,
	AVATAR_COLORS,
	columnIdToApiStatus,
	getInitials,
} from "./types";

const NO_SPRINT_VALUE = "__no_sprint__";

const EMPTY_EDIT_FORM = {
	title: "",
	description: "",
	assigneeId: "",
	sprintId: "",
	status: "todo" as ColumnId,
	priority: "medium" as ApiTaskPriority,
	dueDate: "",
	tagInput: "",
	tags: [] as string[],
};

function taskToEditForm(task: UiTask): typeof EMPTY_EDIT_FORM {
	return {
		title: task.title,
		description: task.description ?? "",
		assigneeId: task.assigned_to?.id ?? "",
		sprintId: task.sprint?.id ?? "",
		status: task.columnId,
		priority: task.priority,
		dueDate: task.due_date ? task.due_date.slice(0, 10) : "",
		tagInput: "",
		tags: [...task.tags],
	};
}

export function EditTaskDialog({
	task,
	onClose,
	onSave,
	profiles,
}: {
	task: UiTask | null;
	onClose: () => void;
	onSave: (task: UiTask, payload: UpdateTaskPayload) => Promise<void>;
	profiles: Profile[];
}) {
	const [form, setForm] = useState(EMPTY_EDIT_FORM);
	const [errors, setErrors] = useState<{ title?: string }>({});
	const [submitting, setSubmitting] = useState(false);
	const [estimatedTime, setEstimatedTime] = useState(0);
	const [sprints, setSprints] = useState<Sprint[]>([]);
	const [sprintsLoading, setSprintsLoading] = useState(false);

	useEffect(() => {
		if (task) {
			setForm(taskToEditForm(task));
			setEstimatedTime(task.estimated_time ?? 0);
		} else {
			setForm(EMPTY_EDIT_FORM);
			setEstimatedTime(0);
		}
		setErrors({});
	}, [task]);

	useEffect(() => {
		if (!task) return;
		let active = true;
		setSprintsLoading(true);
		listSprints()
			.then((data) => {
				if (!active) return;
				setSprints(data);
				if (!task.sprint) {
					const activeSprint = data.find((s) => s.status === "active");
					if (activeSprint) setForm((prev) => ({ ...prev, sprintId: activeSprint.id }));
				}
			})
			.catch(() => { if (active) setSprints([]); })
			.finally(() => { if (active) setSprintsLoading(false); });
		return () => { active = false; };
	}, [task]);

	function set<K extends keyof typeof EMPTY_EDIT_FORM>(
		key: K,
		value: (typeof EMPTY_EDIT_FORM)[K],
	) {
		setForm((prev) => ({ ...prev, [key]: value }));
		if (key === "title") setErrors((e) => ({ ...e, title: undefined }));
	}

	function addTag() {
		const tag = form.tagInput.trim();
		if (!tag || form.tags.includes(tag)) { set("tagInput", ""); return; }
		set("tags", [...form.tags, tag]);
		set("tagInput", "");
	}

	function removeTag(tag: string) {
		set("tags", form.tags.filter((t) => t !== tag));
	}

	function validate() {
		const e: typeof errors = {};
		if (!form.title.trim()) e.title = "Task title is required.";
		setErrors(e);
		return Object.keys(e).length === 0;
	}

	async function handleSubmit() {
		if (!task || !validate()) return;
		setSubmitting(true);
		try {
			await onSave(task, {
				title: form.title.trim(),
				description: projectDescriptionText(form.description) ? form.description : "",
				status: columnIdToApiStatus(form.status),
				priority: form.priority,
				assigned_to: form.assigneeId || undefined,
				due_date: form.dueDate || undefined,
				sprint_id: form.sprintId || undefined,
				tags: form.tags,
				estimated_time: estimatedTime,
			});
			onClose();
		} catch {
			toast.error("Failed to update task", { description: "Please try again." });
		} finally {
			setSubmitting(false);
		}
	}

	const selectedAssignee = profiles.find((p) => p.id === form.assigneeId);

	return (
		<Dialog
			open={!!task}
			onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}
		>
			<DialogContent className="max-w-[520px]">
				<DialogHeader>
					<DialogTitle>Edit Task</DialogTitle>
					<DialogDescription>Update the task details below.</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					{/* Title */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Title <span className="text-danger">*</span>
						</label>
						<Input
							placeholder="e.g. Refactor authentication middleware"
							value={form.title}
							onChange={(e) => set("title", e.target.value)}
							className={errors.title ? "border-danger focus:ring-danger" : ""}
						/>
						{errors.title && (
							<p className="text-xs text-danger mt-1">{errors.title}</p>
						)}
					</div>

					{/* Sprint */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Sprint
						</label>
						<div className="relative">
							{sprintsLoading && (
								<>
									<div className="h-full w-full absolute rounded-2xl bg-white/20 backdrop-blur-xs top-0 left-0 pointer-events-none" />
									<div className="bg-white/50 backdrop-blur-xs h-full w-full absolute rounded-2xl text-slate-600 flex items-center px-2 text-xs justify-center z-10 border border-border pointer-events-none">
										loading...
									</div>
								</>
							)}
							<Select
								value={form.sprintId || NO_SPRINT_VALUE}
								onValueChange={(v) =>
									set("sprintId", v === NO_SPRINT_VALUE ? "" : v)
								}
								disabled={sprintsLoading}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={sprintsLoading ? "Loading..." : "Select sprint"}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NO_SPRINT_VALUE}>No sprint</SelectItem>
									{sprints.map((sprint) => (
										<SelectItem key={sprint.id} value={sprint.id}>
											{sprint.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Description */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Description
						</label>
						<ProjectDescriptionEditor
							value={form.description}
							onChange={(value) => set("description", value)}
							placeholder="Describe the task details..."
						/>
					</div>

					{/* Priority + Status */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
								Priority
							</label>
							<Select
								value={form.priority}
								onValueChange={(v) => set("priority", v as ApiTaskPriority)}
							>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="urgent">Urgent</SelectItem>
									<SelectItem value="high">High</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="low">Low</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
								Status
							</label>
							<Select
								value={form.status}
								onValueChange={(v) => set("status", v as ColumnId)}
							>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="todo">To Do</SelectItem>
									<SelectItem value="in-progress">In Progress</SelectItem>
									<SelectItem value="review">QA</SelectItem>
									<SelectItem value="done">Done</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Estimated Time */}
					<EstimatedTimeField value={estimatedTime} onChange={(v) => setEstimatedTime(v)} />

					{/* Due Date */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Due date
						</label>
						<Input
							type="date"
							value={form.dueDate}
							onChange={(e) => set("dueDate", e.target.value)}
						/>
					</div>

					{/* Assignee */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-2 block">
							Assignee
						</label>
						<div className="flex flex-wrap gap-2">
							{profiles.map((profile, idx) => (
								<button
									key={profile.id}
									type="button"
									onClick={() =>
										set("assigneeId", form.assigneeId === profile.id ? "" : profile.id)
									}
									className={cn(
										"flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
										form.assigneeId === profile.id
											? "border-primary bg-primary-subtle text-primary font-medium"
											: "border-border hover:bg-muted-subtle text-foreground",
									)}
								>
									<Avatar className="h-5 w-5 shrink-0">
										<AvatarFallback
											className={`text-[9px] text-white ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
										>
											{getInitials(profile.full_name ?? profile.email)}
										</AvatarFallback>
									</Avatar>
									{profile.full_name ?? profile.email}
								</button>
							))}
						</div>
						{selectedAssignee && (
							<p className="text-xs text-muted mt-2">
								Assigned to{" "}
								<span className="font-medium text-foreground">
									{selectedAssignee.full_name ?? selectedAssignee.email}
								</span>
							</p>
						)}
					</div>

					{/* Tags */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Tags
						</label>
						<div className="flex gap-2">
							<Input
								placeholder="Add tag..."
								value={form.tagInput}
								onChange={(e) => set("tagInput", e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
								className="flex-1"
							/>
							<Button type="button" variant="outline" size="sm" onClick={addTag} className="shrink-0">
								Add
							</Button>
						</div>
						{form.tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5 mt-2">
								{form.tags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center gap-1 text-[11px] bg-muted-subtle text-muted-foreground px-2 py-0.5 rounded-full font-medium"
									>
										{tag}
										<button
											type="button"
											onClick={() => removeTag(tag)}
											className="text-muted hover:text-foreground transition-colors"
										>
											<X className="h-2.5 w-2.5" />
										</button>
									</span>
								))}
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline" disabled={submitting}>Cancel</Button>
					</DialogClose>
					<Button onClick={handleSubmit} disabled={submitting}>
						{submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
