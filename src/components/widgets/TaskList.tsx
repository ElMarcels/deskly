"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Calendar,
  LayoutGrid,
  List,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NeonButton from "@/components/ui/NeonButton";
import type { Task } from "@/types";

const PRIORITY_CONFIG = {
  low: { label: "Baja", color: "text-neon-cyan", bg: "bg-neon-cyan/10", border: "border-neon-cyan/30" },
  medium: { label: "Media", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  high: { label: "Alta", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
};

const STATUS_CONFIG = {
  todo: { label: "Por Hacer", icon: Circle, color: "text-foreground/50" },
  in_progress: { label: "En Progreso", icon: Clock, color: "text-neon-purple" },
  done: { label: "Completado", icon: CheckCircle2, color: "text-neon-cyan" },
};

export default function TaskList() {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showForm, setShowForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      user_id: "demo",
      subject_id: null,
      title: "Revisar apuntes de Cálculo",
      description: null,
      due_date: new Date(Date.now() + 86400000).toISOString(),
      priority: "high",
      status: "todo",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      user_id: "demo",
      subject_id: null,
      title: "Leer capítulo 3 de Física",
      description: null,
      due_date: new Date(Date.now() + 172800000).toISOString(),
      priority: "medium",
      status: "in_progress",
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      user_id: "demo",
      subject_id: null,
      title: "Practicar ejercicios de programación",
      description: null,
      due_date: new Date(Date.now() + 259200000).toISOString(),
      priority: "low",
      status: "done",
      created_at: new Date().toISOString(),
    },
  ]);

  const [newTask, setNewTask] = useState({
    title: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      user_id: "demo",
      subject_id: null,
      title: newTask.title,
      description: null,
      due_date: newTask.dueDate || null,
      priority: newTask.priority,
      status: "todo",
      created_at: new Date().toISOString(),
    };
    setTasks([task, ...tasks]);
    setNewTask({ title: "", dueDate: "", priority: "medium" });
    setShowForm(false);
  };

  const toggleStatus = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id !== id) return t;
        const statusOrder: Task["status"][] = ["todo", "in_progress", "done"];
        const nextIndex = (statusOrder.indexOf(t.status) + 1) % statusOrder.length;
        return { ...t, status: statusOrder[nextIndex] };
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const filteredTasks = tasks.filter(
    (t) => !filterPriority || t.priority === filterPriority
  );

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold gradient-neon">Tareas</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-light rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "list" ? "bg-neon-purple/20 text-neon-purple" : "text-foreground/40 hover:text-foreground"
              }`}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "kanban" ? "bg-neon-purple/20 text-neon-purple" : "text-foreground/40 hover:text-foreground"
              }`}
            >
              <LayoutGrid size={14} />
            </button>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="p-1.5 rounded-lg hover:bg-surface-light transition-colors text-neon-purple cursor-pointer"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setFilterPriority(null)}
          className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
            !filterPriority ? "bg-neon-purple/20 text-neon-purple" : "text-foreground/40 hover:text-foreground"
          }`}
        >
          Todas
        </button>
        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilterPriority(filterPriority === key ? null : key)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer ${
              filterPriority === key ? `${config.bg} ${config.color}` : "text-foreground/40 hover:text-foreground"
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mb-4 p-3 rounded-xl bg-surface/50 border border-glass-border animate-slide-up">
          <input
            type="text"
            placeholder="Nombre de la tarea..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="w-full bg-transparent border-b border-glass-border pb-2 mb-3 text-sm text-foreground outline-none placeholder:text-foreground/30 focus:border-neon-purple"
            autoFocus
          />
          <div className="flex gap-2 flex-wrap">
            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value as "low" | "medium" | "high" })
              }
              className="bg-surface-light border border-glass-border rounded-lg px-2 py-1 text-xs text-foreground outline-none"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              className="bg-surface-light border border-glass-border rounded-lg px-2 py-1 text-xs text-foreground outline-none"
            />
            <NeonButton onClick={addTask} variant="primary" size="sm">
              Agregar
            </NeonButton>
          </div>
        </div>
      )}

      {viewMode === "list" ? (
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <p className="text-center text-foreground/30 text-sm py-8">No hay tareas</p>
          ) : (
            filteredTasks.map((task) => {
              const priorityConf = PRIORITY_CONFIG[task.priority];
              const statusConf = STATUS_CONFIG[task.status];
              const StatusIcon = statusConf.icon;
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-glass-border hover:border-glass-border-hover transition-all group ${
                    task.status === "done" ? "opacity-50" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleStatus(task.id)}
                    className={`${statusConf.color} hover:scale-110 transition-transform cursor-pointer`}
                  >
                    <StatusIcon size={18} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        task.status === "done" ? "line-through text-foreground/40" : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-[10px] text-foreground/40 flex items-center gap-1 mt-0.5">
                        <Calendar size={10} />
                        {new Date(task.due_date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityConf.bg} ${priorityConf.color} ${priorityConf.border}`}
                  >
                    {priorityConf.label}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {(["todo", "in_progress", "done"] as const).map((status) => {
            const statusConf = STATUS_CONFIG[status];
            const StatusIcon = statusConf.icon;
            const statusTasks = filteredTasks.filter((t) => t.status === status);
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <StatusIcon size={14} className={statusConf.color} />
                  <span className="text-xs font-medium text-foreground/70">
                    {statusConf.label}
                  </span>
                  <span className="text-[10px] text-foreground/30 bg-surface-light px-1.5 py-0.5 rounded-full">
                    {statusTasks.length}
                  </span>
                </div>
                {statusTasks.map((task) => {
                  const priorityConf = PRIORITY_CONFIG[task.priority];
                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-xl bg-surface/50 border border-glass-border hover:border-glass-border-hover transition-all"
                    >
                      <p className="text-xs font-medium text-foreground mb-1">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border ${priorityConf.bg} ${priorityConf.color} ${priorityConf.border}`}
                        >
                          {priorityConf.label}
                        </span>
                        {task.due_date && (
                          <span className="text-[10px] text-foreground/30">
                            {new Date(task.due_date).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        )}
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
