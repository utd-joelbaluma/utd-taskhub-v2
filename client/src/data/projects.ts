export type ProjectStatus = 'in-progress' | 'completed' | 'on-hold' | 'planning'

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  description: string
  tasksCompleted: number
  tasksTotal: number
  sprint: string
  sprintEnds: string
  sprintVelocity: string
  team: { initials: string; color: string }[]
  tags: string[]
}

export const PROJECTS: Project[] = [
  {
    id: 'internal-system',
    name: 'Internal System',
    status: 'in-progress',
    description:
      'Core architectural redesign and backend optimization for the centralized management platform. Focused on scaling microservices and improving latency.',
    tasksCompleted: 12,
    tasksTotal: 48,
    sprint: 'Sprint 24 Delta',
    sprintEnds: 'Sept 24, 2024',
    sprintVelocity: '12% higher than previous sprint',
    team: [
      { initials: 'AM', color: 'bg-primary' },
      { initials: 'JD', color: 'bg-accent' },
      { initials: 'KL', color: 'bg-secondary' },
      { initials: 'SR', color: 'bg-warning' },
    ],
    tags: ['Backend', 'Infrastructure'],
  },
  {
    id: 'customer-portal',
    name: 'Customer Portal',
    status: 'in-progress',
    description:
      'Self-service portal for customers to manage subscriptions, view invoices, and submit support requests. Built on a modern React stack.',
    tasksCompleted: 29,
    tasksTotal: 60,
    sprint: 'Sprint 11 Beta',
    sprintEnds: 'Oct 2, 2024',
    sprintVelocity: '5% higher than previous sprint',
    team: [
      { initials: 'PR', color: 'bg-primary' },
      { initials: 'TS', color: 'bg-secondary' },
      { initials: 'MN', color: 'bg-accent' },
    ],
    tags: ['Frontend', 'UX'],
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline v2',
    status: 'planning',
    description:
      'Next-generation ETL pipeline replacing legacy batch jobs with real-time streaming using Kafka and dbt.',
    tasksCompleted: 3,
    tasksTotal: 34,
    sprint: 'Sprint 1 Alpha',
    sprintEnds: 'Oct 14, 2024',
    sprintVelocity: 'N/A — first sprint',
    team: [
      { initials: 'AL', color: 'bg-primary' },
      { initials: 'BK', color: 'bg-warning' },
    ],
    tags: ['Data', 'Backend'],
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    status: 'completed',
    description:
      'React Native companion app for iOS and Android. Covers task management, notifications, and offline sync.',
    tasksCompleted: 52,
    tasksTotal: 52,
    sprint: 'Sprint 18 Final',
    sprintEnds: 'Aug 30, 2024',
    sprintVelocity: '8% higher than previous sprint',
    team: [
      { initials: 'JL', color: 'bg-secondary' },
      { initials: 'RC', color: 'bg-primary' },
      { initials: 'FD', color: 'bg-accent' },
      { initials: 'GH', color: 'bg-warning' },
    ],
    tags: ['Mobile', 'iOS', 'Android'],
  },
  {
    id: 'design-system',
    name: 'Design System',
    status: 'on-hold',
    description:
      'Centralised component library and Figma token system. On hold while the brand refresh is finalised.',
    tasksCompleted: 18,
    tasksTotal: 40,
    sprint: 'Sprint 7 Gamma',
    sprintEnds: 'TBD',
    sprintVelocity: 'Paused',
    team: [
      { initials: 'YK', color: 'bg-accent' },
      { initials: 'NP', color: 'bg-primary' },
    ],
    tags: ['Design', 'Frontend'],
  },
  {
    id: 'auth-service',
    name: 'Auth Service Rewrite',
    status: 'in-progress',
    description:
      'Full rewrite of authentication and authorisation layer. Migrating from legacy sessions to OAuth 2.0 + PKCE with MFA support.',
    tasksCompleted: 7,
    tasksTotal: 22,
    sprint: 'Sprint 3 Epsilon',
    sprintEnds: 'Oct 10, 2024',
    sprintVelocity: '3% higher than previous sprint',
    team: [
      { initials: 'DM', color: 'bg-danger' },
      { initials: 'CB', color: 'bg-primary' },
      { initials: 'EW', color: 'bg-secondary' },
    ],
    tags: ['Security', 'Backend'],
  },
]

export const CRITICAL_TASKS: Record<string, { id: string; name: string; priority: 'high' | 'medium' | 'low' | 'done'; status: 'review' | 'done' | 'todo' | 'in-progress'; ownerInitials: string; ownerColor: string }[]> = {
  'internal-system': [
    { id: 'TH-102', name: 'API Authentication Layer',   priority: 'high',   status: 'review',      ownerInitials: 'AM', ownerColor: 'bg-primary' },
    { id: 'TH-105', name: 'Database Migration Script',  priority: 'done',   status: 'done',        ownerInitials: 'JD', ownerColor: 'bg-accent' },
    { id: 'TH-112', name: 'User Permission Audit',      priority: 'low',    status: 'todo',        ownerInitials: 'KL', ownerColor: 'bg-secondary' },
  ],
  'customer-portal': [
    { id: 'TH-201', name: 'Invoice PDF Export',         priority: 'high',   status: 'in-progress', ownerInitials: 'PR', ownerColor: 'bg-primary' },
    { id: 'TH-208', name: 'Subscription Upgrade Flow',  priority: 'medium', status: 'todo',        ownerInitials: 'TS', ownerColor: 'bg-secondary' },
    { id: 'TH-215', name: 'Accessibility Audit',        priority: 'low',    status: 'todo',        ownerInitials: 'MN', ownerColor: 'bg-accent' },
  ],
  'auth-service': [
    { id: 'TH-301', name: 'PKCE Flow Implementation',   priority: 'high',   status: 'in-progress', ownerInitials: 'DM', ownerColor: 'bg-danger' },
    { id: 'TH-305', name: 'MFA Enrollment Screen',      priority: 'medium', status: 'todo',        ownerInitials: 'CB', ownerColor: 'bg-primary' },
    { id: 'TH-310', name: 'Session Revocation Endpoint',priority: 'high',   status: 'review',      ownerInitials: 'EW', ownerColor: 'bg-secondary' },
  ],
}

export const ACTIVITY: Record<string, { icon: string; actor: string; action: string; link?: string; linkLabel?: string; quote?: string; time: string }[]> = {
  'internal-system': [
    { icon: 'check',    actor: 'Alex Morgan',  action: 'completed',              link: '/projects/internal-system', linkLabel: 'TH-105: Database Migration', time: '2 hours ago' },
    { icon: 'comment',  actor: 'Jordan Doe',   action: 'commented on',           link: '/projects/internal-system', linkLabel: 'API Layer', quote: '"The schema needs to be updated before we can merge this pull request."', time: '5 hours ago' },
    { icon: 'users',    actor: 'System',       action: 'added 3 new members to the project', time: 'Yesterday' },
    { icon: 'edit',     actor: 'Kim Lee',      action: 'updated the project description', time: 'Yesterday' },
  ],
  'customer-portal': [
    { icon: 'check',   actor: 'Paula R.',      action: 'completed',              link: '/projects/customer-portal', linkLabel: 'TH-199: Login Redesign', time: '1 hour ago' },
    { icon: 'comment', actor: 'Tom S.',        action: 'commented on',           link: '/projects/customer-portal', linkLabel: 'Invoice Export', quote: '"Waiting on the PDF library license."', time: '3 hours ago' },
    { icon: 'users',   actor: 'System',        action: 'added 1 new member to the project', time: 'Yesterday' },
  ],
}
