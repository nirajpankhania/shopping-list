import { describe, it, expect } from "vitest";
import { aisleRank, AISLE_ORDER } from "./aisles";

describe("aisleRank", () => {
  it("ranks known aisles by walk order", () => {
    expect(aisleRank("Fruit & Veg")).toBe(0);
    expect(aisleRank("Cooking & Baking")).toBe(6);
  });

  it("sorts unknown aisles to the end", () => {
    expect(aisleRank("Pet Food")).toBe(AISLE_ORDER.length);
  });
});
