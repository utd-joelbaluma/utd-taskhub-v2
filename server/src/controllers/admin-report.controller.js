// server/src/controllers/admin-report.controller.js
// Returns comprehensive mock datasets for the Admin Reports page.

export async function getAdminReports(req, res, next) {
	try {
		const now = new Date();
		const iso = (d) => d.toISOString().slice(0, 10);
		const daysAgo = (n) => {
			const d = new Date(now);
			d.setDate(d.getDate() - n);
			return iso(d);
		};

		const data = {
			generatedAt: now.toISOString(),

			projectStatusSummary: {
				totals: {
					totalProjects: 24,
					onTrack: 14,
					atRisk: 6,
					blocked: 4,
					completed: 9,
				},
				milestones: {
					total: 58,
					completed: 32,
					inProgress: 18,
					overdue: 8,
				},
				overallProgressPct: 67,
				projects: [
					{ id: "p-101", name: "Atlas Platform Migration", status: "On Track", progress: 78, owner: "Diana Cruz", deadline: "2026-07-12" },
					{ id: "p-102", name: "Mobile App v3", status: "At Risk", progress: 54, owner: "Marcus Lee", deadline: "2026-06-30" },
					{ id: "p-103", name: "Billing Service Refactor", status: "Blocked", progress: 31, owner: "Priya Shah", deadline: "2026-08-05" },
					{ id: "p-104", name: "Customer Portal", status: "On Track", progress: 88, owner: "Jonas Weber", deadline: "2026-06-20" },
					{ id: "p-105", name: "Internal Analytics", status: "On Track", progress: 65, owner: "Elena Park", deadline: "2026-09-01" },
					{ id: "p-106", name: "Compliance Audit Tooling", status: "At Risk", progress: 42, owner: "Tariq Ahmed", deadline: "2026-07-25" },
				],
			},

			taskCompletion: [
				{ date: daysAgo(27), planned: 12, actual: 10 },
				{ date: daysAgo(24), planned: 18, actual: 17 },
				{ date: daysAgo(21), planned: 22, actual: 19 },
				{ date: daysAgo(18), planned: 28, actual: 26 },
				{ date: daysAgo(15), planned: 35, actual: 30 },
				{ date: daysAgo(12), planned: 42, actual: 38 },
				{ date: daysAgo(9), planned: 50, actual: 44 },
				{ date: daysAgo(6), planned: 58, actual: 53 },
				{ date: daysAgo(3), planned: 65, actual: 61 },
				{ date: daysAgo(0), planned: 72, actual: 68 },
			],

			burnChart: {
				sprintId: "SPR-2026-09",
				sprintName: "Sprint 9 - Atlas Core",
				totalScope: 80,
				data: [
					{ day: "Day 1", remaining: 80, completed: 0, idealRemaining: 80 },
					{ day: "Day 2", remaining: 74, completed: 6, idealRemaining: 72 },
					{ day: "Day 3", remaining: 68, completed: 12, idealRemaining: 64 },
					{ day: "Day 4", remaining: 60, completed: 20, idealRemaining: 56 },
					{ day: "Day 5", remaining: 55, completed: 25, idealRemaining: 48 },
					{ day: "Day 6", remaining: 47, completed: 33, idealRemaining: 40 },
					{ day: "Day 7", remaining: 40, completed: 40, idealRemaining: 32 },
					{ day: "Day 8", remaining: 32, completed: 48, idealRemaining: 24 },
					{ day: "Day 9", remaining: 22, completed: 58, idealRemaining: 16 },
					{ day: "Day 10", remaining: 12, completed: 68, idealRemaining: 8 },
				],
			},

			cumulativeFlow: [
				{ date: daysAgo(13), todo: 40, inProgress: 8, review: 2, done: 5 },
				{ date: daysAgo(12), todo: 38, inProgress: 10, review: 3, done: 8 },
				{ date: daysAgo(11), todo: 36, inProgress: 12, review: 4, done: 11 },
				{ date: daysAgo(10), todo: 34, inProgress: 14, review: 5, done: 14 },
				{ date: daysAgo(9), todo: 32, inProgress: 15, review: 6, done: 18 },
				{ date: daysAgo(8), todo: 30, inProgress: 16, review: 7, done: 22 },
				{ date: daysAgo(7), todo: 28, inProgress: 17, review: 8, done: 26 },
				{ date: daysAgo(6), todo: 26, inProgress: 18, review: 9, done: 30 },
				{ date: daysAgo(5), todo: 24, inProgress: 18, review: 10, done: 35 },
				{ date: daysAgo(4), todo: 22, inProgress: 19, review: 11, done: 39 },
				{ date: daysAgo(3), todo: 20, inProgress: 19, review: 12, done: 44 },
				{ date: daysAgo(2), todo: 18, inProgress: 20, review: 12, done: 49 },
				{ date: daysAgo(1), todo: 16, inProgress: 20, review: 13, done: 54 },
				{ date: daysAgo(0), todo: 14, inProgress: 21, review: 13, done: 60 },
			],

			overdueTasks: [
				{ id: "T-4012", title: "Migrate user sessions table", assignee: "Marcus Lee", project: "Atlas Platform Migration", deadline: daysAgo(7), priority: "High", daysOverdue: 7 },
				{ id: "T-4108", title: "Fix push notification token refresh", assignee: "Anya Volkov", project: "Mobile App v3", deadline: daysAgo(4), priority: "Critical", daysOverdue: 4 },
				{ id: "T-4137", title: "Refactor invoice PDF generator", assignee: "Priya Shah", project: "Billing Service Refactor", deadline: daysAgo(12), priority: "High", daysOverdue: 12 },
				{ id: "T-4201", title: "Add audit log retention policy", assignee: "Tariq Ahmed", project: "Compliance Audit Tooling", deadline: daysAgo(3), priority: "Medium", daysOverdue: 3 },
				{ id: "T-4233", title: "Onboarding email template QA", assignee: "Elena Park", project: "Customer Portal", deadline: daysAgo(2), priority: "Low", daysOverdue: 2 },
				{ id: "T-4290", title: "Dashboard chart performance regression", assignee: "Jonas Weber", project: "Internal Analytics", deadline: daysAgo(9), priority: "High", daysOverdue: 9 },
				{ id: "T-4311", title: "OAuth scope review for partners", assignee: "Diana Cruz", project: "Atlas Platform Migration", deadline: daysAgo(1), priority: "Medium", daysOverdue: 1 },
			],

			velocity: [
				{ sprint: "Sprint 3", committed: 48, completed: 42 },
				{ sprint: "Sprint 4", committed: 52, completed: 50 },
				{ sprint: "Sprint 5", committed: 55, completed: 47 },
				{ sprint: "Sprint 6", committed: 60, completed: 58 },
				{ sprint: "Sprint 7", committed: 62, completed: 61 },
				{ sprint: "Sprint 8", committed: 65, completed: 59 },
				{ sprint: "Sprint 9", committed: 70, completed: 68 },
			],

			timeTracking: [
				{ project: "Atlas Platform", estimatedHours: 320, actualHours: 348 },
				{ project: "Mobile App v3", estimatedHours: 280, actualHours: 312 },
				{ project: "Billing Refactor", estimatedHours: 240, actualHours: 290 },
				{ project: "Customer Portal", estimatedHours: 200, actualHours: 188 },
				{ project: "Internal Analytics", estimatedHours: 160, actualHours: 172 },
				{ project: "Compliance Audit", estimatedHours: 140, actualHours: 165 },
			],
		};

		return res.json({ success: true, data });
	} catch (err) {
		return next(err);
	}
}
