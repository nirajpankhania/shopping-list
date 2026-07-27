import type { Canonical } from "./types";

/** Round to at most 2 decimal places for display (never for aggregation). */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Render a canonical quantity as a short metric string. Metric is the default
 * because this is a UK build; an imperial renderer is a later, separate concern.
 */
export function formatMetric(c: Canonical): string {
  switch (c.family) {
    case "MASS":
      return c.base >= 1000 ? `${round(c.base / 1000)} kg` : `${round(c.base)} g`;
    case "VOLUME":
      return c.base >= 1000 ? `${round(c.base / 1000)} l` : `${round(c.base)} ml`;
    case "COUNT":
      return `${round(c.base)}`;
  }
}

/**
 * Render one or more canonical totals (the aggregate result) as a single
 * string, joining un-mergeable quantities with " + " — e.g. "400 g + 30 ml".
 */
export function formatTotals(totals: Canonical[]): string {
  return totals.map(formatMetric).join(" + ");
}
