"use client";

import { useState, useEffect } from "react";
import {
  Plus, Trash2, Calendar, LayoutGrid, List, CheckCircle2, Circle, Clock,
  ChevronDown, ChevronRight, GripVertical,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import type { Task } from "@/types";

const PRIORITY_CONFIG = {
  low: { label: "Baja", color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/10", border: "border-[#06b6d4]/30" },
  medium: { label: "Media", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  high: { label: "Alta", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
};

const STATUS_CONFIG = {
  todo: { label: "Por Hacer", icon: Circle, color: "text-[#e0e0ff]/50" },
  in_progress: { label: "En Progreso", icon: Clock, color: "text-[#a855f7]" },
  done: { label: "Completado", icon: CheckCircle2, color: "text-[#06b6d4]" },
};

const STORAGE_KEY = "deskly-tasks";

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveTasks(tasks: Task[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {}
}

interface Subtask { id: string; title: string; completed: boolean; }

const SUBTASK_STORAGE = "deskly-subtasks";

function loadSubtasks(): Record<string, Subtask[]> {
  if (typeof window === "undefined") return {};
  try { const s = localStorage.getItem(SUBTASK_STORAGE); return s ? JSON.parse(s) : {}; } catch { return {}; }
}

function saveSubtasks(sub: Record<string, Subtask[]>) {
  try { localStorage.setItem(SUBTASK_STORAGE, JSON.stringify(sub)); } catch {}
}

export default function TaskList({ subjectFilter }: { subjectFilter?: string | null }) {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showForm, setShowForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => { setTasks(loadTasks()); setSubtasks(loadSubtasks()); }, []);
  useEffect(() => { saveTasks(tasks); }, [tasks]);
  useEffect(() => { saveSubtasks(subtasks); }, [subtasks]);

  const [newTask, setNewTask] = useState({ title: "", dueDate: "", priority: "medium" as "low" | "medium" | "high", subject: "" });

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: Date.now().toString(), user_id: "local", subject_id: newTask.subject || null,
      title: newTask.title, description: null, due_date: newTask.dueDate || null,
      priority: newTask.priority, status: "todo", created_at: new Date().toISOString(),
    };
    setTasks([task, ...tasks]);
    setNewTask({ title: "", dueDate: "", priority: "medium", subject: "" });
    setShowForm(false);
  };

  const toggleStatus = (id: string) => {
    setTasks(tasks.map((t) => {
      if (t.id !== id) return t;
      const order: Task["status"][] = ["todo", "in_progress", "done"];
      return { ...t, status: order[(order.indexOf(t.status) + 1) % 3] };
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    const s = { ...subtasks }; delete s[id]; setSubtasks(s);
  };

  const addSubtask = (taskId: string) => {
    if (!newSubtask.trim()) return;
    const st: Subtask = { id: Date.now().toString(), title: newSubtask, completed: false };
    setSubtasks({ ...subtasks, [taskId]: [...(subtasks[taskId] || []), st] });
    setNewSubtask("");
  };

  const toggleSubtask = (taskId: string, subId: string) => {
    setSubtasks({
      ...subtasks,
      [taskId]: (subtasks[taskId] || []).map(s => s.id === subId ? { ...s, completed: !s.completed } : s),
    });
  };

  const getSubtaskProgress = (taskId: string) => {
    const subs = subtasks[taskId] || [];
    if (subs.length === 0) return null;
    return Math.round((subs.filter(s => s.completed).length / subs.length) * 100);
  };

  const filteredTasks = tasks.filter(t => {
    if (filterPriority && t.priority !== filterPriority) return false;
    if (subjectFilter && t.subject_id !== subjectFilter) return false;
    return true;
  });

  const renderTask = (task: Task) => {
    const pc = PRIORITY_CONFIG[task.priority];
    const sc = STATUS_CONFIG[task.status];
    const StatusIcon = sc.icon;
    const progress = getSubtaskProgress(task.id);
    const isExpanded = expandedTask === task.id;

    return (
      <div key={task.id} className={`rounded-xl bg-[#12122a]/50 border border-[rgba(168,85,247,0.15)] hover:border-[rgba(168,85,247,0.4)] transition-all group ${task.status === "done" ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-3 p-3">
          <button onClick={() => toggleStatus(task.id)} className={`${sc.color} hover:scale-110 transition-transform cursor-pointer`}>
            <StatusIcon size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-[#e0e0ff]/40" : "text-[#e0e0ff]"}`}>
              {task.title}
            </p>
            {task.due_date && (
              <p className="text-[10px] text-[#e0e0ff]/40 flex items-center gap-1 mt-0.5">
                <Calendar size={10} />
                {new Date(task.due_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </p>
            )}
            {progress !== null && (
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#1a1a3e] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#a855f7] to-[#06b6d4]" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] text-[#e0e0ff]/40">{progress}%</span>
              </div>
            )}
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pc.bg} ${pc.color} ${pc.border}`}>{pc.label}</span>
          <button onClick={() => setExpandedTask(isExpanded ? null : task.id)} className="p-1 rounded-lg hover:bg-[#1a1a3e] text-[#e0e0ff]/30 cursor-pointer">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-all cursor-pointer">
            <Trash2 size={14} />
          </button>
        </div>

        {isExpanded && (
          <div className="px-3 pb-3 border-t border-[rgba(168,85,247,0.1)] pt-2 animate-slide-up">
            <div className="space-y-1.5 mb-2">
              {(subtasks[task.id] || []).map(st => (
                <div key={st.id} className="flex items-center gap-2 pl-6">
                  <button onClick={() => toggleSubtask(task.id, st.id)} className={`cursor-pointer ${st.completed ? "text-[#06b6d4]" : "text-[#e0e0ff]/30"}`}>
                    {st.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  </button>
                  <span className={`text-xs ${st.completed ? "line-through text-[#e0e0ff]/30" : "text-[#e0e0ff]/70"}`}>{st.title}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pl-6">
              <input
                type="text" placeholder="Nueva subtarea..." value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSubtask(task.id)}
                className="flex-1 bg-transparent border-b border-[rgba(168,85,247,0.15)] pb-1 text-xs text-[#e0e0ff] outline-none placeholder:text-[#e0e0ff]/20 focus:border-[#a855f7]/50"
              />
              <NeonButton onClick={() => addSubtask(task.id)} variant="ghost" size="sm">+</NeonButton>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold gradient-neon">Tareas</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#1a1a3e] rounded-lg p-1">
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === "list" ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7]" : "text-[#e0e0ff]/40 hover:text-[#e0e0ff]"}`}>
              <List size={14} />
            </button>
            <button onClick={() => setViewMode("kanban")} className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === "kanban" ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7]" : "text-[#e0e0ff]/40 hover:text-[#e0e0ff]"}`}>
              <LayoutGrid size={14} />
            </button>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="p-1.5 rounded-lg hover:bg-[#1a1a3e] transition-colors text-[#a855f7] cursor-pointer">
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-3 flex-wrap">
        <button onClick={() => setFilterPriority(null)} className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${!filterPriority ? "bg-[rgba(168,85,247,0.2)] text-[#a855f7]" : "text-[#e0e0ff]/40 hover:text-[#e0e0ff]"}`}>
          Todas
        </button>
        {Object.entries(PRIORITY_CONFIG).map(([key, c]) => (
          <button key={key} onClick={() => setFilterPriority(filterPriority === key ? null : key)} className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${filterPriority === key ? `${c.bg} ${c.color}` : "text-[#e0e0ff]/40 hover:text-[#e0e0ff]"}`}>
            {c.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mb-4 p-3 rounded-xl bg-[#12122a]/50 border border-[rgba(168,85,247,0.2)] animate-slide-up">
          <input type="text" placeholder="Nombre de la tarea..." value={newTask.title}
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={e => e.key === "Enter" && addTask()}
            className="w-full bg-transparent border-b border-[rgba(168,85,247,0.15)] pb-2 mb-3 text-sm text-[#e0e0ff] outline-none placeholder:text-[#e0e0ff]/30 focus:border-[#a855f7]" autoFocus
          />
          <div className="flex gap-2 flex-wrap">
            <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value as "low" | "medium" | "high" })} className="bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1 text-xs text-[#e0e0ff] outline-none">
              <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option>
            </select>
            <input type="date" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} className="bg-[#1a1a3e] border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1 text-xs text-[#e0e0ff] outline-none" />
            <NeonButton onClick={addTask} variant="primary" size="sm">Agregar</NeonButton>
          </div>
        </div>
      )}

      {viewMode === "list" ? (
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <p className="text-center text-[#e0e0ff]/30 text-sm py-8">No hay tareas</p>
          ) : filteredTasks.map(renderTask)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {(["todo", "in_progress", "done"] as const).map(status => {
            const sc = STATUS_CONFIG[status]; const Icon = sc.icon;
            const st = filteredTasks.filter(t => t.status === status);
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={14} className={sc.color} />
                  <span className="text-xs font-medium text-[#e0e0ff]/70">{sc.label}</span>
                  <span className="text-[10px] text-[#e0e0ff]/30 bg-[#1a1a3e] px-1.5 py-0.5 rounded-full">{st.length}</span>
                </div>
                {st.map(task => {
                  const pc = PRIORITY_CONFIG[task.priority]; const progress = getSubtaskProgress(task.id);
                  return (
                    <div key={task.id} className="p-3 rounded-xl bg-[#12122a]/50 border border-[rgba(168,85,247,0.15)] hover:border-[rgba(168,85,247,0.4)] transition-all">
                      <p className="text-xs font-medium text-[#e0e0ff] mb-1">{task.title}</p>
                      {progress !== null && (
                        <div className="mb-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1 bg-[#1a1a3e] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#a855f7] to-[#06b6d4] rounded-full" style={{ width: `${progress}%` }} /></div>
                          <span className="text-[10px] text-[#e0e0ff]/40">{progress}%</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${pc.bg} ${pc.color} ${pc.border}`}>{pc.label}</span>
                        {task.due_date && <span className="text-[10px] text-[#e0e0ff]/30">{new Date(task.due_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
