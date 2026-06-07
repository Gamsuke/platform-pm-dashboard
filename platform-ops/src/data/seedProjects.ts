// SPEC.md Section 4.4 — Seed Project Data
import type { Project } from '../types';

export const SEED_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'NIVEA MEN — Summer Campaign',
    client: 'Beiersdorf',
    status: 'In Progress',
    priority: 'High',
    budget: 850000,
    spent: 340000,
    startDate: '2026-05-12',
    endDate: '2026-05-26',
    departments: ['AE/Strategy', 'Creative', 'Content', 'Media'],
    tasks: [
      { id: 't1', projectId: 'p1', title: 'Campaign concept deck',    department: 'Creative', assigneeId: 'u2', estimatedHours: 16, actualHours: 16, status: 'Done',        dueDate: '2026-05-24', createdAt: '2026-05-12' },
      { id: 't2', projectId: 'p1', title: 'Social content 12 posts',  department: 'Content',  assigneeId: 'u3', estimatedHours: 20, actualHours: 12, status: 'In Progress', dueDate: '2026-05-28', createdAt: '2026-05-12' },
      { id: 't3', projectId: 'p1', title: 'Media plan Q3',            department: 'Media',    assigneeId: 'u4', estimatedHours: 12, actualHours: 10, status: 'Review',      dueDate: '2026-05-27', createdAt: '2026-05-12' },
      { id: 't4', projectId: 'p1', title: 'Influencer shortlist',     department: 'KOL',      assigneeId: 'u5', estimatedHours: 8,  actualHours: 0,  status: 'Briefed',     dueDate: '2026-05-30', createdAt: '2026-05-12' },
    ],
  },
  {
    id: 'p2',
    name: 'กยศ. PR Contract M3',
    client: 'Student Loan Fund',
    status: 'In Progress',
    priority: 'High',
    budget: 7540000,
    spent: 2100000,
    startDate: '2026-05-12',
    endDate: '2026-05-26',
    departments: ['AE/Strategy', 'Content', 'KOL', 'Production'],
    tasks: [
      { id: 't5', projectId: 'p2', title: 'Press release batch 2',  department: 'Content',     assigneeId: 'u3', estimatedHours: 10, actualHours: 5,  status: 'In Progress', dueDate: '2026-05-27', createdAt: '2026-05-12' },
      { id: 't6', projectId: 'p2', title: 'Monthly report deck',    department: 'AE/Strategy', assigneeId: 'u1', estimatedHours: 14, actualHours: 11, status: 'Review',      dueDate: '2026-05-26', createdAt: '2026-05-12' },
      { id: 't7', projectId: 'p2', title: 'Video production brief', department: 'Production',  assigneeId: 'u6', estimatedHours: 18, actualHours: 0,  status: 'Briefed',     dueDate: '2026-05-31', createdAt: '2026-05-12' },
      { id: 't8', projectId: 'p2', title: 'KOL seeding plan',       department: 'KOL',         assigneeId: 'u5', estimatedHours: 6,  actualHours: 6,  status: 'Done',        dueDate: '2026-05-22', createdAt: '2026-05-12' },
    ],
  },
  {
    id: 'p3',
    name: 'Thai Oil — Brand Awareness',
    client: 'Thai Oil',
    status: 'Briefed',
    priority: 'Med',
    budget: 1200000,
    spent: 80000,
    startDate: '2026-05-25',
    endDate: '2026-06-08',
    departments: ['AE/Strategy', 'Creative', 'Media'],
    tasks: [
      { id: 't9',  projectId: 'p3', title: 'Kickoff meeting',        department: 'AE/Strategy', assigneeId: 'u1', estimatedHours: 3,  actualHours: 3, status: 'Done',    dueDate: '2026-05-25', createdAt: '2026-05-25' },
      { id: 't10', projectId: 'p3', title: 'Brand audit deck',       department: 'Creative',    assigneeId: 'u2', estimatedHours: 20, actualHours: 0, status: 'Briefed', dueDate: '2026-06-02', createdAt: '2026-05-25' },
      { id: 't11', projectId: 'p3', title: 'Media landscape report', department: 'Media',       assigneeId: 'u4', estimatedHours: 16, actualHours: 0, status: 'Briefed', dueDate: '2026-06-03', createdAt: '2026-05-25' },
    ],
  },
];
