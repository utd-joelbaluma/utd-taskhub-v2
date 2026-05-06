import { useState } from 'react'
import {
  Type,
  MousePointer2,
  AlignLeft,
  Activity,
  Table2,
  LayoutGrid,
  BellRing,
  Pencil,
  Trash2,
  Plus,
  TrendingUp,
  MessageSquare,
  GitPullRequest,
  ArrowRight,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  Layers,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-[#0058be]" />
      <h2 className="text-base font-semibold text-[#191b23]">{title}</h2>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-widest uppercase text-[#727785] mb-2">
      {children}
    </p>
  )
}

export default function DesignSystemPage() {
  const [checked, setChecked] = useState(true)
  const [radioValue, setRadioValue] = useState('active')

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-[#191b23] mb-1">Design System</h1>
        <p className="text-sm text-[#727785]">Central reference for TaskHub's UI components and styles.</p>
      </div>

      <div className="space-y-10">
        {/* ── TYPOGRAPHY ───────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Type} title="Typography" />
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-5">
                <div>
                  <SectionLabel>Heading 1</SectionLabel>
                  <p className="text-3xl font-semibold text-[#191b23] tracking-tight leading-10">
                    Design System 32px
                  </p>
                </div>
                <div>
                  <SectionLabel>Heading 2</SectionLabel>
                  <p className="text-2xl font-semibold text-[#191b23] tracking-tight leading-8">
                    Task Management 24px
                  </p>
                </div>
                <div>
                  <SectionLabel>Heading 3</SectionLabel>
                  <p className="text-xl font-semibold text-[#191b23] tracking-tight leading-7">
                    Component Library 20px
                  </p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <SectionLabel>Body Large</SectionLabel>
                  <p className="text-base text-[#191b23] leading-6">
                    Focused engineering requires visual quiet and clarity.
                  </p>
                </div>
                <div>
                  <SectionLabel>Body Medium</SectionLabel>
                  <p className="text-sm text-[#191b23] leading-5">
                    Standard text for descriptions and content blocks.
                  </p>
                </div>
                <div>
                  <SectionLabel>Muted / Small</SectionLabel>
                  <p className="text-xs text-[#727785] leading-4">
                    Secondary information and supportive metadata.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ── BUTTONS & ACTIONS ─────────────────────────────────── */}
        <section>
          <SectionHeader icon={MousePointer2} title="Buttons & Actions" />
          <Card className="p-6">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <SectionLabel>Primary</SectionLabel>
                <Button variant="default">Primary Action</Button>
              </div>
              <div>
                <SectionLabel>Secondary</SectionLabel>
                <Button variant="secondary">Secondary Action</Button>
              </div>
              <div>
                <SectionLabel>Outline</SectionLabel>
                <Button variant="outline">Outline Button</Button>
              </div>
              <div>
                <SectionLabel>Ghost & Icon</SectionLabel>
                <div className="space-y-2">
                  <div>
                    <Button variant="ghost">Ghost Button</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" disabled>
                Disabled
              </Button>
            </div>
          </Card>
        </section>

        {/* ── DATA ENTRY ────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader icon={AlignLeft} title="Data Entry" />
            <Button size="icon" className="rounded-full h-9 w-9">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Card className="p-6">
            <div className="grid grid-cols-3 gap-6 items-end">
              <div>
                <label className="text-sm font-medium text-[#424754] mb-1.5 block">
                  Input Label
                </label>
                <Input placeholder="Enter task name..." />
              </div>
              <div>
                <label className="text-sm font-medium text-[#424754] mb-1.5 block">
                  Select Priority
                </label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(v) => setChecked(!!v)}
                    id="active-task"
                  />
                  <span className="text-sm text-[#424754]">Active Task</span>
                </label>
                <RadioGroup value={radioValue} onValueChange={setRadioValue} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="internal" id="internal" />
                    <label htmlFor="internal" className="text-sm text-[#424754] cursor-pointer">
                      Internal
                    </label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </Card>
        </section>

        {/* ── STATUS & FEEDBACK ─────────────────────────────────── */}
        <section>
          <SectionHeader icon={Activity} title="Status & Feedback" />
          <Card className="p-6 space-y-5">
            <div>
              <SectionLabel>Priority Badges</SectionLabel>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="urgent">Urgent</Badge>
                <Badge variant="high">High</Badge>
                <Badge variant="medium">Medium</Badge>
                <Badge variant="low">Low</Badge>
              </div>
            </div>
            <Separator />
            <div>
              <SectionLabel>Workflow Status</SectionLabel>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="backlog">Backlog</Badge>
                <Badge variant="todo">To Do</Badge>
                <Badge variant="in-progress">In Progress</Badge>
                <Badge variant="review">Review</Badge>
                <Badge variant="done">Done</Badge>
                <Badge variant="cancelled">Cancelled</Badge>
              </div>
            </div>
          </Card>
        </section>

        {/* ── TABLES & LISTS ────────────────────────────────────── */}
        <section>
          <SectionHeader icon={Table2} title="Tables & Lists" />
          <Card className="overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e1e2ec]">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#727785]">
                    Task Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#727785]">
                    Assignee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#727785]">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#727785]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#727785]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: 'Fix CSS Grid overflow issue',
                    initials: 'JD',
                    assignee: 'John Doe',
                    priority: 'high' as const,
                    status: 'in-progress' as const,
                  },
                  {
                    name: 'Update API Documentation',
                    initials: 'AS',
                    assignee: 'Anna Smith',
                    priority: 'medium' as const,
                    status: 'todo' as const,
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#e1e2ec] last:border-0 hover:bg-[#f9f9ff] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#191b23] font-medium">{row.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[9px]">{row.initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-[#424754]">{row.assignee}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={row.priority}>
                        {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={row.status}>
                        {{ 'in-progress': 'In Progress', todo: 'To Do' }[row.status] ?? row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-[#727785] hover:text-[#191b23] transition-colors p-1 rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

        {/* ── CARDS & LAYOUTS ───────────────────────────────────── */}
        <section>
          <SectionHeader icon={LayoutGrid} title="Cards & Layouts" />
          <div className="grid grid-cols-2 gap-4">
            {/* Stat card */}
            <Card className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-[#727785] uppercase tracking-wider">
                  Active Sprints
                </p>
                <TrendingUp className="h-4 w-4 text-[#006c49]" />
              </div>
              <p className="text-3xl font-bold text-[#191b23] mb-3">12</p>
              <div className="w-full h-1 bg-[#e1e2ec] rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-[#006c49] rounded-full" />
              </div>
              <p className="text-xs text-[#006c49] mt-2 font-medium">
                ↑ +2 from last week
              </p>
            </Card>

            {/* Feature card */}
            <Card className="p-0 overflow-hidden flex">
              <div className="w-[140px] shrink-0 bg-[#0d1117] flex items-center justify-center">
                <div className="grid grid-cols-3 gap-0.5 p-3 opacity-60">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3 w-3 rounded-sm"
                      style={{
                        backgroundColor: ['#00ff88', '#0066cc', '#004499', '#003377'][i % 4],
                        opacity: 0.4 + (i % 3) * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="open" className="text-[10px]">New Feature</Badge>
                  <span className="text-[10px] text-[#727785]">v2.4 Release</span>
                </div>
                <h3 className="text-sm font-semibold text-[#191b23] mb-1">
                  Advanced Velocity Insights
                </h3>
                <p className="text-xs text-[#727785] leading-4 mb-3">
                  Track your team's momentum with our new real-time velocity engine.
                  Optimized for high-performance engineering teams.
                </p>
                <button className="flex items-center gap-1 text-xs text-[#0058be] font-medium hover:underline">
                  Learn more <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </Card>

            {/* Activity card */}
            <Card className="col-span-2 hover:bg-[#f9f9ff] transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#f2f3fd] flex items-center justify-center shrink-0">
                    <GitPullRequest className="h-4 w-4 text-[#0058be]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#191b23]">Database migration</p>
                    <p className="text-xs text-[#727785]">2 hours ago • PR #104</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#727785]" />
              </div>
            </Card>
          </div>
        </section>

        {/* ── SPECIFIC CARDS ────────────────────────────────────── */}
        <section>
          <SectionHeader icon={BellRing} title="Specific Cards" />
          <div className="grid grid-cols-2 gap-4">
            {/* Task card */}
            <Card className="p-4 border-l-4 border-l-[#b75b00]">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="high">High</Badge>
                <button className="text-[#727785] hover:text-[#191b23]">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-sm font-semibold text-[#191b23] mb-1">
                Refactor Auth Service
              </h3>
              <p className="text-xs text-[#727785] leading-4 mb-4">
                Clean up the legacy JWT implementation and migrate to the new Identity provider logic.
              </p>
              <div className="flex items-center justify-between">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[9px] bg-[#2170e4]">JD</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-3 text-xs text-[#727785]">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Oct 24
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> 5
                  </span>
                </div>
              </div>
            </Card>

            {/* Ticket card */}
            <Card className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-medium text-[#727785] mb-0.5">#TKT-204</p>
                  <h3 className="text-sm font-semibold text-[#191b23]">VPN Access Request</h3>
                </div>
                <Badge variant="open">Open</Badge>
              </div>
              <div className="space-y-2 mb-4">
                {[
                  { label: 'Category', value: 'IT Support' },
                  { label: 'Requested by', value: 'Sarah L.' },
                  { label: 'Priority', value: null, badge: 'medium' as const },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="text-[#727785]">{row.label}</span>
                    {row.badge ? (
                      <Badge variant={row.badge}>
                        {row.badge.charAt(0).toUpperCase() + row.badge.slice(1)}
                      </Badge>
                    ) : (
                      <span className="font-medium text-[#191b23]">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
              <Button className="w-full" size="sm">
                View Details
              </Button>
            </Card>
          </div>
        </section>
        {/* ── DIALOGS & MODALS ──────────────────────────────────── */}
        <section>
          <SectionHeader icon={Layers} title="Dialogs & Modals" />
          <Card className="p-6">
            <p className="text-xs text-[#727785] mb-5">
              Reusable dialog built on Radix UI. Compose with{' '}
              <code className="font-mono text-[11px] bg-[#f2f3fd] px-1 py-0.5 rounded text-[#0058be]">
                DialogContent
              </code>
              ,{' '}
              <code className="font-mono text-[11px] bg-[#f2f3fd] px-1 py-0.5 rounded text-[#0058be]">
                DialogHeader
              </code>
              , and{' '}
              <code className="font-mono text-[11px] bg-[#f2f3fd] px-1 py-0.5 rounded text-[#0058be]">
                DialogFooter
              </code>{' '}
              to build any modal variant.
            </p>

            <div className="flex flex-wrap gap-3">
              {/* Default dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a new task to the current sprint. Fill in the details below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#424754] mb-1.5 block">
                        Task name
                      </label>
                      <Input placeholder="e.g. Refactor auth service" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-[#424754] mb-1.5 block">
                          Priority
                        </label>
                        <Select defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#424754] mb-1.5 block">
                          Assignee
                        </label>
                        <Select defaultValue="jd">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jd">John Doe</SelectItem>
                            <SelectItem value="as">Anna Smith</SelectItem>
                            <SelectItem value="ar">Alex Rivera</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button>Create Task</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Info dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost">
                    <Info className="h-4 w-4 mr-2" />
                    Info Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <Info className="h-4 w-4 text-[#0058be]" />
                      </div>
                      <DialogTitle>Sprint Info</DialogTitle>
                    </div>
                    <DialogDescription>
                      Sprint 14 runs from Oct 21 to Nov 4. 12 tasks are active with 3 in review.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button className="w-full">Got it</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Destructive / confirm dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Delete Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-4 w-4 text-[#ba1a1a]" />
                      </div>
                      <DialogTitle>Delete Task</DialogTitle>
                    </div>
                    <DialogDescription>
                      This action cannot be undone. The task and all associated comments will be
                      permanently removed.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive">Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#e1e2ec] pt-6 pb-4 flex items-center justify-between text-xs text-[#727785]">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#0058be]">TaskHub Design System</span>
          <span className="text-[#c2c6d6]">•</span>
          <span>v1.2.0</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-[#191b23] transition-colors">Documentation</a>
          <a href="#" className="hover:text-[#191b23] transition-colors">Release Notes</a>
          <a href="#" className="hover:text-[#191b23] transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  )
}
