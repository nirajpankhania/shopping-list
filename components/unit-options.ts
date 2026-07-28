import type { UnitFamily } from "@/lib/units";

// Which units to offer in the UI for each family — kept deliberately small so a
// pantry amount or an edited quantity stays within the line's own family.
export const UNIT_OPTIONS: Record<UnitFamily, string[]> = {
  MASS: ["g", "kg"],
  VOLUME: ["ml", "l"],
  COUNT: ["each"],
};
