export type TreeShape =
  | "sprout"
  | "broadleaf"
  | "conifer"
  | "blossom"
  | "willow"
  | "palm"
  | "bonsai"
  | "cactus"
  | "bamboo"
  | "crystal";

export type TreeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface TreeRequirement {
  /** Focus Coins spent to unlock */
  coins: number;
  /** number of other trees already unlocked */
  trees?: number;
  /** lifetime focus hours */
  hours?: number;
  /** longest daily streak reached */
  streak?: number;
}

export interface TreeDef {
  id: string;
  name: string;
  shape: TreeShape;
  rarity: TreeRarity;
  trunk: string;
  leaf: string;
  leafAlt: string;
  accent?: string;
  glow?: boolean;
  req: TreeRequirement;
  blurb: string;
}

const t = (
  id: string,
  name: string,
  shape: TreeShape,
  rarity: TreeRarity,
  trunk: string,
  leaf: string,
  leafAlt: string,
  req: TreeRequirement,
  blurb: string,
  extra: Partial<TreeDef> = {},
): TreeDef => ({ id, name, shape, rarity, trunk, leaf, leafAlt, req, blurb, ...extra });

/**
 * Progression design
 * - common: cheap starters, coins only (a few short sessions)
 * - uncommon: coins + a small collection requirement
 * - rare: coins + collection + lifetime focus hours
 * - epic: heavier coins + hours
 * - legendary: long-term goals (coins, collection, hours, streak)
 * 10 coins per focused minute => 600 coins/hour.
 */
export const TREES: TreeDef[] = [
  // ---------- COMMON (8) ----------
  t("sprout", "Little Sprout", "sprout", "common", "#7a5a3a", "#7cc06a", "#a8dc8c", { coins: 0 }, "Where every forest begins."),
  t("oak", "Garden Oak", "broadleaf", "common", "#7a5638", "#4f9d52", "#78c06a", { coins: 300 }, "Sturdy, patient, dependable."),
  t("pine", "Quiet Pine", "conifer", "common", "#6b4a30", "#2f7a54", "#48a06b", { coins: 500 }, "Smells like cold mornings."),
  t("birch", "Paper Birch", "broadleaf", "common", "#cfc7b6", "#8bc16a", "#b6dd8c", { coins: 800 }, "Bright bark, light leaves."),
  t("maple", "Sugar Maple", "broadleaf", "common", "#7d5334", "#d9803f", "#f0ac5c", { coins: 1200, trees: 2 }, "Autumn in a single tree."),
  t("fern-tree", "Fern Tree", "palm", "common", "#6f5a3c", "#5aa860", "#86c97f", { coins: 1600, trees: 2 }, "Soft green umbrellas."),
  t("apple", "Apple Tree", "broadleaf", "common", "#7a5638", "#4a9b4f", "#7bc06a", { coins: 2000, trees: 3 }, "Rewards those who wait.", { accent: "#e2564a" }),
  t("cypress", "Slim Cypress", "conifer", "common", "#6a4b33", "#3c7f4f", "#5da268", { coins: 2400, trees: 3 }, "Tall and unbothered."),

  // ---------- UNCOMMON (9) ----------
  t("willow", "Weeping Willow", "willow", "uncommon", "#7b6142", "#7ab86a", "#a6d68d", { coins: 3200, trees: 4 }, "Calm hanging curtains of green."),
  t("bamboo", "Bamboo Grove", "bamboo", "uncommon", "#9aa85c", "#79b45c", "#a8d17f", { coins: 3800, trees: 4 }, "Grows fast, bends, never breaks."),
  t("sakura", "Sakura Blossom", "blossom", "uncommon", "#7a5a4a", "#f2b6cd", "#ffd7e6", { coins: 4600, trees: 5, hours: 3 }, "Pink snow in spring."),
  t("olive", "Olive Tree", "broadleaf", "uncommon", "#8a7a5e", "#8fae7a", "#bccf9c", { coins: 5200, trees: 5, hours: 4 }, "Mediterranean patience."),
  t("palm", "Coastal Palm", "palm", "uncommon", "#9b7a4e", "#4fa87a", "#78c79a", { coins: 6000, trees: 6, hours: 5 }, "Salt air and slow days."),
  t("redwood", "Young Redwood", "conifer", "uncommon", "#8a4a34", "#2f6f4c", "#4d9268", { coins: 6800, trees: 6, hours: 6 }, "Small now. Enormous later."),
  t("bonsai", "Zen Bonsai", "bonsai", "uncommon", "#6b4a34", "#4b9a63", "#7cbd85", { coins: 7600, trees: 7, hours: 7 }, "Tiny tree, huge discipline."),
  t("jacaranda", "Jacaranda", "broadleaf", "uncommon", "#6f5544", "#8f7ad6", "#b7a7ee", { coins: 8600, trees: 7, hours: 8 }, "Violet clouds overhead."),
  t("saguaro", "Desert Saguaro", "cactus", "uncommon", "#4f7a4a", "#63a05c", "#89c07c", { coins: 9600, trees: 8, hours: 9 }, "Thrives on very little."),

  // ---------- RARE (9) ----------
  t("ginkgo", "Golden Ginkgo", "broadleaf", "rare", "#7a6242", "#e3c14a", "#f5dc84", { coins: 11000, trees: 9, hours: 11 }, "A living fossil in gold."),
  t("baobab", "Baobab", "broadleaf", "rare", "#a08258", "#6f9b52", "#95bd77", { coins: 12500, trees: 10, hours: 13 }, "The upside-down giant."),
  t("cedar", "Ancient Cedar", "conifer", "rare", "#6a4632", "#2b6b4f", "#43906a", { coins: 14000, trees: 11, hours: 15 }, "Older than the questions you ask it."),
  t("plum", "Winter Plum", "blossom", "rare", "#5f4038", "#e07fa6", "#ffb6cd", { coins: 15500, trees: 12, hours: 17 }, "Blooms while it is still cold."),
  t("banyan", "Banyan Elder", "willow", "rare", "#8a6a4a", "#4f9457", "#7cbb74", { coins: 17000, trees: 13, hours: 19 }, "A single tree, a whole grove."),
  t("frost-fir", "Frost Fir", "conifer", "rare", "#5c5a55", "#7fb8c8", "#b9e0e8", { coins: 19000, trees: 14, hours: 22 }, "Holds the quiet of snow."),
  t("mangrove", "Mangrove", "palm", "rare", "#6b5240", "#3f8f6a", "#69b48c", { coins: 21000, trees: 15, hours: 25 }, "Roots that build coastlines."),
  t("flame-tree", "Flame Tree", "broadleaf", "rare", "#6f4a34", "#e0562f", "#f79052", { coins: 23000, trees: 16, hours: 28 }, "Burns bright without smoke."),
  t("mist-bonsai", "Mist Bonsai", "bonsai", "rare", "#5f4b3a", "#6fae9b", "#a4d3c5", { coins: 25000, trees: 17, hours: 31 }, "Grown in morning fog."),

  // ---------- EPIC (7) ----------
  t("aurora-pine", "Aurora Pine", "conifer", "epic", "#4d4a52", "#4fb6a8", "#9de7d6", { coins: 30000, trees: 18, hours: 36, streak: 3 }, "Northern lights caught in needles.", { glow: true }),
  t("moon-willow", "Moon Willow", "willow", "epic", "#5a5568", "#9fb6e8", "#cfdcff", { coins: 34000, trees: 19, hours: 42, streak: 4 }, "Silver strands that sway at night.", { glow: true }),
  t("ember-oak", "Ember Oak", "broadleaf", "epic", "#5a3a2c", "#c2432f", "#ef8a4d", { coins: 38000, trees: 20, hours: 48, streak: 5 }, "Coals glowing in the canopy.", { glow: true }),
  t("starfruit", "Starfruit Tree", "palm", "epic", "#7a6440", "#88c85f", "#d3ec8e", { coins: 43000, trees: 21, hours: 55, streak: 5 }, "Fruit shaped like small stars.", { accent: "#ffd76a", glow: true }),
  t("coral-blossom", "Coral Blossom", "blossom", "epic", "#6b4a4a", "#ff8f8f", "#ffc7c0", { coins: 48000, trees: 22, hours: 62, streak: 6 }, "Reef colours on land.", { glow: true }),
  t("obsidian-bamboo", "Obsidian Bamboo", "bamboo", "epic", "#3f4048", "#5f7f7a", "#8fb3a8", { coins: 54000, trees: 23, hours: 70, streak: 7 }, "Dark stalks, sharp focus.", { glow: true }),
  t("prism-cactus", "Prism Cactus", "cactus", "epic", "#4a6f7a", "#5fb0c0", "#9fe0e8", { coins: 60000, trees: 24, hours: 80, streak: 7 }, "Splits desert light into colour.", { glow: true }),

  // ---------- LEGENDARY (7) ----------
  t("worldtree", "World Tree", "broadleaf", "legendary", "#6a4b34", "#3fa06a", "#8fe0a8", { coins: 75000, trees: 26, hours: 95, streak: 8 }, "Its branches hold every finished task.", { glow: true, accent: "#ffe08a" }),
  t("crystal-pine", "Crystal Pine", "crystal", "legendary", "#5a6a80", "#7fd6e8", "#d6f5ff", { coins: 90000, trees: 28, hours: 110, streak: 10 }, "Grown from frozen concentration.", { glow: true }),
  t("phoenix-tree", "Phoenix Tree", "blossom", "legendary", "#5f3830", "#ff7a3d", "#ffd06a", { coins: 105000, trees: 29, hours: 130, streak: 12 }, "Reborn after every hard week.", { glow: true }),
  t("celestial-willow", "Celestial Willow", "willow", "legendary", "#4f4a63", "#a68fe8", "#e0d0ff", { coins: 125000, trees: 30, hours: 150, streak: 14 }, "Trails of quiet starlight.", { glow: true }),
  t("eternal-bonsai", "Eternal Bonsai", "bonsai", "legendary", "#4f3a2c", "#d8b45f", "#ffe6a3", { coins: 150000, trees: 31, hours: 180, streak: 18 }, "One tree, a thousand deliberate hours.", { glow: true }),
  t("void-cedar", "Void Cedar", "conifer", "legendary", "#33333d", "#5a5f9e", "#9fa8f0", { coins: 180000, trees: 32, hours: 220, streak: 21 }, "Absorbs distraction entirely.", { glow: true }),
  t("gardener", "The Gardener's Tree", "crystal", "legendary", "#6b5a3f", "#ffd76a", "#fff0bf", { coins: 220000, trees: 34, hours: 260, streak: 30 }, "Awarded to the truly consistent.", { glow: true, accent: "#7cc06a" }),
];

export const TREE_MAP: Record<string, TreeDef> = Object.fromEntries(
  TREES.map((tree) => [tree.id, tree]),
);

export const RARITY_LABEL: Record<TreeRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export function getTree(id: string): TreeDef {
  return TREE_MAP[id] ?? TREES[0];
}
