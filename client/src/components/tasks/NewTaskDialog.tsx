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
	listSprints,
	type Sprint,
} from "@/services/sprint.service";
import {
	type ApiTaskPriority,
	type CreateTaskPayload,
} from "@/services/task.service";
import { type Project } from "@/services/project.service";
import { type Profile } from "@/services/profile.service";
import {
	ProjectDescriptionEditor,
} from "@/components/projects/project-description";
import { projectDescriptionText } from "@/components/projects/project-description-utils";
import { cn } from "@/lib/utils";
import MantineSelect from "@/components/ui/mantine-select";
import { EstimatedTimeField } from "./TaskForm";
import {
	type ColumnId,
	AVATAR_COLORS,
	columnIdToApiStatus,
	getInitials,
} from "./types";

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

export function NewTaskDialog({
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
	const [errors, setErrors] = useState<{ title?: string; projectId?: string }>({});
	const [sprints, setSprints] = useState<Sprint[]>([]);
	const [sprintsLoading, setSprintsLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [estimatedTime, setEstimatedTime] = useState(0);

	useEffect(() => {
		if (!open) return;
		let active = true;
		setSprintsLoading(true);
		listSprints()
			.then((data) => { if (active) setSprints(data); })
			.catch(() => { if (active) setSprints([]); })
			.finally(() => { if (active) setSprintsLoading(false); });
		return () => { active = false; };
	}, [open]);

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
		if (!tag || form.tags.includes(tag)) { set("tagInput", ""); return; }
		set("tags", [...form.tags, tag]);
		set("tagInput", "");
	}

	function removeTag(tag: string) {
		set("tags", form.tags.filter((t) => t !== tag));
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
				description: projectDescriptionText(form.description) ? form.description : undefined,
				status: columnIdToApiStatus(form.status),
				priority: form.priority,
				assigned_to: form.assigneeId || undefined,
				due_date: form.dueDate || undefined,
				tags: form.tags,
				project_id: form.projectId,
				sprint_id: form.sprintId || undefined,
				estimated_time: estimatedTime > 0 ? estimatedTime : 0,
			});
			setForm(EMPTY_TASK_FORM);
			setErrors({});
			onClose();
		} catch {
			toast.error("Failed to create task", { description: "Please try again." });
		} finally {
			setSubmitting(false);
		}
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			setForm(EMPTY_TASK_FORM);
			setErrors({});
			onClose();
		}
	}

	const selectedAssignee = profiles.find((p) => p.id === form.assigneeId);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-[520px]">
				<DialogHeader>
					<DialogTitle>New Task</DialogTitle>
					<DialogDescription>Fill in the details to create a new task.</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					{/* Project + Sprint */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
								Select Project <span className="text-danger">*</span>
							</label>
							<Select value={form.projectId} onValueChange={handleProjectChange}>
								<SelectTrigger className={errors.projectId ? "border-danger" : ""}>
									<SelectValue placeholder="Select project" />
								</SelectTrigger>
								<SelectContent>
									{projects.map((p) => (
										<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.projectId && (
								<p className="text-xs text-danger mt-1">{errors.projectId}</p>
							)}
						</div>

						<div>
							<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
								Select Sprint
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
									onValueChange={(v) => set("sprintId", v === NO_SPRINT_VALUE ? "" : v)}
									disabled={sprintsLoading}
								>
									<SelectTrigger>
										<SelectValue placeholder={sprintsLoading ? "Loading..." : "Select sprint"} />
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
							className={errors.title ? "border-danger focus:ring-danger" : ""}
						/>
						{errors.title && (
							<p className="text-xs text-danger mt-1">{errors.title}</p>
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
							<MantineSelect
								label="Select User"
								value={form.assigneeId}
								onChange={(value: string | null) => set("assigneeId", value ?? "")}
								data={profiles.map((p) => ({
									value: p.id,
									label: p.full_name || p.email,
									description: p.role,
									image: p.avatar_url || `https://i.pravatar.cc/100?u=${p.email}`,
								}))}
							/>
						</div>
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
						Create Task
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
