import { describe, it, expect } from "vitest";
import { roundToPacks } from "./pack";

describe("roundToPacks", () => {
  it("rounds 340 g up to one 400 g tin and stays inspectable", () => {
    const r = roundToPacks(
      { family: "MASS", base: 340 },
      { size: 400, unit: "g", label: "tin chopped tomatoes" },
    );
    expect(r.packs).toBe(1);
    expect(r.display).toBe("1 × 400 g tin chopped tomatoes");
    expect(r.requirementBase).toBe(340); // the recipe requirement is recoverable
    expect(r.providedBase).toBe(400); // what you actually buy
  });

  it("rounds up across a pack boundary", () => {
    const r = roundToPacks(
      { family: "MASS", base: 401 },
      { size: 400, unit: "g", label: "tin" },
    );
    expect(r.packs).toBe(2);
  });

  it("does not double-count an exact multiple", () => {
    const r = roundToPacks(
      { family: "MASS", base: 800 },
      { size: 400, unit: "g", label: "tin" },
    );
    expect(r.packs).toBe(2);
  });

  it("refuses a pack unit from the wrong family", () => {
    expect(() =>
      roundToPacks(
        { family: "MASS", base: 100 },
        { size: 500, unit: "ml", label: "bottle" },
      ),
    ).toThrow(/does not match/);
  });
});
