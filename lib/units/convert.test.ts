import { describe, it, expect } from "vitest";
import { toCanonical, fromCanonical, applyDensity } from "./convert";

describe("toCanonical", () => {
  it("converts within MASS to grams", () => {
    expect(toCanonical(2, "kg")).toEqual({ family: "MASS", base: 2000 });
  });

  it("throws on unknown units", () => {
    expect(() => toCanonical(1, "smidge")).toThrow(/Unknown unit/);
  });
});

describe("fromCanonical", () => {
  it("expresses grams back in kg", () => {
    expect(fromCanonical({ family: "MASS", base: 2000 }, "kg")).toBe(2);
  });

  it("refuses to express one family in another family's unit", () => {
    expect(() => fromCanonical({ family: "MASS", base: 100 }, "ml")).toThrow();
  });
});

describe("applyDensity", () => {
  it("converts volume to mass using grams per millilitre", () => {
    // 100 ml at 0.5 g/ml weighs 50 g
    expect(applyDensity({ family: "VOLUME", base: 100 }, "MASS", 0.5)).toEqual({
      family: "MASS",
      base: 50,
    });
  });

  it("converts mass to volume using grams per millilitre", () => {
    // 50 g at 0.5 g/ml occupies 100 ml
    expect(applyDensity({ family: "MASS", base: 50 }, "VOLUME", 0.5)).toEqual({
      family: "VOLUME",
      base: 100,
    });
  });

  it("returns the input unchanged when already the target family", () => {
    expect(applyDensity({ family: "MASS", base: 10 }, "MASS", 0.5)).toEqual({
      family: "MASS",
      base: 10,
    });
  });

  it("refuses to bridge COUNT — density only spans MASS and VOLUME", () => {
    expect(() => applyDensity({ family: "COUNT", base: 3 }, "MASS", 0.5)).toThrow();
  });
});
