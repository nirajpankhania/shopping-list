import { describe, it, expect } from "vitest";
import { aggregate } from "./aggregate";

describe("aggregate", () => {
  it("sums quantities within a single family", () => {
    expect(
      aggregate([
        { quantity: 200, unit: "g" },
        { quantity: 1, unit: "kg" },
      ]),
    ).toEqual([{ family: "MASS", base: 1200 }]);
  });

  it("keeps mass and volume separate when no density is given", () => {
    // The refuse-to-guess case: two totals, surfaced side by side.
    expect(
      aggregate([
        { quantity: 400, unit: "g" },
        { quantity: 2, unit: "tbsp" },
      ]),
    ).toEqual([
      { family: "MASS", base: 400 },
      { family: "VOLUME", base: 30 },
    ]);
  });

  it("merges mass and volume into grams when a density is supplied", () => {
    // 400 g flour + 2 tbsp (30 ml) at 0.53 g/ml -> 400 + 15.9 = 415.9 g
    const result = aggregate(
      [
        { quantity: 400, unit: "g" },
        { quantity: 2, unit: "tbsp" },
      ],
      { densityGPerMl: 0.53 },
    );
    expect(result).toHaveLength(1);
    expect(result[0].family).toBe("MASS");
    expect(result[0].base).toBeCloseTo(415.9, 5);
  });

  it("never merges COUNT with mass, even when a density is supplied", () => {
    const result = aggregate(
      [
        { quantity: 2, unit: "each" },
        { quantity: 100, unit: "g" },
      ],
      { densityGPerMl: 1 },
    );
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        { family: "COUNT", base: 2 },
        { family: "MASS", base: 100 },
      ]),
    );
  });
});
