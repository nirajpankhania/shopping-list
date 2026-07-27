import { describe, it, expect } from "vitest";
import { UNITS } from "./types";

describe("UNITS table", () => {
  it("uses base units with toBase 1", () => {
    expect(UNITS.g.toBase).toBe(1);
    expect(UNITS.ml.toBase).toBe(1);
    expect(UNITS.each.toBase).toBe(1);
  });

  it("assigns every unit to exactly one known family", () => {
    for (const def of Object.values(UNITS)) {
      expect(["MASS", "VOLUME", "COUNT"]).toContain(def.family);
    }
  });

  it("keeps a known metric mass conversion correct", () => {
    expect(UNITS.kg.toBase).toBe(1000);
  });
});
