import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/store";
import { TREES } from "@/lib/trees";
import {
  categoryBreakdown,
  computeStats,
  dailySeries,
  formatCoins,
  formatDuration,
  insights,
  weeklySummary,
} from "@/lib/stats";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Focus Garden statistics" },
      {
        name: "description",
        content:
          "Real statistics from your own sessions: focus time trends, sessions over time, category split, streaks and coins.",
      },
      { property: "og:title", content: "Insights — Focus Garden statistics" },
      {
        property: "og:description",
        content: "Focus time over 7 days, 30 days or 3 months, plus streaks, coins and personalized insights.",
      },
    ],
  }),
  component: InsightsPage,
});

const RANGES = [
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "3 months" },
] as const;

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function InsightsPage() {
  const state = useAppState();
  const [range, setRange] = useState<7 | 30 | 90>(7);

  const stats = useMemo(() => computeStats(state), [state]);
  const series = useMemo(() => dailySeries(state.sessions, range), [state.sessions, range]);
  const categories = useMemo(() => categoryBreakdown(state.sessions), [state.sessions]);
  const week = useMemo(() => weeklySummary(state.sessions), [state.sessions]);
  const tips = useMemo(() => insights(state), [state]);

  const hasData = state.sessions.length > 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Insights</h1>
        <p className="text-sm text-muted-foreground">
          Everything here comes from your own stored sessions.
        </p>
      </header>

      {!hasData && (
        <div className="surface p-8 text-center">
          <p className="font-display text-lg">No data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete a focus session and your real statistics will appear here — no placeholder
            numbers.
          </p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total focus" value={formatDuration(stats.totalFocusMs, true)} />
        <Stat label="Today" value={formatDuration(stats.todayFocusMs, true)} />
        <Stat label="This week" value={formatDuration(stats.weekFocusMs, true)} />
        <Stat label="This month" value={formatDuration(stats.monthFocusMs, true)} />
        <Stat label="Total sessions" value={String(stats.totalSessions)} />
        <Stat label="Sessions today" value={String(stats.todaySessions)} />
        <Stat label="Average session" value={formatDuration(stats.avgSessionMs, true)} />
        <Stat label="Longest session" value={formatDuration(stats.longestSessionMs, true)} />
        <Stat label="Current streak" value={`${stats.currentStreak} d`} />
        <Stat label="Longest streak" value={`${stats.longestStreak} d`} />
        <Stat label="Coins earned" value={formatCoins(state.coinsEarned)} />
        <Stat label="Coins spent" value={formatCoins(state.coinsSpent)} />
        <Stat label="Trees unlocked" value={`${state.unlockedTrees.length}/${TREES.length}`} />
        <Stat label="Completed sessions" value={String(stats.completedSessions)} />
        <Stat label="Coins available" value={formatCoins(state.coins)} />
        <Stat label="Active tree" value={state.activeTree.replace(/-/g, " ")} />
      </section>

      <section className="surface p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Focus time</h2>
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.key}
                size="sm"
                variant={range === r.key ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="focusFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <Tooltip
                formatter={(v: number) => [`${v} min`, "Focus"]}
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-popover-foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#focusFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-4 sm:p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Sessions completed</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  interval="preserveStartEnd"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                />
                <Bar dataKey="sessions" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface p-4 sm:p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Focus by category</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete a few sessions to see how your focus is distributed.
            </p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categories} layout="vertical" margin={{ left: 20, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    width={70}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v} min`, "Focus"]}
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Bar dataKey="minutes" radius={[0, 6, 6, 0]}>
                    {categories.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <section className="surface p-5">
        <h2 className="font-display text-lg font-semibold">This week</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Focus hours" value={formatDuration(week.focusMs, true)} />
          <Stat label="Sessions" value={String(week.sessions)} />
          <Stat label="Coins earned" value={formatCoins(week.coins)} />
          <Stat
            label="Best day"
            value={
              week.bestDay
                ? new Date(week.bestDay.key).toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                  })
                : "—"
            }
          />
          <Stat label="Avg session" value={formatDuration(week.avgSessionMs, true)} />
        </div>
      </section>

      <section className="surface p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Lightbulb className="size-4 text-primary" aria-hidden /> Personalized insights
        </h2>
        {tips.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Complete at least three sessions and we'll start spotting patterns in your real focus
            data.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {tips.map((tip) => (
              <li key={tip} className="rounded-xl bg-secondary px-3 py-2 text-secondary-foreground">
                {tip}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-display text-lg font-semibold capitalize">{value}</p>
    </div>
  );
}
