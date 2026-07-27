import { UNITS, type Canonical, type UnitFamily } from "./types";

export interface Pack {
  size: number;
  unit: string;
  label: string;
}

export interface PackResult {
  packs: number;
  display: string;
  requirementBase: number;
  providedBase: number;
  family: UnitFamily;
}

/**
 * Round a canonical requirement UP to whole purchasable packs.
 *
 * Every field needed to inspect the decision is returned — `requirementBase`
 * (what the recipes need) alongside `providedBase` (what a whole number of
 * packs gives you) — so the UI can always show the requirement behind the pack
 * quantity. This inspectability is the headline output of the engine.
 */
export function roundToPacks(requirement: Canonical, pack: Pack): PackResult {
  const def = UNITS[pack.unit];
  if (!def) throw new Error(`Unknown pack unit: ${pack.unit}`);
  if (def.family !== requirement.family) {
    throw new Error(
      `Pack unit ${pack.unit} (${def.family}) does not match requirement ${requirement.family}`,
    );
  }

  const packBase = pack.size * def.toBase;
  const packs = Math.max(0, Math.ceil(requirement.base / packBase));

  return {
    packs,
    display: `${packs} × ${pack.size} ${pack.unit} ${pack.label}`,
    requirementBase: requirement.base,
    providedBase: packs * packBase,
    family: requirement.family,
  };
}
