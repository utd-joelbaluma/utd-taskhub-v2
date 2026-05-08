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

export interface DashboardData {
	stats: DashboardStats;
	recent_tasks: DashboardTask[];
	recent_tickets: DashboardTicket[];
}

export async function getDashboard(): Promise<DashboardData> {
	const res = await api.get<{ success: boolean; data: DashboardData }>(
		"/dashboard",
	);
	return res.data;
}
