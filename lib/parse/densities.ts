/**
 * Curated densities (grams per millilitre) for ingredients where weight<->volume
 * conversion matters. NEVER LLM-sourced — guessing a density is the exact
 * competitor bug. Keyed by normalized (lowercased) canonical name.
 */
const DENSITIES: Record<string, number> = {
  "plain flour": 0.53,
  "self-raising flour": 0.53,
  "milk": 1.03,
  "semi-skimmed milk": 1.03,
  "whole milk": 1.03,
  "olive oil": 0.92,
  "vegetable oil": 0.92,
  "honey": 1.42,
  "caster sugar": 0.85,
  "granulated sugar": 0.85,
  "water": 1.0,
};

export function densityFor(canonicalName: string): number | undefined {
  return DENSITIES[canonicalName.trim().toLowerCase()];
}
