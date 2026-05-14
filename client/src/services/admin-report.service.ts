import { api } from "@/lib/api";

export interface AdminReportProjectRow {
	id: string;
	name: string;
	status: "On Track" | "At Risk" | "Blocked" | string;
	progress: number;
	owner: string;
	deadline: string;
}

export interface AdminReportPayload {
	generatedAt: string;
	projectStatusSummary: {
		totals: {
			totalProjects: number;
			onTrack: number;
			atRisk: number;
			blocked: number;
			completed: number;
		};
		milestones: {
			total: number;
			completed: number;
			inProgress: number;
			overdue: number;
		};
		overallProgressPct: number;
		projects: AdminReportProjectRow[];
	};
	taskCompletion: { date: string; planned: number; actual: number }[];
	burnChart: {
		sprintId: string;
		sprintName: string;
		totalScope: number;
		data: { day: string; remaining: number; completed: number; idealRemaining: number }[];
	};
	cumulativeFlow: {
		date: string;
		todo: number;
		inProgress: number;
		review: number;
		done: number;
	}[];
	overdueTasks: {
		id: string;
		title: string;
		assignee: string;
		project: string;
		deadline: string;
		priority: string;
		daysOverdue: number;
	}[];
	velocity: { sprint: string; committed: number; completed: number }[];
	timeTracking: { project: string; estimatedHours: number; actualHours: number }[];
}

export async function getAdminReports(): Promise<AdminReportPayload> {
	const res = await api.get<{ success: boolean; data: AdminReportPayload }>(
		"/admin/reports",
	);
	return res.data;
}
