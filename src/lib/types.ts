export const CATEGORIES = [
  "Study",
  "Coding",
  "Research",
  "Writing",
  "Creative",
  "Work",
  "Personal",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: Category;
  createdAt: number;
  completedAt: number | null;
}

export interface SessionRecord {
  id: string;
  taskId: string | null;
  taskTitle: string;
  category: Category;
  plannedMs: number;
  focusedMs: number;
  coins: number;
  treeId: string;
  startedAt: number;
  endedAt: number;
  completed: boolean;
}

export type TimerStatus = "idle" | "running" | "paused";

export interface TimerState {
  status: TimerStatus;
  taskId: string | null;
  taskTitle: string;
  category: Category;
  plannedMs: number;
  startedAt: number;
  /** focused ms banked before the current running span */
  bankedMs: number;
  /** timestamp of the current running span start, null when paused */
  runningSince: number | null;
  treeId: string;
}

export interface AppState {
  version: number;
  tasks: Task[];
  sessions: SessionRecord[];
  coins: number;
  coinsEarned: number;
  coinsSpent: number;
  unlockedTrees: string[];
  activeTree: string;
  theme: "light" | "dark";
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  timer: TimerState | null;
}
