export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

export interface TaskUser {
  id: string
  name: string
  initials: string
  color: string
}

export interface Task {
  id: string
  title: string
  projectId: string
  assigneeId: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  tags: string[]
}

export const USERS: TaskUser[] = [
  { id: 'am', name: 'Alex Morgan',   initials: 'AM', color: 'bg-primary' },
  { id: 'jd', name: 'Jordan Doe',    initials: 'JD', color: 'bg-accent' },
  { id: 'kl', name: 'Kim Lee',       initials: 'KL', color: 'bg-secondary' },
  { id: 'pr', name: 'Paula Rivera',  initials: 'PR', color: 'bg-warning' },
  { id: 'ts', name: 'Tom Santos',    initials: 'TS', color: 'bg-danger' },
  { id: 'dm', name: 'Dev Morris',    initials: 'DM', color: 'bg-primary-hover' },
]

export const INITIAL_TASKS: Task[] = [
  // TODO
  { id: 't-01', title: 'Set up CI/CD pipeline',           projectId: 'internal-system',  assigneeId: 'am', status: 'todo', priority: 'high',   dueDate: 'May 12', tags: ['DevOps'] },
  { id: 't-02', title: 'Update API documentation',         projectId: 'customer-portal',  assigneeId: 'kl', status: 'todo', priority: 'medium', dueDate: 'May 15', tags: ['Docs'] },
  { id: 't-03', title: 'User permission audit',            projectId: 'internal-system',  assigneeId: 'jd', status: 'todo', priority: 'low',    dueDate: 'May 20', tags: ['Security'] },
  { id: 't-04', title: 'Subscription upgrade flow',        projectId: 'customer-portal',  assigneeId: 'pr', status: 'todo', priority: 'medium', dueDate: 'May 18', tags: ['UX'] },
  { id: 't-05', title: 'Kafka consumer group refactor',    projectId: 'data-pipeline',    assigneeId: 'ts', status: 'todo', priority: 'high',   dueDate: 'May 22', tags: ['Backend'] },

  // IN PROGRESS
  { id: 't-06', title: 'Refactor authentication middleware', projectId: 'internal-system', assigneeId: 'am', status: 'in-progress', priority: 'urgent', dueDate: 'Today',  tags: ['Security'] },
  { id: 't-07', title: 'Invoice PDF export',                projectId: 'customer-portal',  assigneeId: 'pr', status: 'in-progress', priority: 'high',   dueDate: 'May 10', tags: ['Feature'] },
  { id: 't-08', title: 'PKCE flow implementation',          projectId: 'auth-service',     assigneeId: 'dm', status: 'in-progress', priority: 'high',   dueDate: 'May 11', tags: ['Security'] },
  { id: 't-09', title: 'Database migration scripts',        projectId: 'internal-system',  assigneeId: 'jd', status: 'in-progress', priority: 'medium', dueDate: 'May 24', tags: ['Backend'] },
  { id: 't-10', title: 'Mobile offline sync',               projectId: 'mobile-app',       assigneeId: 'kl', status: 'in-progress', priority: 'high',   dueDate: 'May 13', tags: ['Mobile'] },

  // REVIEW
  { id: 't-11', title: 'API authentication layer',          projectId: 'internal-system',  assigneeId: 'am', status: 'review', priority: 'high',   dueDate: 'May 9',  tags: ['Security'] },
  { id: 't-12', title: 'Session revocation endpoint',       projectId: 'auth-service',     assigneeId: 'dm', status: 'review', priority: 'high',   dueDate: 'May 10', tags: ['Backend'] },
  { id: 't-13', title: 'Accessibility audit fixes',         projectId: 'customer-portal',  assigneeId: 'pr', status: 'review', priority: 'medium', dueDate: 'May 14', tags: ['UX'] },
  { id: 't-14', title: 'Component token documentation',     projectId: 'design-system',    assigneeId: 'ts', status: 'review', priority: 'low',    dueDate: 'May 16', tags: ['Design'] },

  // DONE
  { id: 't-15', title: 'Login page redesign',               projectId: 'customer-portal',  assigneeId: 'pr', status: 'done', priority: 'high',   dueDate: 'May 2',  tags: ['UX'] },
  { id: 't-16', title: 'Push notification service',         projectId: 'mobile-app',       assigneeId: 'kl', status: 'done', priority: 'medium', dueDate: 'Apr 30', tags: ['Mobile'] },
  { id: 't-17', title: 'Rate limiter middleware',            projectId: 'internal-system',  assigneeId: 'am', status: 'done', priority: 'high',   dueDate: 'May 1',  tags: ['Backend'] },
  { id: 't-18', title: 'Figma token export script',         projectId: 'design-system',    assigneeId: 'ts', status: 'done', priority: 'low',    dueDate: 'Apr 28', tags: ['Design'] },
]
