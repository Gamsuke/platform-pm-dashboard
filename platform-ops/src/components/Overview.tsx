import type { Person, Project, Task } from '../types';
import type { Alert } from '../utils/capacity';
import {
  getPersonCapacity,
  getTeamLoadPercent,
  getBudgetPercent,
  getDaysLeft,
  getActualProgress,
  getExpectedProgress,
  LOAD_ZONE_COLORS,
  getLoadZone,
} from '../utils/capacity';
import { DEPARTMENTS } from '../types';

interface Props {
  persons: Person[];
  projects: Project[];
  allTasks: Task[];
  alerts: Alert[];
  onTabChange: (tab: 'projects' | 'capacity') => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('th-TH').format(Math.round(n));
}

function StatusBadge({ status }: { status: string }) {
  const cls = {
    'In Progress': 'badge-inprogress',
    'Briefed': 'badge-briefed',
    'Review': 'badge-review',
    'Done': 'badge-done',
    'On Hold': 'badge-onhold',
  }[status] ?? 'badge-briefed';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function Overview({ persons, projects, allTasks, alerts, onTabChange }: Props) {
  const active = projects.filter(p => p.status !== 'Done');
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent  = projects.reduce((s, p) => s + p.spent, 0);

  const totalCommitted = persons.reduce((s, p) => {
    return s + getPersonCapacity(p, allTasks).committedHours;
  }, 0);
  const totalAvailable = persons.reduce((s, p) => {
    return s + getPersonCapacity(p, allTasks).netAvailableHours;
  }, 0);

  const dangers  = alerts.filter(a => a.level === 'danger');
  const warnings = alerts.filter(a => a.level === 'warning');

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dangers.map(a => (
            <div key={a.id} className="alert-danger">{a.message}</div>
          ))}
          {warnings.map(a => (
            <div key={a.id} className="alert-warning">{a.message}</div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { label: 'Active Projects', value: active.length, sub: `${projects.length} total`, color: 'var(--accent)' },
          { label: 'Team Members',    value: persons.length, sub: `${DEPARTMENTS.filter(d => persons.some(p => p.department === d)).length} departments`, color: 'var(--green)' },
          { label: 'Hours Committed', value: `${Math.round(totalCommitted)}h`, sub: `of ${Math.round(totalAvailable)}h available`, color: 'var(--amber)' },
          { label: 'Total Budget',    value: `฿${fmt(totalBudget)}`, sub: `฿${fmt(totalSpent)} used (${Math.round(totalSpent/totalBudget*100)}%)`, color: 'var(--purple)' },
        ].map(kpi => (
          <div key={kpi.label} className="card">
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: 6 }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: kpi.color, lineHeight: 1.2 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--hint)', marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Project Cards */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Active Projects</h2>
            <button className="btn btn-sm" onClick={() => onTabChange('projects')}>View All →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.map(p => {
              const daysLeft   = getDaysLeft(p);
              const budgetPct  = getBudgetPercent(p);
              const actualPct  = getActualProgress(p);
              const expectedPct = getExpectedProgress(p);
              const gap        = expectedPct - actualPct;
              const gapColor   = gap > 15 ? 'var(--red)' : gap > 5 ? 'var(--amber)' : 'var(--green)';

              return (
                <div key={p.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.client}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <StatusBadge status={p.status} />
                      <span className={`badge badge-${p.priority.toLowerCase()}`}>{p.priority}</span>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                        <span>Timeline</span>
                        <span style={{ color: daysLeft <= 3 ? 'var(--red)' : 'var(--muted)' }}>
                          {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(100, expectedPct)}%`, background: daysLeft <= 3 ? 'var(--red)' : 'var(--accent)' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                        <span>Progress</span>
                        <span style={{ color: gapColor }}>
                          {Math.round(actualPct)}% {gap > 5 ? `(−${Math.round(gap)}%)` : ''}
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(100, actualPct)}%`, background: gapColor }} />
                      </div>
                    </div>
                  </div>

                  {/* Budget */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                      <span>Budget</span>
                      <span style={{ color: budgetPct > 85 ? 'var(--red)' : 'var(--muted)' }}>
                        ฿{fmt(p.spent)} / ฿{fmt(p.budget)} ({Math.round(budgetPct)}%)
                      </span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{
                        width: `${Math.min(100, budgetPct)}%`,
                        background: budgetPct > 85 ? 'var(--red)' : budgetPct > 60 ? 'var(--amber)' : 'var(--green)',
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {active.length === 0 && (
              <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
                No active projects
              </div>
            )}
          </div>
        </div>

        {/* Capacity Snapshot */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>Team Load</h2>
            <button className="btn btn-sm" onClick={() => onTabChange('capacity')}>Detail →</button>
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {DEPARTMENTS.filter(d => persons.some(p => p.department === d)).map(dept => {
                const deptPersons = persons.filter(p => p.department === dept);
                const loadPct = getTeamLoadPercent(dept, deptPersons, allTasks);
                const zone = getLoadZone(loadPct);
                const color = LOAD_ZONE_COLORS[zone];
                const spof = deptPersons.length === 1;

                return (
                  <div key={dept}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{dept}</span>
                        {spof && <span title="Single point of failure" style={{ fontSize: 10, color: 'var(--amber)' }}>⚠ SPOF</span>}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{Math.round(loadPct)}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${Math.min(100, loadPct)}%`, background: color }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--hint)', marginTop: 3 }}>
                      {deptPersons.length} person{deptPersons.length > 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
