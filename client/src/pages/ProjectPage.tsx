import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	Plus,
	Pencil,
	TrendingUp,
	Loader2,
	X,
	Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { WeekPicker } from "@/components/ui/week-picker";
import {
	getProject,
	updateProject,
	type Project,
	type ProjectStatus,
} from "@/services/project.service";
import {
	listSprints,
	createSprint,
	updateSprint,
	deleteSprint,
	type Sprint,
	type SprintStatus,
} from "@/services/sprint.service";
import { toast } from "sonner";
import { addMember, removeMember } from "@/services/project-member.service";
import { listProfiles, type Profile } from "@/services/profile.service";
import {
	listTasks,
	createTask,
	type Task,
	type ApiTaskStatus,
	type ApiTaskPriority,
} from "@/services/task.service";
import { cn } from "@/lib/utils";
import {
	ProjectDescriptionEditor,
	ProjectDescriptionPreview,
} from "@/components/projects/project-description";
import { projectDescriptionText } from "@/components/projects/project-description-utils";
import {
	DEFAULT_PROJECT_ICON,
	type ProjectIconType,
} from "@/components/projects/project-icon-options";
import { ProjectIconPicker } from "@/components/projects/project-icon-picker";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
	"in-progress": { variant: "in-progress" as const, label: "In Progress" },
	planning: { variant: "todo" as const, label: "Planning" },
	completed: { variant: "done" as const, label: "Completed" },
	"on-hold": { variant: "cancelled" as const, label: "On Hold" },
};

const TASK_STATUS_BADGE: Record<
	ApiTaskStatus,
	{
		variant:
			| "backlog"
			| "todo"
			| "in-progress"
			| "review"
			| "done"
			| "cancelled";
		label: string;
	}
> = {
	backlog: { variant: "backlog", label: "Backlog" },
	todo: { variant: "todo", label: "Todo" },
	in_progress: { variant: "in-progress", label: "In Progress" },
	review: { variant: "review", label: "Review" },
	done: { variant: "done", label: "Done" },
	cancelled: { variant: "cancelled", label: "Cancelled" },
};

const TASK_PRIORITY_BADGE: Record<
	ApiTaskPriority,
	{ variant: "low" | "medium" | "high" | "urgent"; label: string }
> = {
	low: { variant: "low", label: "Low" },
	medium: { variant: "medium", label: "Medium" },
	high: { variant: "high", label: "High" },
	urgent: { variant: "urgent", label: "Urgent" },
};

const SPRINT_STATUS_BADGE: Record<
	SprintStatus,
	{ variant: "todo" | "in-progress" | "done"; label: string }
> = {
	planned: { variant: "todo", label: "Planned" },
	active: { variant: "in-progress", label: "Active" },
	completed: { variant: "done", label: "Completed" },
};

const AVATAR_COLORS = [
	"bg-primary",
	"bg-accent",
	"bg-secondary",
	"bg-warning",
	"bg-danger",
];

const TABS = ["Overview", "Tasks", "Sprints", "Activity"] as const;
type Tab = (typeof TABS)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
	if (!name) return "?";
	return name
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

function avatarColor(index: number): string {
	return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function formatDate(iso: string | null): string {
	if (!iso) return "—";
	return new Date(iso).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatSprintRange(start: string, end: string): string {
	const s = new Date(start + "T00:00:00");
	const e = new Date(end + "T00:00:00");
	if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
		return `${format(s, "MMM d")} – ${format(e, "d, yyyy")}`;
	}
	return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
}

// ── Team Avatars ──────────────────────────────────────────────────────────────

function TeamAvatars({ members }: { members: Project["project_members"] }) {
	const visible = members.slice(0, 4);
	const extra = members.length - 4;
	return (
		<div className="flex items-center">
			{visible.map((m, i) => (
				<Avatar
					key={m.user_id}
					className={`h-9 w-9 border-2 border-surface ${i > 0 ? "-ml-3" : ""}`}
				>
					<AvatarFallback
						className={`text-[10px] text-white ${avatarColor(i)}`}
					>
						{getInitials(m.profiles?.full_name ?? null)}
					</AvatarFallback>
				</Avatar>
			))}
			{extra > 0 && (
				<div className="-ml-3 h-9 w-9 rounded-full bg-muted-subtle border-2 border-surface flex items-center justify-center text-xs font-medium text-muted">
					+{extra}
				</div>
			)}
		</div>
	);
}

// ── Edit Project Dialog ───────────────────────────────────────────────────────

const EDIT_EMPTY = {
	name: "",
	status: "planning" as ProjectStatus,
	iconType: "icon" as ProjectIconType,
	iconValue: DEFAULT_PROJECT_ICON,
	sprint: "",
	sprintEnds: "",
	description: "",
	tagInput: "",
	tags: [] as string[],
	memberIds: [] as string[],
};

function EditProjectDialog({
	open,
	onClose,
	project,
	profiles,
	onSaved,
}: {
	open: boolean;
	onClose: () => void;
	project: Project;
	profiles: Profile[];
	onSaved: (updated: Project) => void;
}) {
	const [form, setForm] = useState(EDIT_EMPTY);
	const [initialMemberIds, setInitialMemberIds] = useState<string[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState<{ name?: string; submit?: string }>(
		{},
	);

	useEffect(() => {
		if (!open) return;
		const ids = project.project_members.map((m) => m.user_id);
		setInitialMemberIds(ids);
		setForm({
			name: project.name,
			status: project.status,
			iconType: project.icon_type ?? "icon",
			iconValue: project.icon_value ?? DEFAULT_PROJECT_ICON,
			sprint: project.sprint_name ?? "",
			sprintEnds: project.sprint_end_date
				? project.sprint_end_date.slice(0, 10)
				: "",
			description: project.description ?? "",
			tagInput: "",
			tags: [...(project.tags ?? [])],
			memberIds: [...ids],
		});
		setErrors({});
	}, [open, project]);

	function set<K extends keyof typeof EDIT_EMPTY>(
		key: K,
		value: (typeof EDIT_EMPTY)[K],
	) {
		setForm((prev) => ({ ...prev, [key]: value }));
		if (key === "name") setErrors((prev) => ({ ...prev, name: undefined }));
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

	function toggleMember(id: string) {
		if (id === project.created_by) return;
		set(
			"memberIds",
			form.memberIds.includes(id)
				? form.memberIds.filter((i) => i !== id)
				: [...form.memberIds, id],
		);
	}

	async function handleSubmit() {
		if (!form.name.trim()) {
			setErrors({ name: "Project name is required." });
			return;
		}
		if (form.iconType === "image" && form.iconValue.length > 1_000_000) {
			setErrors({
				submit: "Icon image is too large. Please upload a smaller image.",
			});
			return;
		}
		setSubmitting(true);
		setErrors({});
		try {
			const updated = await updateProject(project.id, {
				name: form.name.trim(),
				description: projectDescriptionText(form.description)
					? form.description
					: "",
				status: form.status,
				icon_type: form.iconType,
				icon_value: form.iconValue,
				sprint_name: form.sprint.trim() || undefined,
				sprint_end_date: form.sprintEnds || undefined,
				tags: form.tags,
			});

			const toAdd = form.memberIds.filter(
				(id) => !initialMemberIds.includes(id),
			);
			const toRemove = initialMemberIds.filter(
				(id) =>
					!form.memberIds.includes(id) && id !== project.created_by,
			);

			await Promise.all([
				...toAdd.map((uid) => addMember(project.id, uid)),
				...toRemove.map((uid) => removeMember(project.id, uid)),
			]);

			onSaved(updated);
			onClose();
			toast.success("Project updated", { description: updated.name });
		} catch {
			toast.error("Failed to update project", {
				description: "Please try again.",
			});
			setErrors({ submit: "Failed to save changes. Please try again." });
		} finally {
			setSubmitting(false);
		}
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) onClose();
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-[560px]">
				<DialogHeader>
					<DialogTitle>Edit Project</DialogTitle>
					<DialogDescription>
						Update the project details.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-5">
					{/* Name */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Project Name <span className="text-danger">*</span>
						</label>
						<Input
							value={form.name}
							onChange={(e) => set("name", e.target.value)}
							className={errors.name ? "border-danger" : ""}
						/>
						{errors.name && (
							<p className="text-xs text-danger mt-1">
								{errors.name}
							</p>
						)}
					</div>

					{/* <ProjectIconPicker
						iconType={form.iconType}
						iconValue={form.iconValue}
						onChange={({ iconType, iconValue }) => {
							set("iconType", iconType);
							set("iconValue", iconValue);
							setErrors((prev) => ({
								...prev,
								submit: undefined,
							}));
						}}
					/> */}

					{/* Status + Sprint Name */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
								Status
							</label>
							<Select
								value={form.status}
								onValueChange={(v) =>
									set("status", v as ProjectStatus)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="planning">
										Planning
									</SelectItem>
									<SelectItem value="in-progress">
										In Progress
									</SelectItem>
									<SelectItem value="on-hold">
										On Hold
									</SelectItem>
									<SelectItem value="completed">
										Completed
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
								Sprint Name
							</label>
							<Input
								placeholder="e.g. Sprint 1 Alpha"
								value={form.sprint}
								onChange={(e) => set("sprint", e.target.value)}
							/>
						</div>
					</div>

					{/* Sprint End Date + Tags */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
								Sprint End Date
							</label>
							<Input
								type="date"
								value={form.sprintEnds}
								onChange={(e) =>
									set("sprintEnds", e.target.value)
								}
							/>
						</div>
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

					{/* Description */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Description
						</label>
						<ProjectDescriptionEditor
							value={form.description}
							onChange={(value) => set("description", value)}
						/>
					</div>

					{/* Team Members */}
					{profiles.length > 0 && (
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								Team Members
							</label>
							<div className="grid grid-cols-2 gap-2">
								{profiles.map((profile, i) => {
									const isOwner =
										profile.id === project.created_by;
									const checked = form.memberIds.includes(
										profile.id,
									);
									return (
										<label
											key={profile.id}
											className={cn(
												"flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors",
												isOwner
													? "opacity-60 cursor-not-allowed border-border"
													: checked
														? "border-primary bg-primary-subtle cursor-pointer"
														: "border-border hover:bg-muted-subtle cursor-pointer",
											)}
										>
											<Checkbox
												checked={checked}
												disabled={isOwner}
												onCheckedChange={() =>
													toggleMember(profile.id)
												}
											/>
											<Avatar className="h-6 w-6 shrink-0">
												<AvatarFallback
													className={`text-[9px] text-white ${avatarColor(i)}`}
												>
													{getInitials(
														profile.full_name,
													)}
												</AvatarFallback>
											</Avatar>
											<span className="text-sm text-foreground truncate">
												{profile.full_name ??
													profile.email}
												{isOwner && (
													<span className="ml-1 text-[10px] text-muted">
														(owner)
													</span>
												)}
											</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{errors.submit && (
						<p className="text-xs text-danger">{errors.submit}</p>
					)}
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

// ── Sprint Dialogs ────────────────────────────────────────────────────────────

type WeekRange = { start: Date; end: Date };

const SPRINT_FORM_EMPTY = {
	name: "",
	week: null as WeekRange | null,
	status: "planned" as SprintStatus,
};

function NewSprintDialog({
	open,
	onClose,
	projectId,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	projectId: string;
	onCreated: (sprint: Sprint) => void;
}) {
	const [form, setForm] = useState(SPRINT_FORM_EMPTY);
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState<{
		name?: string;
		week?: string;
		submit?: string;
	}>({});

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			setForm(SPRINT_FORM_EMPTY);
			setErrors({});
			onClose();
		}
	}

	async function handleSubmit() {
		const errs: typeof errors = {};
		if (!form.name.trim()) errs.name = "Sprint name is required.";
		if (!form.week) errs.week = "Please select a week.";
		if (Object.keys(errs).length > 0) {
			setErrors(errs);
			return;
		}
		setSubmitting(true);
		setErrors({});
		try {
			const sprint = await createSprint(projectId, {
				name: form.name.trim(),
				start_date: format(form.week!.start, "yyyy-MM-dd"),
				end_date: format(form.week!.end, "yyyy-MM-dd"),
				status: form.status,
			});
			onCreated(sprint);
			setForm(SPRINT_FORM_EMPTY);
			onClose();
			toast.success("Sprint created", { description: sprint.name });
		} catch (err: any) {
			const msg =
				err?.response?.data?.message ?? "Failed to create sprint.";
			setErrors({ submit: msg });
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-[440px]">
				<DialogHeader>
					<DialogTitle>New Sprint</DialogTitle>
					<DialogDescription>
						Sprints cover one full week (Mon – Sun).
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Sprint Name <span className="text-danger">*</span>
						</label>
						<Input
							placeholder="e.g. Sprint 1"
							value={form.name}
							onChange={(e) => {
								setForm((p) => ({
									...p,
									name: e.target.value,
								}));
								setErrors((p) => ({ ...p, name: undefined }));
							}}
							className={errors.name ? "border-danger" : ""}
						/>
						{errors.name && (
							<p className="text-xs text-danger mt-1">
								{errors.name}
							</p>
						)}
					</div>

					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Week <span className="text-danger">*</span>
						</label>
						<WeekPicker
							value={form.week}
							onChange={(w) => {
								setForm((p) => ({ ...p, week: w }));
								setErrors((p) => ({ ...p, week: undefined }));
							}}
							placeholder="Select a week"
						/>
						{errors.week && (
							<p className="text-xs text-danger mt-1">
								{errors.week}
							</p>
						)}
					</div>

					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Status
						</label>
						<Select
							value={form.status}
							onValueChange={(v) =>
								setForm((p) => ({
									...p,
									status: v as SprintStatus,
								}))
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="planned">Planned</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="completed">
									Completed
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{errors.submit && (
						<p className="text-xs text-danger">{errors.submit}</p>
					)}
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
						Create Sprint
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function EditSprintDialog({
	open,
	onClose,
	sprint,
	projectId,
	onSaved,
}: {
	open: boolean;
	onClose: () => void;
	sprint: Sprint;
	projectId: string;
	onSaved: (updated: Sprint) => void;
}) {
	const [form, setForm] = useState(SPRINT_FORM_EMPTY);
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState<{
		name?: string;
		week?: string;
		submit?: string;
	}>({});

	useEffect(() => {
		if (!open) return;
		const start = new Date(sprint.start_date + "T00:00:00");
		const end = new Date(sprint.end_date + "T00:00:00");
		setForm({
			name: sprint.name,
			week: { start, end },
			status: sprint.status,
		});
		setErrors({});
	}, [open, sprint]);

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) onClose();
	}

	async function handleSubmit() {
		const errs: typeof errors = {};
		if (!form.name.trim()) errs.name = "Sprint name is required.";
		if (!form.week) errs.week = "Please select a week.";
		if (Object.keys(errs).length > 0) {
			setErrors(errs);
			return;
		}
		setSubmitting(true);
		setErrors({});
		try {
			const updated = await updateSprint(projectId, sprint.id, {
				name: form.name.trim(),
				start_date: format(form.week!.start, "yyyy-MM-dd"),
				end_date: format(form.week!.end, "yyyy-MM-dd"),
				status: form.status,
			});
			onSaved(updated);
			onClose();
			toast.success("Sprint updated", { description: updated.name });
		} catch (err: any) {
			const msg =
				err?.response?.data?.message ?? "Failed to update sprint.";
			setErrors({ submit: msg });
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-[440px]">
				<DialogHeader>
					<DialogTitle>Edit Sprint</DialogTitle>
					<DialogDescription>
						Sprints cover one full week (Mon – Sun).
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Sprint Name <span className="text-danger">*</span>
						</label>
						<Input
							value={form.name}
							onChange={(e) => {
								setForm((p) => ({
									...p,
									name: e.target.value,
								}));
								setErrors((p) => ({ ...p, name: undefined }));
							}}
							className={errors.name ? "border-danger" : ""}
						/>
						{errors.name && (
							<p className="text-xs text-danger mt-1">
								{errors.name}
							</p>
						)}
					</div>

					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Week <span className="text-danger">*</span>
						</label>
						<WeekPicker
							value={form.week}
							onChange={(w) => {
								setForm((p) => ({ ...p, week: w }));
								setErrors((p) => ({ ...p, week: undefined }));
							}}
						/>
						{errors.week && (
							<p className="text-xs text-danger mt-1">
								{errors.week}
							</p>
						)}
					</div>

					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Status
						</label>
						<Select
							value={form.status}
							onValueChange={(v) =>
								setForm((p) => ({
									...p,
									status: v as SprintStatus,
								}))
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="planned">Planned</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="completed">
									Completed
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{errors.submit && (
						<p className="text-xs text-danger">{errors.submit}</p>
					)}
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

// ── New Task Dialog ───────────────────────────────────────────────────────────

const TASK_EMPTY = {
	title: "",
	description: "",
	sprintId: "",
	status: "todo" as ApiTaskStatus,
	priority: "medium" as ApiTaskPriority,
	assignedTo: "",
	dueDate: "",
	tagInput: "",
	tags: [] as string[],
};

const NO_TASK_SPRINT_VALUE = "__no_task_sprint__";

function NewTaskDialog({
	open,
	onClose,
	projectId,
	members,
	onCreated,
}: {
	open: boolean;
	onClose: () => void;
	projectId: string;
	members: Project["project_members"];
	onCreated: (task: Task) => void;
}) {
	const [form, setForm] = useState(TASK_EMPTY);
	const [sprints, setSprints] = useState<Sprint[]>([]);
	const [sprintsLoading, setSprintsLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState<{ title?: string; submit?: string }>(
		{},
	);
	const [estimatedTime, setEstimatedTime] = useState(0);

	const addEstimatedTime = useCallback((minutes: number) => {
		setEstimatedTime((prev) => prev + minutes);
	}, []);

	const resetEstimatedTime = useCallback(() => {
		setEstimatedTime(0);
	}, []);

	const formatTime = (minutes: number) => {
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		if (remainingMinutes === 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
		return `${hours} hr${hours > 1 ? "s" : ""} ${remainingMinutes} min`;
	};

	useEffect(() => {
		if (!open) {
			setSprints([]);
			setSprintsLoading(false);
			return;
		}

		let active = true;
		setSprintsLoading(true);
		listSprints(projectId)
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
	}, [open, projectId]);

	function set<K extends keyof typeof TASK_EMPTY>(
		key: K,
		value: (typeof TASK_EMPTY)[K],
	) {
		setForm((prev) => ({ ...prev, [key]: value }));
		if (key === "title")
			setErrors((prev) => ({ ...prev, title: undefined }));
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

	async function handleSubmit() {
		if (!form.title.trim()) {
			setErrors({ title: "Task title is required." });
			return;
		}
		setSubmitting(true);
		setErrors({});
		try {
			const task = await createTask(projectId, {
				title: form.title.trim(),
				description: projectDescriptionText(form.description)
					? form.description
					: undefined,
				status: form.status,
				priority: form.priority,
				assigned_to: form.assignedTo || undefined,
				due_date: form.dueDate || undefined,
				sprint_id: form.sprintId || undefined,
				estimated_time: estimatedTime > 0 ? estimatedTime : 0,
				tags: form.tags,
			});
			onCreated(task);
			setForm(TASK_EMPTY);
			setEstimatedTime(0);
			onClose();
		} catch {
			setErrors({ submit: "Failed to create task. Please try again." });
		} finally {
			setSubmitting(false);
		}
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			setForm(TASK_EMPTY);
			setEstimatedTime(0);
			setErrors({});
		}
		if (!isOpen) onClose();
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-[520px]">
				<DialogHeader>
					<DialogTitle>New Task</DialogTitle>
					<DialogDescription>
						Add a task to this project.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Sprint */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Select Sprint
						</label>
						<Select
							value={form.sprintId || NO_TASK_SPRINT_VALUE}
							onValueChange={(v) =>
								set(
									"sprintId",
									v === NO_TASK_SPRINT_VALUE ? "" : v,
								)
							}
							disabled={sprintsLoading}
						>
							<SelectTrigger>
								<SelectValue
									placeholder={
										sprintsLoading
											? "Loading..."
											: "Select sprint"
									}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={NO_TASK_SPRINT_VALUE}>
									No sprint
								</SelectItem>
								{sprints.map((sprint) => (
									<SelectItem
										key={sprint.id}
										value={sprint.id}
									>
										{sprint.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Title */}
					<div>
						<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
							Title <span className="text-danger">*</span>
						</label>
						<Input
							placeholder="e.g. Set up CI/CD pipeline"
							value={form.title}
							onChange={(e) => set("title", e.target.value)}
							className={errors.title ? "border-danger" : ""}
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
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="medium">
										Medium
									</SelectItem>
									<SelectItem value="high">High</SelectItem>
									<SelectItem value="urgent">
										Urgent
									</SelectItem>
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
									set("status", v as ApiTaskStatus)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="backlog">
										Backlog
									</SelectItem>
									<SelectItem value="todo">Todo</SelectItem>
									<SelectItem value="in_progress">
										In Progress
									</SelectItem>
									<SelectItem value="review">
										Review
									</SelectItem>
									<SelectItem value="done">Done</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Estimated Time */}
					<div className="flex flex-col items-center justify-center">
						<label className="text-sm font-medium text-muted-foreground block w-full text-left mb-1.5">
							Estimated time
						</label>
						<div className="bg-white border border-border rounded-xl px-4 py-1.5 mb-3 w-full text-center">
							<b className="text-primary text-lg">
								{formatTime(estimatedTime)}
							</b>
						</div>
						<div className="flex items-center gap-2">
							<span
								className="text-xs text-secondary cursor-pointer shadow-xs border border-secondary/50 px-1.5 py-1 rounded-md hover:bg-primary hover:text-white transition-all duration-200"
								onClick={() => addEstimatedTime(5)}
							>
								+5 mins
							</span>
							<span
								className="text-xs text-secondary cursor-pointer shadow-xs border border-secondary/50 px-1.5 py-1 rounded-md hover:bg-primary hover:text-white transition-all duration-200"
								onClick={() => addEstimatedTime(15)}
							>
								+15 mins
							</span>
							<span
								className="text-xs text-secondary cursor-pointer shadow-xs border border-secondary/50 px-1.5 py-1 rounded-md hover:bg-primary hover:text-white transition-all duration-200"
								onClick={() => addEstimatedTime(30)}
							>
								+30 mins
							</span>
							<span
								className="text-xs text-secondary cursor-pointer shadow-xs border border-secondary/50 px-1.5 py-1 rounded-md hover:bg-primary hover:text-white transition-all duration-200"
								onClick={() => addEstimatedTime(60)}
							>
								+1 hour
							</span>
							<span
								className="text-xs text-secondary cursor-pointer shadow-xs border border-secondary/50 px-1.5 py-1 rounded-md hover:bg-primary hover:text-white transition-all duration-200"
								onClick={() => addEstimatedTime(60 * 8)}
							>
								+8 hour
							</span>
							<span
								className="text-xs text-accent cursor-pointer shadow-xs border border-reset px-1.5 py-1 rounded-md hover:bg-primary hover:text-white transition-all duration-200"
								onClick={() => resetEstimatedTime()}
							>
								Reset
							</span>
						</div>
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
							{members.map((m, idx) => (
								<button
									key={m.user_id}
									type="button"
									onClick={() =>
										set(
											"assignedTo",
											form.assignedTo === m.user_id
												? ""
												: m.user_id,
										)
									}
									className={cn(
										"flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
										form.assignedTo === m.user_id
											? "border-primary bg-primary-subtle text-primary font-medium"
											: "border-border hover:bg-muted-subtle text-foreground",
									)}
								>
									<Avatar className="h-5 w-5 shrink-0">
										<AvatarFallback
											className={`text-[9px] text-white ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
										>
											{getInitials(
												m.profiles?.full_name ?? null,
											)}
										</AvatarFallback>
									</Avatar>
									{m.profiles?.full_name ?? m.user_id}
								</button>
							))}
						</div>
						{form.assignedTo && (
							<p className="text-xs text-muted mt-2">
								Assigned to{" "}
								<span className="font-medium text-foreground">
									{members.find(
										(m) => m.user_id === form.assignedTo,
									)?.profiles?.full_name ?? form.assignedTo}
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

					{errors.submit && (
						<p className="text-xs text-danger">{errors.submit}</p>
					)}
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [activeTab, setActiveTab] = useState<Tab>("Overview");
	const [project, setProject] = useState<Project | null>(null);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [profiles, setProfiles] = useState<Profile[]>([]);
	const [sprints, setSprints] = useState<Sprint[]>([]);
	const [loading, setLoading] = useState(true);
	const [tasksLoading, setTasksLoading] = useState(true);
	const [sprintsLoading, setSprintsLoading] = useState(false);
	const [sprintsLoaded, setSprintsLoaded] = useState(false);
	const [error, setError] = useState(false);
	const [editOpen, setEditOpen] = useState(false);
	const [newTaskOpen, setNewTaskOpen] = useState(false);
	const [newSprintOpen, setNewSprintOpen] = useState(false);
	const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
	const [deletingSprintId, setDeletingSprintId] = useState<string | null>(
		null,
	);
	const [startingSprintId, setStartingSprintId] = useState<string | null>(
		null,
	);

	useEffect(() => {
		if (!id) return;
		setLoading(true);
		setTasksLoading(true);

		Promise.all([getProject(id), listTasks(id), listProfiles()])
			.then(([proj, taskList, profileList]) => {
				setProject(proj);
				setTasks(taskList);
				setProfiles(profileList);
			})
			.catch(() => setError(true))
			.finally(() => {
				setLoading(false);
				setTasksLoading(false);
			});
	}, [id]);

	useEffect(() => {
		if (activeTab !== "Sprints" || sprintsLoaded || !id) return;
		setSprintsLoading(true);
		listSprints(id)
			.then((data) => {
				setSprints(data);
				setSprintsLoaded(true);
			})
			.catch(() => toast.error("Failed to load sprints."))
			.finally(() => setSprintsLoading(false));
	}, [activeTab, sprintsLoaded, id]);

	async function handleDeleteSprint(sprintId: string) {
		if (!id) return;
		try {
			await deleteSprint(id, sprintId);
			setSprints((prev) => prev.filter((s) => s.id !== sprintId));
			setDeletingSprintId(null);
			toast.success("Sprint deleted.");
		} catch {
			toast.error("Failed to delete sprint.");
		}
	}

	async function handleStartSprint(sprintId: string) {
		if (!id) return;
		const alreadyActive = sprints.some((s) => s.status === "active");
		if (alreadyActive) {
			toast.error("A sprint is already active for this project.");
			return;
		}
		setStartingSprintId(sprintId);
		try {
			const updated = await updateSprint(id, sprintId, {
				status: "active",
			});
			setSprints((prev) =>
				prev.map((s) => (s.id === sprintId ? updated : s)),
			);
			toast.success("Sprint started.");
		} catch {
			toast.error("Failed to start sprint.");
		} finally {
			setStartingSprintId(null);
		}
	}

	if (loading) {
		return (
			<div className="mx-auto max-w-[1280px] px-6 py-16 flex items-center justify-center gap-2 text-muted">
				<Loader2 className="h-5 w-5 animate-spin" />
				<span className="text-sm">Loading project...</span>
			</div>
		);
	}

	if (error || !project) {
		return (
			<div className="mx-auto max-w-[1280px] px-6 py-16 text-center">
				<p className="text-base font-medium text-foreground mb-2">
					Project not found
				</p>
				<Button variant="outline" onClick={() => navigate("/projects")}>
					Back to Projects
				</Button>
			</div>
		);
	}

	const { variant: statusVariant, label: statusLabel } =
		STATUS_BADGE[project.status];
	const members = project.project_members ?? [];
	const doneCount = tasks.filter((t) => t.status === "done").length;
	const pct =
		tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
	const sprintBlocks = 4;
	const filledBlocks = Math.round((pct / 100) * sprintBlocks);

	return (
		<div className="mx-auto max-w-[1280px] px-6 py-8">
			{/* Back */}
			<button
				onClick={() => navigate("/projects")}
				className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				Projects
			</button>

			{/* Header */}
			<div className="flex items-start justify-between gap-6 mb-6">
				<div className="flex-1">
					<div className="flex items-center gap-3 mb-2">
						<h1 className="text-3xl font-semibold text-foreground tracking-tight">
							{project.name}
						</h1>
						<Badge variant={statusVariant}>{statusLabel}</Badge>
					</div>
					<ProjectDescriptionPreview
						value={project.description}
						className="text-sm text-muted leading-relaxed max-w-2xl"
					/>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					<Button
						variant="outline"
						className="flex items-center gap-2"
						onClick={() => setEditOpen(true)}
					>
						<Pencil className="h-3.5 w-3.5" />
						Edit Project
					</Button>
					<Button
						className="flex items-center gap-2"
						onClick={() => setNewTaskOpen(true)}
					>
						<Plus className="h-4 w-4" />
						New Task
					</Button>
				</div>
			</div>

			{/* Tabs */}
			<div className="flex flex-wrap items-center gap-0 border-b border-border mb-8">
				{TABS.map((tab) => (
					<button
						key={tab}
						onClick={() => setActiveTab(tab)}
						className={cn(
							"px-4 py-2.5 text-sm transition-colors -mb-px border-b-2",
							activeTab === tab
								? "text-primary font-medium border-primary"
								: "text-muted-foreground hover:text-foreground border-transparent",
						)}
					>
						{tab}
					</button>
				))}
			</div>

			{/* ── OVERVIEW TAB ─────────────────────────────────────── */}
			{activeTab === "Overview" && (
				<div className="space-y-6">
					<div className="grid grid-cols-[280px_1fr] gap-4">
						{/* Completion Progress */}
						<Card className="p-5">
							<p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-4">
								Completion Progress
							</p>
							<p className="text-4xl font-bold text-primary mb-1">
								{pct}%
							</p>
							<p className="text-xs text-muted mb-3">
								{doneCount} / {tasks.length} Tasks
							</p>
							<div className="h-1.5 w-full bg-border rounded-full overflow-hidden mb-4">
								<div
									className="h-full bg-primary rounded-full transition-all"
									style={{ width: `${pct}%` }}
								/>
							</div>
							<div className="grid grid-cols-2 gap-2">
								<div className="rounded-lg bg-muted-subtle px-3 py-2">
									<p className="text-[10px] text-muted mb-0.5">
										Completed
									</p>
									<p className="text-lg font-bold text-foreground">
										{doneCount}
									</p>
								</div>
								<div className="rounded-lg bg-muted-subtle px-3 py-2">
									<p className="text-[10px] text-muted mb-0.5">
										Remaining
									</p>
									<p className="text-lg font-bold text-foreground">
										{tasks.length - doneCount}
									</p>
								</div>
							</div>
						</Card>

						{/* Current Sprint */}
						<Card className="p-5">
							<div className="flex items-start justify-between mb-4">
								<div>
									<p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-2">
										Current Sprint
									</p>
									<h2 className="text-2xl font-bold text-foreground">
										{project.sprint_name || "No sprint"}
									</h2>
									{project.sprint_end_date && (
										<p className="text-sm text-muted mt-0.5">
											Ends{" "}
											{formatDate(
												project.sprint_end_date,
											)}
										</p>
									)}
								</div>
								<TeamAvatars members={members} />
							</div>

							<div className="flex items-center gap-2 mb-4">
								<TrendingUp className="h-4 w-4 text-primary" />
								<p className="text-sm text-foreground">
									<span className="font-semibold">
										{members.length}
									</span>{" "}
									team member{members.length !== 1 ? "s" : ""}
								</p>
							</div>

							<div className="flex gap-2">
								{Array.from({ length: sprintBlocks }).map(
									(_, i) => (
										<div
											key={i}
											className={`h-2 flex-1 rounded-full ${i < filledBlocks ? "bg-primary" : "bg-border"}`}
										/>
									),
								)}
							</div>
						</Card>
					</div>

					{/* Tags + Team */}
					<div className="grid grid-cols-[1fr_320px] gap-4">
						<Card className="p-5">
							<h2 className="text-base font-semibold text-foreground mb-4">
								Tags
							</h2>
							{project.tags.length === 0 ? (
								<p className="text-sm text-muted">No tags.</p>
							) : (
								<div className="flex flex-wrap gap-2">
									{project.tags.map((tag) => (
										<span
											key={tag}
											className="text-sm bg-muted-subtle text-muted-foreground px-3 py-1 rounded-full font-medium"
										>
											{tag}
										</span>
									))}
								</div>
							)}
						</Card>

						<Card className="p-5">
							<h2 className="text-base font-semibold text-foreground mb-4">
								Team
							</h2>
							{members.length === 0 ? (
								<p className="text-sm text-muted">
									No members yet.
								</p>
							) : (
								<div className="space-y-3">
									{members.map((m, i) => (
										<div
											key={m.user_id}
											className="flex items-center gap-3"
										>
											<Avatar className="h-8 w-8 shrink-0">
												<AvatarFallback
													className={`text-[10px] text-white ${avatarColor(i)}`}
												>
													{getInitials(
														m.profiles?.full_name ??
															null,
													)}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-medium text-foreground truncate">
													{m.profiles?.full_name ??
														"Unknown"}
												</p>
												<p className="text-xs text-muted capitalize">
													{m.role}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</Card>
					</div>
				</div>
			)}

			{/* ── TASKS TAB ────────────────────────────────────────── */}
			{activeTab === "Tasks" && (
				<Card className="p-0 overflow-hidden">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border bg-muted-subtle/40">
								{[
									"Title",
									"Status",
									"Priority",
									"Assigned To",
									"Due Date",
								].map((h) => (
									<th
										key={h}
										className="px-5 py-3 text-xs font-medium text-muted text-left"
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{tasksLoading ? (
								<tr>
									<td
										colSpan={5}
										className="px-5 py-10 text-center"
									>
										<div className="flex items-center justify-center gap-2 text-muted">
											<Loader2 className="h-4 w-4 animate-spin" />
											<span className="text-sm">
												Loading tasks...
											</span>
										</div>
									</td>
								</tr>
							) : tasks.length === 0 ? (
								<tr>
									<td
										colSpan={5}
										className="px-5 py-10 text-center text-sm text-muted"
									>
										No tasks yet. Click "New Task" to create
										one.
									</td>
								</tr>
							) : (
								tasks.map((task, i) => {
									const statusInfo =
										TASK_STATUS_BADGE[task.status];
									const priorityInfo =
										TASK_PRIORITY_BADGE[task.priority];
									const assignee = task.assigned_to ?? null;
									const description = projectDescriptionText(
										task.description,
									);
									return (
										<tr
											key={task.id}
											className="border-b border-border last:border-0 hover:bg-muted-subtle transition-colors"
										>
											<td className="px-5 py-4">
												<p className="text-sm font-medium text-foreground">
													{task.title}
												</p>
												{description && (
													<p className="text-[11px] text-muted mt-0.5 truncate max-w-xs">
														{description}
													</p>
												)}
											</td>
											<td className="px-5 py-4">
												<Badge
													variant={statusInfo.variant}
												>
													{statusInfo.label}
												</Badge>
											</td>
											<td className="px-5 py-4">
												<Badge
													variant={
														priorityInfo.variant
													}
												>
													{priorityInfo.label}
												</Badge>
											</td>
											<td className="px-5 py-4">
												{assignee ? (
													<div className="flex items-center gap-2">
														<Avatar className="h-6 w-6 shrink-0">
															<AvatarFallback
																className={`text-[9px] text-white ${avatarColor(i)}`}
															>
																{getInitials(
																	assignee.full_name,
																)}
															</AvatarFallback>
														</Avatar>
														<span className="text-sm text-foreground">
															{assignee.full_name ??
																assignee.email}
														</span>
													</div>
												) : (
													<span className="text-sm text-muted">
														Unassigned
													</span>
												)}
											</td>
											<td className="px-5 py-4 text-sm text-muted whitespace-nowrap">
												{formatDate(task.due_date)}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</Card>
			)}

			{/* ── SPRINTS TAB ──────────────────────────────────────── */}
			{activeTab === "Sprints" && (
				<div>
					<div className="flex items-center justify-between mb-6">
						<div>
							<h2 className="text-base font-semibold text-foreground">
								Sprints
							</h2>
							<p className="text-sm text-muted">
								Each sprint covers one week (Mon – Sun).
							</p>
						</div>
						<Button
							className="flex items-center gap-2"
							onClick={() => setNewSprintOpen(true)}
						>
							<Plus className="h-4 w-4" />
							New Sprint
						</Button>
					</div>

					{sprintsLoading ? (
						<div className="flex items-center justify-center gap-2 text-muted py-16">
							<Loader2 className="h-4 w-4 animate-spin" />
							<span className="text-sm">Loading sprints...</span>
						</div>
					) : sprints.length === 0 ? (
						<Card className="p-10 text-center">
							<p className="text-sm font-medium text-foreground mb-1">
								No sprints yet
							</p>
							<p className="text-sm text-muted">
								Create your first sprint to start tracking
								weekly work.
							</p>
						</Card>
					) : (
						<div className="space-y-3">
							{sprints.map((sprint) => {
								const { variant, label } =
									SPRINT_STATUS_BADGE[sprint.status];
								const isDeleting =
									deletingSprintId === sprint.id;
								return (
									<Card
										key={sprint.id}
										className="flex items-center gap-4 px-5 py-4"
									>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-semibold text-foreground">
												{sprint.name}
											</p>
											<p className="text-xs text-muted mt-0.5">
												{formatSprintRange(
													sprint.start_date,
													sprint.end_date,
												)}
											</p>
										</div>
										<Badge variant={variant}>{label}</Badge>
										{isDeleting ? (
											<div className="flex items-center gap-2 shrink-0">
												<span className="text-xs text-muted">
													Delete?
												</span>
												<Button
													size="sm"
													variant="destructive"
													onClick={() =>
														handleDeleteSprint(
															sprint.id,
														)
													}
												>
													Yes
												</Button>
												<Button
													size="sm"
													variant="outline"
													onClick={() =>
														setDeletingSprintId(
															null,
														)
													}
												>
													No
												</Button>
											</div>
										) : (
											<div className="flex items-center gap-2 shrink-0">
												{sprint.status ===
													"planned" && (
													<Button
														size="sm"
														variant="outline"
														disabled={
															startingSprintId ===
															sprint.id
														}
														onClick={() =>
															handleStartSprint(
																sprint.id,
															)
														}
													>
														{startingSprintId ===
															sprint.id && (
															<Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
														)}
														Start Sprint
													</Button>
												)}
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8 text-muted hover:text-foreground"
													onClick={() =>
														setEditingSprint(sprint)
													}
												>
													<Pencil className="h-3.5 w-3.5" />
												</Button>
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8 text-muted hover:text-danger"
													onClick={() =>
														setDeletingSprintId(
															sprint.id,
														)
													}
												>
													<Trash2 className="h-3.5 w-3.5" />
												</Button>
											</div>
										)}
									</Card>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* ── ACTIVITY TAB ─────────────────────────────────────── */}
			{activeTab === "Activity" && (
				<Card className="p-5 max-w-2xl">
					<p className="text-sm text-muted text-center py-8">
						No activity yet.
					</p>
				</Card>
			)}

			{/* ── Dialogs ──────────────────────────────────────────── */}
			<EditProjectDialog
				open={editOpen}
				onClose={() => setEditOpen(false)}
				project={project}
				profiles={profiles}
				onSaved={(updated) => {
					setProject((prev) =>
						prev
							? {
									...updated,
									project_members: prev.project_members,
								}
							: updated,
					);
				}}
			/>

			<NewTaskDialog
				open={newTaskOpen}
				onClose={() => setNewTaskOpen(false)}
				projectId={project.id}
				members={members}
				onCreated={(task) => setTasks((prev) => [task, ...prev])}
			/>

			<NewSprintDialog
				open={newSprintOpen}
				onClose={() => setNewSprintOpen(false)}
				projectId={project.id}
				onCreated={(sprint) => {
					setSprints((prev) =>
						[...prev, sprint].sort((a, b) =>
							a.start_date.localeCompare(b.start_date),
						),
					);
				}}
			/>

			{editingSprint && (
				<EditSprintDialog
					open={!!editingSprint}
					onClose={() => setEditingSprint(null)}
					sprint={editingSprint}
					projectId={project.id}
					onSaved={(updated) => {
						setSprints((prev) =>
							prev
								.map((s) => (s.id === updated.id ? updated : s))
								.sort((a, b) =>
									a.start_date.localeCompare(b.start_date),
								),
						);
						setEditingSprint(null);
					}}
				/>
			)}
		</div>
	);
}
