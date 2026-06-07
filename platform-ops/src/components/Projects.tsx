import { useState } from 'react';
import type { Project, Task, Person, Department, TaskStatus, ProjectStatus } from '../types';
import { DEPARTMENTS, TASK_STATUSES, PROJECT_STATUSES } from '../types';
import { getProjectHoursByDept, getTotalEstimatedHours, getTotalActualHours, getBurnRate, getDaysLeft } from '../utils/capacity';

interface Props {
  projects: Project[];
  persons: Person[];
  onUpdateProject: (p: Project) => void;
  onAddTask: (projectId: string, task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (projectId: string, task: Task) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('th-TH').format(Math.round(n));
}

const STATUS_BADGE: Record<string, string> = {
  'In Progress': 'badge-inprogress',
  'Briefed': 'badge-briefed',
  'Review': 'badge-review',
  'Done': 'badge-done',
  'Blocked': 'badge-blocked',
  'On Hold': 'badge-onhold',
};

const DEPT_COLORS: Record<string, string> = {
  'AE/Strategy': '#4da6ff',
  'Creative': '#a78bfa',
  'Content': '#00d9a3',
  'Media': '#f0b429',
  'KOL': '#fb923c',
  'Production': '#60a5fa',
  'Dev': '#34d399',
  'Freelance': '#94a3b8',
};

interface TaskModalProps {
  projectId: string;
  persons: Person[];
  task?: Task;
  onSave: (t: Omit<Task, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}
function TaskModal({ projectId, persons, task, onSave, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [dept, setDept] = useState<Department>(task?.department ?? 'Creative');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '');
  const [hours, setHours] = useState(task?.estimatedHours ?? 0);
  const [actualHours, setActualHours] = useState(task?.actualHours ?? 0);
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'Briefed');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [error, setError] = useState('');

  const deptPersons = persons.filter(p => p.department === dept);

  const handleSave = () => {
    if (!title.trim()) { setError('กรุณากรอกชื่อ Task'); return; }
    if (!hours || hours <= 0) { setError('Estimated Hours ต้องมากกว่า 0 (SPEC §5.5)'); return; }
    if (!dueDate) { setError('กรุณาเลือก Due Date'); return; }
    const pid = assigneeId || deptPersons[0]?.id || '';
    onSave({ projectId, title: title.trim(), department: dept, assigneeId: pid, estimatedHours: hours, actualHours, status, dueDate });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Add Task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-field">
            <label>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field">
              <label>Department *</label>
              <select value={dept} onChange={e => { setDept(e.target.value as Department); setAssigneeId(''); }}>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Assignee</label>
              <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                <option value="">— select —</option>
                {deptPersons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Estimated Hours * <span style={{ color: 'var(--red)', fontSize: 11 }}>(required)</span></label>
              <input type="number" min={0.5} step={0.5} value={hours || ''} onChange={e => setHours(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="form-field">
              <label>Actual Hours</label>
              <input type="number" min={0} step={0.5} value={actualHours || ''} onChange={e => setActualHours(Number(e.target.value))} placeholder="0" />
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
                {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Due Date *</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          {error && <div className="alert-danger">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {task ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProjectModalProps {
  project?: Project;
  onSave: (p: Partial<Project>) => void;
  onClose: () => void;
}
function ProjectModal({ project, onSave, onClose }: ProjectModalProps) {
  const [name, setName] = useState(project?.name ?? '');
  const [client, setClient] = useState(project?.client ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'Briefed');
  const [priority, setPriority] = useState<'High'|'Med'|'Low'>(project?.priority ?? 'Med');
  const [budget, setBudget] = useState(project?.budget ?? 0);
  const [spent, setSpent] = useState(project?.spent ?? 0);
  const [startDate, setStartDate] = useState(project?.startDate ?? '');
  const [endDate, setEndDate] = useState(project?.endDate ?? '');

  const handleSave = () => {
    if (!name.trim() || !client.trim() || !startDate || !endDate) return;
    onSave({ name: name.trim(), client: client.trim(), status, priority, budget, spent, startDate, endDate });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2>{project ? 'Edit Project' : 'New Project'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-field" style={{ gridColumn: '1/-1' }}>
              <label>Project Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. NIVEA — Summer Campaign" />
            </div>
            <div className="form-field">
              <label>Client *</label>
              <input value={client} onChange={e => setClient(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
                {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as 'High'|'Med'|'Low')}>
                {['High','Med','Low'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Budget (THB)</label>
              <input type="number" min={0} value={budget || ''} onChange={e => setBudget(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label>Spent (THB)</label>
              <input type="number" min={0} value={spent || ''} onChange={e => setSpent(Number(e.target.value))} />
            </div>
            <div className="form-field">
              <label>Start Date *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-field">
              <label>End Date *</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {project ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Projects({ projects, persons, onUpdateProject, onAddTask, onUpdateTask, onDeleteTask }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(projects[0]?.id ?? null);
  const [taskModal, setTaskModal] = useState<{ open: boolean; task?: Task }>({ open: false });
  const [projModal, setProjModal] = useState<{ open: boolean; project?: Project }>({ open: false });
  const [statusFilter, setStatusFilter] = useState('');

  const selected = projects.find(p => p.id === selectedId) ?? null;
  const filtered = statusFilter ? projects.filter(p => p.status === statusFilter) : projects;

  const handleSaveTask = (t: Omit<Task, 'id' | 'createdAt'>) => {
    if (taskModal.task) {
      onUpdateTask(t.projectId, { ...taskModal.task, ...t });
    } else if (selectedId) {
      onAddTask(selectedId, t);
    }
  };

  const handleSaveProject = (data: Partial<Project>) => {
    if (projModal.project) {
      onUpdateProject({ ...projModal.project, ...data });
    } else {
      const newProj: Project = {
        id: 'p_' + Date.now(),
        name: '', client: '', status: 'Briefed', priority: 'Med',
        budget: 0, spent: 0, startDate: '', endDate: '',
        departments: [], tasks: [],
        ...data,
      };
      onUpdateProject(newProj);
      setSelectedId(newProj.id);
    }
  };

  const deptHours = selected ? getProjectHoursByDept(selected) : {};
  const totalEst  = selected ? getTotalEstimatedHours(selected) : 0;
  const totalAct  = selected ? getTotalActualHours(selected) : 0;
  const burnRate  = selected ? getBurnRate(selected) : 0;
  const daysLeft  = selected ? getDaysLeft(selected) : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 50px)', overflow: 'hidden' }}>
      {/* LEFT: Project list */}
      <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Projects ({filtered.length})</span>
            <button className="btn btn-primary btn-sm" onClick={() => setProjModal({ open: true })}>+ New</button>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '6px 8px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontSize: 12 }}
          >
            <option value="">All Status</option>
            {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            style={{
              padding: '12px 16px',
              background: selectedId === p.id ? 'rgba(77,166,255,0.08)' : 'none',
              border: 'none',
              borderLeft: `3px solid ${selectedId === p.id ? 'var(--accent)' : 'transparent'}`,
              borderBottom: '1px solid var(--border)',
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{p.client}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span className={`badge ${STATUS_BADGE[p.status]}`} style={{ fontSize: 10 }}>{p.status}</span>
              <span className={`badge badge-${p.priority.toLowerCase()}`} style={{ fontSize: 10 }}>{p.priority}</span>
              {getDaysLeft(p) <= 3 && p.status !== 'Done' && (
                <span className="badge" style={{ background: 'var(--red)', color: '#fff', fontSize: 10 }}>
                  {getDaysLeft(p) === 0 ? 'Overdue' : `${getDaysLeft(p)}d`}
                </span>
              )}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 24, color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>No projects</div>
        )}
      </div>

      {/* RIGHT: Project detail */}
      {selected ? (
        <div style={{ overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selected.name}</h1>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{selected.client}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => setProjModal({ open: true, project: selected })}>✏️ Edit</button>
            </div>
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span className={`badge ${STATUS_BADGE[selected.status]}`}>{selected.status}</span>
            <span className={`badge badge-${selected.priority.toLowerCase()}`}>{selected.priority}</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>📅 {selected.startDate} → {selected.endDate}</span>
            <span style={{ fontSize: 12, color: daysLeft <= 3 ? 'var(--red)' : 'var(--muted)' }}>
              {daysLeft <= 0 ? '⚡ Overdue' : `${daysLeft} days left`}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>💰 ฿{fmt(selected.budget)} budget</span>
            {burnRate > 0 && (
              <span style={{ fontSize: 12, color: 'var(--accent)' }}>🔥 {burnRate.toFixed(1)}h/day burn</span>
            )}
          </div>

          {/* Tasks */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600 }}>Tasks ({selected.tasks.length})</span>
              <button className="btn btn-primary btn-sm" onClick={() => setTaskModal({ open: true })}>+ Add Task</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th><th>Dept</th><th>Assignee</th>
                    <th>Est h</th><th>Act h</th><th>Status</th><th>Due</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {selected.tasks.map(t => {
                    const assignee = persons.find(p => p.id === t.assigneeId);
                    const overdue = t.dueDate < new Date().toISOString().slice(0,10) && t.status !== 'Done';
                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 500 }}>{t.title}</td>
                        <td>
                          <span style={{
                            fontSize: 11, padding: '2px 7px', borderRadius: 4,
                            background: (DEPT_COLORS[t.department] ?? '#888') + '22',
                            color: DEPT_COLORS[t.department] ?? '#888',
                          }}>{t.department}</span>
                        </td>
                        <td style={{ color: 'var(--muted)' }}>{assignee?.name ?? '—'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{t.estimatedHours}h</td>
                        <td style={{ color: t.actualHours > t.estimatedHours ? 'var(--red)' : 'var(--muted)' }}>{t.actualHours}h</td>
                        <td><span className={`badge ${STATUS_BADGE[t.status]}`}>{t.status}</span></td>
                        <td style={{ color: overdue ? 'var(--red)' : 'var(--muted)' }}>{t.dueDate}</td>
                        <td>
                          <button className="btn btn-sm" onClick={() => setTaskModal({ open: true, task: t })}>✏</button>
                          <button className="btn btn-sm btn-danger" style={{ marginLeft: 4 }} onClick={() => {
                            if (confirm(`Delete "${t.title}"?`)) onDeleteTask(selected.id, t.id);
                          }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                  {selected.tasks.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No tasks yet — add one above</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Man-hour breakdown by dept */}
          {Object.keys(deptHours).length > 0 && (
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 14 }}>Man-Hour Breakdown by Department</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(deptHours).sort((a, b) => b[1] - a[1]).map(([dept, hrs]) => {
                  const pct = totalEst > 0 ? (hrs / totalEst) * 100 : 0;
                  const color = DEPT_COLORS[dept] ?? '#888';
                  return (
                    <div key={dept}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                          {dept}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {hrs}h <span style={{ color: 'var(--hint)' }}>({Math.round(pct)}%)</span>
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>Total</span>
                  <span>
                    Est: <b>{totalEst}h</b>
                    <span style={{ margin: '0 8px', color: 'var(--hint)' }}>|</span>
                    Act: <b style={{ color: totalAct > totalEst ? 'var(--red)' : 'var(--green)' }}>{totalAct}h</b>
                    {burnRate > 0 && <span style={{ color: 'var(--muted)', marginLeft: 8 }}>@ {burnRate.toFixed(1)}h/day</span>}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
          Select a project from the list
        </div>
      )}

      {taskModal.open && selectedId && (
        <TaskModal
          projectId={selectedId}
          persons={persons}
          task={taskModal.task}
          onSave={handleSaveTask}
          onClose={() => setTaskModal({ open: false })}
        />
      )}
      {projModal.open && (
        <ProjectModal
          project={projModal.project}
          onSave={handleSaveProject}
          onClose={() => setProjModal({ open: false })}
        />
      )}
    </div>
  );
}
