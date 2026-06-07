import { useState } from 'react';
import type { Task, Person, Project } from '../types';
import { DEPARTMENTS, TASK_STATUSES } from '../types';

interface Props {
  projects: Project[];
  persons: Person[];
}

const STATUS_BADGE: Record<string, string> = {
  'In Progress': 'badge-inprogress',
  'Briefed': 'badge-briefed',
  'Review': 'badge-review',
  'Done': 'badge-done',
  'Blocked': 'badge-blocked',
};

const DEPT_COLORS: Record<string, string> = {
  'AE/Strategy': '#4da6ff', 'Creative': '#a78bfa', 'Content': '#00d9a3',
  'Media': '#f0b429', 'KOL': '#fb923c', 'Production': '#60a5fa',
  'Dev': '#34d399', 'Freelance': '#94a3b8',
};

export default function AllTasks({ projects, persons }: Props) {
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [search, setSearch] = useState('');

  const allTasks: (Task & { projectName: string })[] = projects.flatMap(p =>
    p.tasks.map(t => ({ ...t, projectName: p.name }))
  );

  const filtered = allTasks.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (deptFilter && t.department !== deptFilter) return false;
    if (assigneeFilter && t.assigneeId !== assigneeFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.projectName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCommitted = filtered.filter(t => t.status !== 'Done').reduce((s, t) => s + t.estimatedHours, 0);
  const totalActual    = filtered.reduce((s, t) => s + t.actualHours, 0);

  const today = new Date().toISOString().slice(0,10);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>All Tasks</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted)' }}>
            <span>Committed: <b style={{ color: 'var(--amber)' }}>{totalCommitted}h</b></span>
            <span>Actual: <b style={{ color: 'var(--green)' }}>{totalActual}h</b></span>
            <span>Showing: <b style={{ color: 'var(--text)' }}>{filtered.length}</b> / {allTasks.length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search task or project…"
          style={{ padding: '7px 12px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 13, minWidth: 220 }}
        />
        {[
          { label: 'All Status', val: statusFilter, set: setStatusFilter, options: TASK_STATUSES },
          { label: 'All Depts', val: deptFilter, set: setDeptFilter, options: DEPARTMENTS },
        ].map(({ label, val, set, options }) => (
          <select
            key={label}
            value={val}
            onChange={e => set(e.target.value)}
            style={{ padding: '7px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}
          >
            <option value="">{label}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <select
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value)}
          style={{ padding: '7px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}
        >
          <option value="">All Assignees</option>
          {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(statusFilter || deptFilter || assigneeFilter || search) && (
          <button className="btn btn-sm" onClick={() => { setStatusFilter(''); setDeptFilter(''); setAssigneeFilter(''); setSearch(''); }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th><th>Project</th><th>Dept</th><th>Assignee</th>
                <th>Est h</th><th>Act h</th><th>Status</th><th>Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const assignee = persons.find(p => p.id === t.assigneeId);
                const overdue = t.dueDate < today && t.status !== 'Done';
                const color = DEPT_COLORS[t.department] ?? '#888';
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500, maxWidth: 240 }}>{t.title}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 12, maxWidth: 180 }}>{t.projectName}</td>
                    <td>
                      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: color + '22', color }}>
                        {t.department}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{assignee?.name ?? '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{t.estimatedHours}h</td>
                    <td style={{ color: t.actualHours > t.estimatedHours ? 'var(--red)' : 'var(--muted)' }}>
                      {t.actualHours}h
                      {t.status === 'Done' && t.actualHours > 0 && (
                        <span style={{ fontSize: 10, color: t.actualHours <= t.estimatedHours ? 'var(--green)' : 'var(--red)', marginLeft: 4 }}>
                          {t.actualHours <= t.estimatedHours ? '✓' : `+${t.actualHours - t.estimatedHours}h`}
                        </span>
                      )}
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[t.status] ?? 'badge-briefed'}`}>{t.status}</span></td>
                    <td style={{ color: overdue ? 'var(--red)' : 'var(--muted)', fontSize: 12 }}>
                      {overdue ? '⚡ ' : ''}{t.dueDate}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
                    No tasks match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status breakdown */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {TASK_STATUSES.map(s => {
          const cnt = allTasks.filter(t => t.status === s).length;
          const cls = STATUS_BADGE[s] ?? 'badge-briefed';
          return cnt > 0 ? (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`badge ${cls}`}
              style={{ cursor: 'pointer', padding: '5px 12px', border: `1px solid ${statusFilter === s ? 'currentColor' : 'transparent'}` }}
            >
              {s} ({cnt})
            </button>
          ) : null;
        })}
      </div>
    </div>
  );
}
