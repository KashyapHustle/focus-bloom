import type { AppState, Category, SessionRecord } from "./types";
import { CATEGORIES } from "./types";
import { getTree, TREES, type TreeDef } from "./trees";

export const MINUTE = 60000;
export const HOUR = 3600000;

export const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function formatDuration(ms: number, compact = false) {
  const totalMinutes = Math.floor(ms / MINUTE);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (compact) return h > 0 ? `${h}h ${m}m` : `${m}m`;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export const formatCoins = (n: number) => n.toLocaleString();

/* ------------------------------- streaks -------------------------------- */

export function computeStreaks(sessions: SessionRecord[]) {
  const days = Array.from(new Set(sessions.map((s) => dayKey(s.endedAt)))).sort();
  if (days.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1] as string).getTime();
    const cur = new Date(days[i] as string).getTime();
    const diff = Math.round((cur - prev) / 86400000);
    run = diff === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - 86400000);
  const last = days[days.length - 1] as string;
  let current = 0;
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      const diff = Math.round(
        (new Date(days[i] as string).getTime() - new Date(days[i - 1] as string).getTime()) /
          86400000,
      );
      if (diff === 1) current++;
      else break;
    }
  }
  return { current, longest };
}

/* ------------------------------ aggregates ------------------------------ */

export interface Stats {
  totalFocusMs: number;
  todayFocusMs: number;
  weekFocusMs: number;
  monthFocusMs: number;
  totalSessions: number;
  todaySessions: number;
  completedSessions: number;
  avgSessionMs: number;
  longestSessionMs: number;
  currentStreak: number;
  longestStreak: number;
  totalHours: number;
}

export function computeStats(state: AppState): Stats {
  const sessions = state.sessions;
  const now = Date.now();
  const today = dayKey(now);
  const sum = (list: SessionRecord[]) => list.reduce((acc, s) => acc + s.focusedMs, 0);
  const totalFocusMs = sum(sessions);
  const streaks = computeStreaks(sessions);
  return {
    totalFocusMs,
    todayFocusMs: sum(sessions.filter((s) => dayKey(s.endedAt) === today)),
    weekFocusMs: sum(sessions.filter((s) => now - s.endedAt <= 7 * 86400000)),
    monthFocusMs: sum(sessions.filter((s) => now - s.endedAt <= 30 * 86400000)),
    totalSessions: sessions.length,
    todaySessions: sessions.filter((s) => dayKey(s.endedAt) === today).length,
    completedSessions: sessions.filter((s) => s.completed).length,
    avgSessionMs: sessions.length ? Math.round(totalFocusMs / sessions.length) : 0,
    longestSessionMs: sessions.reduce((m, s) => Math.max(m, s.focusedMs), 0),
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    totalHours: totalFocusMs / HOUR,
  };
}

export function dailySeries(sessions: SessionRecord[], days: number) {
  const out: { date: string; label: string; minutes: number; sessions: number }[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start.getTime() - i * 86400000);
    const key = dayKey(d.getTime());
    const matching = sessions.filter((s) => dayKey(s.endedAt) === key);
    out.push({
      date: key,
      label:
        days <= 7
          ? d.toLocaleDateString(undefined, { weekday: "short" })
          : d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      minutes: Math.round(matching.reduce((a, s) => a + s.focusedMs, 0) / MINUTE),
      sessions: matching.length,
    });
  }
  return out;
}

export function categoryBreakdown(sessions: SessionRecord[]) {
  return CATEGORIES.map((category) => ({
    category,
    minutes: Math.round(
      sessions.filter((s) => s.category === category).reduce((a, s) => a + s.focusedMs, 0) / MINUTE,
    ),
  })).filter((row) => row.minutes > 0);
}

export function weeklySummary(sessions: SessionRecord[]) {
  const now = Date.now();
  const week = sessions.filter((s) => now - s.endedAt <= 7 * 86400000);
  const byDay = new Map<string, number>();
  week.forEach((s) => byDay.set(dayKey(s.endedAt), (byDay.get(dayKey(s.endedAt)) ?? 0) + s.focusedMs));
  let bestDay: { key: string; ms: number } | null = null;
  byDay.forEach((ms, key) => {
    if (!bestDay || ms > bestDay.ms) bestDay = { key, ms };
  });
  const focusMs = week.reduce((a, s) => a + s.focusedMs, 0);
  return {
    focusMs,
    sessions: week.length,
    coins: week.reduce((a, s) => a + s.coins, 0),
    bestDay: bestDay as { key: string; ms: number } | null,
    avgSessionMs: week.length ? Math.round(focusMs / week.length) : 0,
  };
}

export function insights(state: AppState): string[] {
  const sessions = state.sessions;
  if (sessions.length < 3) return [];
  const out: string[] = [];

  const byCategory = new Map<Category, number>();
  sessions.forEach((s) => byCategory.set(s.category, (byCategory.get(s.category) ?? 0) + s.focusedMs));
  const topCategory = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    out.push(
      `Most of your focus goes into ${topCategory[0]} — ${formatDuration(topCategory[1], true)} so far.`,
    );
  }

  const byWeekday = new Map<number, number>();
  sessions.forEach((s) => {
    const d = new Date(s.endedAt).getDay();
    byWeekday.set(d, (byWeekday.get(d) ?? 0) + s.focusedMs);
  });
  const topDay = [...byWeekday.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topDay) {
    const name = new Date(2024, 0, 7 + topDay[0]).toLocaleDateString(undefined, { weekday: "long" });
    out.push(`${name} is your strongest focus day.`);
  }

  const stats = computeStats(state);
  out.push(
    `Your average session is ${formatDuration(stats.avgSessionMs, true)}; your longest was ${formatDuration(stats.longestSessionMs, true)}.`,
  );
  const completionRate = Math.round((stats.completedSessions / stats.totalSessions) * 100);
  out.push(`You finish ${completionRate}% of the sessions you plan.`);
  if (stats.currentStreak > 1) out.push(`You are on a ${stats.currentStreak}-day focus streak.`);
  return out;
}

/* ------------------------------ break rules ----------------------------- */

export function breakSuggestion(focusMinutes: number): string | null {
  if (focusMinutes < 25) return null;
  if (focusMinutes <= 50) return "Take a 5-minute break";
  if (focusMinutes <= 90) return "Take a 10-minute break";
  if (focusMinutes <= 120) return "Take a 15-minute break";
  return "Take a 15–20 minute break";
}

/* ----------------------------- tree progress ---------------------------- */

export interface RequirementRow {
  label: string;
  have: number;
  need: number;
  met: boolean;
  display: string;
}

export function treeRequirements(tree: TreeDef, state: AppState, stats: Stats): RequirementRow[] {
  const rows: RequirementRow[] = [];
  rows.push({
    label: "Focus Coins",
    have: state.coins,
    need: tree.req.coins,
    met: state.coins >= tree.req.coins,
    display: `${formatCoins(Math.min(state.coins, tree.req.coins))}/${formatCoins(tree.req.coins)} Focus Coins`,
  });
  if (tree.req.trees) {
    const have = state.unlockedTrees.length;
    rows.push({
      label: "Trees Unlocked",
      have,
      need: tree.req.trees,
      met: have >= tree.req.trees,
      display: `${Math.min(have, tree.req.trees)}/${tree.req.trees} Trees Unlocked`,
    });
  }
  if (tree.req.hours) {
    const have = stats.totalHours;
    rows.push({
      label: "Focus Hours",
      have,
      need: tree.req.hours,
      met: have >= tree.req.hours,
      display: `${Math.min(have, tree.req.hours).toFixed(1)}/${tree.req.hours} Focus Hours`,
    });
  }
  if (tree.req.streak) {
    const have = stats.longestStreak;
    rows.push({
      label: "Day Streak",
      have,
      need: tree.req.streak,
      met: have >= tree.req.streak,
      display: `${Math.min(have, tree.req.streak)}/${tree.req.streak} Day Streak`,
    });
  }
  return rows;
}

export function canUnlock(rows: RequirementRow[]) {
  return rows.every((r) => r.met);
}

export function sortedTrees() {
  return TREES;
}

export { getTree };
