import type { Project } from '../types';
import {
  getBudgetPercent,
  getBurnRate,
  getDaysLeft,
  getTotalEstimatedHours,
  getTotalActualHours,
  getHourVariance,
  getProjectedTotalHours,
} from '../utils/capacity';

interface Props {
  projects: Project[];
  onUpdateProject: (p: Project) => void;
}

function fmt(n: number) {
  return new Intl.NumberFormat('th-TH').format(Math.round(n));
}

function BudgetBar({ pct }: { pct: number }) {
  const color = pct > 85 ? '#ff5c5c' : pct > 60 ? '#f0b429' : '#00d9a3';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 6, overflow: 'hidden', minWidth: 80 }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 38, textAlign: 'right' }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export default function Finance({ projects, onUpdateProject }: Props) {
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent  = projects.reduce((s, p) => s + p.spent, 0);
  const active      = projects.filter(p => p.status !== 'Done');
  const overBudget  = projects.filter(p => getBudgetPercent(p) > 100);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>Finance Overview</h1>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Budget',  value: `฿${fmt(totalBudget)}`,  sub: `${projects.length} projects`,     color: 'var(--accent)' },
          { label: 'Total Spent',   value: `฿${fmt(totalSpent)}`,   sub: `${Math.round(totalSpent/totalBudget*100)}% of budget`, color: totalSpent/totalBudget > 0.85 ? 'var(--red)' : 'var(--green)' },
          { label: 'Remaining',     value: `฿${fmt(totalBudget - totalSpent)}`, sub: 'unspent budget',       color: 'var(--green)' },
          { label: 'Active Budget', value: `฿${fmt(active.reduce((s,p)=>s+p.budget,0))}`, sub: `${active.length} active projects`, color: 'var(--amber)' },
        ].map(kpi => (
          <div key={kpi.label} className="card">
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color, lineHeight: 1.2 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: 'var(--hint)', marginTop: 4 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {overBudget.length > 0 && (
        <div className="alert-danger">
          ⚡ {overBudget.length} project{overBudget.length > 1 ? 's' : ''} over budget: {overBudget.map(p => p.name).join(', ')}
        </div>
      )}

      {/* Per-project finance table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
          Project Budget Breakdown
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Utilization</th>
                <th>Est Hours</th>
                <th>Act Hours</th>
                <th>Burn (h/day)</th>
                <th>Projected</th>
                <th>Variance</th>
                <th>Days Left</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const budgetPct    = getBudgetPercent(p);
                const burnRate     = getBurnRate(p);
                const estHours     = getTotalEstimatedHours(p);
                const actHours     = getTotalActualHours(p);
                const projHours    = getProjectedTotalHours(p);
                const variance     = getHourVariance(p);
                const daysLeft     = getDaysLeft(p);
                const remaining    = p.budget - p.spent;

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, maxWidth: 200 }}>{p.name}</div>
                      <span className={`badge ${p.status === 'Done' ? 'badge-done' : p.status === 'In Progress' ? 'badge-inprogress' : 'badge-briefed'}`} style={{ fontSize: 10, marginTop: 2 }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 12 }}>{p.client}</td>
                    <td style={{ fontWeight: 600 }}>฿{fmt(p.budget)}</td>
                    <td style={{ color: budgetPct > 85 ? 'var(--red)' : 'var(--text)' }}>฿{fmt(p.spent)}</td>
                    <td style={{ color: remaining < 0 ? 'var(--red)' : 'var(--green)' }}>
                      {remaining < 0 ? '−' : ''}฿{fmt(Math.abs(remaining))}
                    </td>
                    <td style={{ minWidth: 140 }}><BudgetBar pct={budgetPct} /></td>
                    <td style={{ color: 'var(--accent)' }}>{estHours}h</td>
                    <td style={{ color: actHours > estHours ? 'var(--red)' : 'var(--muted)' }}>{actHours}h</td>
                    <td style={{ color: 'var(--muted)' }}>{burnRate > 0 ? burnRate.toFixed(1) : '—'}</td>
                    <td style={{ color: projHours > estHours ? 'var(--red)' : 'var(--muted)' }}>
                      {projHours > 0 ? `${Math.round(projHours)}h` : '—'}
                    </td>
                    <td style={{ color: variance >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {projHours > 0 ? `${variance >= 0 ? '+' : ''}${Math.round(variance)}h` : '—'}
                    </td>
                    <td style={{ color: daysLeft <= 3 && p.status !== 'Done' ? 'var(--red)' : 'var(--muted)' }}>
                      {p.status === 'Done' ? '✓ Done' : daysLeft <= 0 ? 'Overdue' : `${daysLeft}d`}
                    </td>
                    <td>
                      {/* Quick spent update */}
                      <button className="btn btn-sm" onClick={() => {
                        const val = prompt(`Update spent for "${p.name}" (current: ฿${fmt(p.spent)})`, String(p.spent));
                        if (val !== null && !isNaN(Number(val))) {
                          onUpdateProject({ ...p, spent: Number(val) });
                        }
                      }}>✏</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Footer totals */}
            <tfoot>
              <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 700 }}>
                <td colSpan={2}>TOTAL</td>
                <td>฿{fmt(totalBudget)}</td>
                <td>฿{fmt(totalSpent)}</td>
                <td style={{ color: totalBudget - totalSpent >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  ฿{fmt(totalBudget - totalSpent)}
                </td>
                <td colSpan={8}>{Math.round(totalSpent / totalBudget * 100)}% of total budget used</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Budget utilization breakdown */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Budget Utilization by Project</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...projects].sort((a, b) => b.budget - a.budget).map(p => {
            const pct = getBudgetPercent(p);
            const color = pct > 100 ? '#ff5c5c' : pct > 85 ? '#f0b429' : '#00d9a3';
            return (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ color: 'var(--muted)' }}>฿{fmt(p.spent)} / ฿{fmt(p.budget)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 40, textAlign: 'right' }}>{Math.round(pct)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
