import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Coffee, Pause, Play, RotateCcw, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";

import { CircularTimer } from "@/components/CircularTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTree } from "@/lib/trees";
import {
  COINS_PER_MINUTE,
  COMPLETION_BONUS,
  endSession,
  focusedMs,
  hydrate,
  pauseSession,
  resetSession,
  resumeSession,
  startSession,
  useAppState,
} from "@/lib/store";
import { breakSuggestion, formatCoins, formatDuration, MINUTE } from "@/lib/stats";
import { CATEGORIES, type Category } from "@/lib/types";
import { playChime, requestNotificationPermission, sendNotification } from "@/lib/notify";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Focus Garden — Focus timer that grows a forest" },
      {
        name: "description",
        content:
          "Pick a task, choose a focus duration from 1 minute to 10 hours, and grow a tree while you work. Earn 10 Focus Coins per focused minute.",
      },
      { property: "og:title", content: "Focus Garden — Focus timer that grows a forest" },
      {
        property: "og:description",
        content: "A calm focus timer: grow trees, earn Focus Coins and build your own digital forest.",
      },
    ],
  }),
  component: TimerPage,
});

const PRESETS = [10, 25, 45, 60, 90, 120];

function TimerPage() {
  const state = useAppState();
  const [now, setNow] = useState(() => Date.now());
  const [minutes, setMinutes] = useState(25);
  const [customMinutes, setCustomMinutes] = useState("30");
  const [taskId, setTaskId] = useState<string>("none");
  const [category, setCategory] = useState<Category>("Study");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [breakUntil, setBreakUntil] = useState<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const timer = state.timer;
  const activeTree = getTree(timer?.treeId ?? state.activeTree);
  const elapsed = timer ? focusedMs(timer, now) : 0;
  const remaining = timer ? Math.max(0, timer.plannedMs - elapsed) : minutes * MINUTE;
  const progress = timer ? Math.min(1, elapsed / timer.plannedMs) : 0;
  const earnedSoFar = Math.floor(elapsed / MINUTE) * COINS_PER_MINUTE;

  const activeTasks = useMemo(() => state.tasks.filter((t) => !t.completedAt), [state.tasks]);
  const selectedTask = activeTasks.find((t) => t.id === taskId) ?? null;

  // Auto-complete when the planned duration is reached (timestamp based).
  useEffect(() => {
    if (!timer || timer.status !== "running") {
      finishedRef.current = false;
      return;
    }
    if (elapsed >= timer.plannedMs && !finishedRef.current) {
      finishedRef.current = true;
      const record = endSession(true);
      if (record) {
        if (state.soundEnabled) playChime();
        if (state.notificationsEnabled) {
          sendNotification(
            "Focus session complete 🌳",
            `${formatDuration(record.focusedMs, true)} focused · +${formatCoins(record.coins)} Focus Coins`,
          );
        }
        toast.success("Session complete!", {
          description: `${formatDuration(record.focusedMs, true)} focused · +${formatCoins(record.coins)} coins (incl. ${COMPLETION_BONUS} bonus)`,
        });
        const suggestion = breakSuggestion(Math.floor(record.focusedMs / MINUTE));
        if (suggestion) {
          setBreakUntil(Date.now());
          toast("Break suggested", { description: suggestion });
        }
      }
    }
  }, [elapsed, timer, state.soundEnabled, state.notificationsEnabled]);

  const start = async () => {
    const planned = Math.round(minutes * MINUTE);
    if (planned < MINUTE) return;
    startSession({ task: selectedTask, category, plannedMs: planned });
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      const granted = await requestNotificationPermission();
      if (granted) {
        // remember the choice so completed sessions notify next time
        const { setSetting } = await import("@/lib/store");
        setSetting("notificationsEnabled", true);
      }
    }
  };

  const confirmEndSession = () => {
    const record = endSession(false);
    setConfirmEnd(false);
    if (record) {
      toast("Session ended early", {
        description: `${formatDuration(record.focusedMs, true)} focused · +${formatCoins(record.coins)} coins kept`,
      });
      const suggestion = breakSuggestion(Math.floor(record.focusedMs / MINUTE));
      if (suggestion) setBreakUntil(Date.now());
    }
  };

  const lastSuggestion = breakSuggestion(Math.floor(elapsed / MINUTE));

  const setPreset = (m: number) => {
    setMinutes(m);
    setCustomMinutes(String(m));
  };

  return (
    <div className="space-y-6">
      <section className="surface p-5 sm:p-8">
        <div className="text-center">
          {timer ? (
            <>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {timer.category}
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold">{timer.taskTitle}</h1>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                Plant a tree with your next focus session
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Earn {COINS_PER_MINUTE} Focus Coins for every focused minute.
              </p>
            </>
          )}
        </div>

        <div className="mt-6">
          <CircularTimer
            tree={activeTree}
            remainingMs={remaining}
            progress={timer ? progress : 0}
            status={timer?.status ?? "idle"}
            label={
              timer
                ? `${activeTree.name} · +${formatCoins(earnedSoFar)} coins so far`
                : `${activeTree.name} · ready`
            }
          />
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {!timer && (
            <Button size="lg" className="rounded-full px-8" onClick={start}>
              <Play className="size-4" /> Start focus
            </Button>
          )}
          {timer?.status === "running" && (
            <Button size="lg" variant="secondary" className="rounded-full px-6" onClick={pauseSession}>
              <Pause className="size-4" /> Pause
            </Button>
          )}
          {timer?.status === "paused" && (
            <Button size="lg" className="rounded-full px-6" onClick={resumeSession}>
              <Play className="size-4" /> Resume
            </Button>
          )}
          {timer && (
            <>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full"
                onClick={() => setConfirmEnd(true)}
              >
                <Square className="size-4" /> End session
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  resetSession();
                  toast("Session discarded", { description: "No coins were awarded." });
                }}
              >
                <RotateCcw className="size-4" /> Reset
              </Button>
            </>
          )}
        </div>

        {timer && lastSuggestion && (
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Coffee className="size-4" aria-hidden /> {lastSuggestion} when you finish — entirely optional.
          </p>
        )}

        {breakUntil && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-sm">
            <span>Break suggested. Rest your eyes, stretch, get water.</span>
            <Button size="sm" variant="secondary" onClick={() => setBreakUntil(null)}>
              Skip
            </Button>
            <Button size="sm" onClick={() => setBreakUntil(null)}>
              Break taken
            </Button>
          </div>
        )}
      </section>

      {/* Setup */}
      {!timer && (
        <section className="surface space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Task</Label>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Free focus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Free focus (no task)</SelectItem>
                  {activeTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title} · {task.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Manage tasks in the{" "}
                <Link to="/tasks" className="underline underline-offset-4">
                  Tasks
                </Link>{" "}
                section.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={selectedTask ? selectedTask.category : category}
                onValueChange={(v) => setCategory(v as Category)}
                disabled={!!selectedTask}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTask && (
                <p className="text-xs text-muted-foreground">Taken from the selected task.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Duration</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={minutes === m ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setPreset(m)}
                >
                  {m >= 60 ? `${m / 60}h` : `${m} min`}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="custom" className="text-xs text-muted-foreground">
                  Custom (1–600 minutes)
                </Label>
                <Input
                  id="custom"
                  type="number"
                  min={1}
                  max={600}
                  value={customMinutes}
                  className="w-36"
                  onChange={(e) => {
                    setCustomMinutes(e.target.value);
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v >= 1 && v <= 600) setMinutes(Math.round(v));
                  }}
                />
              </div>
              <p className="pb-2 text-sm text-muted-foreground">
                {formatDuration(minutes * MINUTE)} · up to{" "}
                <strong className="text-foreground">
                  {formatCoins(minutes * COINS_PER_MINUTE + COMPLETION_BONUS)}
                </strong>{" "}
                coins
              </p>
            </div>
            {breakSuggestion(minutes) && (
              <p className="text-xs text-muted-foreground">
                Suggested afterwards: {breakSuggestion(minutes)}.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Recent sessions */}
      <section className="surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden /> Recent sessions
        </h2>
        {state.sessions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No sessions yet. Your first finished session will appear here.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {state.sessions.slice(0, 6).map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <span className="size-9 shrink-0">
                  <TreeThumb id={s.treeId} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.taskTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.category} · {formatDuration(s.focusedMs, true)} ·{" "}
                    {s.completed ? "completed" : "ended early"}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary">+{formatCoins(s.coins)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this session early?</AlertDialogTitle>
            <AlertDialogDescription>
              You have focused for {formatDuration(elapsed, true)} of your planned{" "}
              {formatDuration(timer?.plannedMs ?? 0, true)}. You keep the{" "}
              {formatCoins(earnedSoFar)} coins already earned, but this will not count as a completed
              planned session and the completion bonus is not awarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep focusing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndSession}>End session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TreeThumb({ id }: { id: string }) {
  const tree = getTree(id);
  return <TreeArtLazy id={tree.id} />;
}

function TreeArtLazy({ id }: { id: string }) {
  const tree = getTree(id);
  const { TreeArt } = require_treeart();
  return <TreeArt tree={tree} growth={1} showGround={false} className="size-full text-foreground" />;
}

// Small helper keeps the import in one place without a circular dependency.
function require_treeart() {
  return TreeArtModule;
}

import * as TreeArtModule from "@/components/TreeArt";
