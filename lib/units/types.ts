export type UnitFamily = "MASS" | "VOLUME" | "COUNT";

/**
 * A quantity expressed in a family's canonical base unit:
 * MASS -> grams, VOLUME -> millilitres, COUNT -> each.
 * We aggregate in base units so sums are always exact and unit-agnostic.
 */
export interface Canonical {
  family: UnitFamily;
  base: number;
}

/**
 * How a named unit maps onto its family and its base unit.
 * `toBase` multiplies a quantity in this unit to get base units.
 */
export interface UnitDef {
  family: UnitFamily;
  toBase: number;
  system: "metric" | "imperial" | "neutral";
}

/**
 * The single source of truth for conversion factors. Base units (g / ml / each)
 * have toBase 1. Spoons use UK/metric conventions (tsp 5 ml, tbsp 15 ml).
 */
export const UNITS: Record<string, UnitDef> = {
  // MASS — base unit: gram
  mg: { family: "MASS", toBase: 0.001, system: "metric" },
  g: { family: "MASS", toBase: 1, system: "metric" },
  kg: { family: "MASS", toBase: 1000, system: "metric" },
  oz: { family: "MASS", toBase: 28.3495, system: "imperial" },
  lb: { family: "MASS", toBase: 453.592, system: "imperial" },

  // VOLUME — base unit: millilitre
  ml: { family: "VOLUME", toBase: 1, system: "metric" },
  l: { family: "VOLUME", toBase: 1000, system: "metric" },
  tsp: { family: "VOLUME", toBase: 5, system: "metric" },
  tbsp: { family: "VOLUME", toBase: 15, system: "metric" },
  // The US customary cup (236.588 ml). Recipes that use cups are almost always
  // US-origin, so we adopt one documented convention rather than guess per
  // recipe. The pack's unit still decides whether a cup resolves to weight
  // (a cup of flour -> grams, via density) or volume (a cup of milk -> ml).
  cup: { family: "VOLUME", toBase: 236.588, system: "imperial" },

  // COUNT — base unit: each
  each: { family: "COUNT", toBase: 1, system: "neutral" },
};
