# Platform Group — Agency PM System Spec
> Feed this file to Claude Code as the primary project brief.
> All logic, data models, formulas, and UI requirements are defined here.

---

## 1. Project Overview

Build a **web-based Agency Project Management System** for Platform Group (~50 staff).
The system manages man-hours, capacity, project tasks, client collaboration, and finance
across 8 departments working on 2-week sprint cycles.

**Stack:** React + TypeScript frontend. JSON/localStorage for data persistence (Phase 1).
Can upgrade to Supabase/PostgreSQL backend in Phase 2.

**Entry point:** `npm run dev` → single-page app, no login required for Phase 1.

---

## 2. Data Models

### 2.1 Person
```typescript
interface Person {
  id: string;
  name: string;
  role: string;
  department: Department;
  workHoursPerWeek: number;        // default: 45
  // Computed fields (do NOT store — calculate at runtime)
  // opsOverheadHours: number      → from OPS_OVERHEAD[department].hoursPerWeek
  // trainingHoursPerWeek: number  → from TRAINING[department].totalMonthly / 4.33
  // netAvailableHours: number     → workHoursPerWeek - ops - training - personalBuffer
  // committedProjectHours: number → sum of task.estimatedHours where task.assigneeId === id
  // loadPercent: number           → committedProjectHours / netAvailableHours * 100
  // bufferHours: number           → netAvailableHours - committedProjectHours
}
```

### 2.2 Task
```typescript
interface Task {
  id: string;
  projectId: string;
  title: string;
  department: Department;
  assigneeId: string;
  estimatedHours: number;
  actualHours: number;             // updated as work progresses
  status: TaskStatus;
  dueDate: string;                 // ISO date string
  createdAt: string;
}

type TaskStatus = 'Briefed' | 'In Progress' | 'Review' | 'Done' | 'Blocked';
```

### 2.3 Project
```typescript
interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  priority: 'High' | 'Med' | 'Low';
  budget: number;                  // THB
  spent: number;                   // THB, updated manually
  startDate: string;               // ISO date string
  endDate: string;                 // ISO date string
  departments: Department[];
  tasks: Task[];
  // Computed fields (calculate at runtime)
  // totalEstimatedHours: number   → sum of all task.estimatedHours
  // totalActualHours: number      → sum of all task.actualHours
  // daysLeft: number              → diff(endDate, today)
  // totalDays: number             → diff(endDate, startDate)
  // timelinePercent: number       → (totalDays - daysLeft) / totalDays * 100
  // budgetPercent: number         → spent / budget * 100
  // burnRate: number              → totalActualHours / daysElapsed (hours/day)
  // projectedTotalHours: number   → burnRate * totalDays
  // hourVariance: number          → totalEstimatedHours - projectedTotalHours
}

type ProjectStatus = 'Briefed' | 'In Progress' | 'Review' | 'Done' | 'On Hold';
```

### 2.4 Department
```typescript
type Department =
  | 'AE/Strategy'
  | 'Creative'
  | 'Content'
  | 'Media'
  | 'KOL'
  | 'Production'
  | 'Dev'
  | 'Freelance';
```

---

## 3. Core Formulas

### 3.1 Person Capacity (calculate per person, per week)

```
personalBufferHours  = workHoursPerWeek × 0.05
opsHours             = OPS_OVERHEAD[department].hoursPerWeek
trainingHoursWeekly  = TRAINING[department].totalMonthlyHours / 4.33

netAvailableHours    = workHoursPerWeek
                     - opsHours
                     - trainingHoursWeekly
                     - personalBufferHours

safeCapacityHours    = netAvailableHours × 0.80   // never assign beyond this

committedHours       = sum(task.estimatedHours for all active tasks assigned to person)

loadPercent          = committedHours / netAvailableHours × 100
bufferHours          = netAvailableHours - committedHours
```

### 3.2 Load Zone Classification

```
loadPercent < 60    → zone: 'comfortable'  color: #4da6ff
loadPercent 60–79   → zone: 'healthy'      color: #00d9a3
loadPercent 80–94   → zone: 'at-risk'      color: #f0b429
loadPercent ≥ 95    → zone: 'overloaded'   color: #ff5c5c
```

### 3.3 Team Capacity (per department)

```
teamCapacityPool     = sum(person.netAvailableHours for all persons in department)
teamCommittedHours   = sum(task.estimatedHours for all tasks assigned to department)
teamLoadPercent      = teamCommittedHours / teamCapacityPool × 100

// WARNING: team load can look healthy while a key person is overloaded
// Always check individual load alongside team load
```

### 3.4 Project Progress

```
daysElapsed          = diff(today, project.startDate) in days
totalDays            = diff(project.endDate, project.startDate) in days
daysLeft             = diff(project.endDate, today) in days

expectedProgress     = daysElapsed / totalDays × 100   // %
actualProgress       = totalActualHours / totalEstimatedHours × 100   // %
progressGap          = expectedProgress - actualProgress

// Gap interpretation:
// gap ≤ 5%  → on track
// gap 5–15% → warning
// gap > 15% → at risk, escalate

burnRate             = totalActualHours / daysElapsed   // hours per day
projectedTotalHours  = burnRate × totalDays
hourVariance         = totalEstimatedHours - projectedTotalHours
// positive variance = under budget hours
// negative variance = will exceed estimated hours
```

### 3.5 Project Staffing Estimate (for new briefs)

```
// When receiving a new brief, calculate required hours per department:
requiredHoursPerDay[dept] = (totalEstimatedHours × deptAllocationPercent[dept]) / totalDays

// Default allocation percentages (adjust per project type):
DEPT_ALLOCATION_DEFAULT = {
  'AE/Strategy': 0.25,
  'Creative':    0.30,
  'Content':     0.20,
  'Media':       0.15,
  'KOL':         0.10,
}

// For each department: check if available persons can cover requiredHoursPerDay
// If person.bufferHours/5 (per day) < requiredHoursPerDay → flag for freelance
```

---

## 4. Reference Data

### 4.1 Ops Overhead (hours per week, built into capacity calculation)

```json
{
  "AE/Strategy": {
    "hoursPerWeek": 9,
    "items": [
      "Meeting notes & minutes",
      "Client emails & status reports",
      "Brief writing & revisions"
    ]
  },
  "Creative": {
    "hoursPerWeek": 5,
    "items": [
      "Revision logging",
      "Asset naming & filing",
      "Brief comprehension time"
    ]
  },
  "Content": {
    "hoursPerWeek": 6,
    "items": [
      "Caption edits & approval tracking",
      "Platform uploads",
      "Copy alignment rounds"
    ]
  },
  "Media": {
    "hoursPerWeek": 7,
    "items": [
      "Report pulls & dashboard updates",
      "Vendor coordination",
      "Billing reconciliation"
    ]
  },
  "KOL": {
    "hoursPerWeek": 8,
    "items": [
      "Contract admin",
      "Influencer tracking sheet",
      "Follow-up & seeding logistics"
    ]
  },
  "Production": {
    "hoursPerWeek": 5.5,
    "items": [
      "Supplier POs",
      "File management & QC checklists",
      "Delivery coordination"
    ]
  },
  "Dev": {
    "hoursPerWeek": 4.5,
    "items": [
      "Bug logs & deployment notes",
      "Documentation",
      "Code review coordination"
    ]
  },
  "Freelance": {
    "hoursPerWeek": 2.5,
    "items": [
      "Brief intake",
      "Revision rounds",
      "File handoff"
    ]
  }
}
```

### 4.2 Training Allocation (hours per month)

```json
{
  "AE/Strategy": {
    "tier1_mandatory": 2,
    "tier2_department": 3,
    "tier3_leadership": 2,
    "totalMonthlyHours": 7,
    "topics": [
      "AI Foundation — mandatory for all staff (Platform KPI)",
      "Brief writing & pitching",
      "Leadership & feedback skills"
    ]
  },
  "Creative": {
    "tier1_mandatory": 2,
    "tier2_department": 2,
    "tier3_leadership": 0,
    "totalMonthlyHours": 4,
    "topics": [
      "AI Foundation — mandatory for all staff",
      "AI tools & trend workshop"
    ]
  },
  "Content": {
    "tier1_mandatory": 2,
    "tier2_department": 2,
    "tier3_leadership": 0,
    "totalMonthlyHours": 4,
    "topics": [
      "AI Foundation — mandatory for all staff",
      "Platform & algorithm updates"
    ]
  },
  "Media": {
    "tier1_mandatory": 2,
    "tier2_department": 2,
    "tier3_leadership": 0,
    "totalMonthlyHours": 4,
    "topics": [
      "AI Foundation — mandatory for all staff",
      "Meta/Google/TikTok certification updates"
    ]
  },
  "KOL": {
    "tier1_mandatory": 2,
    "tier2_department": 1.5,
    "tier3_leadership": 0,
    "totalMonthlyHours": 3.5,
    "topics": [
      "AI Foundation — mandatory for all staff",
      "Contract law & influencer vetting"
    ]
  },
  "Production": {
    "tier1_mandatory": 2,
    "tier2_department": 1,
    "tier3_leadership": 0,
    "totalMonthlyHours": 3,
    "topics": [
      "AI Foundation — mandatory for all staff",
      "Safety & process SOP"
    ]
  },
  "Dev": {
    "tier1_mandatory": 2,
    "tier2_department": 1,
    "tier3_leadership": 0,
    "totalMonthlyHours": 3,
    "topics": [
      "AI Foundation — mandatory for all staff",
      "Security & deployment best practices"
    ]
  },
  "Freelance": {
    "tier1_mandatory": 1,
    "tier2_department": 0,
    "tier3_leadership": 0,
    "totalMonthlyHours": 1,
    "topics": [
      "Tool onboarding"
    ]
  }
}
```

### 4.3 Seed Team Data

```json
[
  { "id": "u1",  "name": "Gamsuke",    "role": "Executive Director", "department": "AE/Strategy", "workHoursPerWeek": 45 },
  { "id": "u2",  "name": "Pusit",      "role": "Head of Content",    "department": "Creative",    "workHoursPerWeek": 45 },
  { "id": "u3",  "name": "Miw",        "role": "Content Lead",       "department": "Content",     "workHoursPerWeek": 45 },
  { "id": "u4",  "name": "Wiyada",     "role": "Media Planner",      "department": "Media",       "workHoursPerWeek": 45 },
  { "id": "u5",  "name": "Nuttanun",   "role": "KOL Manager",        "department": "KOL",         "workHoursPerWeek": 45 },
  { "id": "u6",  "name": "Joe",        "role": "Producer",           "department": "Production",  "workHoursPerWeek": 45 },
  { "id": "u7",  "name": "Dev Lead",   "role": "Lead Developer",     "department": "Dev",         "workHoursPerWeek": 45 },
  { "id": "u8",  "name": "Freelance A","role": "Freelance Designer", "department": "Freelance",   "workHoursPerWeek": 45 },
  { "id": "u9",  "name": "AE Jr.",     "role": "Account Executive",  "department": "AE/Strategy", "workHoursPerWeek": 45 },
  { "id": "u10", "name": "Graphic 1",  "role": "Graphic Designer",   "department": "Creative",    "workHoursPerWeek": 45 },
  { "id": "u11", "name": "Graphic 2",  "role": "Graphic Designer",   "department": "Creative",    "workHoursPerWeek": 45 },
  { "id": "u12", "name": "Media Jr.",  "role": "Media Buyer",        "department": "Media",       "workHoursPerWeek": 45 }
]
```

### 4.4 Seed Project Data

```json
[
  {
    "id": "p1",
    "name": "NIVEA MEN — Summer Campaign",
    "client": "Beiersdorf",
    "status": "In Progress",
    "priority": "High",
    "budget": 850000,
    "spent": 340000,
    "startDate": "2026-05-12",
    "endDate": "2026-05-26",
    "departments": ["AE/Strategy","Creative","Content","Media"],
    "tasks": [
      { "id": "t1", "title": "Campaign concept deck",   "department": "Creative",    "assigneeId": "u2",  "estimatedHours": 16, "actualHours": 16, "status": "Done",        "dueDate": "2026-05-24" },
      { "id": "t2", "title": "Social content 12 posts", "department": "Content",     "assigneeId": "u3",  "estimatedHours": 20, "actualHours": 12, "status": "In Progress", "dueDate": "2026-05-28" },
      { "id": "t3", "title": "Media plan Q3",           "department": "Media",       "assigneeId": "u4",  "estimatedHours": 12, "actualHours": 10, "status": "Review",      "dueDate": "2026-05-27" },
      { "id": "t4", "title": "Influencer shortlist",    "department": "KOL",         "assigneeId": "u5",  "estimatedHours": 8,  "actualHours": 0,  "status": "Briefed",     "dueDate": "2026-05-30" }
    ]
  },
  {
    "id": "p2",
    "name": "กยศ. PR Contract M3",
    "client": "Student Loan Fund",
    "status": "In Progress",
    "priority": "High",
    "budget": 7540000,
    "spent": 2100000,
    "startDate": "2026-05-12",
    "endDate": "2026-05-26",
    "departments": ["AE/Strategy","Content","KOL","Production"],
    "tasks": [
      { "id": "t5", "title": "Press release batch 2",   "department": "Content",     "assigneeId": "u3",  "estimatedHours": 10, "actualHours": 5,  "status": "In Progress", "dueDate": "2026-05-27" },
      { "id": "t6", "title": "Monthly report deck",     "department": "AE/Strategy", "assigneeId": "u1",  "estimatedHours": 14, "actualHours": 11, "status": "Review",      "dueDate": "2026-05-26" },
      { "id": "t7", "title": "Video production brief",  "department": "Production",  "assigneeId": "u6",  "estimatedHours": 18, "actualHours": 0,  "status": "Briefed",     "dueDate": "2026-05-31" },
      { "id": "t8", "title": "KOL seeding plan",        "department": "KOL",         "assigneeId": "u5",  "estimatedHours": 6,  "actualHours": 6,  "status": "Done",        "dueDate": "2026-05-22" }
    ]
  },
  {
    "id": "p3",
    "name": "Thai Oil — Brand Awareness",
    "client": "Thai Oil",
    "status": "Briefed",
    "priority": "Med",
    "budget": 1200000,
    "spent": 80000,
    "startDate": "2026-05-25",
    "endDate": "2026-06-08",
    "departments": ["AE/Strategy","Creative","Media"],
    "tasks": [
      { "id": "t9",  "title": "Kickoff meeting",         "department": "AE/Strategy", "assigneeId": "u1",  "estimatedHours": 3,  "actualHours": 3,  "status": "Done",    "dueDate": "2026-05-25" },
      { "id": "t10", "title": "Brand audit deck",        "department": "Creative",    "assigneeId": "u2",  "estimatedHours": 20, "actualHours": 0,  "status": "Briefed", "dueDate": "2026-06-02" },
      { "id": "t11", "title": "Media landscape report",  "department": "Media",       "assigneeId": "u4",  "estimatedHours": 16, "actualHours": 0,  "status": "Briefed", "dueDate": "2026-06-03" }
    ]
  }
]
```

---

## 5. UI Requirements

### 5.1 Navigation Tabs

| Tab | Purpose |
|---|---|
| Overview | KPI cards + project summaries + capacity snapshot |
| Projects | Project list + task detail + man-hour breakdown per dept |
| All Tasks | Full task list with status filter + total committed hours |
| Capacity | Per-person man-hour table + individual breakdown panel |
| Training | Training allocation per dept + capacity impact table |
| Finance | Budget summary + per-project burn table |

### 5.2 Capacity Tab — Required Columns

Table must show these columns per person:

| Column | Formula |
|---|---|
| Project Hrs | sum of estimatedHours for active tasks |
| Ops Overhead | OPS_OVERHEAD[dept].hoursPerWeek |
| Training/wk | TRAINING[dept].totalMonthlyHours / 4.33 |
| Total Committed | projectHrs + opsHours + trainingHrs |
| Buffer | netAvailable - totalCommitted |
| Load % | totalCommitted / netAvailable × 100 |

Click a person row → show detail panel with:
- Hour breakdown bar chart (project / ops / training / buffer)
- List of ops overhead items for their department
- Alert if load ≥ 80% with Thai-language recommendation

### 5.3 Project Tab — Man-Hour Breakdown

Below the task table, show a per-department breakdown:
- Department tag + total hours + percentage of project total
- Horizontal bar proportional to percentage
- Burn rate indicator if actualHours data exists

### 5.4 Load Alerts

Show alerts automatically when:
- Person load ≥ 95% → "⚡ Overloaded — ควรย้ายงานหรือลด scope ทันที"
- Person load ≥ 80% → "⚠ Buffer เหลือน้อย — ระวังงานใหม่"
- Project progress gap > 15% → "🔴 งานล่าช้ากว่าแผน {gap}%"
- Budget utilization > 85% → "⚠ งบใกล้หมด"
- Days left ≤ 3 → highlight in danger color

### 5.5 Add Task Form Fields

When creating a new task, require:
- Title (text)
- Department (select from Department enum)
- Assignee (select from persons in that department)
- Estimated Hours (number, required — no task without hours)
- Due Date (date picker)
- Status (select, default: 'Briefed')

---

## 6. Business Rules

1. **Never assign project work exceeding safe capacity** — safeCapacityHours = netAvailable × 0.80. Warn visually but do not hard-block.

2. **Ops overhead is non-negotiable** — it must be deducted before any capacity calculation. It represents real recurring time cost per role.

3. **Training is pre-allocated** — T1 (AI Foundation) is mandatory for all staff per Platform Group KPI. Cannot be removed from calculation.

4. **Personal buffer (5%)** — minimum reserve for unexpected personal matters. Always included.

5. **10–15% total overhead rule** — ops + training together should consume 10–15% of workHoursPerWeek. If a department exceeds 15%, flag for review.

6. **Key person risk** — if a department has a single person who is the only one capable of a certain task type (e.g., Art Direction), their individual load is more critical than the team pool load. Flag this as "single point of failure."

7. **Sprint cycle = 14 days** — default project duration. All timelines and burn rates are calibrated against this cycle.

8. **Freelance buffer** — maintain a pre-approved roster. When any internal person hits 80% load on a project requiring their department, surface a prompt to engage freelance.

---

## 7. File Structure to Generate

```
platform-ops/
├── src/
│   ├── types/
│   │   └── index.ts           # All TypeScript interfaces from Section 2
│   ├── data/
│   │   ├── opsOverhead.ts     # OPS_OVERHEAD constant from Section 4.1
│   │   ├── training.ts        # TRAINING constant from Section 4.2
│   │   ├── seedTeam.ts        # Seed persons from Section 4.3
│   │   └── seedProjects.ts    # Seed projects from Section 4.4
│   ├── utils/
│   │   └── capacity.ts        # All formulas from Section 3 as pure functions
│   ├── components/
│   │   ├── Nav.tsx
│   │   ├── Overview.tsx
│   │   ├── Projects.tsx
│   │   ├── AllTasks.tsx
│   │   ├── Capacity.tsx
│   │   ├── Training.tsx
│   │   └── Finance.tsx
│   ├── App.tsx
│   └── main.tsx
├── SPEC.md                    # This file
├── package.json
└── README.md
```

---

## 8. Suggested Prompt for Claude Code

Paste the following when starting Claude Code:

```
Read SPEC.md fully before writing any code.

Build the Platform Group Agency PM System as specified.
Start with: types/index.ts → data files → utils/capacity.ts → components → App.tsx

Key constraints:
- All capacity formulas must match Section 3 exactly
- Use seed data from Section 4 for initial state
- Alerts from Section 5.4 must be visible in Overview and Capacity tabs
- No task can be created without estimatedHours (Section 5.5)
- Use localStorage for persistence, no backend needed

Run `npm run dev` when done and confirm all 6 tabs render correctly.
```

---

*Spec version: 1.0 | Platform Group | May 2026*
