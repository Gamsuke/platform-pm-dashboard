import { useState, useMemo, useCallback } from 'react';
import type { Person, Project, Task } from './types';
import { SEED_TEAM } from './data/seedTeam';
import { SEED_PROJECTS } from './data/seedProjects';
import { generateAlerts } from './utils/capacity';
import Nav, { type TabId } from './components/Nav';
import Overview from './components/Overview';
import Projects from './components/Projects';
import AllTasks from './components/AllTasks';
import Capacity from './components/Capacity';
import Training from './components/Training';
import Finance from './components/Finance';

const PERSONS_KEY  = 'pg_ops_persons_v1';
const PROJECTS_KEY = 'pg_ops_projects_v1';

function loadPersons(): Person[] {
  try {
    const raw = localStorage.getItem(PERSONS_KEY);
    return raw ? JSON.parse(raw) : SEED_TEAM;
  } catch { return SEED_TEAM; }
}

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : SEED_PROJECTS;
  } catch { return SEED_PROJECTS; }
}

function savePersons(persons: Person[]) {
  localStorage.setItem(PERSONS_KEY, JSON.stringify(persons));
}

function saveProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [persons,  setPersons]  = useState<Person[]>(loadPersons);
  const [projects, setProjects] = useState<Project[]>(loadProjects);

  // Flat array of all tasks across all projects
  const allTasks: Task[] = useMemo(
    () => projects.flatMap(p => p.tasks),
    [projects]
  );

  const alerts = useMemo(
    () => generateAlerts(persons, projects, allTasks),
    [persons, projects, allTasks]
  );

  // ── Project mutations ──────────────────────────────────
  const updateProject = useCallback((updated: Project) => {
    setProjects(prev => {
      const next = prev.find(p => p.id === updated.id)
        ? prev.map(p => p.id === updated.id ? updated : p)
        : [...prev, updated];
      saveProjects(next);
      return next;
    });
  }, []);

  const addTask = useCallback((projectId: string, taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...taskData,
      id: 't_' + Date.now(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProjects(prev => {
      const next = prev.map(p =>
        p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p
      );
      saveProjects(next);
      return next;
    });
  }, []);

  const updateTask = useCallback((projectId: string, updated: Task) => {
    setProjects(prev => {
      const next = prev.map(p =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map(t => t.id === updated.id ? updated : t) }
          : p
      );
      saveProjects(next);
      return next;
    });
  }, []);

  const deleteTask = useCallback((projectId: string, taskId: string) => {
    setProjects(prev => {
      const next = prev.map(p =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
          : p
      );
      saveProjects(next);
      return next;
    });
  }, []);

  const handleTabChange = (tab: TabId) => setActiveTab(tab);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav
        active={activeTab}
        onChange={handleTabChange}
        alertCount={alerts.filter(a => a.level === 'danger').length}
        alerts={alerts}
      />

      <main style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'overview' && (
          <Overview
            persons={persons}
            projects={projects}
            allTasks={allTasks}
            alerts={alerts}
            onTabChange={(tab) => setActiveTab(tab as TabId)}
          />
        )}
        {activeTab === 'projects' && (
          <Projects
            projects={projects}
            persons={persons}
            onUpdateProject={updateProject}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}
        {activeTab === 'tasks' && (
          <AllTasks projects={projects} persons={persons} />
        )}
        {activeTab === 'capacity' && (
          <Capacity persons={persons} allTasks={allTasks} />
        )}
        {activeTab === 'training' && (
          <Training persons={persons} />
        )}
        {activeTab === 'finance' && (
          <Finance projects={projects} onUpdateProject={updateProject} />
        )}
      </main>
    </div>
  );
}
