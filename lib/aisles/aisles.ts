/**
 * UK supermarket aisle order — roughly the sequence you walk a store in, so the
 * list reads top-to-bottom as you shop. A sensible starting point, tunable as
 * we learn real store layouts.
 */
export const AISLE_ORDER: string[] = [
  "Fruit & Veg",
  "Bakery",
  "Meat & Fish",
  "Dairy & Chilled",
  "Frozen",
  "Tins & Packets",
  "Cooking & Baking",
  "Drinks",
  "Household",
  "Other",
];

/** Position of an aisle in the walk order. Unknown aisles sort to the end. */
export function aisleRank(aisle: string): number {
  const index = AISLE_ORDER.indexOf(aisle);
  return index === -1 ? AISLE_ORDER.length : index;
}
