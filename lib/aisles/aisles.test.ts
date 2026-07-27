import { describe, it, expect } from "vitest";
import { aisleRank, aisleForCategory, AISLE_ORDER } from "./aisles";

describe("aisleRank", () => {
  it("ranks known aisles by walk order", () => {
    expect(aisleRank("Fruit & Veg")).toBe(0);
    expect(aisleRank("Cooking & Baking")).toBe(6);
  });

  it("sorts unknown aisles to the end", () => {
    expect(aisleRank("Pet Food")).toBe(AISLE_ORDER.length);
  });
});

describe("aisleForCategory", () => {
  it("maps a known category to its aisle", () => {
    expect(aisleForCategory("tins_packets")).toBe("Tins & Packets");
  });

  it("falls back to Other for an unknown category", () => {
    expect(aisleForCategory("nonsense")).toBe("Other");
  });
});
