// frontend/src/pages/admin/ReportsPage.tsx
// Standalone Admin Reports Page.
// Self-contained: state, fetching, error handling, CSV export, charts.

import React, { useEffect, useMemo, useState } from "react";
import http from "@/services/http.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Download, AlertTriangle, CheckCircle2, Clock, Ban } from "lucide-react";

// ----------------------------- Types -----------------------------

type ProjectRow = {
  id: string;
  name: string;
  status: "On Track" | "At Risk" | "Blocked" | string;
  progress: number;
  owner: string;
  deadline: string;
};

type ReportPayload = {
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
    projects: ProjectRow[];
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
};

// ----------------------------- CSV Utils -----------------------------

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

// ----------------------------- Role Placeholder -----------------------------

function useCurrentUserRole(): string {
  // Replace with real context/store wiring later.
  try {
    const raw =
      (typeof window !== "undefined" && window.localStorage.getItem("user")) || "";
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.role || parsed?.user?.role || "admin";
    }
  } catch {
    // ignore
  }
  return "admin";
}

function Unauthorized() {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <Ban className="mb-3 h-10 w-10 text-red-500" />
      <h2 className="text-2xl font-semibold">Unauthorized</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        You do not have permission to view the Admin Reports page. Please contact
        your administrator if you believe this is a mistake.
      </p>
    </div>
  );
}

// ----------------------------- Helpers -----------------------------

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

// ----------------------------- Page -----------------------------

const ReportsPage: React.FC = () => {
  const role = useCurrentUserRole();
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await http.get("/api/admin/reports");
        const payload: ReportPayload = res?.data?.data ?? res?.data;
        if (mounted) setData(payload);
      } catch (err: any) {
        if (mounted) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load reports"
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (role === "admin") load();
    return () => {
      mounted = false;
    };
  }, [role]);

  const exportAll = useMemo(
    () => () => {
      if (!data) return;
      const flat: Record<string, unknown>[] = [];
      flat.push({ section: "Generated At", value: data.generatedAt });
      flat.push({});
      flat.push({ section: "Project Status - Totals" });
      Object.entries(data.projectStatusSummary.totals).forEach(([k, v]) =>
        flat.push({ key: k, value: v })
      );
      flat.push({});
      flat.push({ section: "Projects" });
      data.projectStatusSummary.projects.forEach((p) => flat.push({ ...p }));
      downloadCSV("admin-reports-full", flat);
    },
    [data]
  );

  if (role !== "admin") return <Unauthorized />;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin Reports</h1>
          <p className="text-sm text-muted-foreground">
            Cross-project analytics, sprint health, and team performance.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Export dataset</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={exportAll} disabled={!data}>
              All reports (summary)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                data && downloadCSV("projects", data.projectStatusSummary.projects as unknown as Record<string, unknown>[])
              }
              disabled={!data}
            >
              Project status
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                data && downloadCSV("task-completion", data.taskCompletion as unknown as Record<string, unknown>[])
              }
              disabled={!data}
            >
              Task completion
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                data && downloadCSV("burn-chart", data.burnChart.data as unknown as Record<string, unknown>[])
              }
              disabled={!data}
            >
              Burn-down / Burn-up
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                data && downloadCSV("cumulative-flow", data.cumulativeFlow as unknown as Record<string, unknown>[])
              }
              disabled={!data}
            >
              Cumulative flow
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                data && downloadCSV("overdue-tasks", data.overdueTasks as unknown as Record<string, unknown>[])
              }
              disabled={!data}
            >
              Overdue tasks
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                data && downloadCSV("velocity", data.velocity as unknown as Record<string, unknown>[])
              }
              disabled={!data}
            >
              Velocity
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                data && downloadCSV("time-tracking", data.timeTracking as unknown as Record<string, unknown>[])
              }
              disabled={!data}
            >
              Time tracking
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Loading / Error */}
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
            <AlertTriangle className="h-5 w-5" />
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
                <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
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
                <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
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
                <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ban className="h-4 w-4 text-red-500" />
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
                      style={{ width: `${data.projectStatusSummary.overallProgressPct}%` }}
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
                  className="gap-2"
                  onClick={() =>
                    downloadCSV(
                      "projects",
                      data.projectStatusSummary.projects as unknown as Record<string, unknown>[]
                    )
                  }
                >
                  <Download className="h-4 w-4" /> Export
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead className="w-[180px]">Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.projectStatusSummary.projects.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>
                            <Pill label={p.status} className={STATUS_COLORS[p.status]} />
                          </TableCell>
                          <TableCell>{p.owner}</TableCell>
                          <TableCell>{p.deadline}</TableCell>
                          <TableCell>
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 2 + 3 row */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* 2. Task Completion */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Task Completion</CardTitle>
                  <CardDescription>Planned vs actual completed tasks.</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    downloadCSV(
                      "task-completion",
                      data.taskCompletion as unknown as Record<string, unknown>[]
                    )
                  }
                >
                  <Download className="h-4 w-4" /> CSV
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

            {/* 3. Burn-down / Burn-up */}
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
                  className="gap-2"
                  onClick={() =>
                    downloadCSV(
                      "burn-chart",
                      data.burnChart.data as unknown as Record<string, unknown>[]
                    )
                  }
                >
                  <Download className="h-4 w-4" /> CSV
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
          <section>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Cumulative Flow Diagram</CardTitle>
                  <CardDescription>
                    Tasks accumulating across workflow stages.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    downloadCSV(
                      "cumulative-flow",
                      data.cumulativeFlow as unknown as Record<string, unknown>[]
                    )
                  }
                >
                  <Download className="h-4 w-4" /> CSV
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
          </section>

          {/* 5. Overdue Tasks */}
          <section>
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
                  className="gap-2"
                  onClick={() =>
                    downloadCSV(
                      "overdue-tasks",
                      data.overdueTasks as unknown as Record<string, unknown>[]
                    )
                  }
                >
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Days Overdue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.overdueTasks.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{t.title}</span>
                              <span className="text-xs text-muted-foreground">{t.id}</span>
                            </div>
                          </TableCell>
                          <TableCell>{t.project}</TableCell>
                          <TableCell>{t.assignee}</TableCell>
                          <TableCell>{t.deadline}</TableCell>
                          <TableCell>
                            <Pill
                              label={t.priority}
                              className={PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.Low}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="inline-flex items-center gap-1 text-red-600">
                              <Clock className="h-3.5 w-3.5" />
                              {t.daysOverdue}d
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 6 + 7 row */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* 6. Velocity */}
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
                  className="gap-2"
                  onClick={() =>
                    downloadCSV(
                      "velocity",
                      data.velocity as unknown as Record<string, unknown>[]
                    )
                  }
                >
                  <Download className="h-4 w-4" /> CSV
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
                    <Bar dataKey="committed" fill="#a5b4fc" name="Committed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" fill="#6366f1" name="Completed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 7. Time Tracking */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Time Tracking vs Estimates</CardTitle>
                  <CardDescription>
                    Budgeted hours compared with actual logged hours per project.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    downloadCSV(
                      "time-tracking",
                      data.timeTracking as unknown as Record<string, unknown>[]
                    )
                  }
                >
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </CardHeader>
              <CardContent style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeTracking}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="project" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="estimatedHours" fill="#94a3b8" name="Estimated" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actualHours" fill="#ef4444" name="Actual" radius={[4, 4, 0, 0]} />
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
};

export default ReportsPage;
