# Shopping List — Design

## What this is

A recipe-driven shopping list. You plan several meals at once — typically at a
laptop on a Sunday — then execute one big shop, on a phone, in a UK supermarket.
The promise is a list you can **trust**: correct quantities, in the units you
actually shop in, minus what's already in your cupboard.

## Who it's for

The recipe-driven meal-prepper. Today their workflow is recipes scattered across
saved posts, browser tabs and screenshots → manual transcription into Notes →
a list they can't fully trust → improvising in the aisle.

## Product thesis

> A shopping list you can trust: correct quantities, in the units you actually
> shop in, minus what's already in your cupboard.

Every feature traces back to this. If it doesn't, it's out of scope.

## What the research pointed at (strongest signal first)

1. **Unit handling** — the clearest evidenced pain. Imperial/metric conversion
   missing or broken, and — more telling — weight and volume conflated: half a
   cup of flour "converting" to 118 ml, identical to a liquid. That is a
   correctness bug, not a preference.
2. **Pantry state** — the list should account for what you already own.
3. **Aisle / category correctness** — smaller but real, and specifically wrong
   for UK stores.
4. **Sharing / sync** — genuinely wanted, but deliberately out of scope (below).

## Architecture

Mobile-first. The planning surface is a laptop; the execution surface is a phone
held one-handed next to a trolley — so tap targets are large, primary actions are
thumb-reachable, and the list is legible at arm's length.

Folder layout — each directory maps to one concept:

```
app/                 Next.js pages + server actions (thin — render & dispatch only)
components/          presentational UI components
lib/
  units/             PURE unit engine (MASS/VOLUME/COUNT, convert, aggregate, render)
  aisles/            deterministic UK aisle assignment + ordering
  llm/               the LLM boundary: recipe text -> Zod-validated ingredients
  repo/              Repository interface + adapters (in-memory, then Postgres)
  list/              the derived-list projection (read-time)
db/                  Drizzle schema — only lib/repo touches SQL
docs/                this design spec
```

Core rules that keep it clean:

- **Domain logic lives in `lib/`, never in components.** Components render and dispatch.
- **The list is a derived view, not a table.** Store recipes, ingredients and
  overrides; project the list at read time.
- **The LLM only parses. It never calculates.**
- **Everything that must be correct is pure and deterministic.**

## The unit engine (`lib/units`) — the core of the product

Pure, synchronous, and fully unit-tested. No dependency on the database or the
LLM. Rules, in order of importance:

1. **Three families: MASS, VOLUME, COUNT.** Conversion is free within a family
   and forbidden between families.
2. **Cross-family conversion requires an explicit density** on the ingredient
   (flour, milk, oil, honey…). No density → **don't guess**: keep the quantities
   separate and surface both ("400 g + 2 tbsp"). Guessing here is exactly the
   competitor bug.
3. **Aggregate in canonical base units** (grams, millilitres, count), then render
   in the user's preferred system. Default metric — this is a UK build.
4. **Render the total requirement in the unit you shop in** — "340 g chopped
   tomatoes", aggregated across recipes and converted (within a family, or across
   via density). An earlier version rounded up to whole packs ("1 × 400 g tin");
   that was dropped — how many packs to buy is the shopper's call, and telling
   someone who needs 340 g to buy a tin adds a guess we don't need to make. Pack
   metadata is still kept on the ingredient, but it isn't the headline output.
5. **Subtract the pantry** — what you already have comes off the requirement, so
   the list shows the shortfall and anything you have enough of drops out. The
   drop stays inspectable: the "in pantry" section shows need vs. have.

Tests are written first for this module. It is small, it is where correctness
matters, and the passing tests are the strongest artefact in the codebase.

## The LLM boundary (`lib/llm`)

- **Allowed:** free recipe text → `{ quantity, unit, ingredient, note }[]`, plus
  servings and title. Strict JSON, no prose, validated with Zod. Reject and retry
  once on schema failure, then fall back to a manual-entry form. Also allowed:
  mapping a raw ingredient string to a canonical ingredient when no fuzzy match
  exists.
- **Forbidden:** arithmetic, unit conversion, aggregation, aisle assignment. All
  deterministic, all in `lib/units` and `lib/aisles`.
- **Import:** paste-the-text is the primary path. URL fetch is a stretch goal —
  a single readable-content extraction attempt with a graceful fallback to paste.
  No scraper for arbitrary recipe sites.

## Data model

```
recipes            id, title, source_url, servings_original, servings_target
recipe_ingredients id, recipe_id, raw_text, quantity, unit, ingredient_id, note
ingredients        id, canonical_name, unit_family, aisle, density_g_per_ml?,
                   pack_size, pack_unit, pack_label
pantry             ingredient_id, quantity, unit                 -- what you already have
list_overrides     ingredient_id, checked, manual_quantity?,      -- per-line state, incl.
                   manual_unit?, removed                          --   edit / remove a line
manual_items       id, name, quantity, unit, aisle, checked       -- entries not from a recipe
```

The pantry started as a boolean `already_have` flag on `list_overrides`; it was
replaced by a quantitative `pantry` table, because "a food list with no
quantities" was exactly the evidenced complaint. Manual control layers on top:
`manual_items` holds entries no recipe produced, and `manual_quantity` / `removed`
on `list_overrides` let the user override a recipe line's amount or drop it — all
still projected at read time, no denormalised copy to drift.

Because the list is projected at read time, drop-a-meal and pantry subtraction
are all queries over the same projection — there is no denormalised copy to drift.

Persistence sits behind a **`Repository` interface** in `lib/repo`. A seeded
**in-memory adapter** is built first (zero infrastructure, instant tests); a
**Postgres adapter** (Neon + Drizzle) drops in behind the same interface once the
data shapes are stable. Nothing outside `lib/repo` touches SQL.

## Build order

**P0 — a working demo exists**
1. Schema + repository interface + in-memory adapter
2. Unit engine: canonicalisation, within-family conversion, aggregation (tests first)
3. Render the aggregated requirement in the unit you shop in
4. Paste recipe text → parse → structured ingredients persisted
5. Aisle-grouped list view, UK supermarket ordering
6. Check items off, persists across reload
7. Swap in the Neon + Drizzle adapter behind the same interface

**P1 — it stops being a to-do list**
8. Pantry — record what you have, with quantities; the list subtracts it and
   shows the shortfall *(done — supersedes the original boolean "already have")*
9. Manual control — add your own list entries, edit a recipe line's amount, and
   remove/restore a line *(done)*
10. Metric/imperial toggle at list level
11. Drop a meal — removes only items nothing else needs *(a judgement bet, not an
    evidenced need, and described as such)*

## Non-goals (deliberate, with reasons)

- **Sharing / sync** — real-time multi-user would have consumed the whole build
  budget; depth on the planning problem was the better trade. The clearest next
  thing to build.
- **Auth** — a single implicit user. Buys nothing here for real user value.
- **Offline** — genuinely wanted in-store; costs a service worker and a sync
  strategy. Named as the next build after sharing.
- **Barcode scanning / native app** — a URL demos better than an install.
- **Arbitrary site scraping** — unbounded, brittle, and not the interesting problem.

Also cut: substitutions, serving scaling, waste/leftover ledger, running cost
total, nutrition, supermarket APIs, recipe discovery.

## Conventions

- TypeScript strict. No `any`. Prefer parsing to casting.
- Server actions over API routes unless there's a reason.
- Errors surface to the user as something actionable, never a silent catch.
- Tests only where correctness matters: `lib/units`. Coverage is not a goal.
- Comments explain *why*, not *what*.
- Secrets live in `.env.local` (never committed); `.env.example` is the committed
  template.
- Commits are small and meaningful — the history reads as a narrative of decisions.
