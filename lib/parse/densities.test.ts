import { describe, it, expect } from "vitest";
import { densityFor } from "./densities";

describe("densityFor", () => {
  it("returns a curated density, case-insensitively", () => {
    expect(densityFor("Plain Flour")).toBe(0.53);
  });

  it("returns undefined for ingredients we haven't curated", () => {
    expect(densityFor("chopped tomatoes")).toBeUndefined();
  });
});
