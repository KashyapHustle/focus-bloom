import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addTask, deleteTask, toggleTaskComplete, useAppState } from "@/lib/store";
import { formatDuration } from "@/lib/stats";
import { CATEGORIES, type Category } from "@/lib/types";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Focus Garden" },
      {
        name: "description",
        content:
          "Create, categorise and complete the tasks you focus on. Every finished session is linked back to its task.",
      },
      { property: "og:title", content: "Tasks — Focus Garden" },
      {
        property: "og:description",
        content: "Plan what to focus on: categories, descriptions, active and completed tasks.",
      },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const state = useAppState();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Study");
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Category>("all");

  const tasks = useMemo(() => {
    return state.tasks.filter((task) => {
      if (filter === "active" && task.completedAt) return false;
      if (filter === "completed" && !task.completedAt) return false;
      if (categoryFilter !== "all" && task.category !== categoryFilter) return false;
      return true;
    });
  }, [state.tasks, filter, categoryFilter]);

  const focusByTask = useMemo(() => {
    const map = new Map<string, { ms: number; count: number; coins: number }>();
    state.sessions.forEach((s) => {
      if (!s.taskId) return;
      const cur = map.get(s.taskId) ?? { ms: 0, count: 0, coins: 0 };
      map.set(s.taskId, { ms: cur.ms + s.focusedMs, count: cur.count + 1, coins: cur.coins + s.coins });
    });
    return map;
  }, [state.sessions]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title, description, category });
    setTitle("");
    setDescription("");
    toast.success("Task added");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          What are you growing today? Pick a task before starting a session.
        </p>
      </header>

      <form onSubmit={submit} className="surface space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="title">Task</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Read chapter 4 of the algorithms book"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger id="category">
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
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">Notes (optional)</Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Anything that helps future you"
          />
        </div>
        <Button type="submit" className="rounded-full">
          <Plus className="size-4" /> Add task
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {(["active", "completed", "all"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            className="rounded-full capitalize"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
        <div className="ml-auto w-44">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as Category | "all")}>
            <SelectTrigger aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ul className="space-y-3">
        {tasks.length === 0 && (
          <li className="surface p-6 text-center text-sm text-muted-foreground">
            No tasks here yet.
          </li>
        )}
        {tasks.map((task) => {
          const stats = focusByTask.get(task.id);
          return (
            <li key={task.id} className="surface lift flex items-start gap-3 p-4">
              <button
                type="button"
                onClick={() => toggleTaskComplete(task.id)}
                aria-label={task.completedAt ? "Mark as active" : "Mark as complete"}
                className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-colors ${
                  task.completedAt
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary"
                }`}
              >
                {task.completedAt ? <Check className="size-3.5" /> : null}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`font-medium ${task.completedAt ? "text-muted-foreground line-through" : ""}`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
                    {task.category}
                  </span>{" "}
                  {stats
                    ? `· ${formatDuration(stats.ms, true)} focused across ${stats.count} session${stats.count > 1 ? "s" : ""} · ${stats.coins} coins`
                    : "· no focus time yet"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {task.completedAt && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Reopen task"
                    onClick={() => toggleTaskComplete(task.id)}
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete task"
                  onClick={() => {
                    deleteTask(task.id);
                    toast("Task deleted");
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
