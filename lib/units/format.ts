import type { Canonical } from "./types";

/** Round to at most 2 decimal places for display (never for aggregation). */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Render a base amount in `unit`, flooring a nonzero value that would round to
 *  0 to "< 1 <unit>" rather than the misleading "0 <unit>". */
function floored(base: number, unit: string): string {
  if (base > 0 && round(base) === 0) return `< 1 ${unit}`;
  return `${round(base)} ${unit}`;
}

/**
 * Render a canonical quantity as a short metric string. Metric is the default
 * because this is a UK build; an imperial renderer is a later, separate concern.
 */
export function formatMetric(c: Canonical): string {
  switch (c.family) {
    case "MASS":
      if (c.base >= 1000) return `${round(c.base / 1000)} kg`;
      // A tiny-but-real amount rounds to "0 g" at 2dp, which reads as "buy
      // nothing". Floor it so the shopper still knows to pick some up.
      return floored(c.base, "g");
    case "VOLUME":
      if (c.base >= 1000) return `${round(c.base / 1000)} l`;
      return floored(c.base, "ml");
    case "COUNT":
      // A count has no unit noun, so a bare "2" reads as "2 g?" when joined into
      // "400 g + 2". The multiplier sign marks it as a quantity of items.
      return `× ${round(c.base)}`;
  }
}

/**
 * Render one or more canonical totals (the aggregate result) as a single
 * string, joining un-mergeable quantities with " + " — e.g. "400 g + 30 ml".
 */
export function formatTotals(totals: Canonical[]): string {
  return totals.map(formatMetric).join(" + ");
}
