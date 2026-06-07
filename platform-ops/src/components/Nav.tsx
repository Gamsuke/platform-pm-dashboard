import type { Alert } from '../utils/capacity';

export type TabId = 'overview' | 'projects' | 'tasks' | 'capacity' | 'training' | 'finance';

interface NavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  alertCount: number;
  alerts: Alert[];
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview',  label: 'Overview',  icon: '📊' },
  { id: 'projects',  label: 'Projects',  icon: '📁' },
  { id: 'tasks',     label: 'All Tasks', icon: '✅' },
  { id: 'capacity',  label: 'Capacity',  icon: '⚡' },
  { id: 'training',  label: 'Training',  icon: '🎓' },
  { id: 'finance',   label: 'Finance',   icon: '💰' },
];

export default function Nav({ active, onChange, alertCount }: NavProps) {
  return (
    <nav style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, background: 'var(--accent)',
          borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff',
        }}>P</div>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Platform OPS</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, flex: 1 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '14px 16px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${active === tab.id ? 'var(--accent)' : 'transparent'}`,
              color: active === tab.id ? 'var(--accent)' : 'var(--muted)',
              fontSize: 13,
              fontWeight: active === tab.id ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === 'overview' && alertCount > 0 && (
              <span style={{
                background: 'var(--red)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 5px',
                borderRadius: 10,
                minWidth: 16,
                textAlign: 'center',
              }}>{alertCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Date */}
      <div style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
        {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
    </nav>
  );
}
