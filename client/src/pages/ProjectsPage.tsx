import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PROJECTS, type Project, type ProjectStatus } from '@/data/projects'
import { cn } from '@/lib/utils'

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All',         value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Planning',    value: 'planning' },
  { label: 'Completed',   value: 'completed' },
  { label: 'On Hold',     value: 'on-hold' },
]

const STATUS_BADGE: Record<ProjectStatus, { variant: 'in-progress' | 'todo' | 'done' | 'cancelled' | 'backlog'; label: string }> = {
  'in-progress': { variant: 'in-progress', label: 'In Progress' },
  'planning':    { variant: 'todo',        label: 'Planning' },
  'completed':   { variant: 'done',        label: 'Completed' },
  'on-hold':     { variant: 'cancelled',   label: 'On Hold' },
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function TeamAvatars({ team, max = 4 }: { team: Project['team']; max?: number }) {
  const visible = team.slice(0, max)
  const extra = team.length - max
  return (
    <div className="flex items-center">
      {visible.map((m, i) => (
        <Avatar key={i} className={`h-6 w-6 border-2 border-surface ${i > 0 ? '-ml-2' : ''}`}>
          <AvatarFallback className={`text-[9px] text-white ${m.color}`}>{m.initials}</AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 && (
        <div className="-ml-2 h-6 w-6 rounded-full bg-muted-subtle border-2 border-surface flex items-center justify-center text-[9px] font-medium text-muted">
          +{extra}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const pct = Math.round((project.tasksCompleted / project.tasksTotal) * 100)
  const { variant, label } = STATUS_BADGE[project.status]
  return (
    <Card
      className="p-5 flex flex-col gap-4 hover:shadow-md hover:border-border-strong transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
          <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{project.description}</p>
        </div>
        <Badge variant={variant} className="shrink-0">{label}</Badge>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {project.tags.map((t) => (
          <span key={t} className="text-[10px] bg-muted-subtle text-muted-foreground px-2 py-0.5 rounded-full font-medium">{t}</span>
        ))}
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted">Progress</span>
          <span className="font-medium text-foreground">{pct}%</span>
        </div>
        <ProgressBar pct={pct} />
        <p className="text-[10px] text-muted mt-1.5">{project.tasksCompleted} / {project.tasksTotal} tasks</p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <TeamAvatars team={project.team} />
        <span className="text-[10px] text-muted">{project.sprint}</span>
      </div>
    </Card>
  )
}

function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) {
  const pct = Math.round((project.tasksCompleted / project.tasksTotal) * 100)
  const { variant, label } = STATUS_BADGE[project.status]
  return (
    <tr
      className="border-b border-border last:border-0 hover:bg-muted-subtle transition-colors cursor-pointer"
      onClick={onClick}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{project.name}</p>
            <p className="text-xs text-muted truncate max-w-xs">{project.description.slice(0, 60)}…</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <Badge variant={variant}>{label}</Badge>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 min-w-[120px]">
          <ProgressBar pct={pct} />
          <span className="text-xs text-muted whitespace-nowrap">{pct}%</span>
        </div>
      </td>
      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
        {project.tasksCompleted} / {project.tasksTotal}
      </td>
      <td className="px-4 py-4">
        <TeamAvatars team={project.team} max={3} />
      </td>
      <td className="px-4 py-4 text-xs text-muted whitespace-nowrap">{project.sprint}</td>
      <td className="px-4 py-4 text-right">
        <ChevronRight className="h-4 w-4 text-muted ml-auto" />
      </td>
    </tr>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = PROJECTS.filter((p) => {
    const matchStatus = filter === 'all' || p.status === filter
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">Projects</h1>
          <p className="text-sm text-muted mt-1">{PROJECTS.length} projects total</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters + Search + View toggle */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-surface">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap',
                filter === f.value
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted-subtle'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-56 h-9 text-sm"
            />
          </div>

          <div className="flex items-center border border-border rounded-lg overflow-hidden bg-surface">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'p-2 transition-colors',
                view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground hover:bg-muted-subtle'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-2 transition-colors',
                view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground hover:bg-muted-subtle'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="h-10 w-10 text-border-strong mb-4" />
          <p className="text-base font-medium text-foreground mb-1">No projects found</p>
          <p className="text-sm text-muted">Try adjusting your search or filter.</p>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && filtered.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Project', 'Status', 'Progress', 'Tasks', 'Team', 'Sprint', ''].map((h, i) => (
                  <th
                    key={h + i}
                    className={cn(
                      'px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted',
                      i === 0 ? 'pl-5 text-left' : i === 6 ? 'text-right' : 'text-left'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <ProjectRow key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
