import { useState } from 'react';
import type { Person, Task } from '../types';
import {
  getPersonCapacity,
  getOpsHours,
  getTrainingHoursPerWeek,
  getPersonalBufferHours,
  LOAD_ZONE_COLORS,
} from '../utils/capacity';
import { OPS_OVERHEAD } from '../data/opsOverhead';

interface Props {
  persons: Person[];
  allTasks: Task[];
}

function LoadBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 38, textAlign: 'right' }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

function HourBreakdownBar({ proj, ops, training, buffer }: { proj: number; ops: number; training: number; buffer: number }) {
  const total = Math.max(proj + ops + training + Math.abs(buffer), 1);
  const segments = [
    { label: 'Project', value: proj,     color: '#4da6ff' },
    { label: 'Ops',     value: ops,      color: '#f0b429' },
    { label: 'Training',value: training, color: '#a78bfa' },
    { label: 'Buffer',  value: Math.max(0, buffer), color: '#00d9a3' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 16, marginBottom: 8 }}>
        {segments.map(s => (
          <div
            key={s.label}
            title={`${s.label}: ${s.value.toFixed(1)}h`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color, minWidth: s.value > 0 ? 2 : 0 }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
            <span style={{ color: 'var(--muted)' }}>{s.label}:</span>
            <span style={{ fontWeight: 600 }}>{s.value.toFixed(1)}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Capacity({ persons, allTasks }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deptFilter, setDeptFilter] = useState('');

  const selected = selectedId ? persons.find(p => p.id === selectedId) : null;
  const selectedCap = selected ? getPersonCapacity(selected, allTasks) : null;

  const departments = [...new Set(persons.map(p => p.department))].sort();
  const filtered = deptFilter ? persons.filter(p => p.department === deptFilter) : persons;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Capacity — Man-Hour Breakdown</h1>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          style={{ padding: '7px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 13 }}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedCap ? '1fr 360px' : '1fr', gap: 20 }}>
        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Dept</th>
                  <th>Project Hrs</th>
                  <th>Ops Overhead</th>
                  <th>Training/wk</th>
                  <th>Total Committed</th>
                  <th>Buffer</th>
                  <th>Load %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(person => {
                  const cap = getPersonCapacity(person, allTasks);
                  const color = LOAD_ZONE_COLORS[cap.loadZone];
                  const totalCommitted = cap.committedHours + cap.opsHours + cap.trainingHoursPerWeek;
                  const displayBuffer = cap.netAvailableHours - totalCommitted;
                  const displayLoad   = (totalCommitted / person.workHoursPerWeek) * 100;
                  const isSelected = selectedId === person.id;

                  return (
                    <tr
                      key={person.id}
                      onClick={() => setSelectedId(isSelected ? null : person.id)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(77,166,255,0.06)' : undefined,
                      }}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>{person.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{person.role}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>{person.department}</td>
                      <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{cap.committedHours.toFixed(1)}h</td>
                      <td style={{ color: 'var(--amber)' }}>{cap.opsHours.toFixed(1)}h</td>
                      <td style={{ color: '#a78bfa' }}>{cap.trainingHoursPerWeek.toFixed(1)}h</td>
                      <td style={{ fontWeight: 600 }}>{totalCommitted.toFixed(1)}h <span style={{ fontSize: 11, color: 'var(--hint)' }}>/ {person.workHoursPerWeek}h</span></td>
                      <td style={{ color: displayBuffer < 0 ? 'var(--red)' : displayBuffer < 5 ? 'var(--amber)' : 'var(--green)' }}>
                        {displayBuffer.toFixed(1)}h
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <LoadBar pct={displayLoad} color={color} />
                      </td>
                      <td>
                        {cap.isOverSafeCapacity && (
                          <span title="Exceeds safe capacity (80%)" style={{ color: 'var(--amber)', fontSize: 14 }}>⚠</span>
                        )}
                        {cap.loadZone === 'overloaded' && (
                          <span title="Overloaded!" style={{ color: 'var(--red)', fontSize: 14, marginLeft: 4 }}>⚡</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedCap && selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{selected.role} · {selected.department}</div>
                </div>
                <button
                  className="modal-close"
                  onClick={() => setSelectedId(null)}
                  style={{ fontSize: 18, color: 'var(--muted)' }}
                >×</button>
              </div>

              <HourBreakdownBar
                proj={selectedCap.committedHours}
                ops={selectedCap.opsHours}
                training={selectedCap.trainingHoursPerWeek}
                buffer={selectedCap.bufferHours}
              />

              {/* Numbers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {[
                  { label: 'Work hours/week', value: `${selected.workHoursPerWeek}h`, color: 'var(--text)' },
                  { label: 'Ops overhead', value: `−${selectedCap.opsHours.toFixed(1)}h`, color: 'var(--amber)' },
                  { label: 'Training/week', value: `−${selectedCap.trainingHoursPerWeek.toFixed(1)}h`, color: '#a78bfa' },
                  { label: 'Personal buffer (5%)', value: `−${selectedCap.personalBuffer.toFixed(1)}h`, color: 'var(--hint)' },
                  { label: 'Net available', value: `${selectedCap.netAvailableHours.toFixed(1)}h`, color: 'var(--green)', bold: true },
                  { label: 'Safe capacity (80%)', value: `${selectedCap.safeCapacityHours.toFixed(1)}h`, color: 'var(--muted)' },
                  { label: 'Project committed', value: `${selectedCap.committedHours.toFixed(1)}h`, color: 'var(--accent)', bold: true },
                  { label: 'Buffer remaining', value: `${selectedCap.bufferHours.toFixed(1)}h`, color: selectedCap.bufferHours < 0 ? 'var(--red)' : 'var(--green)', bold: true },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--muted)' }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: row.bold ? 700 : 400 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Alerts */}
              {selectedCap.loadZone === 'overloaded' && (
                <div className="alert-danger" style={{ marginTop: 14 }}>
                  ⚡ Overloaded ({Math.round(selectedCap.loadPercent)}%) — ควรย้ายงานหรือลด scope ทันที
                </div>
              )}
              {selectedCap.loadZone === 'at-risk' && (
                <div className="alert-warning" style={{ marginTop: 14 }}>
                  ⚠ Buffer เหลือแค่ {selectedCap.bufferHours.toFixed(1)}h — ระวังงานใหม่
                </div>
              )}
            </div>

            {/* Ops items */}
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Ops Overhead Items</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                {selectedCap.opsHours}h/week fixed for {selected.department}:
              </div>
              <ul style={{ fontSize: 13, color: 'var(--text)', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {OPS_OVERHEAD[selected.department].items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Active tasks */}
            {(() => {
              const tasks = allTasks.filter(t => t.assigneeId === selected.id && t.status !== 'Done');
              return tasks.length > 0 ? (
                <div className="card">
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>Active Tasks ({tasks.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tasks.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text)', maxWidth: 200 }}>{t.title}</span>
                        <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>{t.estimatedHours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
        {[
          { label: 'Comfortable <60%', color: '#4da6ff' },
          { label: 'Healthy 60–79%',   color: '#00d9a3' },
          { label: 'At-Risk 80–94%',   color: '#f0b429' },
          { label: 'Overloaded ≥95%',  color: '#ff5c5c' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
        <span style={{ fontSize: 12, color: 'var(--hint)' }}>| Click row for detail panel</span>
      </div>
    </div>
  );
}
