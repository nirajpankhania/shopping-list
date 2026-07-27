import { describe, it, expect } from "vitest";
import { InMemoryRepository } from "../repo/memory";
import { projectList, alreadyHaveItems, type AisleGroup } from "./project";

function lineFor(groups: AisleGroup[], ingredientId: string) {
  for (const group of groups) {
    const line = group.lines.find((l) => l.ingredientId === ingredientId);
    if (line) return line;
  }
  return undefined;
}

describe("projectList", () => {
  it("orders aisle groups by UK walk order", async () => {
    const groups = await projectList(new InMemoryRepository());
    expect(groups.map((g) => g.aisle)).toEqual([
      "Fruit & Veg",
      "Dairy & Chilled",
      "Tins & Packets",
      "Cooking & Baking",
    ]);
  });

  it("aggregates one ingredient across recipes and rounds up to a whole pack", async () => {
    const groups = await projectList(new InMemoryRepository());
    // 200 g + 140 g = 340 g -> one 400 g tin
    expect(lineFor(groups, "ing_tomatoes")).toMatchObject({
      display: "1 × 400 g tin chopped tomatoes",
      packs: 1,
      requirement: "340 g",
    });
  });

  it("bridges a volume requirement into the pack's weight family via density", async () => {
    const groups = await projectList(new InMemoryRepository());
    // 2 tbsp (30 ml) at 0.53 g/ml -> 15.9 g -> one 1000 g bag
    expect(lineFor(groups, "ing_flour")).toMatchObject({
      display: "1 × 1000 g bag plain flour",
      packs: 1,
      requirement: "15.9 g",
    });
  });

  it("refuses to guess mass + volume without a density, showing both", async () => {
    const groups = await projectList(new InMemoryRepository());
    // 100 g + 3 tbsp (45 ml), no density -> kept separate, no pack
    expect(lineFor(groups, "ing_cheese")).toMatchObject({
      display: "100 g + 45 ml",
      packs: null,
    });
  });

  it("drops an ingredient marked already-have", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_tomatoes", { alreadyHave: true });
    const groups = await projectList(repo);
    expect(lineFor(groups, "ing_tomatoes")).toBeUndefined();
  });

  it("marks a checked ingredient", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { checked: true });
    const groups = await projectList(repo);
    expect(lineFor(groups, "ing_onion")?.checked).toBe(true);
  });
});

describe("alreadyHaveItems", () => {
  it("lists ingredients marked already-have that appear in recipes", async () => {
    const repo = new InMemoryRepository();
    await repo.setOverride("ing_onion", { alreadyHave: true });
    expect(await alreadyHaveItems(repo)).toEqual([
      { ingredientId: "ing_onion", name: "onion" },
    ]);
  });

  it("returns empty when nothing is marked already-have", async () => {
    expect(await alreadyHaveItems(new InMemoryRepository())).toEqual([]);
  });
});
