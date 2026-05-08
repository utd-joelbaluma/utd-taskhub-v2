import { api } from "@/lib/api";

export interface DashboardStats {
	my_tasks: number;
	in_progress: number;
	for_review: number;
	completed: number;
	open_tickets: number;
	overdue: number;
}

export interface DashboardTask {
	id: string;
	title: string;
	status: string;
	due_date: string | null;
	project: { name: string } | null;
}

export interface DashboardTicket {
	id: string;
	title: string;
	type: string;
	status: string;
	created_at: string;
	created_by: { full_name: string | null } | null;
}

export interface DashboardActiveSprint {
	id: string;
	name: string;
	start_date: string;
	end_date: string;
	status: "active";
	total_tasks: number;
	completed_tasks: number;
	open_tasks: number;
	progress: number;
}

export interface DashboardData {
	stats: DashboardStats;
	active_sprint: DashboardActiveSprint | null;
	recent_tasks: DashboardTask[];
	recent_tickets: DashboardTicket[];
}

export async function getDashboard(): Promise<DashboardData> {
	const res = await api.get<{ success: boolean; data: DashboardData }>(
		"/dashboard",
	);
	return res.data;
}
