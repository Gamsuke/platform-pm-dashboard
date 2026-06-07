import type { Person } from '../types';
import { DEPARTMENTS } from '../types';
import { TRAINING } from '../data/training';
import { OPS_OVERHEAD } from '../data/opsOverhead';

interface Props {
  persons: Person[];
}

const WORK_HOURS = 45;

export default function Training({ persons }: Props) {
  const activeDepts = DEPARTMENTS.filter(d => persons.some(p => p.department === d));

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Training Allocation</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          T1 = AI Foundation (mandatory all staff · Platform KPI) &nbsp;|&nbsp;
          T2 = Department-specific &nbsp;|&nbsp; T3 = Leadership
        </p>
      </div>

      {/* Main allocation table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>T1 Mandatory</th>
                <th>T2 Department</th>
                <th>T3 Leadership</th>
                <th>Total/month</th>
                <th>Per week</th>
                <th>% of work hrs</th>
                <th>Ops/week</th>
                <th>Total overhead</th>
                <th>⚠ Flag</th>
              </tr>
            </thead>
            <tbody>
              {activeDepts.map(dept => {
                const t = TRAINING[dept];
                const ops = OPS_OVERHEAD[dept].hoursPerWeek;
                const trainingPerWeek = t.totalMonthlyHours / 4.33;
                const overheadPct = ((ops + trainingPerWeek) / WORK_HOURS) * 100;
                const flag = overheadPct > 15;
                const members = persons.filter(p => p.department === dept);

                return (
                  <tr key={dept}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{dept}</div>
                      <div style={{ fontSize: 11, color: 'var(--hint)' }}>{members.length} member{members.length > 1 ? 's' : ''}</div>
                    </td>
                    <td style={{ color: '#4da6ff' }}>{t.tier1_mandatory}h</td>
                    <td style={{ color: '#a78bfa' }}>{t.tier2_department}h</td>
                    <td style={{ color: '#00d9a3' }}>{t.tier3_leadership}h</td>
                    <td style={{ fontWeight: 700 }}>{t.totalMonthlyHours}h</td>
                    <td style={{ fontWeight: 600, color: '#a78bfa' }}>{trainingPerWeek.toFixed(1)}h</td>
                    <td style={{ color: overheadPct > 15 ? 'var(--red)' : 'var(--muted)' }}>
                      {((trainingPerWeek / WORK_HOURS) * 100).toFixed(1)}%
                    </td>
                    <td style={{ color: 'var(--amber)' }}>{ops}h</td>
                    <td>
                      <span style={{ fontWeight: 700, color: flag ? 'var(--red)' : 'var(--green)' }}>
                        {overheadPct.toFixed(1)}%
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--hint)', marginLeft: 4 }}>
                        ({(ops + trainingPerWeek).toFixed(1)}h)
                      </span>
                    </td>
                    <td>{flag && <span title="Overhead > 15% — review recommended" style={{ color: 'var(--red)' }}>⚠ Review</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-person training impact */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Capacity Impact per Person</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {activeDepts.map(dept => {
            const t = TRAINING[dept];
            const ops = OPS_OVERHEAD[dept].hoursPerWeek;
            const trainingPerWeek = t.totalMonthlyHours / 4.33;
            const personalBuffer = WORK_HOURS * 0.05;
            const netAvailable = WORK_HOURS - ops - trainingPerWeek - personalBuffer;
            const members = persons.filter(p => p.department === dept);

            return (
              <div key={dept} className="card">
                <div style={{ fontWeight: 600, marginBottom: 12 }}>{dept}</div>

                {/* Stacked bar */}
                <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                  {[
                    { pct: (ops / WORK_HOURS) * 100, color: '#f0b429', label: 'Ops' },
                    { pct: (trainingPerWeek / WORK_HOURS) * 100, color: '#a78bfa', label: 'Training' },
                    { pct: (personalBuffer / WORK_HOURS) * 100, color: '#6e7681', label: 'Buffer' },
                    { pct: (netAvailable / WORK_HOURS) * 100, color: '#00d9a3', label: 'Net Available' },
                  ].map(s => (
                    <div key={s.label} title={`${s.label}: ${s.pct.toFixed(1)}%`} style={{ width: `${s.pct}%`, background: s.color }} />
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Work hours/week</span>
                    <span>{WORK_HOURS}h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--amber)' }}>− Ops overhead</span>
                    <span>{ops}h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#a78bfa' }}>− Training/week</span>
                    <span>{trainingPerWeek.toFixed(1)}h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--hint)' }}>− Personal buffer (5%)</span>
                    <span>{personalBuffer.toFixed(1)}h</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 5, marginTop: 3 }}>
                    <span style={{ color: 'var(--green)' }}>Net available</span>
                    <span style={{ color: 'var(--green)' }}>{netAvailable.toFixed(1)}h</span>
                  </div>
                </div>

                {/* Training topics */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--hint)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Training Topics</div>
                  {t.topics.map(topic => (
                    <div key={topic} style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>• {topic}</div>
                  ))}
                </div>

                {/* Members */}
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {members.map(m => (
                    <span key={m.id} style={{ fontSize: 11, padding: '2px 7px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, color: 'var(--muted)' }}>
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Business rule reminder */}
      <div className="card" style={{ background: 'rgba(77,166,255,0.06)', borderColor: 'rgba(77,166,255,0.2)' }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--accent)' }}>📋 Business Rules (SPEC §6)</div>
        <ul style={{ fontSize: 12, color: 'var(--muted)', paddingLeft: 16, lineHeight: 2 }}>
          <li>T1 AI Foundation = mandatory for ALL staff — Platform KPI. Cannot be removed from calculation.</li>
          <li>Ops overhead is non-negotiable — represents real recurring time cost per role.</li>
          <li>Personal buffer 5% = minimum reserve. Always included.</li>
          <li>10–15% overhead rule — ops + training should consume 10–15% of workHoursPerWeek. Red = {'>'} 15%.</li>
        </ul>
      </div>
    </div>
  );
}
