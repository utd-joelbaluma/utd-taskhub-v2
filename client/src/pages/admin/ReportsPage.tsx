import { useEffect, useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	AreaChart,
	Area,
	BarChart,
	Bar,
} from "recharts";
import {
	getAdminReports,
	type AdminReportPayload,
} from "@/services/admin-report.service";

function toCSV(rows: Record<string, unknown>[]): string {
	if (!rows || rows.length === 0) return "";
	const headers = Object.keys(rows[0]);
	const escape = (val: unknown): string => {
		if (val === null || val === undefined) return "";
		const s = String(val);
		if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
		return s;
	};
	const lines = [headers.join(",")];
	for (const r of rows) {
		lines.push(headers.map((h) => escape(r[h])).join(","));
	}
	return lines.join("\n");
}

function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
	const csv = toCSV(rows);
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function Unauthorized() {
	return (
		<div className="flex h-[60vh] flex-col items-center justify-center text-center">
			<div className="mb-2 text-3xl">🚫</div>
			<h2 className="text-2xl font-semibold">Unauthorized</h2>
			<p className="mt-2 max-w-md text-sm text-muted-foreground">
				You do not have permission to view the Admin Reports page.
			</p>
		</div>
	);
}

function useCurrentUserRole(): string {
	try {
		const raw =
			(typeof window !== "undefined" && window.localStorage.getItem("user")) ||
			"";
		if (raw) {
			const parsed = JSON.parse(raw);
			return parsed?.role || parsed?.user?.role || "admin";
		}
	} catch {
		// ignore
	}
	return "admin";
}

const STATUS_COLORS: Record<string, string> = {
	"On Track": "bg-emerald-100 text-emerald-800 border-emerald-200",
	"At Risk": "bg-amber-100 text-amber-800 border-amber-200",
	Blocked: "bg-red-100 text-red-800 border-red-200",
};

const PRIORITY_COLORS: Record<string, string> = {
	Critical: "bg-red-100 text-red-800 border-red-200",
	High: "bg-orange-100 text-orange-800 border-orange-200",
	Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
	Low: "bg-slate-100 text-slate-700 border-slate-200",
};

function Pill({ label, className }: { label: string; className?: string }) {
	return (
		<span
			className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className || ""}`}
		>
			{label}
		</span>
	);
}

export default function ReportsPage() {
	const role = useCurrentUserRole();
	const [data, setData] = useState<AdminReportPayload | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				setLoading(true);
				setError(null);
				const payload = await getAdminReports();
				if (mounted) setData(payload);
			} catch (err) {
				if (mounted) {
					setError(
						err instanceof Error ? err.message : "Failed to load reports",
					);
				}
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const exportAll = useMemo(
		() => () => {
			if (!data) return;
			const flat: Record<string, unknown>[] = [];
			flat.push({ section: "Generated At", value: data.generatedAt });
			flat.push({ section: "" });
			flat.push({ section: "Project Status - Totals" });
			Object.entries(data.projectStatusSummary.totals).forEach(([k, v]) =>
				flat.push({ key: k, value: v }),
			);
			flat.push({ section: "" });
			flat.push({ section: "Projects" });
			data.projectStatusSummary.projects.forEach((p) =>
				flat.push(p as unknown as Record<string, unknown>),
			);
			downloadCSV("admin-reports-full", flat);
		},
		[data],
	);

	if (role !== "admin") return <Unauthorized />;

	return (
		<div className="mx-auto w-full max-w-[1400px] space-y-6 p-6">
			<div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Admin Reports</h1>
					<p className="text-sm text-muted-foreground">
						Cross-project analytics, sprint health, and team performance.
					</p>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline">Export CSV</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>Export dataset</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={exportAll} disabled={!data}>
							All reports (summary)
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								data &&
								downloadCSV(
									"projects",
									data.projectStatusSummary.projects as unknown as Record<string, unknown>[],
								)
							}
							disabled={!data}
						>
							Project status
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								data &&
								downloadCSV(
									"task-completion",
									data.taskCompletion as unknown as Record<string, unknown>[],
								)
							}
							disabled={!data}
						>
							Task completion
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								data &&
								downloadCSV(
									"burn-chart",
									data.burnChart.data as unknown as Record<string, unknown>[],
								)
							}
							disabled={!data}
						>
							Burn-down / Burn-up
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								data &&
								downloadCSV(
									"cumulative-flow",
									data.cumulativeFlow as unknown as Record<string, unknown>[],
								)
							}
							disabled={!data}
						>
							Cumulative flow
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								data &&
								downloadCSV(
									"overdue-tasks",
									data.overdueTasks as unknown as Record<string, unknown>[],
								)
							}
							disabled={!data}
						>
							Overdue tasks
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								data &&
								downloadCSV(
									"velocity",
									data.velocity as unknown as Record<string, unknown>[],
								)
							}
							disabled={!data}
						>
							Velocity
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								data &&
								downloadCSV(
									"time-tracking",
									data.timeTracking as unknown as Record<string, unknown>[],
								)
							}
							disabled={!data}
						>
							Time tracking
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{loading && (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className="h-28 animate-pulse rounded-lg border bg-muted/40"
						/>
					))}
				</div>
			)}

			{error && !loading && (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="flex items-center gap-3 p-4 text-red-800">
						<div>
							<div className="font-medium">Failed to load reports</div>
							<div className="text-sm">{error}</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="ml-auto"
							onClick={() => window.location.reload()}
						>
							Retry
						</Button>
					</CardContent>
				</Card>
			)}

			{data && !loading && !error && (
				<>
					{/* 1. Project Status Summary */}
					<section className="space-y-3">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>On Track</CardDescription>
									<CardTitle className="text-3xl text-emerald-600">
										{data.projectStatusSummary.totals.onTrack}
									</CardTitle>
								</CardHeader>
								<CardContent className="text-sm text-muted-foreground">
									Projects performing on schedule
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardDescription>At Risk</CardDescription>
									<CardTitle className="text-3xl text-amber-600">
										{data.projectStatusSummary.totals.atRisk}
									</CardTitle>
								</CardHeader>
								<CardContent className="text-sm text-muted-foreground">
									Need attention soon
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardDescription>Blocked</CardDescription>
									<CardTitle className="text-3xl text-red-600">
										{data.projectStatusSummary.totals.blocked}
									</CardTitle>
								</CardHeader>
								<CardContent className="text-sm text-muted-foreground">
									Cannot progress
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="pb-2">
									<CardDescription>Overall Progress</CardDescription>
									<CardTitle className="text-3xl">
										{data.projectStatusSummary.overallProgressPct}%
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
										<div
											className="h-2 rounded-full bg-primary"
											style={{
												width: `${data.projectStatusSummary.overallProgressPct}%`,
											}}
										/>
									</div>
									<div className="mt-2 text-xs text-muted-foreground">
										Milestones: {data.projectStatusSummary.milestones.completed}/
										{data.projectStatusSummary.milestones.total} done,{" "}
										{data.projectStatusSummary.milestones.overdue} overdue
									</div>
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base">Projects breakdown</CardTitle>
									<CardDescription>
										Latest snapshot of every active project.
									</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										downloadCSV(
											"projects",
											data.projectStatusSummary.projects as unknown as Record<string, unknown>[],
										)
									}
								>
									Export
								</Button>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
											<tr className="border-b">
												<th className="px-3 py-2">Project</th>
												<th className="px-3 py-2">Status</th>
												<th className="px-3 py-2">Owner</th>
												<th className="px-3 py-2">Deadline</th>
												<th className="px-3 py-2 w-[200px]">Progress</th>
											</tr>
										</thead>
										<tbody>
											{data.projectStatusSummary.projects.map((p) => (
												<tr key={p.id} className="border-b last:border-0">
													<td className="px-3 py-2 font-medium">{p.name}</td>
													<td className="px-3 py-2">
														<Pill
															label={p.status}
															className={STATUS_COLORS[p.status]}
														/>
													</td>
													<td className="px-3 py-2">{p.owner}</td>
													<td className="px-3 py-2">{p.deadline}</td>
													<td className="px-3 py-2">
														<div className="flex items-center gap-2">
															<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
																<div
																	className="h-2 rounded-full bg-primary"
																	style={{ width: `${p.progress}%` }}
																/>
															</div>
															<span className="w-10 text-right text-xs text-muted-foreground">
																{p.progress}%
															</span>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					</section>

					{/* 2 + 3 row */}
					<section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base">Task Completion</CardTitle>
									<CardDescription>
										Planned vs actual completed tasks.
									</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										downloadCSV(
											"task-completion",
											data.taskCompletion as unknown as Record<string, unknown>[],
										)
									}
								>
									CSV
								</Button>
							</CardHeader>
							<CardContent style={{ height: 320 }}>
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={data.taskCompletion}>
										<CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
										<XAxis dataKey="date" tick={{ fontSize: 11 }} />
										<YAxis tick={{ fontSize: 11 }} />
										<Tooltip />
										<Legend />
										<Line
											type="monotone"
											dataKey="planned"
											stroke="#6366f1"
											strokeWidth={2}
											dot={{ r: 3 }}
											name="Planned"
										/>
										<Line
											type="monotone"
											dataKey="actual"
											stroke="#10b981"
											strokeWidth={2}
											dot={{ r: 3 }}
											name="Actual"
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base">
										Burn-down / Burn-up — {data.burnChart.sprintName}
									</CardTitle>
									<CardDescription>
										Remaining vs completed work across the sprint.
									</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										downloadCSV(
											"burn-chart",
											data.burnChart.data as unknown as Record<string, unknown>[],
										)
									}
								>
									CSV
								</Button>
							</CardHeader>
							<CardContent style={{ height: 320 }}>
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={data.burnChart.data}>
										<CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
										<XAxis dataKey="day" tick={{ fontSize: 11 }} />
										<YAxis tick={{ fontSize: 11 }} />
										<Tooltip />
										<Legend />
										<Line
											type="monotone"
											dataKey="idealRemaining"
											stroke="#94a3b8"
											strokeDasharray="4 4"
											dot={false}
											name="Ideal"
										/>
										<Line
											type="monotone"
											dataKey="remaining"
											stroke="#ef4444"
											strokeWidth={2}
											dot={{ r: 3 }}
											name="Remaining"
										/>
										<Line
											type="monotone"
											dataKey="completed"
											stroke="#22c55e"
											strokeWidth={2}
											dot={{ r: 3 }}
											name="Completed"
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</section>

					{/* 4. Cumulative Flow */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle className="text-base">
									Cumulative Flow Diagram
								</CardTitle>
								<CardDescription>
									Tasks accumulating across workflow stages.
								</CardDescription>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									downloadCSV(
										"cumulative-flow",
										data.cumulativeFlow as unknown as Record<string, unknown>[],
									)
								}
							>
								CSV
							</Button>
						</CardHeader>
						<CardContent style={{ height: 360 }}>
							<ResponsiveContainer width="100%" height="100%">
								<AreaChart data={data.cumulativeFlow}>
									<CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
									<XAxis dataKey="date" tick={{ fontSize: 11 }} />
									<YAxis tick={{ fontSize: 11 }} />
									<Tooltip />
									<Legend />
									<Area
										type="monotone"
										dataKey="todo"
										stackId="1"
										stroke="#94a3b8"
										fill="#cbd5e1"
										name="Todo"
									/>
									<Area
										type="monotone"
										dataKey="inProgress"
										stackId="1"
										stroke="#6366f1"
										fill="#a5b4fc"
										name="In Progress"
									/>
									<Area
										type="monotone"
										dataKey="review"
										stackId="1"
										stroke="#f59e0b"
										fill="#fcd34d"
										name="Review"
									/>
									<Area
										type="monotone"
										dataKey="done"
										stackId="1"
										stroke="#10b981"
										fill="#6ee7b7"
										name="Done"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* 5. Overdue Tasks */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle className="text-base">Overdue Tasks</CardTitle>
								<CardDescription>
									Tasks past their deadline, sorted by priority and lateness.
								</CardDescription>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									downloadCSV(
										"overdue-tasks",
										data.overdueTasks as unknown as Record<string, unknown>[],
									)
								}
							>
								CSV
							</Button>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
										<tr className="border-b">
											<th className="px-3 py-2">Task</th>
											<th className="px-3 py-2">Project</th>
											<th className="px-3 py-2">Assignee</th>
											<th className="px-3 py-2">Deadline</th>
											<th className="px-3 py-2">Priority</th>
											<th className="px-3 py-2 text-right">Days Overdue</th>
										</tr>
									</thead>
									<tbody>
										{data.overdueTasks.map((t) => (
											<tr key={t.id} className="border-b last:border-0">
												<td className="px-3 py-2 font-medium">
													<div className="flex flex-col">
														<span>{t.title}</span>
														<span className="text-xs text-muted-foreground">
															{t.id}
														</span>
													</div>
												</td>
												<td className="px-3 py-2">{t.project}</td>
												<td className="px-3 py-2">{t.assignee}</td>
												<td className="px-3 py-2">{t.deadline}</td>
												<td className="px-3 py-2">
													<Pill
														label={t.priority}
														className={
															PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.Low
														}
													/>
												</td>
												<td className="px-3 py-2 text-right text-red-600">
													{t.daysOverdue}d
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>

					{/* 6 + 7 row */}
					<section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base">Velocity</CardTitle>
									<CardDescription>
										Story points committed vs completed by sprint.
									</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										downloadCSV(
											"velocity",
											data.velocity as unknown as Record<string, unknown>[],
										)
									}
								>
									CSV
								</Button>
							</CardHeader>
							<CardContent style={{ height: 320 }}>
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={data.velocity}>
										<CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
										<XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
										<YAxis tick={{ fontSize: 11 }} />
										<Tooltip />
										<Legend />
										<Bar
											dataKey="committed"
											fill="#a5b4fc"
											name="Committed"
											radius={[4, 4, 0, 0]}
										/>
										<Bar
											dataKey="completed"
											fill="#6366f1"
											name="Completed"
											radius={[4, 4, 0, 0]}
										/>
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<div>
									<CardTitle className="text-base">
										Time Tracking vs Estimates
									</CardTitle>
									<CardDescription>
										Budgeted hours compared with actual logged hours per project.
									</CardDescription>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										downloadCSV(
											"time-tracking",
											data.timeTracking as unknown as Record<string, unknown>[],
										)
									}
								>
									CSV
								</Button>
							</CardHeader>
							<CardContent style={{ height: 320 }}>
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={data.timeTracking}>
										<CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
										<XAxis
											dataKey="project"
											tick={{ fontSize: 11 }}
											interval={0}
											angle={-15}
											textAnchor="end"
											height={60}
										/>
										<YAxis tick={{ fontSize: 11 }} />
										<Tooltip />
										<Legend />
										<Bar
											dataKey="estimatedHours"
											fill="#94a3b8"
											name="Estimated"
											radius={[4, 4, 0, 0]}
										/>
										<Bar
											dataKey="actualHours"
											fill="#ef4444"
											name="Actual"
											radius={[4, 4, 0, 0]}
										/>
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</section>

					<div className="pt-2 text-right text-xs text-muted-foreground">
						Generated at {new Date(data.generatedAt).toLocaleString()}
					</div>
				</>
			)}
		</div>
	);
}
