import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, List, ChevronRight, CheckCircle2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  listProjects, createProject,
  type Project, type ProjectStatus,
} from '@/services/project.service'
import { addMember } from '@/services/project-member.service'
import { listProfiles, type Profile } from '@/services/profile.service'

// ── Constants ─────────────────────────────────────────────────────────────────

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

const AVATAR_COLORS = [
  'bg-primary', 'bg-accent', 'bg-secondary', 'bg-warning', 'bg-danger',
]

const EMPTY_FORM = {
  name:        '',
  status:      'planning' as ProjectStatus,
  description: '',
  sprint:      '',
  sprintEnds:  '',
  tagInput:    '',
  tags:        [] as string[],
  teamIds:     [] as string[],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function avatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function safePct(completed: number, total: number) {
  return total === 0 ? 0 : Math.round((completed / total) * 100)
}

type TeamMember = { initials: string; color: string }

function membersToTeam(members: Project['project_members']): TeamMember[] {
  return members.map((m, i) => ({
    initials: getInitials(m.profiles?.full_name ?? null),
    color:    avatarColor(i),
  }))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function TeamAvatars({ team, max = 4 }: { team: TeamMember[]; max?: number }) {
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
  const pct = safePct(0, 0)
  const { variant, label } = STATUS_BADGE[project.status]
  const team = membersToTeam(project.project_members ?? [])
  return (
    <Card
      className="p-5 flex flex-col gap-4 hover:shadow-md hover:border-border-strong transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{project.name}</h3>
          <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{project.description || 'No description.'}</p>
        </div>
        <Badge variant={variant} className="shrink-0">{label}</Badge>
      </div>

      <div className="flex gap-1.5 flex-wrap min-h-[20px]">
        {(project.tags ?? []).map((t) => (
          <span key={t} className="text-[10px] bg-muted-subtle text-muted-foreground px-2 py-0.5 rounded-full font-medium">{t}</span>
        ))}
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted">Progress</span>
          <span className="font-medium text-foreground">{pct}%</span>
        </div>
        <ProgressBar pct={pct} />
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <TeamAvatars team={team} />
        <span className="text-[10px] text-muted">{project.sprint_name || 'No sprint'}</span>
      </div>
    </Card>
  )
}

function ProjectRow({ project, onClick }: { project: Project; onClick: () => void }) {
  const { variant, label } = STATUS_BADGE[project.status]
  const team = membersToTeam(project.project_members ?? [])
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
            <p className="text-xs text-muted truncate max-w-xs">
              {project.description ? project.description.slice(0, 60) + '…' : 'No description.'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4"><Badge variant={variant}>{label}</Badge></td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 min-w-[120px]">
          <ProgressBar pct={0} />
          <span className="text-xs text-muted whitespace-nowrap">0%</span>
        </div>
      </td>
      <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">0 / 0</td>
      <td className="px-4 py-4"><TeamAvatars team={team} max={3} /></td>
      <td className="px-4 py-4 text-xs text-muted whitespace-nowrap">{project.sprint_name || '—'}</td>
      <td className="px-4 py-4 text-right">
        <ChevronRight className="h-4 w-4 text-muted ml-auto" />
      </td>
    </tr>
  )
}

// ── New Project Dialog ────────────────────────────────────────────────────────

function NewProjectDialog({
  open,
  onClose,
  onCreate,
  profiles,
  profilesLoading,
}: {
  open: boolean
  onClose: () => void
  onCreate: (project: Project) => void
  profiles: Profile[]
  profilesLoading: boolean
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<{ name?: string; submit?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: typeof EMPTY_FORM[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'name') setErrors(prev => ({ ...prev, name: undefined }))
  }

  function addTag() {
    const tag = form.tagInput.trim()
    if (!tag || form.tags.includes(tag)) { set('tagInput', ''); return }
    set('tags', [...form.tags, tag])
    set('tagInput', '')
  }

  function removeTag(tag: string) {
    set('tags', form.tags.filter(t => t !== tag))
  }

  function toggleMember(id: string) {
    set('teamIds', form.teamIds.includes(id)
      ? form.teamIds.filter(i => i !== id)
      : [...form.teamIds, id]
    )
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setErrors({ name: 'Project name is required.' })
      return
    }

    setSubmitting(true)
    setErrors({})

    try {
      const project = await createProject({
        name:            form.name.trim(),
        description:     form.description.trim() || undefined,
        status:          form.status,
        sprint_name:     form.sprint.trim() || undefined,
        sprint_end_date: form.sprintEnds || undefined,
        tags:            form.tags,
      })

      await Promise.all(
        form.teamIds.map(userId => addMember(project.id, userId))
      )

      onCreate(project)
      setForm(EMPTY_FORM)
      setErrors({})
      onClose()
    } catch {
      setErrors({ submit: 'Failed to create project. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) { setForm(EMPTY_FORM); setErrors({}) }
    if (!open) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Fill in the details to create a new project.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Project Name <span className="text-danger">*</span>
            </label>
            <Input
              placeholder="e.g. Internal System Rewrite"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={errors.name ? 'border-danger focus:ring-danger' : ''}
            />
            {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
          </div>

          {/* Status + Sprint Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Status</label>
              <Select value={form.status} onValueChange={v => set('status', v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Sprint Name</label>
              <Input
                placeholder="e.g. Sprint 1 Alpha"
                value={form.sprint}
                onChange={e => set('sprint', e.target.value)}
              />
            </div>
          </div>

          {/* Sprint End Date + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Sprint End Date</label>
              <Input
                type="date"
                value={form.sprintEnds}
                onChange={e => set('sprintEnds', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Tags</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={form.tagInput}
                  onChange={e => set('tagInput', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag} className="shrink-0">
                  Add
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] bg-muted-subtle text-muted-foreground px-2 py-0.5 rounded-full font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-muted hover:text-foreground transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea
              placeholder="Describe the project goals and scope..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Team Members */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Team Members</label>
            {profilesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading members...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {profiles.map((profile, i) => (
                  <label
                    key={profile.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors',
                      form.teamIds.includes(profile.id)
                        ? 'border-primary bg-primary-subtle'
                        : 'border-border hover:bg-muted-subtle'
                    )}
                  >
                    <Checkbox
                      checked={form.teamIds.includes(profile.id)}
                      onCheckedChange={() => toggleMember(profile.id)}
                    />
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className={`text-[9px] text-white ${avatarColor(i)}`}>
                        {getInitials(profile.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-foreground">{profile.full_name ?? profile.email}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {errors.submit && (
            <p className="text-xs text-danger">{errors.submit}</p>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={submitting}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params: { status?: string; search?: string } = {}
      if (filter !== 'all') params.status = filter
      if (search) params.search = search
      const data = await listProjects(params)
      setProjects(data)
    } catch {
      setError('Failed to load projects.')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch(() => setProfiles([]))
      .finally(() => setProfilesLoading(false))
  }, [])

  async function handleCreate(project: Project) {
    await fetchProjects()
    void project
  }

  const filtered = projects.filter((p) => {
    const matchStatus = filter === 'all' || p.status === filter
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">Projects</h1>
          <p className="text-sm text-muted mt-1">{projects.length} projects total</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setDialogOpen(true)}>
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24 gap-2 text-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading projects...</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-base font-medium text-foreground mb-1">Something went wrong</p>
          <p className="text-sm text-muted mb-4">{error}</p>
          <Button variant="outline" onClick={fetchProjects}>Retry</Button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CheckCircle2 className="h-10 w-10 text-border-strong mb-4" />
          <p className="text-base font-medium text-foreground mb-1">No projects found</p>
          <p className="text-sm text-muted">Try adjusting your search or filter.</p>
        </div>
      )}

      {/* Grid view */}
      {!loading && !error && view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>
      )}

      {/* List view */}
      {!loading && !error && view === 'list' && filtered.length > 0 && (
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

      <NewProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreate}
        profiles={profiles}
        profilesLoading={profilesLoading}
      />
    </div>
  )
}
