# Platform OPS — Agency PM System

## Quick Start for Claude Code

### Step 1: Feed these files in order

```
1. SPEC.md          ← read this first, full system spec
2. capacity.ts      ← core formula logic (put in src/utils/)
```

### Step 2: Prompt Claude Code

```
Read SPEC.md fully. Then read capacity.ts.

Build the full Platform Group Agency PM System.

File structure is in SPEC.md Section 7.
Start with:
  1. src/types/index.ts          (from SPEC Section 2)
  2. src/data/opsOverhead.ts     (from SPEC Section 4.1)
  3. src/data/training.ts        (from SPEC Section 4.2)
  4. src/data/seedTeam.ts        (from SPEC Section 4.3)
  5. src/data/seedProjects.ts    (from SPEC Section 4.4)
  6. src/utils/capacity.ts       (already provided — copy as-is)
  7. src/components/*.tsx        (6 tab components per SPEC Section 5)
  8. src/App.tsx
  9. src/main.tsx

Rules:
- All formulas must import from capacity.ts — no inline re-calculation
- No task can be created without estimatedHours
- Alerts from SPEC Section 5.4 must auto-generate using generateAlerts()
- Use localStorage for persistence
- Vite + React + TypeScript
```

### Step 3: What you'll get

A 6-tab dashboard covering:

| Tab | Key feature |
|---|---|
| Overview | KPI cards + project cards + capacity snapshot |
| Projects | Task table + man-hour breakdown by dept + burn rate |
| All Tasks | Filter by status + total committed hours |
| Capacity | Per-person table with ops/training/buffer breakdown |
| Training | Tier 1/2/3 allocation + capacity impact per person |
| Finance | Budget vs spent + hour burn per project |

---

## Files in this package

| File | Purpose |
|---|---|
| `SPEC.md` | Full system spec — data models, formulas, UI requirements, business rules |
| `capacity.ts` | All man-hour formulas as pure TypeScript functions |
| `README.md` | This file |

---

## Key Formulas (summary)

```
Net Available Hours = workHours - opsOverhead - training - personalBuffer(5%)
Safe Capacity       = netAvailable × 80%
Load %              = committedProjectHours / netAvailable × 100

Load Zones:
  < 60%   → comfortable  (blue)
  60–79%  → healthy      (green)
  80–94%  → at-risk      (yellow)
  ≥ 95%   → overloaded   (red)

Burn Rate           = actualHours / daysElapsed
Projected Hours     = burnRate × totalDays
Progress Gap        = expectedProgress% - actualProgress%
  gap ≤ 5%  → on track
  gap 5–15% → warning
  gap > 15% → at risk
```

---

*Platform Group · May 2026*
