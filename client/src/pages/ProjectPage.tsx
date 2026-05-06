import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Pencil, CheckCircle2, MessageSquare, Users, Edit3,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { PROJECTS, CRITICAL_TASKS, ACTIVITY } from '@/data/projects'
import { cn } from '@/lib/utils'

const STATUS_BADGE = {
  'in-progress': { variant: 'in-progress' as const, label: 'In Progress' },
  'planning':    { variant: 'todo' as const,        label: 'Planning' },
  'completed':   { variant: 'done' as const,        label: 'Completed' },
  'on-hold':     { variant: 'cancelled' as const,   label: 'On Hold' },
}

const PRIORITY_BADGE = {
  high:   { variant: 'high' as const,    label: 'High' },
  medium: { variant: 'medium' as const,  label: 'Medium' },
  low:    { variant: 'low' as const,     label: 'Low' },
  done:   { variant: 'done' as const,    label: 'Done' },
}

const STATUS_TASK_BADGE = {
  'review':      { variant: 'review' as const,       label: 'In Review' },
  'done':        { variant: 'done' as const,          label: 'Done' },
  'todo':        { variant: 'todo' as const,          label: 'Todo' },
  'in-progress': { variant: 'in-progress' as const,  label: 'In Progress' },
}

const TABS = ['Overview', 'Tasks', 'Activity'] as const
type Tab = typeof TABS[number]

function ActivityIcon({ type }: { type: string }) {
  const base = 'h-8 w-8 rounded-full flex items-center justify-center shrink-0'
  if (type === 'check')   return <div className={`${base} bg-primary-subtle`}><CheckCircle2 className="h-4 w-4 text-primary" /></div>
  if (type === 'comment') return <div className={`${base} bg-accent-subtle`}><MessageSquare className="h-4 w-4 text-accent" /></div>
  if (type === 'users')   return <div className={`${base} bg-muted-subtle`}><Users className="h-4 w-4 text-muted" /></div>
  return <div className={`${base} bg-secondary-subtle`}><Edit3 className="h-4 w-4 text-secondary" /></div>
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  const project = PROJECTS.find((p) => p.id === id)

  if (!project) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-16 text-center">
        <p className="text-base font-medium text-foreground mb-2">Project not found</p>
        <Button variant="outline" onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    )
  }

  const { variant: statusVariant, label: statusLabel } = STATUS_BADGE[project.status]
  const pct = Math.round((project.tasksCompleted / project.tasksTotal) * 100)
  const tasks = CRITICAL_TASKS[id!] ?? []
  const activity = ACTIVITY[id!] ?? []

  const sprintBlocks = 4
  const filledBlocks = Math.round((pct / 100) * sprintBlocks)

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* Back */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Projects
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">{project.name}</h1>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="text-sm text-muted leading-relaxed max-w-2xl">{project.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="flex items-center gap-2">
            <Pencil className="h-3.5 w-3.5" />
            Edit Project
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border mb-8">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm transition-colors -mb-px border-b-2',
              activeTab === tab
                ? 'text-primary font-medium border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* Top row: completion + sprint */}
          <div className="grid grid-cols-[280px_1fr] gap-4">
            {/* Completion Progress */}
            <Card className="p-5">
              <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-4">Completion Progress</p>
              <p className="text-4xl font-bold text-primary mb-1">{pct}%</p>
              <p className="text-xs text-muted mb-3">{project.tasksCompleted} / {project.tasksTotal} Tasks</p>
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden mb-4">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-muted-subtle px-3 py-2">
                  <p className="text-[10px] text-muted mb-0.5">Completed</p>
                  <p className="text-lg font-bold text-foreground">{project.tasksCompleted}</p>
                </div>
                <div className="rounded-lg bg-muted-subtle px-3 py-2">
                  <p className="text-[10px] text-muted mb-0.5">Remaining</p>
                  <p className="text-lg font-bold text-foreground">{project.tasksTotal - project.tasksCompleted}</p>
                </div>
              </div>
            </Card>

            {/* Current Sprint */}
            <Card className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted mb-2">Current Sprint</p>
                  <h2 className="text-2xl font-bold text-foreground">{project.sprint}</h2>
                  <p className="text-sm text-muted mt-0.5">Ends in 4 days ({project.sprintEnds})</p>
                </div>
                <div className="flex items-center">
                  {project.team.slice(0, 4).map((m, i) => (
                    <Avatar key={i} className={`h-9 w-9 border-2 border-surface ${i > 0 ? '-ml-3' : ''}`}>
                      <AvatarFallback className={`text-[10px] text-white ${m.color}`}>{m.initials}</AvatarFallback>
                    </Avatar>
                  ))}
                  {project.team.length > 4 && (
                    <div className="-ml-3 h-9 w-9 rounded-full bg-muted-subtle border-2 border-surface flex items-center justify-center text-xs font-medium text-muted">
                      +{project.team.length - 4}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-sm text-foreground">
                  Velocity is <span className="font-semibold">{project.sprintVelocity}</span>
                </p>
              </div>

              <div className="flex gap-2">
                {Array.from({ length: sprintBlocks }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${i < filledBlocks ? 'bg-primary' : 'bg-border'}`}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Bottom row: critical tasks + activity */}
          <div className="grid grid-cols-[1fr_320px] gap-4">
            {/* Critical Tasks */}
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">Critical Tasks</h2>
                <button className="text-sm text-primary font-medium hover:underline">View All</button>
              </div>
              {tasks.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted">No critical tasks.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted-subtle/40">
                      {['Task Name', 'Priority', 'Status', 'Owner'].map((h) => (
                        <th key={h} className="px-5 py-3 text-xs font-medium text-muted text-left first:pl-5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted-subtle transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-foreground">{t.name}</p>
                          <p className="text-[11px] text-muted">{t.id}</p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={PRIORITY_BADGE[t.priority].variant}>{PRIORITY_BADGE[t.priority].label}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={STATUS_TASK_BADGE[t.status].variant}>{STATUS_TASK_BADGE[t.status].label}</Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className={`text-[10px] text-white ${t.ownerColor}`}>{t.ownerInitials}</AvatarFallback>
                          </Avatar>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Recent Activity */}
            <Card className="p-5">
              <h2 className="text-base font-semibold text-foreground mb-5">Recent Activity</h2>
              {activity.length === 0 ? (
                <p className="text-sm text-muted">No recent activity.</p>
              ) : (
                <div className="space-y-4">
                  {activity.map((a, i) => (
                    <div key={i}>
                      <div className="flex gap-3">
                        <ActivityIcon type={a.icon} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-snug">
                            <span className="font-semibold">{a.actor}</span>{' '}
                            {a.action}{' '}
                            {a.linkLabel && (
                              <span className="text-primary font-medium">{a.linkLabel}</span>
                            )}
                          </p>
                          {a.quote && (
                            <p className="text-xs text-muted mt-1 italic leading-relaxed">{a.quote}</p>
                          )}
                          <p className="text-[11px] text-muted mt-1">{a.time}</p>
                        </div>
                      </div>
                      {i < activity.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── TASKS TAB ────────────────────────────────────────── */}
      {activeTab === 'Tasks' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted-subtle/40">
                {['Task Name', 'Priority', 'Status', 'Owner'].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-medium text-muted text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(CRITICAL_TASKS[id!] ?? []).map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted-subtle transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted">{t.id}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={PRIORITY_BADGE[t.priority].variant}>{PRIORITY_BADGE[t.priority].label}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_TASK_BADGE[t.status].variant}>{STATUS_TASK_BADGE[t.status].label}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={`text-[10px] text-white ${t.ownerColor}`}>{t.ownerInitials}</AvatarFallback>
                    </Avatar>
                  </td>
                </tr>
              ))}
              {!(CRITICAL_TASKS[id!]?.length) && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted">No tasks yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── ACTIVITY TAB ─────────────────────────────────────── */}
      {activeTab === 'Activity' && (
        <Card className="p-5 max-w-2xl">
          {(ACTIVITY[id!] ?? []).length === 0 ? (
            <p className="text-sm text-muted text-center py-8">No activity yet.</p>
          ) : (
            <div className="space-y-4">
              {(ACTIVITY[id!] ?? []).map((a, i) => (
                <div key={i}>
                  <div className="flex gap-3">
                    <ActivityIcon type={a.icon} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">
                        <span className="font-semibold">{a.actor}</span>{' '}
                        {a.action}{' '}
                        {a.linkLabel && (
                          <span className="text-primary font-medium">{a.linkLabel}</span>
                        )}
                      </p>
                      {a.quote && (
                        <p className="text-xs text-muted mt-1 italic leading-relaxed">{a.quote}</p>
                      )}
                      <p className="text-[11px] text-muted mt-1">{a.time}</p>
                    </div>
                  </div>
                  {i < (ACTIVITY[id!] ?? []).length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
