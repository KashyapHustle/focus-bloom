import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";

import { TreeArt } from "@/components/TreeArt";
import { Button } from "@/components/ui/button";
import { TREES, RARITY_LABEL, type TreeRarity } from "@/lib/trees";
import { canUnlock, computeStats, formatCoins, treeRequirements } from "@/lib/stats";
import { selectTree, unlockTree, useAppState } from "@/lib/store";

export const Route = createFileRoute("/forest")({
  head: () => ({
    meta: [
      { title: "Forest — Focus Garden tree collection" },
      {
        name: "description",
        content:
          "Browse 37 collectible trees, see exactly what each one requires, unlock them with Focus Coins and choose your active tree.",
      },
      { property: "og:title", content: "Forest — Focus Garden tree collection" },
      {
        property: "og:description",
        content: "Common to legendary trees, each with clear coin, collection, hour and streak requirements.",
      },
    ],
  }),
  component: ForestPage,
});

const RARITIES: (TreeRarity | "all")[] = ["all", "common", "uncommon", "rare", "epic", "legendary"];

function ForestPage() {
  const state = useAppState();
  const stats = useMemo(() => computeStats(state), [state]);
  const [rarity, setRarity] = useState<TreeRarity | "all">("all");

  const trees = TREES.filter((t) => rarity === "all" || t.rarity === rarity);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Your forest</h1>
          <p className="text-sm text-muted-foreground">
            {state.unlockedTrees.length} of {TREES.length} trees unlocked ·{" "}
            {formatCoins(state.coins)} Focus Coins available
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RARITIES.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={rarity === r ? "default" : "outline"}
              className="rounded-full capitalize"
              onClick={() => setRarity(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {trees.map((tree) => {
          const unlocked = state.unlockedTrees.includes(tree.id);
          const active = state.activeTree === tree.id;
          const rows = treeRequirements(tree, state, stats);
          const ready = canUnlock(rows);

          return (
            <article
              key={tree.id}
              className={`surface lift flex flex-col p-4 ${active ? "ring-2 ring-primary" : ""}`}
            >
              <div className="relative mx-auto aspect-square w-32">
                <TreeArt
                  tree={tree}
                  growth={1}
                  className={`size-full text-foreground ${unlocked ? "" : "opacity-25 grayscale"}`}
                />
                {!unlocked && (
                  <span className="absolute inset-0 grid place-items-center">
                    <Lock className="size-6 text-muted-foreground" aria-hidden />
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-center font-display text-lg font-semibold">{tree.name}</h2>
              <p className="text-center text-xs uppercase tracking-wider text-muted-foreground">
                {RARITY_LABEL[tree.rarity]}
              </p>
              <p className="mt-1 text-center text-sm text-muted-foreground">{tree.blurb}</p>

              {!unlocked && (
                <ul className="mt-3 space-y-1 text-sm">
                  {rows.map((row) => (
                    <li
                      key={row.label}
                      className={`flex items-center gap-2 ${row.met ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {row.met ? (
                        <Check className="size-3.5 shrink-0" aria-hidden />
                      ) : (
                        <Lock className="size-3.5 shrink-0" aria-hidden />
                      )}
                      {row.display}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4">
                {unlocked ? (
                  active ? (
                    <Button className="w-full rounded-full" disabled>
                      <Check className="size-4" /> Active tree
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full rounded-full"
                      onClick={() => {
                        selectTree(tree.id);
                        toast.success(`${tree.name} is now your active tree`);
                      }}
                    >
                      Select
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full rounded-full"
                    disabled={!ready}
                    onClick={() => {
                      if (unlockTree(tree.id)) {
                        toast.success(`Unlocked ${tree.name}!`, {
                          description: `Spent ${formatCoins(tree.req.coins)} Focus Coins. It is now your active tree.`,
                        });
                      }
                    }}
                  >
                    {ready ? `Unlock for ${formatCoins(tree.req.coins)}` : "Requirements not met"}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
