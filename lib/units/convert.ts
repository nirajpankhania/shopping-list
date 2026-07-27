import { UNITS, type Canonical, type UnitFamily } from "./types";

/** Convert a quantity in a named unit to its family's canonical base. */
export function toCanonical(quantity: number, unit: string): Canonical {
  const def = UNITS[unit];
  if (!def) throw new Error(`Unknown unit: ${unit}`);
  return { family: def.family, base: quantity * def.toBase };
}

/** Express a canonical quantity in a chosen unit of the SAME family. */
export function fromCanonical(c: Canonical, unit: string): number {
  const def = UNITS[unit];
  if (!def) throw new Error(`Unknown unit: ${unit}`);
  if (def.family !== c.family) {
    throw new Error(`Cannot express ${c.family} in ${unit} (${def.family})`);
  }
  return c.base / def.toBase;
}

/**
 * The ONLY bridge across families, and only ever between MASS and VOLUME.
 * The caller must supply the density explicitly (grams per millilitre); the
 * engine never invents one, because guessing a density is precisely the
 * competitor bug we exist to avoid. COUNT never converts.
 */
export function applyDensity(
  c: Canonical,
  target: UnitFamily,
  densityGPerMl: number,
): Canonical {
  if (c.family === target) return c;
  if (c.family === "VOLUME" && target === "MASS") {
    return { family: "MASS", base: c.base * densityGPerMl };
  }
  if (c.family === "MASS" && target === "VOLUME") {
    return { family: "VOLUME", base: c.base / densityGPerMl };
  }
  throw new Error(`No density bridge between ${c.family} and ${target}`);
}
