import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  FolderKanban,
  Gauge,
  HeartHandshake,
  Home,
  Lightbulb,
  ListTodo,
  MessageSquareText,
  Newspaper,
  Plus,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Target,
  Users,
  X,
} from "lucide-react";

type Status = "active" | "blocked" | "planning" | "paused";
type ProjectId = "garden" | "hintonship" | "humanity" | "tiny" | "vault" | "burden";

type Task = {
  id: string;
  title: string;
  project: ProjectId;
  owner: "Amber" | "AIESHAR" | "Family";
  priority: "Now" | "Next" | "Later";
  done: boolean;
};

type Project = {
  id: ProjectId;
  name: string;
  shortName: string;
  mission: string;
  status: Status;
  progress: number;
  nextMove: string;
  blocker: string;
  icon: typeof Sprout;
  url?: string;
};

const projects: Project[] = [
  {
    id: "garden",
    name: "Garden of Truth",
    shortName: "Garden",
    mission: "A membership learning garden for courses, research, personal growth, and sacred inquiry.",
    status: "blocked",
    progress: 62,
    nextMove: "Repair the Vercel deployment and verify the black-and-gold Learning Command Center live.",
    blocker: "Production is still serving the older dashboard after serverless deployment failures.",
    icon: Sprout,
    url: "https://studentoftheword.org",
  },
  {
    id: "hintonship",
    name: "Hintonship",
    shortName: "Hintonship",
    mission: "A family operating system for homeschool, chores, meals, safety, schedules, and growth.",
    status: "active",
    progress: 48,
    nextMove: "Stabilize profiles, passcodes, family agenda, and AIESHAR household commands.",
    blocker: "Several modules exist but still behave as separate islands.",
    icon: Home,
  },
  {
    id: "humanity",
    name: "Humanity Beacon",
    shortName: "Beacon",
    mission: "A hope-centered newsroom that reports verified stories of people helping people.",
    status: "active",
    progress: 37,
    nextMove: "Finish the daily story approval, script, reel, and publishing workflow.",
    blocker: "Social OAuth and automated publishing are not fully connected.",
    icon: Newspaper,
  },
  {
    id: "tiny",
    name: "Tiny Sproutz",
    shortName: "Sproutz",
    mission: "A watercolor children’s world teaching family, land, creativity, and practical wisdom.",
    status: "planning",
    progress: 18,
    nextMove: "Lock Episode 1 storyboards and production assets.",
    blocker: "Waiting behind the three active priority projects.",
    icon: Star,
  },
  {
    id: "vault",
    name: "Evidence Vaults",
    shortName: "Vaults",
    mission: "A research engine for connecting sources, claims, timelines, and unresolved questions.",
    status: "paused",
    progress: 24,
    nextMove: "Define the truth-seeker entry page and evidence classification workflow.",
    blocker: "Paused to protect focus.",
    icon: Search,
  },
  {
    id: "burden",
    name: "Burdenbearer Services",
    shortName: "Burdenbearer",
    mission: "A service umbrella supporting community care, practical help, and creator-owned projects.",
    status: "planning",
    progress: 14,
    nextMove: "Clarify services, intake, and how the umbrella connects the projects.",
    blocker: "Needs a simpler MVP before implementation.",
    icon: HeartHandshake,
  },
];

const initialTasks: Task[] = [
  { id: "t1", title: "Get Garden of Truth production deployment healthy", project: "garden", owner: "AIESHAR", priority: "Now", done: false },
  { id: "t2", title: "Verify owner login and Learning Command Center", project: "garden", owner: "Amber", priority: "Now", done: false },
  { id: "t3", title: "Repair Hintonship profile and passcode switching", project: "hintonship", owner: "AIESHAR", priority: "Next", done: false },
  { id: "t4", title: "Approve today’s Humanity Beacon story set", project: "humanity", owner: "Amber", priority: "Next", done: false },
  { id: "t5", title: "Map the complete Humanity Beacon reel workflow", project: "humanity", owner: "AIESHAR", priority: "Next", done: false },
  { id: "t6", title: "Review family calendar and household maintenance", project: "hintonship", owner: "Family", priority: "Later", done: false },
];

const statusLabels: Record<Status, string> = {
  active: "Active",
  blocked: "Blocked",
  planning: "Planning",
  paused: "Paused",
};

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem("amber-os.tasks");
    return stored ? JSON.parse(stored) : initialTasks;
  } catch {
    return initialTasks;
  }
}

export default function App() {
  const [activeProject, setActiveProject] = useState<ProjectId | "all">("all");
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [capture, setCapture] = useState("");
  const [showCapture, setShowCapture] = useState(false);
  const [view, setView] = useState<"command" | "projects" | "week">("command");

  const visibleTasks = useMemo(
    () => tasks.filter((task) => activeProject === "all" || task.project === activeProject),
    [tasks, activeProject],
  );

  const nowTasks = visibleTasks.filter((task) => task.priority === "Now" && !task.done);
  const nextTasks = visibleTasks.filter((task) => task.priority === "Next" && !task.done);
  const completed = tasks.filter((task) => task.done).length;
  const activeProjects = projects.filter((project) => project.status === "active" || project.status === "blocked").length;
  const selected = activeProject === "all" ? null : projects.find((project) => project.id === activeProject) || null;

  function persist(next: Task[]) {
    setTasks(next);
    try { localStorage.setItem("amber-os.tasks", JSON.stringify(next)); } catch { /* ignore */ }
  }

  function toggleTask(id: string) {
    persist(tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function addTask() {
    const title = capture.trim();
    if (!title) return;
    const project = activeProject === "all" ? "garden" : activeProject;
    persist([{ id: crypto.randomUUID(), title, project, owner: "Amber", priority: "Next", done: false }, ...tasks]);
    setCapture("");
    setShowCapture(false);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><BrainCircuit size={26} /></div>
          <div><strong>Amber OS</strong><span>Owner Control Room</span></div>
        </div>

        <nav className="nav-stack" aria-label="Primary">
          <button className={view === "command" ? "nav active" : "nav"} onClick={() => setView("command")}><Gauge size={18} /> Command Center</button>
          <button className={view === "projects" ? "nav active" : "nav"} onClick={() => setView("projects")}><FolderKanban size={18} /> Projects</button>
          <button className={view === "week" ? "nav active" : "nav"} onClick={() => setView("week")}><CalendarDays size={18} /> Weekly Focus</button>
        </nav>

        <div className="sidebar-label">Project Rooms</div>
        <div className="project-nav">
          <button className={activeProject === "all" ? "project-link selected" : "project-link"} onClick={() => setActiveProject("all")}>
            <span className="project-dot all" /> All Projects <span>{projects.length}</span>
          </button>
          {projects.map((project) => (
            <button key={project.id} className={activeProject === project.id ? "project-link selected" : "project-link"} onClick={() => setActiveProject(project.id)}>
              <span className={`project-dot ${project.status}`} /> {project.shortName}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <button className="nav"><Settings size={18} /> Settings</button>
          <div className="owner-card"><div className="avatar">A</div><div><strong>Amber Wilder</strong><span>Owner · Builder</span></div></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Monday Command Brief</p>
            <h1>{view === "command" ? "What moves the vision forward today?" : view === "projects" ? "Project Portfolio" : "This Week’s Focus"}</h1>
          </div>
          <button className="primary-button" onClick={() => setShowCapture(true)}><Plus size={17} /> Quick Capture</button>
        </header>

        {view === "command" && (
          <>
            <section className="metric-grid">
              <Metric icon={Rocket} label="Active Projects" value={activeProjects} note="3 need attention" />
              <Metric icon={Target} label="Today’s Priorities" value={nowTasks.length || 2} note="Protect the top two" />
              <Metric icon={AlertTriangle} label="Open Blockers" value={projects.filter((p) => p.status === "blocked").length + 2} note="Resolve before adding" />
              <Metric icon={CheckCircle2} label="Completed" value={completed} note="Stored on this device" />
            </section>

            {selected && <ProjectSpotlight project={selected} />}

            <section className="command-grid">
              <div className="panel priority-panel">
                <PanelHeader icon={Target} title="Today’s Priorities" action="One thing at a time" />
                <div className="priority-list">
                  {(nowTasks.length ? nowTasks : visibleTasks.filter((t) => !t.done).slice(0, 2)).map((task, index) => (
                    <TaskRow key={task.id} task={task} index={index + 1} toggle={toggleTask} />
                  ))}
                </div>
                <div className="decision-strip"><Lightbulb size={18} /><div><strong>Manager’s call</strong><span>Garden of Truth deployment health comes before adding another feature.</span></div></div>
              </div>

              <div className="panel blockers-panel">
                <PanelHeader icon={AlertTriangle} title="Blockers" action="Clear the road" />
                <div className="blocker-list">
                  {projects.filter((project) => project.status === "blocked" || project.blocker.includes("not") || project.blocker.includes("still")).slice(0, 4).map((project) => (
                    <button key={project.id} className="blocker" onClick={() => setActiveProject(project.id)}>
                      <span className={`project-dot ${project.status}`} />
                      <div><strong>{project.name}</strong><span>{project.blocker}</span></div><ChevronRight size={17} />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="panel">
              <PanelHeader icon={FolderKanban} title="Project Pulse" action="Click a room to focus" />
              <div className="project-grid">
                {projects.map((project) => <ProjectCard key={project.id} project={project} open={() => setActiveProject(project.id)} />)}
              </div>
            </section>

            <section className="command-grid bottom-grid">
              <div className="panel">
                <PanelHeader icon={ListTodo} title="Coming Next" action={`${nextTasks.length} queued`} />
                <div className="compact-task-list">
                  {nextTasks.slice(0, 5).map((task) => <TaskRow key={task.id} task={task} toggle={toggleTask} compact />)}
                </div>
              </div>
              <div className="panel">
                <PanelHeader icon={Sparkles} title="AIESHAR Manager Notes" action="Clarity over clutter" />
                <div className="manager-note">
                  <p>You do not need to carry every project in your head. Amber OS holds the map. Today, protect deployment stability, test what is live, and refuse shiny detours.</p>
                  <button className="text-button" onClick={() => setShowCapture(true)}>Capture a thought <ArrowRight size={15} /></button>
                </div>
              </div>
            </section>
          </>
        )}

        {view === "projects" && (
          <section className="panel large-panel">
            <PanelHeader icon={FolderKanban} title="All Project Rooms" action="One portfolio, separate missions" />
            <div className="project-grid expanded">
              {projects.map((project) => <ProjectCard key={project.id} project={project} open={() => setActiveProject(project.id)} expanded />)}
            </div>
          </section>
        )}

        {view === "week" && (
          <section className="week-layout">
            <div className="panel">
              <PanelHeader icon={CalendarDays} title="Weekly Focus" action="Three lanes only" />
              {[
                ["1", "Garden of Truth", "Get the live deployment healthy and confirm the Learning Command Center."],
                ["2", "Hintonship", "Stabilize the family hall, profiles, and the most-used daily tools."],
                ["3", "Humanity Beacon", "Produce a repeatable daily story-to-reel workflow."],
              ].map(([number, title, text]) => (
                <div className="week-focus" key={number}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></div>
              ))}
            </div>
            <div className="panel">
              <PanelHeader icon={ShieldCheck} title="Not This Week" action="Protected focus" />
              <ul className="not-now">
                <li>Tiny Sproutz production expansion</li>
                <li>Evidence Vault redesign</li>
                <li>New marketplace features</li>
                <li>Any new website before these three stabilize</li>
              </ul>
            </div>
          </section>
        )}
      </main>

      {showCapture && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowCapture(false)}>
          <div className="capture-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <button className="close-button" onClick={() => setShowCapture(false)} aria-label="Close"><X size={19} /></button>
            <div className="modal-icon"><MessageSquareText size={24} /></div>
            <p className="eyebrow">Quick Capture</p>
            <h2>Get it out of your head.</h2>
            <p className="modal-copy">It will become a Next task in {selected?.name || "Garden of Truth"}. You can organize it later.</p>
            <textarea value={capture} onChange={(event) => setCapture(event.target.value)} placeholder="What needs attention?" autoFocus />
            <button className="primary-button full" onClick={addTask}><Plus size={17} /> Add to Amber OS</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Rocket; label: string; value: number; note: string }) {
  return <article className="metric-card"><div className="metric-icon"><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function PanelHeader({ icon: Icon, title, action }: { icon: typeof Target; title: string; action: string }) {
  return <div className="panel-header"><div><Icon size={18} /><h2>{title}</h2></div><span>{action}</span></div>;
}

function TaskRow({ task, index, toggle, compact = false }: { task: Task; index?: number; toggle: (id: string) => void; compact?: boolean }) {
  const project = projects.find((item) => item.id === task.project)!;
  return (
    <div className={compact ? "task-row compact" : "task-row"}>
      {index && <span className="task-number">{index}</span>}
      <button className={task.done ? "task-check checked" : "task-check"} onClick={() => toggle(task.id)} aria-label={task.done ? "Mark incomplete" : "Mark complete"}>{task.done ? <Check size={15} /> : null}</button>
      <div className="task-copy"><strong className={task.done ? "done" : ""}>{task.title}</strong><span>{project.shortName} · Owner: {task.owner}</span></div>
      <span className={`priority-chip ${task.priority.toLowerCase()}`}>{task.priority}</span>
    </div>
  );
}

function ProjectSpotlight({ project }: { project: Project }) {
  const Icon = project.icon;
  return (
    <section className="spotlight">
      <div className="spotlight-icon"><Icon size={30} /></div>
      <div className="spotlight-copy"><p className="eyebrow">Focused Project</p><h2>{project.name}</h2><p>{project.mission}</p></div>
      <div className="spotlight-move"><span>Next move</span><strong>{project.nextMove}</strong></div>
    </section>
  );
}

function ProjectCard({ project, open, expanded = false }: { project: Project; open: () => void; expanded?: boolean }) {
  const Icon = project.icon;
  return (
    <button className={expanded ? "project-card expanded" : "project-card"} onClick={open}>
      <div className="project-card-top"><div className="project-icon"><Icon size={22} /></div><span className={`status ${project.status}`}><CircleDot size={11} /> {statusLabels[project.status]}</span></div>
      <h3>{project.name}</h3>
      <p>{project.mission}</p>
      {expanded && <div className="next-move"><span>Next move</span>{project.nextMove}</div>}
      <div className="progress-row"><span>Progress</span><strong>{project.progress}%</strong></div>
      <div className="progress-track"><i style={{ width: `${project.progress}%` }} /></div>
      <div className="project-footer"><span>{project.blocker}</span><ArrowRight size={16} /></div>
    </button>
  );
}
