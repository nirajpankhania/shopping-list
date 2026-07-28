import type { UnitFamily } from "@/lib/units";

// Which units to offer in the UI for each family — kept deliberately small so a
// pantry amount or an edited quantity stays within the line's own family.
export const UNIT_OPTIONS: Record<UnitFamily, string[]> = {
  MASS: ["g", "kg"],
  VOLUME: ["ml", "l"],
  COUNT: ["each"],
};

// The pantry is entered by free text, so its unit isn't tied to a family — offer
// one option per family plus the common step-ups.
export const PANTRY_UNITS = ["each", "g", "kg", "ml", "l"];
