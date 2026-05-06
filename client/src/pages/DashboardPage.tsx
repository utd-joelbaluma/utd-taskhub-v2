import {
  CheckCircle2, Circle, MessageSquare, ShieldCheck, Ticket, AlertTriangle,
  Plus, MoreVertical, Bug, KeyRound, Moon, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const stats = [
  { label: 'My Tasks',     value: '24', icon: CheckCircle2, iconClass: 'text-primary' },
  { label: 'In Progress',  value: '08', icon: Circle,       iconClass: 'text-primary' },
  { label: 'For Review',   value: '05', icon: MessageSquare,iconClass: 'text-accent' },
  { label: 'Completed',    value: '12', icon: ShieldCheck,  iconClass: 'text-secondary' },
  { label: 'Open Tickets', value: '03', icon: Ticket,       iconClass: 'text-muted' },
  { label: 'Overdue',      value: '02', icon: AlertTriangle,iconClass: 'text-danger', valueClass: 'text-danger' },
]

const recentTasks = [
  {
    dot: 'bg-primary',
    name: 'Refactor Authentication Middleware',
    assignees: ['AR', 'JD'],
    extraCount: 2,
    due: 'Today',
    status: 'in-progress' as const,
    statusLabel: 'In Progress',
  },
  {
    dot: 'bg-accent',
    name: 'API Documentation Update',
    assignees: ['AS'],
    extraCount: 0,
    due: 'Tomorrow',
    status: 'review' as const,
    statusLabel: 'Review',
  },
  {
    dot: 'bg-secondary',
    name: 'Database Migration Scripts',
    assignees: ['JD', 'AR'],
    extraCount: 0,
    due: 'May 24',
    status: 'todo' as const,
    statusLabel: 'To Do',
  },
]

const workloadDays = [
  { day: 'Mon', height: 55, active: false },
  { day: 'Tue', height: 72, active: false },
  { day: 'Wed', height: 100, active: true, peak: true },
  { day: 'Thu', height: 38, active: false },
  { day: 'Fri', height: 50, active: false },
]

const tickets = [
  {
    icon: Bug,
    iconBg: 'bg-danger-subtle',
    iconClass: 'text-danger',
    title: 'Fatal: Checkout Loop',
    id: '#4429',
    by: 'Maria Santos',
  },
  {
    icon: KeyRound,
    iconBg: 'bg-accent-subtle',
    iconClass: 'text-accent',
    title: 'Reset Password Flow Broken',
    id: '#4430',
    by: 'System Admin',
  },
  {
    icon: Moon,
    iconBg: 'bg-primary-subtle',
    iconClass: 'text-primary',
    title: 'New Feature: Dark Mode',
    id: '#4431',
    by: 'Product Team',
  },
]

const productivity = [
  { label: 'Development', pct: 82, barClass: 'bg-primary' },
  { label: 'Code Review',  pct: 45, barClass: 'bg-secondary' },
  { label: 'Testing',      pct: 61, barClass: 'bg-accent' },
]

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">System Overview</h1>
          <p className="text-sm text-muted mt-1">Hello Joel, here is what requires your attention today.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-muted mb-3">{s.label}</p>
            <div className="flex items-center justify-between">
              <span className={`text-3xl font-bold tabular-nums ${s.valueClass ?? 'text-foreground'}`}>{s.value}</span>
              <s.icon className={`h-6 w-6 ${s.iconClass}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Main content: left + right columns */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* LEFT */}
        <div className="flex flex-col gap-6">
          {/* Recent Tasks */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Recent Tasks</h2>
              <button className="text-sm text-primary font-medium hover:underline">View All</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-[10px] font-medium uppercase tracking-wider text-muted text-left">Task Description</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted text-left">Assigned</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted text-left">Due</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task.name} className="border-b border-border last:border-0 hover:bg-muted-subtle transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${task.dot}`} />
                        <span className="text-sm font-medium text-foreground">{task.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        {task.assignees.map((initials, i) => (
                          <Avatar key={initials + i} className={`h-6 w-6 border-2 border-surface ${i > 0 ? '-ml-2' : ''}`}>
                            <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                          </Avatar>
                        ))}
                        {task.extraCount > 0 && (
                          <div className="-ml-2 h-6 w-6 rounded-full bg-muted-subtle border-2 border-surface flex items-center justify-center text-[9px] font-medium text-muted">
                            +{task.extraCount}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{task.due}</td>
                    <td className="px-4 py-4">
                      <Badge variant={task.status}>{task.statusLabel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Workload Overview */}
          <Card className="p-5">
            <h2 className="text-base font-semibold text-foreground mb-6">Workload Overview</h2>
            <div className="flex items-end justify-between gap-3 h-28 px-4">
              {workloadDays.map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                  {d.peak && (
                    <span className="text-[10px] font-medium bg-foreground text-surface px-2 py-0.5 rounded">Peak</span>
                  )}
                  <div
                    className={`w-full rounded-t-sm ${d.active ? 'bg-primary' : 'bg-primary/20'}`}
                    style={{ height: `${d.height}%` }}
                  />
                  <span className={`text-xs ${d.active ? 'font-semibold text-foreground' : 'text-muted'}`}>{d.day}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-6">
          {/* Tickets */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Tickets</h2>
              <button className="text-muted hover:text-foreground p-1 rounded transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-full ${t.iconBg} flex items-center justify-center shrink-0`}>
                    <t.icon className={`h-4 w-4 ${t.iconClass}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground leading-tight">{t.title}</p>
                    <p className="text-xs text-muted mt-0.5">ID {t.id} &bull; By {t.by}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-5 text-sm">Manage Tickets</Button>
          </Card>

          {/* Weekly Productivity */}
          <Card className="p-5">
            <h2 className="text-base font-semibold text-foreground mb-5">Weekly Productivity</h2>
            <div className="space-y-4">
              {productivity.map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground">{p.label}</span>
                    <span className="text-sm font-medium text-foreground">{p.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div className={`h-full ${p.barClass} rounded-full`} style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Floating action button */}
      <button className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary-hover transition-colors">
        <Zap className="h-5 w-5" />
      </button>
    </div>
  )
}
