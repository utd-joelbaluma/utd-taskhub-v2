import {
	LayoutDashboard,
	Ticket,
	Users,
	Shield,
	CheckCircle2,
	Timer,
	type LucideIcon,
} from "lucide-react";

export type AccessLevel =
	| { type: "full" }
	| { type: "none" }
	| { type: "partial"; label: string };

export const FULL: AccessLevel = { type: "full" };
export const NONE: AccessLevel = { type: "none" };
export const partial = (label: string): AccessLevel => ({ type: "partial", label });

export type RoleKey = "admin" | "manager" | "developer" | "user";

export interface PermRow {
	feature: string;
	admin: AccessLevel;
	manager: AccessLevel;
	developer: AccessLevel;
	user: AccessLevel;
}

export interface PermGroup {
	module: string;
	icon: LucideIcon;
	rows: PermRow[];
}

export const PERMISSION_GROUPS: PermGroup[] = [
	{
		module: "Projects",
		icon: LayoutDashboard,
		rows: [
			{ feature: "View projects", admin: FULL, manager: partial("Assigned"), developer: FULL, user: FULL },
			{ feature: "Create projects", admin: FULL, manager: FULL, developer: NONE, user: NONE },
			{ feature: "Manage project settings", admin: FULL, manager: partial("Assigned"), developer: NONE, user: NONE },
			{ feature: "Delete projects", admin: FULL, manager: NONE, developer: NONE, user: NONE },
		],
	},
	{
		module: "Tasks",
		icon: CheckCircle2,
		rows: [
			{ feature: "View tasks", admin: FULL, manager: FULL, developer: FULL, user: FULL },
			{ feature: "Create & edit tasks", admin: FULL, manager: FULL, developer: FULL, user: NONE },
			{ feature: "Delete tasks", admin: FULL, manager: FULL, developer: NONE, user: NONE },
		],
	},
	{
		module: "Tickets",
		icon: Ticket,
		rows: [
			{ feature: "View tickets", admin: FULL, manager: FULL, developer: FULL, user: FULL },
			{ feature: "Create tickets", admin: FULL, manager: FULL, developer: FULL, user: FULL },
			{ feature: "Edit tickets", admin: FULL, manager: FULL, developer: FULL, user: partial("Own only") },
			{ feature: "Delete tickets", admin: FULL, manager: FULL, developer: NONE, user: partial("Own only") },
		],
	},
	{
		module: "Sprints",
		icon: Timer,
		rows: [
			{ feature: "View sprints", admin: FULL, manager: FULL, developer: FULL, user: NONE },
			{ feature: "Create & manage sprints", admin: FULL, manager: FULL, developer: NONE, user: NONE },
			{ feature: "Delete sprints", admin: FULL, manager: NONE, developer: NONE, user: NONE },
		],
	},
	{
		module: "Users",
		icon: Users,
		rows: [
			{ feature: "View users", admin: FULL, manager: FULL, developer: NONE, user: NONE },
			{ feature: "Invite users", admin: FULL, manager: FULL, developer: NONE, user: NONE },
			{ feature: "Delete users", admin: FULL, manager: FULL, developer: NONE, user: NONE },
		],
	},
	{
		module: "Roles & Settings",
		icon: Shield,
		rows: [
			{ feature: "Manage role permissions", admin: FULL, manager: NONE, developer: NONE, user: NONE },
			{ feature: "Workspace settings", admin: FULL, manager: NONE, developer: NONE, user: NONE },
			{ feature: "View system logs", admin: FULL, manager: NONE, developer: NONE, user: NONE },
		],
	},
];

export const ROLE_COLUMNS: {
	key: RoleKey;
	label: string;
	variant: string;
}[] = [
	{ key: "admin", label: "Admin", variant: "primary" },
	{ key: "manager", label: "Manager", variant: "review" },
	{ key: "developer", label: "Developer", variant: "done" },
	{ key: "user", label: "User (Client)", variant: "important" },
];

/** Returns all non-none permission rows for a given role key, grouped by module. */
export function getPermissionsForRole(roleKey: RoleKey): { module: string; icon: LucideIcon; features: { feature: string; level: AccessLevel }[] }[] {
	return PERMISSION_GROUPS
		.map((group) => ({
			module: group.module,
			icon: group.icon,
			features: group.rows
				.map((row) => ({ feature: row.feature, level: row[roleKey] }))
				.filter((r) => r.level.type !== "none"),
		}))
		.filter((group) => group.features.length > 0);
}
