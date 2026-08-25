export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  daily_study_goal: number;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "done";
  created_at: string;
  subject?: Subject;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  completed: boolean;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  updated_at: string;
  created_at: string;
}

export type PomodoroMode = "study" | "short_break" | "long_break";

export interface PomodoroSettings {
  studyDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export interface GradeEntry {
  id: string;
  name: string;
  grade: number;
  weight: number;
}
