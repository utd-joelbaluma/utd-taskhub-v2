import { useState, useEffect } from "react";
import {
	Settings,
	Users,
	LayoutDashboard,
	Ticket,
	Bell,
	Shield,
	Plug,
	AlertOctagon,
	MoreHorizontal,
	Plus,
	X,
	Key,
	MessageSquare,
	GitBranch,
	AlertTriangle,
	Tag,
	Clock,
	UserCircle,
	Hash,
	Mail,
	Smartphone,
	Globe,
	AtSign,
	CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
	{ id: "general", label: "General", icon: Settings },
	{ id: "members", label: "Members & Roles", icon: Users },
	{ id: "boards", label: "Boards & Workflow", icon: LayoutDashboard },
	{ id: "tickets", label: "Tickets", icon: Ticket },
	{ id: "notifications", label: "Notifications", icon: Bell },
	{ id: "security", label: "Security", icon: Shield },
	{ id: "integrations", label: "Integrations", icon: Plug },
	{ id: "danger", label: "Danger Zone", icon: AlertOctagon, danger: true },
];

const members = [
	{
		initials: "JD",
		name: "John Doe (You)",
		email: "john@taskhub.io",
		role: "Admin",
		status: "Active",
	},
	{
		initials: "SM",
		name: "Sarah Miller",
		email: "sarah@agency.com",
		role: "Member",
		status: "Active",
	},
];

const defaultStatuses = ["Backlog", "In Progress", "Done"];

const integrations = [
	{
		id: "slack",
		name: "Slack",
		description: "Get notifications and update tasks from channels.",
		icon: MessageSquare,
		linked: false,
	},
	{
		id: "github",
		name: "GitHub",
		description: "Sync pull requests with workspace tickets.",
		icon: GitBranch,
		linked: true,
	},
	{
		id: "jira",
		name: "Jira Sync",
		description: "Bi-directional sync for enterprise boards.",
		icon: AlertTriangle,
		linked: false,
	},
];

function SectionBlock({
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
}) {
	return (
		<Card className="p-6">
			<div className="mb-5">
				<h2 className="text-base font-semibold text-foreground">
					{title}
				</h2>
				{description && (
					<p className="text-xs text-muted mt-0.5">{description}</p>
				)}
			</div>
			{children}
		</Card>
	);
}

function Toggle({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: () => void;
}) {
	return (
		<button
			role="switch"
			aria-checked={checked}
			onClick={onChange}
			className={cn(
				"relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
				checked ? "bg-primary" : "bg-border-strong",
			)}
		>
			<span
				className={cn(
					"pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
					checked ? "translate-x-6" : "translate-x-1",
				)}
			/>
		</button>
	);
}

export default function SettingsPage() {
	const [activeSection, setActiveSection] = useState("general");
	const [viewMode, setViewMode] = useState<"board" | "list">("board");
	const [statuses, setStatuses] = useState(defaultStatuses);
	const [newStatus, setNewStatus] = useState("");
	const [addingStatus, setAddingStatus] = useState(false);
	const [twoFactor, setTwoFactor] = useState(true);

	// Tickets state
	const [ticketPrefix, setTicketPrefix] = useState("TKT");
	const [defaultPriority, setDefaultPriority] = useState("medium");
	const [defaultAssignee, setDefaultAssignee] = useState("unassigned");
	const [autoClose, setAutoClose] = useState(true);
	const [slaEnabled, setSlaEnabled] = useState(true);
	const [slaHours, setSlaHours] = useState("24");

	// Notifications state
	const [notifEmail, setNotifEmail] = useState(true);
	const [notifPush, setNotifPush] = useState(true);
	const [notifSlack, setNotifSlack] = useState(false);
	const [digestFrequency, setDigestFrequency] = useState("daily");
	const [notifAssigned, setNotifAssigned] = useState(true);
	const [notifMentioned, setNotifMentioned] = useState(true);
	const [notifStatusChange, setNotifStatusChange] = useState(true);
	const [notifComment, setNotifComment] = useState(false);
	const [notifDue, setNotifDue] = useState(true);
	const [quietStart, setQuietStart] = useState("22:00");
	const [quietEnd, setQuietEnd] = useState("08:00");

	const sectionOrder = ["general", "members", "boards", "tickets", "notifications", "integrations", "security", "danger"];

	useEffect(() => {
		const visible = new Set<string>();
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						visible.add(entry.target.id);
					} else {
						visible.delete(entry.target.id);
					}
				});
				const active = sectionOrder.find((id) => visible.has(id));
				if (active) setActiveSection(active);
			},
			{ rootMargin: "-20% 0px -70% 0px" },
		);
		sectionOrder.forEach((id) => {
			const el = document.getElementById(id);
			if (el) observer.observe(el);
		});
		return () => observer.disconnect();
	}, []);

	function scrollToSection(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
		} else {
			setActiveSection(id);
		}
	}

	function removeStatus(label: string) {
		setStatuses((prev) => prev.filter((s) => s !== label));
	}

	function addStatus() {
		const trimmed = newStatus.trim();
		if (trimmed && !statuses.includes(trimmed)) {
			setStatuses((prev) => [...prev, trimmed]);
		}
		setNewStatus("");
		setAddingStatus(false);
	}

	return (
		<div className="mx-auto max-w-[1280px] px-6 py-8">
			<div className="mb-8">
				<h1 className="text-2xl font-semibold text-foreground">
					Workspace Settings
				</h1>
				<p className="text-sm text-muted mt-0.5">
					Manage your workspace's identity, team, and security
					preferences.
				</p>
			</div>

			<div className="flex gap-8 items-start">
				{/* Sidebar */}
				<nav className="w-52 shrink-0 sticky top-22">
					<ul className="space-y-0.5">
						{navItems.map(({ id, label, icon: Icon, danger }) => (
							<li key={id}>
								<button
									onClick={() => scrollToSection(id)}
									className={cn(
										"w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
										activeSection === id
											? danger
												? "bg-danger-subtle text-danger font-medium"
												: "bg-primary-subtle text-primary font-medium"
											: danger
												? "text-danger hover:bg-danger-subtle"
												: "text-muted-foreground hover:bg-muted-subtle hover:text-foreground",
									)}
								>
									<Icon className="h-4 w-4 shrink-0" />
									{label}
								</button>
							</li>
						))}
					</ul>
				</nav>

				{/* Content */}
				<div className="flex-1 space-y-6 min-w-0">
					{/* General Settings */}
					<div id="general">
					<SectionBlock
						title="General Settings"
						description="Update your basic workspace information."
					>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
									Workspace Name
								</label>
								<Input defaultValue="TaskHub HQ" />
							</div>
							<div>
								<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
									Workspace URL
								</label>
								<div className="flex items-center gap-0">
									<span className="h-9 flex items-center px-3 text-sm text-muted border border-r-0 border-border-strong bg-muted-subtle rounded-l-lg whitespace-nowrap">
										taskhub.io/
									</span>
									<Input
										defaultValue="hq"
										className="rounded-l-none"
									/>
								</div>
							</div>
							<div>
								<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
									Time Zone
								</label>
								<Select defaultValue="pacific">
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pacific">
											(GMT-08:00) Pacific Time
										</SelectItem>
										<SelectItem value="mountain">
											(GMT-07:00) Mountain Time
										</SelectItem>
										<SelectItem value="central">
											(GMT-06:00) Central Time
										</SelectItem>
										<SelectItem value="eastern">
											(GMT-05:00) Eastern Time
										</SelectItem>
										<SelectItem value="utc">
											(GMT+00:00) UTC
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
									Language
								</label>
								<Select defaultValue="en-us">
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="en-us">
											English (US)
										</SelectItem>
										<SelectItem value="en-gb">
											English (UK)
										</SelectItem>
										<SelectItem value="fr">
											French
										</SelectItem>
										<SelectItem value="de">
											German
										</SelectItem>
										<SelectItem value="es">
											Spanish
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="mt-5 flex justify-end">
							<Button size="sm">Save Changes</Button>
						</div>
					</SectionBlock>
					</div>

					{/* Members & Roles */}
					<div id="members">
					<SectionBlock
						title="Members & Roles"
						description="Manage your team's access levels."
					>
						<div className="flex items-center justify-between mb-4">
							<div />
							<Button size="sm">
								<Plus className="h-3.5 w-3.5" />
								Invite Member
							</Button>
						</div>
						<div className="rounded-lg border border-border overflow-hidden">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border bg-muted-subtle">
										{[
											"Member",
											"Role",
											"Status",
											"Action",
										].map((h, i) => (
											<th
												key={h}
												className={cn(
													"px-4 py-2.5 text-xs font-medium text-muted",
													i === 3
														? "text-right"
														: "text-left",
												)}
											>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{members.map((m, i) => (
										<tr
											key={i}
											className="border-b border-border last:border-0 hover:bg-muted-subtle transition-colors"
										>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2.5">
													<Avatar className="h-7 w-7">
														<AvatarFallback className="text-[10px]">
															{m.initials}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="text-sm font-medium text-foreground leading-none">
															{m.name}
														</p>
														<p className="text-xs text-muted mt-0.5">
															{m.email}
														</p>
													</div>
												</div>
											</td>
											<td className="px-4 py-3">
												<Badge
													variant={
														m.role === "Admin"
															? "in-progress"
															: "backlog"
													}
													className="text-xs"
												>
													{m.role}
												</Badge>
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-1.5">
													<span className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
													<span className="text-sm text-muted-foreground">
														{m.status}
													</span>
												</div>
											</td>
											<td className="px-4 py-3 text-right">
												<button className="text-muted hover:text-foreground transition-colors p-1 rounded">
													<MoreHorizontal className="h-4 w-4" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</SectionBlock>
					</div>

					{/* Boards & Workflow */}
					<div id="boards">
					<SectionBlock
						title="Boards & Workflow"
						description="Configure how your tasks are visualized and tracked."
					>
						<div className="space-y-5">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-foreground">
										Default View Mode
									</p>
									<p className="text-xs text-muted mt-0.5">
										Choose between Kanban board or List
										layout.
									</p>
								</div>
								<div className="flex items-center rounded-lg border border-border overflow-hidden">
									<button
										onClick={() => setViewMode("board")}
										className={cn(
											"px-4 py-1.5 text-sm transition-colors",
											viewMode === "board"
												? "bg-primary text-primary-foreground font-medium"
												: "text-muted-foreground hover:bg-muted-subtle",
										)}
									>
										Board
									</button>
									<button
										onClick={() => setViewMode("list")}
										className={cn(
											"px-4 py-1.5 text-sm transition-colors",
											viewMode === "list"
												? "bg-primary text-primary-foreground font-medium"
												: "text-muted-foreground hover:bg-muted-subtle",
										)}
									>
										List
									</button>
								</div>
							</div>

							<Separator />

							<div>
								<p className="text-sm font-medium text-foreground mb-3">
									Custom Status Labels
								</p>
								<div className="flex flex-wrap gap-2">
									{statuses.map((label) => (
										<span
											key={label}
											className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-border bg-surface text-foreground"
										>
											<span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
											{label}
											<button
												onClick={() =>
													removeStatus(label)
												}
												className="text-muted hover:text-foreground transition-colors ml-0.5"
											>
												<X className="h-3 w-3" />
											</button>
										</span>
									))}

									{addingStatus ? (
										<div className="flex items-center gap-1.5">
											<Input
												autoFocus
												value={newStatus}
												onChange={(e) =>
													setNewStatus(e.target.value)
												}
												onKeyDown={(e) => {
													if (e.key === "Enter")
														addStatus();
													if (e.key === "Escape") {
														setAddingStatus(false);
														setNewStatus("");
													}
												}}
												placeholder="Status name"
												className="h-8 w-32 text-sm"
											/>
											<Button
												size="sm"
												onClick={addStatus}
											>
												Add
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => {
													setAddingStatus(false);
													setNewStatus("");
												}}
											>
												Cancel
											</Button>
										</div>
									) : (
										<button
											onClick={() =>
												setAddingStatus(true)
											}
											className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border border-dashed border-border-strong text-muted-foreground hover:border-primary hover:text-primary transition-colors"
										>
											<Plus className="h-3 w-3" />
											Add Status
										</button>
									)}
								</div>
							</div>
						</div>
					</SectionBlock>
					</div>

					{/* Tickets */}
					<div id="tickets">
					<SectionBlock
						title="Tickets"
						description="Configure how support tickets are created, assigned, and resolved."
					>
						<div className="space-y-6">

							{/* Ticket ID prefix */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
										Ticket ID Prefix
									</label>
									<div className="flex items-center gap-2">
										<div className="relative flex-1">
											<Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
											<Input
												value={ticketPrefix}
												onChange={(e) => setTicketPrefix(e.target.value.toUpperCase().slice(0, 6))}
												className="pl-8 font-mono uppercase"
												placeholder="TKT"
											/>
										</div>
										<span className="text-xs text-muted px-3 py-2 bg-muted-subtle rounded-lg border border-border font-mono whitespace-nowrap">
											#{ticketPrefix || "TKT"}-001
										</span>
									</div>
									<p className="text-[11px] text-muted mt-1.5">Max 6 characters. Used to generate ticket IDs.</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
										Default Priority
									</label>
									<Select value={defaultPriority} onValueChange={setDefaultPriority}>
										<SelectTrigger><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="urgent">Urgent</SelectItem>
											<SelectItem value="high">High</SelectItem>
											<SelectItem value="medium">Medium</SelectItem>
											<SelectItem value="low">Low</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-[11px] text-muted mt-1.5">Applied to new tickets with no priority set.</p>
								</div>
							</div>

							<Separator />

							{/* Assignment & SLA */}
							<div>
								<p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
									<UserCircle className="h-4 w-4 text-primary" />
									Assignment & SLA
								</p>
								<div className="space-y-3">
									<div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
										<div className="flex items-center gap-3">
											<div className="h-8 w-8 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
												<UserCircle className="h-4 w-4 text-primary" />
											</div>
											<div>
												<p className="text-sm font-medium text-foreground">Default Assignee</p>
												<p className="text-xs text-muted mt-0.5">Who gets new tickets when no assignee is specified</p>
											</div>
										</div>
										<Select value={defaultAssignee} onValueChange={setDefaultAssignee}>
											<SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
											<SelectContent>
												<SelectItem value="unassigned">Unassigned</SelectItem>
												<SelectItem value="jd">John Doe</SelectItem>
												<SelectItem value="sm">Sarah Miller</SelectItem>
												<SelectItem value="round-robin">Round Robin</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
										<div className="flex items-center gap-3">
											<div className="h-8 w-8 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
												<Clock className="h-4 w-4 text-accent" />
											</div>
											<div>
												<p className="text-sm font-medium text-foreground">SLA Response Time</p>
												<p className="text-xs text-muted mt-0.5">Target first-response window for open tickets</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Toggle checked={slaEnabled} onChange={() => setSlaEnabled((v) => !v)} />
											{slaEnabled && (
												<div className="flex items-center gap-1.5 ml-2">
													<Input
														value={slaHours}
														onChange={(e) => setSlaHours(e.target.value)}
														className="w-16 text-center text-sm"
													/>
													<span className="text-xs text-muted">hrs</span>
												</div>
											)}
										</div>
									</div>

									<div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
										<div className="flex items-center gap-3">
											<div className="h-8 w-8 rounded-lg bg-secondary-subtle flex items-center justify-center shrink-0">
												<CheckCircle2 className="h-4 w-4 text-secondary" />
											</div>
											<div>
												<p className="text-sm font-medium text-foreground">Auto-close Resolved Tickets</p>
												<p className="text-xs text-muted mt-0.5">Automatically close tickets 7 days after resolution</p>
											</div>
										</div>
										<Toggle checked={autoClose} onChange={() => setAutoClose((v) => !v)} />
									</div>
								</div>
							</div>

							<Separator />

							{/* Ticket categories */}
							<div>
								<p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
									<Tag className="h-4 w-4 text-primary" />
									Categories
								</p>
								<div className="flex flex-wrap gap-2">
									{["Bug", "Feature Request", "IT Support", "Billing", "Security"].map((cat) => (
										<span
											key={cat}
											className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-border bg-surface text-muted-foreground"
										>
											{cat}
											<button className="text-muted hover:text-danger transition-colors">
												<X className="h-3 w-3" />
											</button>
										</span>
									))}
									<button className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-dashed border-border-strong text-muted-foreground hover:border-primary hover:text-primary transition-colors">
										<Plus className="h-3 w-3" />
										Add Category
									</button>
								</div>
							</div>

						</div>
						<div className="mt-5 flex justify-end">
							<Button size="sm">Save Changes</Button>
						</div>
					</SectionBlock>
					</div>

					{/* Notifications */}
					<div id="notifications">
					<SectionBlock
						title="Notifications"
						description="Control when and how you receive updates from TaskHub."
					>
						<div className="space-y-6">

							{/* Channels */}
							<div>
								<p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
									<Globe className="h-4 w-4 text-primary" />
									Channels
								</p>
								<div className="grid grid-cols-3 gap-3">
									{[
										{ label: "Email", sub: "baluma.joel91@gmail.com", icon: Mail, checked: notifEmail, toggle: () => setNotifEmail((v) => !v) },
										{ label: "Push", sub: "Browser & mobile", icon: Smartphone, checked: notifPush, toggle: () => setNotifPush((v) => !v) },
										{ label: "Slack", sub: "Connect Slack first", icon: MessageSquare, checked: notifSlack, toggle: () => setNotifSlack((v) => !v) },
									].map(({ label, sub, icon: Icon, checked, toggle }) => (
										<div
											key={label}
											className={cn(
												"rounded-lg border p-4 flex flex-col gap-3 transition-colors",
												checked ? "border-primary bg-primary-subtle/40" : "border-border bg-surface",
											)}
										>
											<div className="flex items-center justify-between">
												<div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", checked ? "bg-primary-subtle" : "bg-muted-subtle")}>
													<Icon className={cn("h-4 w-4", checked ? "text-primary" : "text-muted-foreground")} />
												</div>
												<Toggle checked={checked} onChange={toggle} />
											</div>
											<div>
												<p className="text-sm font-medium text-foreground">{label}</p>
												<p className="text-xs text-muted mt-0.5">{sub}</p>
											</div>
										</div>
									))}
								</div>
							</div>

							<Separator />

							{/* Events */}
							<div>
								<p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
									<Bell className="h-4 w-4 text-primary" />
									Notify Me When
								</p>
								<div className="space-y-1">
									{[
										{ label: "A task is assigned to me", icon: UserCircle, checked: notifAssigned, toggle: () => setNotifAssigned((v) => !v) },
										{ label: "I'm mentioned in a comment", icon: AtSign, checked: notifMentioned, toggle: () => setNotifMentioned((v) => !v) },
										{ label: "A task status changes", icon: Tag, checked: notifStatusChange, toggle: () => setNotifStatusChange((v) => !v) },
										{ label: "A new comment is posted", icon: MessageSquare, checked: notifComment, toggle: () => setNotifComment((v) => !v) },
										{ label: "A due date is approaching", icon: Clock, checked: notifDue, toggle: () => setNotifDue((v) => !v) },
									].map(({ label, icon: Icon, checked, toggle }) => (
										<div key={label} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted-subtle transition-colors">
											<div className="flex items-center gap-2.5">
												<Icon className="h-4 w-4 text-muted shrink-0" />
												<span className="text-sm text-foreground">{label}</span>
											</div>
											<Toggle checked={checked} onChange={toggle} />
										</div>
									))}
								</div>
							</div>

							<Separator />

							{/* Digest & Quiet Hours */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-medium text-muted-foreground mb-1.5 block">
										Email Digest
									</label>
									<Select value={digestFrequency} onValueChange={setDigestFrequency}>
										<SelectTrigger><SelectValue /></SelectTrigger>
										<SelectContent>
											<SelectItem value="realtime">Real-time</SelectItem>
											<SelectItem value="hourly">Hourly</SelectItem>
											<SelectItem value="daily">Daily summary</SelectItem>
											<SelectItem value="weekly">Weekly summary</SelectItem>
											<SelectItem value="never">Never</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-[11px] text-muted mt-1.5">How often email summaries are sent.</p>
								</div>
								<div>
									<label className="text-sm font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
										Quiet Hours
									</label>
									<div className="flex items-center gap-2">
										<Input
											type="time"
											value={quietStart}
											onChange={(e) => setQuietStart(e.target.value)}
											className="text-sm"
										/>
										<span className="text-xs text-muted shrink-0">to</span>
										<Input
											type="time"
											value={quietEnd}
											onChange={(e) => setQuietEnd(e.target.value)}
											className="text-sm"
										/>
									</div>
									<p className="text-[11px] text-muted mt-1.5">No push notifications during this window.</p>
								</div>
							</div>

						</div>
						<div className="mt-5 flex justify-end">
							<Button size="sm">Save Changes</Button>
						</div>
					</SectionBlock>
					</div>

					{/* Integrations */}
					<div id="integrations">
					<SectionBlock
						title="Integrations"
						description="Connect your favorite tools to automate your workflow."
					>
						<div className="grid grid-cols-3 gap-4">
							{integrations.map(
								({
									id,
									name,
									description,
									icon: Icon,
									linked,
								}) => (
									<div
										key={id}
										className="rounded-lg border border-border p-4 flex flex-col gap-3 bg-surface"
									>
										<div className="h-9 w-9 rounded-lg bg-muted-subtle flex items-center justify-center">
											<Icon className="h-4 w-4 text-muted-foreground" />
										</div>
										<div className="flex-1">
											<p className="text-sm font-medium text-foreground">
												{name}
											</p>
											<p className="text-xs text-muted mt-0.5 leading-4">
												{description}
											</p>
										</div>
										<Button
											variant={
												linked ? "default" : "outline"
											}
											size="sm"
											className="w-full"
										>
											{linked ? "Linked" : "Connect"}
										</Button>
									</div>
								),
							)}
						</div>

						{/* Promo banner */}
						<div className="mt-4 rounded-lg bg-foreground overflow-hidden relative flex items-center justify-between px-6 py-4">
							<div className="absolute inset-0 opacity-10">
								<div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary" />
								<div className="absolute right-16 top-2 h-16 w-16 rounded-full bg-primary-subtle" />
							</div>
							<p className="text-sm font-semibold text-white relative z-10">
								Unlock 20+ more power-ups for your dev team.
							</p>
							<div className="relative z-10 flex items-center gap-2">
								<span className="text-xl font-bold text-white tracking-tight">
									TaskHub
								</span>
								<Button
									size="sm"
									variant="outline"
									className="bg-white/10 border-white/20 text-white hover:bg-white/20"
								>
									Explore
								</Button>
							</div>
						</div>
					</SectionBlock>
					</div>

					{/* Security & Access */}
					<div id="security">
					<SectionBlock
						title="Security & Access"
						description="Ensure your data and account remain protected."
					>
						<div className="space-y-4">
							<div className="flex items-center justify-between py-3 border-b border-border">
								<div className="flex items-center gap-3">
									<div className="h-9 w-9 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
										<Shield className="h-4 w-4 text-primary" />
									</div>
									<div>
										<p className="text-sm font-medium text-foreground">
											Two-Factor Authentication
										</p>
										<p className="text-xs text-muted mt-0.5">
											Protect your account with an extra
											layer.
										</p>
									</div>
								</div>
								<Toggle
									checked={twoFactor}
									onChange={() => setTwoFactor((v) => !v)}
								/>
							</div>

							<div className="flex items-center justify-between py-3">
								<div className="flex items-center gap-3">
									<div className="h-9 w-9 rounded-lg bg-muted-subtle flex items-center justify-center shrink-0">
										<Key className="h-4 w-4 text-muted-foreground" />
									</div>
									<div>
										<p className="text-sm font-medium text-foreground">
											API Access Tokens
										</p>
										<p className="text-xs text-muted mt-0.5">
											Manage keys for custom tool
											development.
										</p>
									</div>
								</div>
								<button className="text-sm font-medium text-primary hover:underline">
									Manage Keys
								</button>
							</div>
						</div>
					</SectionBlock>
					</div>

					{/* Danger Zone */}
					<div id="danger">
					<Card className="p-6 border-danger/30">
						<div className="mb-5">
							<h2 className="text-base font-semibold text-danger">
								Danger Zone
							</h2>
							<p className="text-xs text-muted mt-0.5">
								Irreversible and destructive actions.
							</p>
						</div>
						<div className="space-y-4">
							<div className="flex items-center justify-between py-3 border border-danger/20 rounded-lg px-4 bg-danger-subtle/40">
								<div>
									<p className="text-sm font-medium text-foreground">
										Delete Workspace
									</p>
									<p className="text-xs text-muted mt-0.5">
										Permanently delete this workspace and
										all its data.
									</p>
								</div>
								<Button variant="destructive" size="sm">
									Delete Workspace
								</Button>
							</div>
						</div>
					</Card>
					</div>
				</div>
			</div>
</div>
	);
}
