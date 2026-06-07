/**
 * capacity.ts
 * Pure calculation functions for man-hour capacity management.
 * No side effects. No imports from React or UI layers.
 * Claude Code: place this in src/utils/capacity.ts
 */

import { OPS_OVERHEAD } from '../data/opsOverhead';
import { TRAINING } from '../data/training';
import type { Person, Task, Project, Department } from '../types';

const WORK_HOURS_PER_WEEK = 45;
const PERSONAL_BUFFER_PCT = 0.05;
const SAFE_CAPACITY_PCT   = 0.80;
const SPRINT_DAYS         = 14;

// ─────────────────────────────────────────────
// PERSON LEVEL
// ─────────────────────────────────────────────

export function getOpsHours(department: Department): number {
  return OPS_OVERHEAD[department].hoursPerWeek;
}

export function getTrainingHoursPerWeek(department: Department): number {
  return TRAINING[department].totalMonthlyHours / 4.33;
}

export function getPersonalBufferHours(workHoursPerWeek: number): number {
  return workHoursPerWeek * PERSONAL_BUFFER_PCT;
}

export function getNetAvailableHours(person: Person): number {
  const ops      = getOpsHours(person.department);
  const training = getTrainingHoursPerWeek(person.department);
  const buffer   = getPersonalBufferHours(person.workHoursPerWeek);
  return person.workHoursPerWeek - ops - training - buffer;
}

export function getSafeCapacityHours(person: Person): number {
  return getNetAvailableHours(person) * SAFE_CAPACITY_PCT;
}

export function getCommittedHours(personId: string, activeTasks: Task[]): number {
  return activeTasks
    .filter(t => t.assigneeId === personId && t.status !== 'Done')
    .reduce((sum, t) => sum + t.estimatedHours, 0);
}

export function getLoadPercent(person: Person, activeTasks: Task[]): number {
  const net       = getNetAvailableHours(person);
  const committed = getCommittedHours(person.id, activeTasks);
  return (committed / net) * 100;
}

export function getBufferHours(person: Person, activeTasks: Task[]): number {
  const net       = getNetAvailableHours(person);
  const committed = getCommittedHours(person.id, activeTasks);
  return net - committed;
}

export type LoadZone = 'comfortable' | 'healthy' | 'at-risk' | 'overloaded';

export function getLoadZone(loadPercent: number): LoadZone {
  if (loadPercent < 60)  return 'comfortable';
  if (loadPercent < 80)  return 'healthy';
  if (loadPercent < 95)  return 'at-risk';
  return 'overloaded';
}

export const LOAD_ZONE_COLORS: Record<LoadZone, string> = {
  comfortable: '#4da6ff',
  healthy:     '#00d9a3',
  'at-risk':   '#f0b429',
  overloaded:  '#ff5c5c',
};

/** Full computed snapshot for one person */
export function getPersonCapacity(person: Person, activeTasks: Task[]) {
  const opsHours             = getOpsHours(person.department);
  const trainingHoursPerWeek = getTrainingHoursPerWeek(person.department);
  const personalBuffer       = getPersonalBufferHours(person.workHoursPerWeek);
  const netAvailableHours    = getNetAvailableHours(person);
  const safeCapacityHours    = getSafeCapacityHours(person);
  const committedHours       = getCommittedHours(person.id, activeTasks);
  const bufferHours          = getBufferHours(person, activeTasks);
  const loadPercent          = getLoadPercent(person, activeTasks);
  const loadZone             = getLoadZone(loadPercent);
  const isOverSafeCapacity   = committedHours > safeCapacityHours;
  const overloadBy           = Math.max(0, committedHours - netAvailableHours);

  return {
    person,
    opsHours,
    trainingHoursPerWeek,
    personalBuffer,
    netAvailableHours,
    safeCapacityHours,
    committedHours,
    bufferHours,
    loadPercent,
    loadZone,
    isOverSafeCapacity,
    overloadBy,
  };
}

// ─────────────────────────────────────────────
// TEAM LEVEL
// ─────────────────────────────────────────────

export function getTeamCapacityPool(persons: Person[]): number {
  return persons.reduce((sum, p) => sum + getNetAvailableHours(p), 0);
}

export function getTeamCommittedHours(dept: Department, activeTasks: Task[]): number {
  return activeTasks
    .filter(t => t.department === dept && t.status !== 'Done')
    .reduce((sum, t) => sum + t.estimatedHours, 0);
}

export function getTeamLoadPercent(
  dept: Department,
  persons: Person[],
  activeTasks: Task[]
): number {
  const pool      = getTeamCapacityPool(persons.filter(p => p.department === dept));
  const committed = getTeamCommittedHours(dept, activeTasks);
  if (pool === 0) return 0;
  return (committed / pool) * 100;
}

/** Detect if a department has a single person doing unique work = single point of failure */
export function isSinglePointOfFailure(dept: Department, persons: Person[]): boolean {
  return persons.filter(p => p.department === dept).length === 1;
}

// ─────────────────────────────────────────────
// PROJECT LEVEL
// ─────────────────────────────────────────────

export function getTotalEstimatedHours(project: Project): number {
  return project.tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
}

export function getTotalActualHours(project: Project): number {
  return project.tasks.reduce((sum, t) => sum + t.actualHours, 0);
}

export function getDaysElapsed(project: Project): number {
  const start = new Date(project.startDate).getTime();
  const today = new Date().getTime();
  return Math.max(0, Math.floor((today - start) / 86_400_000));
}

export function getDaysLeft(project: Project): number {
  const end   = new Date(project.endDate).getTime();
  const today = new Date().getTime();
  return Math.max(0, Math.ceil((end - today) / 86_400_000));
}

export function getTotalDays(project: Project): number {
  const start = new Date(project.startDate).getTime();
  const end   = new Date(project.endDate).getTime();
  return Math.ceil((end - start) / 86_400_000);
}

export function getTimelinePercent(project: Project): number {
  const total   = getTotalDays(project);
  const elapsed = getDaysElapsed(project);
  if (total === 0) return 100;
  return Math.min(100, (elapsed / total) * 100);
}

export function getBudgetPercent(project: Project): number {
  if (project.budget === 0) return 0;
  return (project.spent / project.budget) * 100;
}

export function getBurnRate(project: Project): number {
  const elapsed = getDaysElapsed(project);
  if (elapsed === 0) return 0;
  return getTotalActualHours(project) / elapsed;  // hours per day
}

export function getProjectedTotalHours(project: Project): number {
  const totalDays = getTotalDays(project);
  return getBurnRate(project) * totalDays;
}

export function getHourVariance(project: Project): number {
  return getTotalEstimatedHours(project) - getProjectedTotalHours(project);
  // positive = under budget hours, negative = will exceed
}

export function getExpectedProgress(project: Project): number {
  return getTimelinePercent(project);
}

export function getActualProgress(project: Project): number {
  const estimated = getTotalEstimatedHours(project);
  if (estimated === 0) return 0;
  return (getTotalActualHours(project) / estimated) * 100;
}

export function getProgressGap(project: Project): number {
  return getExpectedProgress(project) - getActualProgress(project);
  // positive gap = behind schedule
}

export type ProgressStatus = 'on-track' | 'warning' | 'at-risk';

export function getProgressStatus(project: Project): ProgressStatus {
  const gap = getProgressGap(project);
  if (gap <= 5)  return 'on-track';
  if (gap <= 15) return 'warning';
  return 'at-risk';
}

/** Hours breakdown per department within a project */
export function getProjectHoursByDept(project: Project): Record<string, number> {
  const result: Record<string, number> = {};
  for (const task of project.tasks) {
    result[task.department] = (result[task.department] ?? 0) + task.estimatedHours;
  }
  return result;
}

// ─────────────────────────────────────────────
// STAFFING ESTIMATE (for new brief intake)
// ─────────────────────────────────────────────

const DEPT_ALLOCATION_DEFAULT: Partial<Record<Department, number>> = {
  'AE/Strategy': 0.25,
  'Creative':    0.30,
  'Content':     0.20,
  'Media':       0.15,
  'KOL':         0.10,
};

export function estimateStaffingNeeds(
  totalHours: number,
  durationDays: number,
  persons: Person[],
  activeTasks: Task[],
  allocation = DEPT_ALLOCATION_DEFAULT
): Array<{
  department: Department;
  requiredHoursPerDay: number;
  availableHoursPerDay: number;
  needsFreelance: boolean;
}> {
  return (Object.entries(allocation) as [Department, number][]).map(([dept, pct]) => {
    const deptHours            = totalHours * pct;
    const requiredHoursPerDay  = deptHours / durationDays;
    const deptPersons          = persons.filter(p => p.department === dept);
    const totalBufferPerDay    = deptPersons.reduce((sum, p) => {
      return sum + getBufferHours(p, activeTasks) / 5; // week → day
    }, 0);
    return {
      department: dept,
      requiredHoursPerDay,
      availableHoursPerDay: totalBufferPerDay,
      needsFreelance: totalBufferPerDay < requiredHoursPerDay,
    };
  });
}

// ─────────────────────────────────────────────
// ALERT GENERATION
// ─────────────────────────────────────────────

export type AlertLevel = 'info' | 'warning' | 'danger';

export interface Alert {
  id: string;
  level: AlertLevel;
  message: string;
  entityType: 'person' | 'project' | 'team';
  entityId: string;
}

export function generateAlerts(
  persons: Person[],
  projects: Project[],
  allTasks: Task[]
): Alert[] {
  const alerts: Alert[] = [];

  // Person alerts
  for (const person of persons) {
    const load = getLoadPercent(person, allTasks);
    const buffer = getBufferHours(person, allTasks);

    if (load >= 95) {
      alerts.push({
        id: `person-overload-${person.id}`,
        level: 'danger',
        message: `⚡ ${person.name} Overloaded (${Math.round(load)}%) — ควรย้ายงานหรือลด scope ทันที`,
        entityType: 'person',
        entityId: person.id,
      });
    } else if (load >= 80) {
      alerts.push({
        id: `person-risk-${person.id}`,
        level: 'warning',
        message: `⚠ ${person.name} Buffer เหลือแค่ ${buffer.toFixed(1)}h — ระวังงานใหม่`,
        entityType: 'person',
        entityId: person.id,
      });
    }
  }

  // Project alerts
  for (const project of projects) {
    if (project.status === 'Done') continue;

    const gap      = getProgressGap(project);
    const budgetPct = getBudgetPercent(project);
    const daysLeft = getDaysLeft(project);

    if (gap > 15) {
      alerts.push({
        id: `project-progress-${project.id}`,
        level: 'danger',
        message: `🔴 ${project.name} — งานล่าช้ากว่าแผน ${Math.round(gap)}%`,
        entityType: 'project',
        entityId: project.id,
      });
    } else if (gap > 5) {
      alerts.push({
        id: `project-warning-${project.id}`,
        level: 'warning',
        message: `⚠ ${project.name} — เริ่มล่าช้า gap ${Math.round(gap)}%`,
        entityType: 'project',
        entityId: project.id,
      });
    }

    if (budgetPct > 85) {
      alerts.push({
        id: `project-budget-${project.id}`,
        level: 'warning',
        message: `⚠ ${project.name} — ใช้งบไปแล้ว ${Math.round(budgetPct)}%`,
        entityType: 'project',
        entityId: project.id,
      });
    }

    if (daysLeft <= 3 && project.status !== 'Done') {
      alerts.push({
        id: `project-deadline-${project.id}`,
        level: 'danger',
        message: `⚡ ${project.name} — เหลือ ${daysLeft} วัน`,
        entityType: 'project',
        entityId: project.id,
      });
    }
  }

  return alerts;
}
