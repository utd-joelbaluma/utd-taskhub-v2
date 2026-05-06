import { useState, useRef, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Search, LayoutGrid, List, Calendar, GripVertical, X } from 'lucide-react'
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
import { PROJECTS } from '@/data/projects'
import { USERS, INITIAL_TASKS, type Task, type TaskStatus, type TaskPriority } from '@/data/tasks'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

type ColumnId = TaskStatus
type Columns = Record<ColumnId, Task[]>

const COLUMN_IDS: ColumnId[] = ['todo', 'in-progress', 'review', 'done']

const COLUMN_LABELS: Record<ColumnId, string> = {
  'todo':        'To Do',
  'in-progress': 'In Progress',
  'review':      'Review',
  'done':        'Done',
}

const COLUMN_BADGE: Record<ColumnId, { variant: 'todo' | 'in-progress' | 'review' | 'done'; dot: string }> = {
  'todo':        { variant: 'todo',        dot: 'bg-muted' },
  'in-progress': { variant: 'in-progress', dot: 'bg-primary' },
  'review':      { variant: 'review',      dot: 'bg-secondary' },
  'done':        { variant: 'done',        dot: 'bg-secondary' },
}

const PRIORITY_LEFT: Record<TaskPriority, string> = {
  urgent: 'border-l-4 border-l-danger',
  high:   'border-l-4 border-l-warning',
  medium: 'border-l-4 border-l-primary',
  low:    'border-l-4 border-l-border',
}

const PRIORITY_BADGE_VARIANT: Record<TaskPriority, 'urgent' | 'high' | 'medium' | 'low'> = {
  urgent: 'urgent',
  high:   'high',
  medium: 'medium',
  low:    'low',
}

const EMPTY_TASK_FORM = {
  title:      '',
  projectId:  '',
  assigneeId: '',
  status:     'todo' as TaskStatus,
  priority:   'medium' as TaskPriority,
  dueDate:    '',
  tagInput:   '',
  tags:       [] as string[],
}

// ── New Task Dialog ───────────────────────────────────────────────────────────

function NewTaskDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (task: Task) => void
}) {
  const [form, setForm] = useState(EMPTY_TASK_FORM)
  const [errors, setErrors] = useState<{ title?: string; projectId?: string }>({})

  function set<K extends keyof typeof EMPTY_TASK_FORM>(key: K, value: typeof EMPTY_TASK_FORM[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'title' || key === 'projectId') setErrors(e => ({ ...e, [key]: undefined }))
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

  function validate() {
    const e: typeof errors = {}
    if (!form.title.trim())   e.title     = 'Task title is required.'
    if (!form.projectId)      e.projectId = 'Please select a project.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    const task: Task = {
      id:         't-' + Date.now(),
      title:      form.title.trim(),
      projectId:  form.projectId,
      assigneeId: form.assigneeId,
      status:     form.status,
      priority:   form.priority,
      dueDate:    form.dueDate || 'TBD',
      tags:       form.tags,
    }

    onCreate(task)
    setForm(EMPTY_TASK_FORM)
    setErrors({})
    onClose()
  }

  function handleOpenChange(open: boolean) {
    if (!open) { setForm(EMPTY_TASK_FORM); setErrors({}) }
    if (!open) onClose()
  }

  const selectedAssignee = USERS.find(u => u.id === form.assigneeId)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Fill in the details to create a new task.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Task Title <span className="text-danger">*</span>
            </label>
            <Input
              placeholder="e.g. Refactor authentication middleware"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className={errors.title ? 'border-danger focus:ring-danger' : ''}
            />
            {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
          </div>

          {/* Project + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Project <span className="text-danger">*</span>
              </label>
              <Select value={form.projectId} onValueChange={v => set('projectId', v)}>
                <SelectTrigger className={errors.projectId ? 'border-danger' : ''}>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECTS.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-xs text-danger mt-1">{errors.projectId}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Status</label>
              <Select value={form.status} onValueChange={v => set('status', v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Priority</label>
              <Select value={form.priority} onValueChange={v => set('priority', v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Due Date</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => set('dueDate', e.target.value)}
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Assignee</label>
            <div className="flex flex-wrap gap-2">
              {USERS.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => set('assigneeId', form.assigneeId === user.id ? '' : user.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
                    form.assigneeId === user.id
                      ? 'border-primary bg-primary-subtle text-primary font-medium'
                      : 'border-border hover:bg-muted-subtle text-foreground'
                  )}
                >
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarFallback className={`text-[9px] text-white ${user.color}`}>{user.initials}</AvatarFallback>
                  </Avatar>
                  {user.name}
                </button>
              ))}
            </div>
            {selectedAssignee && (
              <p className="text-xs text-muted mt-2">
                Assigned to <span className="font-medium text-foreground">{selectedAssignee.name}</span>
              </p>
            )}
          </div>

          {/* Tags */}
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

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildColumns(tasks: Task[]): Columns {
  return COLUMN_IDS.reduce((acc, colId) => {
    acc[colId] = tasks.filter(t => t.status === colId)
    return acc
  }, {} as Columns)
}

function getUserById(id: string) {
  return USERS.find(u => u.id === id)
}

function getProjectName(id: string) {
  return PROJECTS.find(p => p.id === id)?.name ?? id
}

// ── Task card (shared between board and overlay) ──────────────────────────────

function TaskCardContent({ task, isDragging = false }: { task: Task; isDragging?: boolean }) {
  const user = getUserById(task.assigneeId)
  return (
    <div className={cn(
      'bg-surface rounded-lg border border-border p-3.5 flex flex-col gap-2.5 select-none',
      PRIORITY_LEFT[task.priority],
      isDragging ? 'shadow-xl opacity-90 rotate-1' : 'shadow-sm hover:shadow-md hover:border-border-strong transition-all',
    )}>
      <div className="flex items-start justify-between gap-2">
        <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} className="text-[10px]">
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </Badge>
        {task.tags[0] && (
          <span className="text-[10px] bg-muted-subtle text-muted-foreground px-1.5 py-0.5 rounded font-medium leading-none">
            {task.tags[0]}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>

      <p className="text-[11px] text-muted">{getProjectName(task.projectId)}</p>

      <div className="flex items-center justify-between pt-0.5 border-t border-border">
        {user ? (
          <Avatar className="h-5 w-5">
            <AvatarFallback className={`text-[9px] text-white ${user.color}`}>{user.initials}</AvatarFallback>
          </Avatar>
        ) : <span />}
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <Calendar className="h-3 w-3" />
          {task.dueDate}
        </div>
      </div>
    </div>
  )
}

// ── Sortable card wrapper ─────────────────────────────────────────────────────

function SortableTaskCard({ task }: { task: Task }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-2 z-10 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted hover:text-muted-foreground"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      <TaskCardContent task={task} />
    </div>
  )
}

// ── Board column ──────────────────────────────────────────────────────────────

function BoardColumn({ colId, tasks }: { colId: ColumnId; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: colId })
  const { dot } = COLUMN_BADGE[colId]

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-sm font-semibold text-foreground">{COLUMN_LABELS[colId]}</span>
        <span className="ml-auto text-xs font-medium text-muted bg-muted-subtle px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 flex flex-col gap-2.5 rounded-xl p-2 min-h-[200px] transition-colors',
          isOver ? 'bg-primary-subtle/60 border border-dashed border-primary/40' : 'bg-muted-subtle/40',
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => <SortableTaskCard key={task.id} task={task} />)}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-xs text-muted">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── List view row ─────────────────────────────────────────────────────────────

function ListRow({ task }: { task: Task }) {
  const user = getUserById(task.assigneeId)
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted-subtle transition-colors">
      <td className="px-5 py-3.5">
        <p className="text-sm font-medium text-foreground">{task.title}</p>
        {task.tags[0] && (
          <span className="text-[10px] text-muted">{task.tags[0]}</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs text-muted-foreground">{getProjectName(task.projectId)}</span>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </Badge>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={task.status}>
          {COLUMN_LABELS[task.status]}
        </Badge>
      </td>
      <td className="px-4 py-3.5">
        {user && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className={`text-[9px] text-white ${user.color}`}>{user.initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{user.name}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1 text-xs text-muted">
          <Calendar className="h-3 w-3" />
          {task.dueDate}
        </div>
      </td>
    </tr>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [columns, setColumns] = useState<Columns>(() => buildColumns(INITIAL_TASKS))
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [view, setView] = useState<'board' | 'list'>('board')

  const [filterProject, setFilterProject] = useState('all')
  const [filterUser, setFilterUser]       = useState('all')
  const [filterStatus, setFilterStatus]   = useState('all')
  const [search, setSearch]               = useState('')

  // Use ref to always read latest columns in DnD handlers without stale closures
  const columnsRef = useRef(columns)
  columnsRef.current = columns

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // ── DnD helpers ─────────────────────────────────────────────────────────

  function findColumnId(taskId: string): ColumnId | null {
    for (const colId of COLUMN_IDS) {
      if (columnsRef.current[colId].some(t => t.id === taskId)) return colId
    }
    return null
  }

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerHits = pointerWithin(args)
    if (pointerHits.length > 0) return pointerHits
    return rectIntersection(args)
  }, [])

  function onDragStart({ active }: DragStartEvent) {
    setActiveTaskId(active.id as string)
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return

    const activeId = active.id as string
    const overId   = over.id as string
    if (activeId === overId) return

    const srcColId = findColumnId(activeId)
    const dstColId = (COLUMN_IDS.includes(overId as ColumnId)
      ? overId
      : findColumnId(overId)) as ColumnId | null

    if (!srcColId || !dstColId || srcColId === dstColId) return

    setColumns(prev => {
      const srcTasks = [...prev[srcColId]]
      const dstTasks = [...prev[dstColId]]

      const srcIdx = srcTasks.findIndex(t => t.id === activeId)
      if (srcIdx < 0) return prev

      const moved = { ...srcTasks[srcIdx], status: dstColId }
      const newSrc = srcTasks.filter(t => t.id !== activeId)

      const overIdx = dstTasks.findIndex(t => t.id === overId)
      const insertAt = overIdx >= 0 ? overIdx : dstTasks.length
      const newDst = [...dstTasks.slice(0, insertAt), moved, ...dstTasks.slice(insertAt)]

      return { ...prev, [srcColId]: newSrc, [dstColId]: newDst }
    })
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTaskId(null)
    if (!over) return

    const activeId = active.id as string
    const overId   = over.id as string
    if (activeId === overId) return

    const colId = findColumnId(activeId)
    if (!colId) return

    const overIsTask = !COLUMN_IDS.includes(overId as ColumnId)
    if (!overIsTask) return

    const overColId = findColumnId(overId)
    if (!overColId || overColId !== colId) return

    setColumns(prev => {
      const items    = prev[colId]
      const fromIdx  = items.findIndex(t => t.id === activeId)
      const toIdx    = items.findIndex(t => t.id === overId)
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev
      return { ...prev, [colId]: arrayMove(items, fromIdx, toIdx) }
    })
  }

  // ── Filtering ────────────────────────────────────────────────────────────

  function applyFilters(tasks: Task[]) {
    return tasks.filter(t => {
      if (filterProject !== 'all' && t.projectId !== filterProject) return false
      if (filterUser !== 'all' && t.assigneeId !== filterUser) return false
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }

  const filteredColumns = COLUMN_IDS.reduce((acc, colId) => {
    acc[colId] = applyFilters(columns[colId])
    return acc
  }, {} as Columns)

  const allFilteredTasks = COLUMN_IDS.flatMap(c => filteredColumns[c])

  const activeTask = activeTaskId
    ? COLUMN_IDS.flatMap(c => columns[c]).find(t => t.id === activeTaskId) ?? null
    : null

  const isFiltered = filterProject !== 'all' || filterUser !== 'all' || filterStatus !== 'all' || search !== ''

  function handleCreateTask(task: Task) {
    setColumns(prev => ({
      ...prev,
      [task.status]: [task, ...prev[task.status]],
    }))
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">Tasks</h1>
          <p className="text-sm text-muted mt-1">
            {COLUMN_IDS.reduce((s, c) => s + columns[c].length, 0)} tasks across all projects
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Project */}
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {PROJECTS.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 w-56 h-9 text-sm"
          />
        </div>

        {/* User */}
        <Select value={filterUser} onValueChange={setFilterUser}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {USERS.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status (list view only) */}
        {view === 'list' && (
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {COLUMN_IDS.map(c => (
                <SelectItem key={c} value={c}>{COLUMN_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear filters */}
        {isFiltered && (
          <button
            onClick={() => { setFilterProject('all'); setFilterUser('all'); setFilterStatus('all'); setSearch('') }}
            className="text-xs text-muted hover:text-foreground underline"
          >
            Clear filters
          </button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex items-center border border-border rounded-lg overflow-hidden bg-surface">
          <button
            onClick={() => setView('board')}
            className={cn('p-2 transition-colors', view === 'board' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground hover:bg-muted-subtle')}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn('p-2 transition-colors', view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground hover:bg-muted-subtle')}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── BOARD VIEW ──────────────────────────────────────────────────── */}
      {view === 'board' && (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 items-start">
            {COLUMN_IDS.map(colId => (
              <BoardColumn key={colId} colId={colId} tasks={filteredColumns[colId]} />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
            {activeTask ? (
              <div className="w-[272px]">
                <TaskCardContent task={activeTask} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ── LIST VIEW ───────────────────────────────────────────────────── */}
      {view === 'list' && (
        allFilteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="h-8 w-8 text-border-strong mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No tasks found</p>
            <p className="text-xs text-muted">Try adjusting your filters.</p>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted-subtle/40">
                  {['Task', 'Project', 'Priority', 'Status', 'Assignee', 'Due'].map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        'px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-muted',
                        i === 0 ? 'pl-5 text-left' : 'text-left'
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFilteredTasks.map(task => <ListRow key={task.id} task={task} />)}
              </tbody>
            </table>
          </Card>
        )
      )}

      <NewTaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={handleCreateTask}
      />
    </div>
  )
}
