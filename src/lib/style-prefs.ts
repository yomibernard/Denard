/** Client + server shared taste preferences (stored in the browser). */

export type StylePrefs = {
  /** everyday | evening | work | gift */
  occasions: string[];
  /** gold | silver | rose | mixed */
  metals: string[];
  /** minimal | statement | classic | playful */
  vibes: string[];
  /** women | men | jewellery */
  focuses: string[];
  /** Max guide price in GBP; null = no limit */
  budgetMax: number | null;
};

export const DEFAULT_STYLE_PREFS: StylePrefs = {
  occasions: [],
  metals: [],
  vibes: [],
  focuses: [],
  budgetMax: null,
};

export const STYLE_OCCASIONS = [
  { id: "everyday", label: "Everyday" },
  { id: "evening", label: "Evening" },
  { id: "work", label: "Work" },
  { id: "gift", label: "Gifting" },
] as const;

export const STYLE_METALS = [
  { id: "gold", label: "Gold tones" },
  { id: "silver", label: "Silver tones" },
  { id: "rose", label: "Rose gold" },
  { id: "mixed", label: "Mixed metals" },
] as const;

export const STYLE_VIBES = [
  { id: "minimal", label: "Minimal" },
  { id: "statement", label: "Statement" },
  { id: "classic", label: "Classic" },
  { id: "playful", label: "Playful" },
] as const;

export const STYLE_FOCUSES = [
  { id: "jewellery", label: "Jewellery" },
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
] as const;

export const STYLE_BUDGETS = [
  { value: 50, label: "Under £50" },
  { value: 100, label: "Under £100" },
  { value: 200, label: "Under £200" },
  { value: 400, label: "Under £400" },
  { value: null, label: "No limit" },
] as const;

export function prefsAreEmpty(prefs: StylePrefs) {
  return (
    !prefs.occasions.length &&
    !prefs.metals.length &&
    !prefs.vibes.length &&
    !prefs.focuses.length &&
    prefs.budgetMax == null
  );
}

export function summarizePrefs(prefs: StylePrefs): string {
  const bits: string[] = [];
  if (prefs.focuses.length) bits.push(prefs.focuses.join(", "));
  if (prefs.metals.length) bits.push(`${prefs.metals.join("/")} metals`);
  if (prefs.vibes.length) bits.push(prefs.vibes.join(", "));
  if (prefs.occasions.length) bits.push(prefs.occasions.join(", "));
  if (prefs.budgetMax != null) bits.push(`up to £${prefs.budgetMax}`);
  return bits.length ? bits.join(" · ") : "Still learning your taste";
}
