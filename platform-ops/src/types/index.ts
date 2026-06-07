// Platform Group Agency PM — Type Definitions
// Matches SPEC.md Section 2 exactly

export type Department =
  | 'AE/Strategy'
  | 'Creative'
  | 'Content'
  | 'Media'
  | 'KOL'
  | 'Production'
  | 'Dev'
  | 'Freelance';

export const DEPARTMENTS: Department[] = [
  'AE/Strategy',
  'Creative',
  'Content',
  'Media',
  'KOL',
  'Production',
  'Dev',
  'Freelance',
];

export type TaskStatus = 'Briefed' | 'In Progress' | 'Review' | 'Done' | 'Blocked';
export const TASK_STATUSES: TaskStatus[] = ['Briefed', 'In Progress', 'Review', 'Done', 'Blocked'];

export type ProjectStatus = 'Briefed' | 'In Progress' | 'Review' | 'Done' | 'On Hold';
export const PROJECT_STATUSES: ProjectStatus[] = ['Briefed', 'In Progress', 'Review', 'Done', 'On Hold'];

export interface Person {
  id: string;
  name: string;
  role: string;
  department: Department;
  workHoursPerWeek: number; // default 45
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  department: Department;
  assigneeId: string;
  estimatedHours: number;
  actualHours: number;
  status: TaskStatus;
  dueDate: string;   // ISO date
  createdAt: string; // ISO date
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  priority: 'High' | 'Med' | 'Low';
  budget: number;   // THB
  spent: number;    // THB
  startDate: string; // ISO date
  endDate: string;   // ISO date
  departments: Department[];
  tasks: Task[];
}
