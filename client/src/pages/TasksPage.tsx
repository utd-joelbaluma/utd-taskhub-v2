import { useState, useRef, useEffect, useCallback } from "react";
import {
	DndContext,
	DragOverlay,
	pointerWithin,
	rectIntersection,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	useDroppable,
	type CollisionDetection,
	type DragStartEvent,
	type DragOverEvent,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
	arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	Plus,
	Search,
	LayoutGrid,
	List,
	Calendar,
	GripVertical,
	X,
	Loader2,
	Trash2,
	CheckCircle2,
	Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
	listAllTasks,
	createTask,
	updateTask,
	deleteTask,
	type Task as ApiTask,
	type ApiTaskStatus,
	type ApiTaskPriority,
	type CreateTaskPayload,
	type UpdateTaskPayload,
} from "@/services/task.service";
import { listProjects, type Project } from "@/services/project.service";
import { listSprints, type Sprint } from "@/services/sprint.service";
import { listProfiles, type Profile } from "@/services/profile.service";
import { ProjectDescriptionEditor } from "@/components/projects/project-description";
import { projectDescriptionText } from "@/components/projects/project-description-utils";
import { cn } from "@/lib/utils";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

// ── Types ────────────────────────────────────────────────────────────────────

type ColumnId = "todo" | "in-progress" | "review" | "done";
type Columns = Record<ColumnId, UiTask[]>;

interface UiTask {
	id: string;
	project_id: string;
	title: string;
	description: string | null;
	apiStatus: ApiTaskStatus;
	columnId: ColumnId;
	priority: ApiTaskPriority;
	assigned_to: ApiTask["assigned_to"];
	due_date: string | null;
	tags: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMN_IDS: ColumnId[] = ["todo", "in-progress", "review", "done"];

const COLUMN_LABELS: Record<ColumnId, string> = {
	todo: "To Do",
	"in-progress": "In Progress",
	review: "QA",
	done: "Done",
};

const COLUMN_BADGE: Record<
	ColumnId,
	{ variant: "todo" | "in-progress" | "review" | "done"; dot: string }
> = {
	todo: { variant: "todo", dot: "bg-muted" },
	"in-progress": { variant: "in-progress", dot: "bg-primary" },
	review: { variant: "review", dot: "bg-secondary" },
	done: { variant: "done", dot: "bg-secondary" },
};

const PRIORITY_BORDER: Record<ApiTaskPriority, string> = {
	urgent: "border border-danger/20 hover:border-danger/50 hover:shadow-danger/20",
	high: "border border-warning/20 hover:border-warning/50 hover:shadow-warning/20",
	medium: "border border-primary/20 hover:border-primary/50 hover:shadow-primary/20",
	low: "border border-border/20 hover:border-border/50 hover:shadow-border/20",
};

const PRIORITY_BADGE_VARIANT: Record<
	ApiTaskPriority,
	"urgent" | "high" | "medium" | "low"
> = {
	urgent: "urgent",
	high: "high",
	medium: "medium",
	low: "low",
};

const STATUS_BADGE: Record<
	ApiTaskStatus,
	{ variant: "todo" | "in-progress" | "review" | "done"; label: string }
> = {
	backlog: { variant: "todo", label: "Backlog" },
	todo: { variant: "todo", label: "To Do" },
	in_progress: { variant: "in-progress", label: "In Progress" },
	review: { variant: "review", label: "QA" },
	done: { variant: "done", label: "Done" },
	cancelled: { variant: "done", label: "Cancelled" },
};

const AVATAR_COLORS = [
	"bg-primary",
	"bg-accent",
	"bg-secondary",
	"bg-warning",
	"bg-danger",
];

const EMPTY_TASK_FORM = {
	title: "",
	description: "",
	projectId: "",
	sprintId: "",
	assigneeId: "",
	status: "todo" as ColumnId,
	priority: "medium" as ApiTaskPriority,
	estimatedTime: "",
	dueDate: "",
	tagInput: "",
	tags: [] as string[],
};

const NO_SPRINT_VALUE = "__no_sprint__";

// ── Mapping helpers ───────────────────────────────────────────────────────────

function apiStatusToColumnId(status: ApiTaskStatus): ColumnId | null {
	switch (status) {
		case "backlog":
			return "todo";
		case "todo":
			return "todo";
		case "in_progress":
			return "in-progress";
		case "review":
			return "review";
		case "done":
			return "done";
		default:
			return null;
	}
}

function columnIdToApiStatus(colId: ColumnId): ApiTaskStatus {
	switch (colId) {
		case "todo":
			return "todo";
		case "in-progress":
			return "in_progress";
		case "review":
			return "review";
		case "done":
			return "done";
	}
}

function toUiTask(t: ApiTask): UiTask | null {
	const columnId = apiStatusToColumnId(t.status);
	if (!columnId) return null;
	return {
		id: t.id,
		project_id: t.project_id,
		title: t.title,
		description: t.description,
		apiStatus: t.status,
		columnId,
		priority: t.priority,
		assigned_to: t.assigned_to,
		due_date: t.due_date,
		tags: t.tags ?? [],
	};
}

function buildColumns(tasks: UiTask[]): Columns {
	return COLUMN_IDS.reduce((acc, colId) => {
		acc[colId] = tasks.filter((t) => t.columnId === colId);
		return acc;
	}, {} as Columns);
}

function emptyColumns(): Columns {
	return COLUMN_IDS.reduce((acc, c) => ({ ...acc, [c]: [] }), {} as Columns);
}

function getInitials(name: string | null | undefined): string {
	if (!name) return "?";
	return name
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function profileColorClass(id: string): string {
	const sum = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
	return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

// ── New Task Dialog ───────────────────────────────────────────────────────────

function NewTaskDialog({
	open,
	onClose,
	onCreate,
	projects,
	profiles,
}: {
	open: boolean;
	onClose: () => void;
	onCreate: (projectId: string, payload: CreateTaskPayload) => Promise<void>;
	projects: Project[];
	profiles: Profile[];
}) {
	const [form, setForm] = useState(EMPTY_TASK_FORM);
	const [errors, setErrors] = useState<{
		title?: string;
		projectId?: string;
	}>({});
	const [sprints, setSprints] = useState<Sprint[]>([]);
	const [sprintsLoading, setSprintsLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!open || !form.projectId) {
			setSprints([]);
			setSprintsLoading(false);
			return;
		}

		let active = true;
		setSprintsLoading(true);
		listSprints(form.projectId)
			.then((data) => {
				if (active) setSprints(data);
			})
			.catch(() => {
				if (active) setSprints([]);
			})
			.finally(() => {
				if (active) setSprintsLoading(false);
			});

		return () => {
			active = false;
		};
	}, [form.projectId, open]);

	function set<K extends keyof typeof EMPTY_TASK_FORM>(
		key: K,
		value: (typeof EMPTY_TASK_FORM)[K],
	) {
		setForm((prev) => ({ ...prev, [key]: value }));
		if (key === "title" || key === "projectId")
			setErrors((e) => ({ ...e, [key]: undefined }));
	}

	function addTag() {
		const tag = form.tagInput.trim();
		if (!tag || form.tags.includes(tag)) {
			set("tagInput", "");
			return;
		}
		set("tags", [...form.tags, tag]);
		set("tagInput", "");
	}

	function removeTag(tag: string) {
		set(
			"tags",
			form.tags.filter((t) => t !== tag),
		);
	}

	function handleProjectChange(projectId: string) {
		setForm((prev) => ({ ...prev, projectId, sprintId: "" }));
		setErrors((e) => ({ ...e, projectId: undefined }));
	}

	function validate() {
		const e: typeof errors = {};
		if (!form.title.trim()) e.title = "Task title is required.";
		if (!form.projectId) e.projectId = "Please select a project.";
		setErrors(e);
		return Object.keys(e).length === 0;
	}

	async function handleSubmit() {
		if (!validate()) return;
		setSubmitting(true);
		try {
			await onCreate(form.projectId, {
				title: form.title.trim(),
				description: projectDescriptionText(form.description)
					? form.description
					: undefined,
				status: columnIdToApiStatus(form.status),
				priority: form.priority,
				assigned_to: form.assigneeId || undefined,
				due_date: form.dueDate || undefined,
				tags: form.tags,
			});
			setForm(EMPTY_TASK_FORM);
			setErrors({});
			onClose();
		} catch {
			toast.error("Failed to create task", {
				description: "Please try again.",
			});
		} finally {
			setSubmitting(false);
		}
	}

	function handleOpenChange(open: boolean) {
		if (!open) {
			setForm(EMPTY_TASK_FORM);
			setErrors({});
		}
		if (!open) onClose();
	}

	const selectedAssignee = profiles.find((p) => p.id === form.assigneeId);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-[520px]">
				<DialogHeader>
					<DialogTitle>New Task</DialogTitle>
					<DialogDescription>
						Fill in the details to create a new task.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					{/* Project + Sprint */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
								Select Project <span className="text-danger">*</span>
							</label>
							<Select
								value={form.projectId}
								onValueChange={handleProjectChange}
							>
								<SelectTrigger
									className={
										errors.projectId ? "border-danger" : ""
									}
								>
									<SelectValue placeholder="Select project" />
								</SelectTrigger>
								<SelectContent>
									{projects.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.projectId && (
								<p className="text-xs text-danger mt-1">
									{errors.projectId}
								</p>
							)}
						</div>

						<div>
							<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
								Select Sprint
							</label>
							<Select
								value={form.sprintId || NO_SPRINT_VALUE}
								onValueChange={(v) =>
									set("sprintId", v === NO_SPRINT_VALUE ? "" : v)
								}
								disabled={!form.projectId || sprintsLoading}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={
											sprintsLoading ? "Loading..." : "Select sprint"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={NO_SPRINT_VALUE}>
										No sprint
									</SelectItem>
									{sprints.map((sprint) => (
										<SelectItem key={sprint.id} value={sprint.id}>
											{sprint.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					{/* Title */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Title <span className="text-danger">*</span>
						</label>
						<Input
							placeholder="e.g. Refactor authentication middleware"
							value={form.title}
							onChange={(e) => set("title", e.target.value)}
							className={
								errors.title
									? "border-danger focus:ring-danger"
									: ""
							}
						/>
						{errors.title && (
							<p className="text-xs text-danger mt-1">
								{errors.title}
							</p>
						)}
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
								onValueChange={(v) =>
									set("priority", v as ApiTaskPriority)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="urgent">
										Urgent
									</SelectItem>
									<SelectItem value="high">High</SelectItem>
									<SelectItem value="medium">
										Medium
									</SelectItem>
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
								onValueChange={(v) =>
									set("status", v as ColumnId)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todo">To Do</SelectItem>
									<SelectItem value="in-progress">
										In Progress
									</SelectItem>
									<SelectItem value="review">QA</SelectItem>
									<SelectItem value="done">Done</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Estimated Time */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Estimated time
						</label>
						<Input
							type="time"
							value={form.estimatedTime}
							onChange={(e) =>
								set("estimatedTime", e.target.value)
							}
						/>
					</div>

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
										set(
											"assigneeId",
											form.assigneeId === profile.id
												? ""
												: profile.id,
										)
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
											{getInitials(
												profile.full_name ??
													profile.email,
											)}
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
									{selectedAssignee.full_name ??
										selectedAssignee.email}
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
								onChange={(e) =>
									set("tagInput", e.target.value)
								}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addTag();
									}
								}}
								className="flex-1"
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addTag}
								className="shrink-0"
							>
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
						<Button variant="outline" disabled={submitting}>
							Cancel
						</Button>
					</DialogClose>
					<Button onClick={handleSubmit} disabled={submitting}>
						{submitting && (
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
						)}
						Create Task
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Edit Task Dialog ──────────────────────────────────────────────────────────

const EMPTY_EDIT_FORM = {
	title: "",
	description: "",
	assigneeId: "",
	status: "todo" as ColumnId,
	priority: "medium" as ApiTaskPriority,
	estimatedTime: "",
	dueDate: "",
	tagInput: "",
	tags: [] as string[],
};

function taskToEditForm(task: UiTask): typeof EMPTY_EDIT_FORM {
	return {
		title: task.title,
		description: task.description ?? "",
		assigneeId: task.assigned_to?.id ?? "",
		status: task.columnId,
		priority: task.priority,
		estimatedTime: "",
		dueDate: task.due_date ? task.due_date.slice(0, 10) : "",
		tagInput: "",
		tags: [...task.tags],
	};
}

function EditTaskDialog({
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

	useEffect(() => {
		if (task) setForm(taskToEditForm(task));
		else setForm(EMPTY_EDIT_FORM);
		setErrors({});
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
		if (!tag || form.tags.includes(tag)) {
			set("tagInput", "");
			return;
		}
		set("tags", [...form.tags, tag]);
		set("tagInput", "");
	}

	function removeTag(tag: string) {
		set(
			"tags",
			form.tags.filter((t) => t !== tag),
		);
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
				description: projectDescriptionText(form.description)
					? form.description
					: "",
				status: columnIdToApiStatus(form.status),
				priority: form.priority,
				assigned_to: form.assigneeId || undefined,
				due_date: form.dueDate || undefined,
				tags: form.tags,
			});
			onClose();
		} catch {
			toast.error("Failed to update task", {
				description: "Please try again.",
			});
		} finally {
			setSubmitting(false);
		}
	}

	const selectedAssignee = profiles.find((p) => p.id === form.assigneeId);

	return (
		<Dialog
			open={!!task}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="max-w-[520px]">
				<DialogHeader>
					<DialogTitle>Edit Task</DialogTitle>
					<DialogDescription>
						Update the task details below.
					</DialogDescription>
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
							className={
								errors.title
									? "border-danger focus:ring-danger"
									: ""
							}
						/>
						{errors.title && (
							<p className="text-xs text-danger mt-1">
								{errors.title}
							</p>
						)}
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
								onValueChange={(v) =>
									set("priority", v as ApiTaskPriority)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="urgent">
										Urgent
									</SelectItem>
									<SelectItem value="high">High</SelectItem>
									<SelectItem value="medium">
										Medium
									</SelectItem>
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
								onValueChange={(v) =>
									set("status", v as ColumnId)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todo">To Do</SelectItem>
									<SelectItem value="in-progress">
										In Progress
									</SelectItem>
									<SelectItem value="review">QA</SelectItem>
									<SelectItem value="done">Done</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Estimated Time */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Estimated time
						</label>
						<Input
							type="time"
							value={form.estimatedTime}
							onChange={(e) =>
								set("estimatedTime", e.target.value)
							}
						/>
					</div>

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
										set(
											"assigneeId",
											form.assigneeId === profile.id
												? ""
												: profile.id,
										)
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
											{getInitials(
												profile.full_name ??
													profile.email,
											)}
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
									{selectedAssignee.full_name ??
										selectedAssignee.email}
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
								onChange={(e) =>
									set("tagInput", e.target.value)
								}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addTag();
									}
								}}
								className="flex-1"
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addTag}
								className="shrink-0"
							>
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
						<Button variant="outline" disabled={submitting}>
							Cancel
						</Button>
					</DialogClose>
					<Button onClick={handleSubmit} disabled={submitting}>
						{submitting && (
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
						)}
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Task card ─────────────────────────────────────────────────────────────────

function TaskCardContent({
	task,
	projects,
	isDragging = false,
}: {
	task: UiTask;
	projects: Project[];
	isDragging?: boolean;
}) {
	const projectName =
		projects.find((p) => p.id === task.project_id)?.name ?? "—";
	const assignee = task.assigned_to;

	return (
		<div
			className={cn(
				"bg-surface rounded-lg border border-border p-3.5  transition-all flex flex-col gap-2.5 select-none",
				PRIORITY_BORDER[task.priority],
				isDragging
					? "shadow-xl opacity-90 rotate-1"
					: "shadow-xs hover:shadow-md",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<Badge
					variant={PRIORITY_BADGE_VARIANT[task.priority]}
					className="text-[10px]"
				>
					{task.priority.charAt(0).toUpperCase() +
						task.priority.slice(1)}
				</Badge>
				{task.tags[0] && (
					<span className="text-[10px] bg-muted-subtle text-muted-foreground px-1.5 py-0.5 rounded font-medium leading-none">
						{task.tags[0]}
					</span>
				)}
			</div>

			<p className="text-sm font-medium text-foreground leading-snug">
				{task.title}
			</p>

			<p className="text-[11px] text-muted">{projectName}</p>

			<div className="flex items-center justify-between pt-0.5 border-t border-border">
				{assignee ? (
					<Avatar className="h-5 w-5">
						<AvatarFallback
							className={`text-[9px] text-white ${profileColorClass(assignee.id)}`}
						>
							{getInitials(assignee.full_name ?? assignee.email)}
						</AvatarFallback>
					</Avatar>
				) : (
					<span />
				)}
				<div className="flex items-center gap-1 text-[11px] text-muted">
					<Calendar className="h-3 w-3" />
					{task.due_date ? task.due_date.slice(0, 10) : "—"}
				</div>
			</div>
		</div>
	);
}

// ── Sortable card wrapper ─────────────────────────────────────────────────────

function SortableTaskCard({
	task,
	projects,
	onEdit,
	onDelete,
}: {
	task: UiTask;
	projects: Project[];
	onEdit: (task: UiTask) => void;
	onDelete: (task: UiTask) => void;
}) {
	const [confirming, setConfirming] = useState(false);
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: task.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.35 : undefined,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="relative group"
			onMouseLeave={() => setConfirming(false)}
		>
			<div
				{...attributes}
				{...listeners}
				className="absolute top-3 right-2 z-10 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted hover:text-primary"
			>
				<Tooltip>
					<TooltipTrigger asChild>
						<GripVertical className="h-4 w-4" />
					</TooltipTrigger>
					<TooltipContent side="left">
						Click and drag to move task
					</TooltipContent>
				</Tooltip>
			</div>
			<div className="absolute top-10 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-4">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => onEdit(task)}
							className="p-0.5 rounded transition-colors text-muted hover:text-primary"
						>
							<Pencil className="h-3.5 w-3.5" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="left">
						Click to edit task
					</TooltipContent>
				</Tooltip>
			</div>
			<div className="absolute bottom-3 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-4">
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => onDelete(task)}
							className={cn(
								"text-[11px] font-medium relative text-secondary bg-secondary/5 hover:bg-secondary/10 px-1.5 py-0.5 rounded transition-all duration-150 gap-1 flex items-center justify-center",
								confirming
									? "opacity-100 translate-x-0"
									: "opacity-0 translate-x-2 pointer-events-none",
							)}
						>
							<CheckCircle2 className="h-3 w-3" />
							Confirm
						</button>
					</TooltipTrigger>
					<TooltipContent side="top">
						This will permanently delete the task
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => setConfirming((prev) => !prev)}
							className={cn(
								"p-0.5 rounded transition-colors",
								confirming
									? "text-danger"
									: "text-muted hover:text-danger",
							)}
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</TooltipTrigger>
					<TooltipContent side="left">
						Click to delete task
					</TooltipContent>
				</Tooltip>
			</div>

			<TaskCardContent task={task} projects={projects} />
		</div>
	);
}

// ── Board column ──────────────────────────────────────────────────────────────

function BoardColumn({
	colId,
	tasks,
	projects,
	onEdit,
	onDelete,
}: {
	colId: ColumnId;
	tasks: UiTask[];
	projects: Project[];
	onEdit: (task: UiTask) => void;
	onDelete: (task: UiTask) => void;
}) {
	const { setNodeRef, isOver } = useDroppable({ id: colId });
	const { dot } = COLUMN_BADGE[colId];

	return (
		<div className="flex flex-col min-w-[280px] flex-1">
			<div className="flex items-center gap-2 mb-3 px-1">
				<span className={`h-2 w-2 rounded-full ${dot}`} />
				<span className="text-sm font-semibold text-foreground">
					{COLUMN_LABELS[colId]}
				</span>
				<span className="ml-auto text-xs font-medium text-muted bg-muted-subtle px-2 py-0.5 rounded-full">
					{tasks.length}
				</span>
			</div>

			<div
				ref={setNodeRef}
				className={cn(
					"flex-1 flex flex-col gap-2.5 rounded-xl p-2 min-h-[200px] transition-colors",
					isOver
						? "bg-primary-subtle/60 border border-dashed border-primary/40"
						: "bg-muted-subtle/40",
				)}
			>
				<SortableContext
					items={tasks.map((t) => t.id)}
					strategy={verticalListSortingStrategy}
				>
					{tasks.map((task) => (
						<SortableTaskCard
							key={task.id}
							task={task}
							projects={projects}
							onEdit={onEdit}
							onDelete={onDelete}
						/>
					))}
				</SortableContext>

				{tasks.length === 0 && (
					<div className="flex-1 flex items-center justify-center py-8">
						<p className="text-xs text-muted">Drop tasks here</p>
					</div>
				)}
			</div>
		</div>
	);
}

// ── List view row ─────────────────────────────────────────────────────────────

function ListRow({ task, projects }: { task: UiTask; projects: Project[] }) {
	const projectName =
		projects.find((p) => p.id === task.project_id)?.name ?? "—";
	const assignee = task.assigned_to;
	const statusInfo = STATUS_BADGE[task.apiStatus];

	return (
		<tr className="border-b border-border last:border-0 hover:bg-muted-subtle transition-colors">
			<td className="px-5 py-3.5">
				<p className="text-sm font-medium text-foreground">
					{task.title}
				</p>
				{task.tags[0] && (
					<span className="text-[10px] text-muted">
						{task.tags[0]}
					</span>
				)}
			</td>
			<td className="px-4 py-3.5">
				<span className="text-xs text-muted-foreground">
					{projectName}
				</span>
			</td>
			<td className="px-4 py-3.5">
				<Badge variant={PRIORITY_BADGE_VARIANT[task.priority]}>
					{task.priority.charAt(0).toUpperCase() +
						task.priority.slice(1)}
				</Badge>
			</td>
			<td className="px-4 py-3.5">
				<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
			</td>
			<td className="px-4 py-3.5">
				{assignee && (
					<div className="flex items-center gap-2">
						<Avatar className="h-6 w-6">
							<AvatarFallback
								className={`text-[9px] text-white ${profileColorClass(assignee.id)}`}
							>
								{getInitials(
									assignee.full_name ?? assignee.email,
								)}
							</AvatarFallback>
						</Avatar>
						<span className="text-xs text-muted-foreground">
							{assignee.full_name ?? assignee.email}
						</span>
					</div>
				)}
			</td>
			<td className="px-4 py-3.5">
				<div className="flex items-center gap-1 text-xs text-muted">
					<Calendar className="h-3 w-3" />
					{task.due_date ? task.due_date.slice(0, 10) : "—"}
				</div>
			</td>
		</tr>
	);
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
	const [columns, setColumns] = useState<Columns>(emptyColumns);
	const [projects, setProjects] = useState<Project[]>([]);
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTask, setEditTask] = useState<UiTask | null>(null);
	const [view, setView] = useState<"board" | "list">("board");

	const [filterProject, setFilterProject] = useState("all");
	const [filterUser, setFilterUser] = useState("all");
	const [filterStatus, setFilterStatus] = useState("all");
	const [search, setSearch] = useState("");

	const columnsRef = useRef(columns);
	columnsRef.current = columns;
	const dragSrcColRef = useRef<ColumnId | null>(null);

	// ── Data loading ─────────────────────────────────────────────────────────

	useEffect(() => {
		let cancelled = false;
		async function load() {
			setLoading(true);
			setError(null);
			try {
				const [tasks, projs, profs] = await Promise.all([
					listAllTasks(),
					listProjects(),
					listProfiles(),
				]);
				if (cancelled) return;
				setProjects(projs);
				setProfiles(profs);
				setColumns(
					buildColumns(
						tasks.flatMap((t) => {
							const u = toUiTask(t);
							return u ? [u] : [];
						}),
					),
				);
			} catch (e) {
				if (!cancelled) setError((e as Error).message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, []);

	// ── DnD ──────────────────────────────────────────────────────────────────

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	function findColumnId(taskId: string): ColumnId | null {
		for (const colId of COLUMN_IDS) {
			if (columnsRef.current[colId].some((t) => t.id === taskId))
				return colId;
		}
		return null;
	}

	const collisionDetection: CollisionDetection = useCallback((args) => {
		const pointerHits = pointerWithin(args);
		if (pointerHits.length > 0) return pointerHits;
		return rectIntersection(args);
	}, []);

	function onDragStart({ active }: DragStartEvent) {
		setActiveTaskId(active.id as string);
		dragSrcColRef.current = findColumnId(active.id as string);
	}

	function onDragOver({ active, over }: DragOverEvent) {
		if (!over) return;

		const activeId = active.id as string;
		const overId = over.id as string;
		if (activeId === overId) return;

		const srcColId = findColumnId(activeId);
		const dstColId = (
			COLUMN_IDS.includes(overId as ColumnId)
				? overId
				: findColumnId(overId)
		) as ColumnId | null;

		if (!srcColId || !dstColId || srcColId === dstColId) return;

		setColumns((prev) => {
			const srcTasks = [...prev[srcColId]];
			const dstTasks = [...prev[dstColId]];

			const srcIdx = srcTasks.findIndex((t) => t.id === activeId);
			if (srcIdx < 0) return prev;

			const moved = { ...srcTasks[srcIdx], columnId: dstColId };
			const newSrc = srcTasks.filter((t) => t.id !== activeId);

			const overIdx = dstTasks.findIndex((t) => t.id === overId);
			const insertAt = overIdx >= 0 ? overIdx : dstTasks.length;
			const newDst = [
				...dstTasks.slice(0, insertAt),
				moved,
				...dstTasks.slice(insertAt),
			];

			return { ...prev, [srcColId]: newSrc, [dstColId]: newDst };
		});
	}

	function onDragEnd({ active, over }: DragEndEvent) {
		setActiveTaskId(null);
		if (!over) return;

		const activeId = active.id as string;
		const overId = over.id as string;

		const srcCol = dragSrcColRef.current;
		const curCol = findColumnId(activeId);

		// Cross-column move — persist status via API
		if (srcCol && curCol && srcCol !== curCol) {
			const task = columnsRef.current[curCol].find(
				(t) => t.id === activeId,
			);
			if (task) {
				updateTask(task.project_id, task.id, {
					status: columnIdToApiStatus(curCol),
				})
					.then(() =>
						toast.success("Task updated", {
							description: `Moved to ${COLUMN_LABELS[curCol]}`,
						}),
					)
					.catch(() => {
						toast.error("Failed to move task", {
							description: "Please try again.",
						});
						listAllTasks().then((tasks) =>
							setColumns(
								buildColumns(
									tasks.flatMap((t) => {
										const u = toUiTask(t);
										return u ? [u] : [];
									}),
								),
							),
						);
					});
			}
			return;
		}

		// Same-column reorder (local only — no position API on global view)
		if (activeId === overId) return;
		const colId = findColumnId(activeId);
		if (!colId) return;
		const overIsTask = !COLUMN_IDS.includes(overId as ColumnId);
		if (!overIsTask) return;
		const overColId = findColumnId(overId);
		if (!overColId || overColId !== colId) return;

		setColumns((prev) => {
			const items = prev[colId];
			const fromIdx = items.findIndex((t) => t.id === activeId);
			const toIdx = items.findIndex((t) => t.id === overId);
			if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev;
			return { ...prev, [colId]: arrayMove(items, fromIdx, toIdx) };
		});
	}

	// ── Filtering ────────────────────────────────────────────────────────────

	function applyFilters(tasks: UiTask[]) {
		return tasks.filter((t) => {
			if (filterProject !== "all" && t.project_id !== filterProject)
				return false;
			if (filterUser !== "all" && t.assigned_to?.id !== filterUser)
				return false;
			if (
				filterStatus !== "all" &&
				t.apiStatus !== (filterStatus as ApiTaskStatus)
			)
				return false;
			if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
				return false;
			return true;
		});
	}

	const filteredColumns = COLUMN_IDS.reduce((acc, colId) => {
		acc[colId] = applyFilters(columns[colId]);
		return acc;
	}, {} as Columns);

	const allFilteredTasks = COLUMN_IDS.flatMap((c) => filteredColumns[c]);

	const activeTask = activeTaskId
		? (COLUMN_IDS.flatMap((c) => columns[c]).find(
				(t) => t.id === activeTaskId,
			) ?? null)
		: null;

	const isFiltered =
		filterProject !== "all" ||
		filterUser !== "all" ||
		filterStatus !== "all" ||
		search !== "";

	// ── Handlers ─────────────────────────────────────────────────────────────

	async function handleCreateTask(
		projectId: string,
		payload: CreateTaskPayload,
	) {
		const apiTask = await createTask(projectId, payload);
		const ui = toUiTask(apiTask);
		if (!ui) return;
		setColumns((prev) => ({
			...prev,
			[ui.columnId]: [ui, ...prev[ui.columnId]],
		}));
		toast.success("Task created", { description: apiTask.title });
	}

	async function handleDeleteTask(task: UiTask) {
		setColumns((prev) => ({
			...prev,
			[task.columnId]: prev[task.columnId].filter(
				(t) => t.id !== task.id,
			),
		}));
		try {
			await deleteTask(task.project_id, task.id);
			toast.success("Task deleted", { description: task.title });
		} catch {
			setColumns((prev) => ({
				...prev,
				[task.columnId]: [task, ...prev[task.columnId]],
			}));
			toast.error("Failed to delete task", {
				description: "Please try again.",
			});
		}
	}

	async function handleEditTask(task: UiTask, payload: UpdateTaskPayload) {
		const apiTask = await updateTask(task.project_id, task.id, payload);
		const updated = toUiTask(apiTask);
		if (!updated) return;
		setColumns((prev) => {
			// Remove from old column, insert into new column
			const withoutOld = {
				...prev,
				[task.columnId]: prev[task.columnId].filter(
					(t) => t.id !== task.id,
				),
			};
			return {
				...withoutOld,
				[updated.columnId]: [
					updated,
					...withoutOld[updated.columnId].filter(
						(t) => t.id !== updated.id,
					),
				],
			};
		});
		toast.success("Task updated", { description: apiTask.title });
	}

	// ── Loading / Error ───────────────────────────────────────────────────────

	if (loading) {
		return (
			<div className="flex items-center justify-center py-24">
				<Loader2 className="h-6 w-6 animate-spin text-muted" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-24 text-center">
				<p className="text-sm font-medium text-foreground mb-1">
					Failed to load tasks
				</p>
				<p className="text-xs text-muted">{error}</p>
			</div>
		);
	}

	// ── Render ───────────────────────────────────────────────────────────────

	return (
		<div className="mx-auto max-w-[1280px] px-6 py-8">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-semibold text-foreground tracking-tight">
						Tasks
					</h1>
					<p className="text-sm text-muted mt-1">
						{COLUMN_IDS.reduce((s, c) => s + columns[c].length, 0)}{" "}
						tasks across all projects
					</p>
				</div>
				<Button
					className="flex items-center gap-2"
					onClick={() => setDialogOpen(true)}
				>
					<Plus className="h-4 w-4" />
					New Task
				</Button>
			</div>

			{/* Filter bar */}
			<div className="flex items-center gap-3 mb-6 flex-wrap">
				{/* Project */}
				<Select value={filterProject} onValueChange={setFilterProject}>
					<SelectTrigger className="w-48 h-9">
						<SelectValue placeholder="All Projects" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Projects</SelectItem>
						{projects.map((p) => (
							<SelectItem key={p.id} value={p.id}>
								{p.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
					<Input
						placeholder="Search tasks..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-8 w-56 h-9 text-sm"
					/>
				</div>

				{/* User */}
				<Select value={filterUser} onValueChange={setFilterUser}>
					<SelectTrigger className="w-44 h-9">
						<SelectValue placeholder="All Users" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Users</SelectItem>
						{profiles.map((u) => (
							<SelectItem key={u.id} value={u.id}>
								{u.full_name ?? u.email}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Status (list view only) */}
				{view === "list" && (
					<Select
						value={filterStatus}
						onValueChange={setFilterStatus}
					>
						<SelectTrigger className="w-40 h-9">
							<SelectValue placeholder="All Statuses" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Statuses</SelectItem>
							<SelectItem value="backlog">Backlog</SelectItem>
							<SelectItem value="todo">To Do</SelectItem>
							<SelectItem value="in_progress">
								In Progress
							</SelectItem>
							<SelectItem value="review">QA</SelectItem>
							<SelectItem value="done">Done</SelectItem>
							<SelectItem value="cancelled">Cancelled</SelectItem>
						</SelectContent>
					</Select>
				)}

				{/* Clear filters */}
				{isFiltered && (
					<button
						onClick={() => {
							setFilterProject("all");
							setFilterUser("all");
							setFilterStatus("all");
							setSearch("");
						}}
						className="text-xs text-muted hover:text-foreground underline"
					>
						Clear filters
					</button>
				)}

				{/* View toggle */}
				<div className="ml-auto flex items-center border border-border rounded-lg overflow-hidden bg-surface">
					<button
						onClick={() => setView("board")}
						className={cn(
							"p-2 transition-colors",
							view === "board"
								? "bg-primary text-primary-foreground"
								: "text-muted hover:text-foreground hover:bg-muted-subtle",
						)}
					>
						<LayoutGrid className="h-4 w-4" />
					</button>
					<button
						onClick={() => setView("list")}
						className={cn(
							"p-2 transition-colors",
							view === "list"
								? "bg-primary text-primary-foreground"
								: "text-muted hover:text-foreground hover:bg-muted-subtle",
						)}
					>
						<List className="h-4 w-4" />
					</button>
				</div>
			</div>

			{/* ── BOARD VIEW ──────────────────────────────────────────────────── */}
			{view === "board" && (
				<DndContext
					sensors={sensors}
					collisionDetection={collisionDetection}
					onDragStart={onDragStart}
					onDragOver={onDragOver}
					onDragEnd={onDragEnd}
				>
					<div className="flex gap-4 overflow-x-auto pb-4 items-start">
						{COLUMN_IDS.map((colId) => (
							<BoardColumn
								key={colId}
								colId={colId}
								tasks={filteredColumns[colId]}
								projects={projects}
								onEdit={setEditTask}
								onDelete={handleDeleteTask}
							/>
						))}
					</div>

					<DragOverlay
						dropAnimation={{ duration: 150, easing: "ease" }}
					>
						{activeTask ? (
							<div className="w-[272px]">
								<TaskCardContent
									task={activeTask}
									projects={projects}
									isDragging
								/>
							</div>
						) : null}
					</DragOverlay>
				</DndContext>
			)}

			{/* ── LIST VIEW ───────────────────────────────────────────────────── */}
			{view === "list" &&
				(allFilteredTasks.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-24 text-center">
						<Search className="h-8 w-8 text-border-strong mb-3" />
						<p className="text-sm font-medium text-foreground mb-1">
							No tasks found
						</p>
						<p className="text-xs text-muted">
							Try adjusting your filters.
						</p>
					</div>
				) : (
					<Card className="p-0 overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted-subtle/40">
									{[
										"Task",
										"Project",
										"Priority",
										"Status",
										"Assignee",
										"Due",
									].map((h, i) => (
										<th
											key={h}
											className={cn(
												"px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted",
												i === 0
													? "pl-5 text-left"
													: "text-left",
											)}
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{allFilteredTasks.map((task) => (
									<ListRow
										key={task.id}
										task={task}
										projects={projects}
									/>
								))}
							</tbody>
						</table>
					</Card>
				))}

			<NewTaskDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onCreate={handleCreateTask}
				projects={projects}
				profiles={profiles}
			/>

			<EditTaskDialog
				task={editTask}
				onClose={() => setEditTask(null)}
				onSave={handleEditTask}
				profiles={profiles}
			/>
		</div>
	);
}
