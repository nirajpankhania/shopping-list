import { toCanonical, applyDensity } from "./convert";
import type { Canonical, UnitFamily } from "./types";

export interface Item {
  quantity: number;
  unit: string;
}

/**
 * Sum the quantities for a single ingredient into canonical totals.
 *
 * - Same family -> one total, in that family.
 * - MASS + VOLUME with a density -> merged into MASS (grams). This is the
 *   deliberate, explicit cross-family conversion.
 * - MASS + VOLUME WITHOUT a density -> kept separate (two totals). We refuse to
 *   guess; the caller surfaces both, e.g. "400 g + 30 ml".
 * - COUNT never merges with MASS or VOLUME (density only bridges those two).
 *
 * The boundary to understand: a density only bridges families when BOTH a mass
 * and a volume total are present. A volume-only total stays volume even with a
 * density supplied — there is no mass to merge it into. Choosing the family an
 * ingredient is *shopped* in (e.g. flour by weight) is therefore the caller's
 * responsibility, not this function's; see projectList.
 *
 * The result is length 1 in the happy path and >1 when quantities cannot be
 * merged — a shape the UI can always inspect.
 */
export function aggregate(
  items: Item[],
  opts?: { densityGPerMl?: number },
): Canonical[] {
  // Sum in canonical base, grouped by family (insertion order preserved).
  const byFamily = new Map<UnitFamily, number>();
  for (const item of items) {
    const c = toCanonical(item.quantity, item.unit);
    byFamily.set(c.family, (byFamily.get(c.family) ?? 0) + c.base);
  }

  const totals: Canonical[] = [...byFamily].map(([family, base]) => ({
    family,
    base,
  }));

  // Only bridge MASS <-> VOLUME, and only when a density is explicitly given.
  const density = opts?.densityGPerMl;
  const mass = totals.find((t) => t.family === "MASS");
  const volume = totals.find((t) => t.family === "VOLUME");
  if (density !== undefined && mass && volume) {
    const volumeAsMass = applyDensity(volume, "MASS", density);
    return [
      { family: "MASS", base: mass.base + volumeAsMass.base },
      ...totals.filter((t) => t.family !== "MASS" && t.family !== "VOLUME"),
    ];
  }

  return totals;
}
