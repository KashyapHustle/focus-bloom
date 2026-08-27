import { TreeArt } from "./TreeArt";
import type { TreeDef } from "@/lib/trees";
import { formatClock } from "@/lib/stats";

interface Props {
  tree: TreeDef;
  remainingMs: number;
  progress: number;
  status: "idle" | "running" | "paused";
  label?: string;
}

const SIZE = 320;
const R = 142;
const C = 2 * Math.PI * R;

const PARTICLES = [
  { left: "18%", size: 4, delay: "0s", duration: "13s", opacity: 0.5 },
  { left: "34%", size: 3, delay: "3.5s", duration: "16s", opacity: 0.4 },
  { left: "52%", size: 5, delay: "1.8s", duration: "14.5s", opacity: 0.35 },
  { left: "68%", size: 3, delay: "6s", duration: "17s", opacity: 0.45 },
  { left: "82%", size: 4, delay: "8.5s", duration: "15s", opacity: 0.3 },
];

export function CircularTimer({ tree, remainingMs, progress, status, label }: Props) {
  const p = Math.min(1, Math.max(0, progress));
  const running = status === "running";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(85vw,360px)]">
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-3 transition-opacity duration-700 ${
          running ? "timer-glow opacity-100" : "opacity-0"
        }`}
      />

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full -rotate-90">

        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - p)}
          className="text-primary transition-[stroke-dashoffset] duration-700 ease-linear"
        />
      </svg>

      <div className="absolute inset-6 overflow-hidden rounded-full bg-card/70">
        <TreeArt
          tree={tree}
          growth={status === "idle" ? 0.06 : Math.max(0.06, p)}
          className={`absolute inset-x-0 bottom-0 top-2 size-full text-foreground ${
            status === "running" ? "animate-sway" : ""
          }`}
        />
      </div>

      <div className="absolute inset-x-0 top-[26%] flex flex-col items-center">
        <span
          className="font-display text-5xl font-semibold tabular-nums text-foreground drop-shadow-sm sm:text-6xl"
          aria-live="polite"
        >
          {formatClock(remainingMs)}
        </span>
        {label && <span className="mt-1 text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
