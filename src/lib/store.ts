import { useSyncExternalStore } from "react";
import type { AppState, Category, SessionRecord, Task, TimerState } from "./types";
import { getTree } from "./trees";

const KEY = "focus-garden-state-v1";

export const COINS_PER_MINUTE = 10;
/** bonus coins for finishing the full planned duration */
export const COMPLETION_BONUS = 25;

const initialState = (): AppState => ({
  version: 1,
  tasks: [],
  sessions: [],
  coins: 0,
  coinsEarned: 0,
  coinsSpent: 0,
  unlockedTrees: ["sprout", "oak"],
  activeTree: "oak",
  theme: "light",
  soundEnabled: true,
  notificationsEnabled: false,
  timer: null,
});

let state: AppState = initialState();
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      state = { ...initialState(), ...parsed };
    }
  } catch {
    /* ignore corrupt state */
  }
  applyTheme(state.theme);
  emit();
}

export function setState(updater: (prev: AppState) => AppState) {
  state = updater(state);
  persist();
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverSnapshot = initialState();
const getSnapshot = () => state;
const getServerSnapshot = () => serverSnapshot;

export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/* ------------------------------- theme ---------------------------------- */

export function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function toggleTheme() {
  setState((s) => {
    const theme = s.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    return { ...s, theme };
  });
}

export function setSetting(key: "soundEnabled" | "notificationsEnabled", value: boolean) {
  setState((s) => ({ ...s, [key]: value }));
}

/* -------------------------------- tasks --------------------------------- */

export function addTask(input: { title: string; description?: string; category: Category }): Task {
  const task: Task = {
    id: uid(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    category: input.category,
    createdAt: Date.now(),
    completedAt: null,
  };
  setState((s) => ({ ...s, tasks: [task, ...s.tasks] }));
  return task;
}

export function toggleTaskComplete(id: string) {
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((task) =>
      task.id === id ? { ...task, completedAt: task.completedAt ? null : Date.now() } : task,
    ),
  }));
}

export function deleteTask(id: string) {
  setState((s) => ({ ...s, tasks: s.tasks.filter((task) => task.id !== id) }));
}

export function updateTask(id: string, patch: Partial<Omit<Task, "id">>) {
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
  }));
}

/* -------------------------------- timer --------------------------------- */

export function focusedMs(timer: TimerState, now = Date.now()) {
  return timer.bankedMs + (timer.runningSince ? now - timer.runningSince : 0);
}

export function startSession(options: {
  task: Task | null;
  category: Category;
  plannedMs: number;
}) {
  const now = Date.now();
  setState((s) => ({
    ...s,
    timer: {
      status: "running",
      taskId: options.task?.id ?? null,
      taskTitle: options.task?.title ?? "Free focus",
      category: options.task?.category ?? options.category,
      plannedMs: options.plannedMs,
      startedAt: now,
      bankedMs: 0,
      runningSince: now,
      treeId: s.activeTree,
    },
  }));
}

export function pauseSession() {
  setState((s) => {
    if (!s.timer || s.timer.status !== "running") return s;
    return {
      ...s,
      timer: {
        ...s.timer,
        status: "paused",
        bankedMs: focusedMs(s.timer),
        runningSince: null,
      },
    };
  });
}

export function resumeSession() {
  setState((s) => {
    if (!s.timer || s.timer.status !== "paused") return s;
    return { ...s, timer: { ...s.timer, status: "running", runningSince: Date.now() } };
  });
}

export function resetSession() {
  setState((s) => ({ ...s, timer: null }));
}

/** Ends the session, banks coins for whole focused minutes, returns the record. */
export function endSession(completed: boolean): SessionRecord | null {
  let record: SessionRecord | null = null;
  setState((s) => {
    const timer = s.timer;
    if (!timer) return s;
    const total = Math.min(focusedMs(timer), timer.plannedMs);
    const minutes = Math.floor(total / 60000);
    const bonus = completed && minutes > 0 ? COMPLETION_BONUS : 0;
    const coins = minutes * COINS_PER_MINUTE + bonus;
    record = {
      id: uid(),
      taskId: timer.taskId,
      taskTitle: timer.taskTitle,
      category: timer.category,
      plannedMs: timer.plannedMs,
      focusedMs: total,
      coins,
      treeId: timer.treeId,
      startedAt: timer.startedAt,
      endedAt: Date.now(),
      completed,
    };
    return {
      ...s,
      timer: null,
      coins: s.coins + coins,
      coinsEarned: s.coinsEarned + coins,
      sessions: [record, ...s.sessions],
    };
  });
  return record;
}

/* -------------------------------- trees --------------------------------- */

export function unlockTree(id: string): boolean {
  const tree = getTree(id);
  let ok = false;
  setState((s) => {
    if (s.unlockedTrees.includes(id) || s.coins < tree.req.coins) return s;
    ok = true;
    return {
      ...s,
      coins: s.coins - tree.req.coins,
      coinsSpent: s.coinsSpent + tree.req.coins,
      unlockedTrees: [...s.unlockedTrees, id],
      activeTree: id,
    };
  });
  return ok;
}

export function selectTree(id: string) {
  setState((s) => (s.unlockedTrees.includes(id) ? { ...s, activeTree: id } : s));
}

export function resetAllProgress() {
  state = initialState();
  applyTheme(state.theme);
  persist();
  emit();
}
