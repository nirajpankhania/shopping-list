# Shopping List

A recipe-driven shopping list you can **trust**: correct quantities, in the units
you actually shop in, minus what's already in your cupboard.

## Who it's for

The recipe-driven meal-prepper. You plan several meals at once — typically at a
laptop on a Sunday — then execute one big shop, on a phone, in a UK supermarket.
Today that means recipes scattered across saved posts, tabs and screenshots,
transcribed by hand into a list you can't fully trust. This turns the paste into
a list you can.

## What it does

- **Paste a recipe** — free text becomes structured `{ quantity, unit, ingredient }`
  lines, validated before anything is stored.
- **Aggregates across recipes** — onions from three meals appear once, with the
  total.
- **Correct unit handling** — mass, volume and count are kept distinct; weight and
  volume are never silently conflated (see below).
- **Aisle-grouped** — the list is ordered by UK supermarket walk order, so it reads
  top-to-bottom as you move through the store.
- **Pantry tagging** — record what you already own; matching lines are tagged
  *"in pantry"* so you know what to skip, without anything vanishing behind your back.
- **Manual control** — add your own entries, override a line's amount, or drop a line.
- **Recipe scaling** — a per-recipe multiplier for how many people or days you're
  cooking for; `0` keeps a recipe saved but off the list.
- **Saved plans** — name and re-apply a whole list week to week.

## The interesting engineering problem: the unit engine

`lib/units` is a pure, synchronous, fully unit-tested module with no dependency on
the database or the LLM. It exists because the clearest evidenced competitor bug is
a correctness one: half a cup of flour "converting" to 118 ml — treated identically
to a liquid.

The rule that prevents it: there are **three unit families — MASS, VOLUME and
COUNT** — and conversion between families is *forbidden* unless the ingredient
carries an explicit density (flour, milk, oil…). With no density the engine
**refuses to guess**: it keeps the quantities separate and surfaces both, e.g.
`400 g + 2 tbsp`. Everything that has to be correct — aggregation, conversion,
aisle assignment — is deterministic and lives here or in `lib/aisles`. The LLM only
parses; it never calculates.

## Running it locally

```bash
npm install
npm run dev
```

It runs with **zero infrastructure**. With no `DATABASE_URL` set, it uses a seeded
in-memory repository, so the app and its tests work out of the box.

- **`ANTHROPIC_API_KEY`** — needed only for parsing pasted recipes. Everything else
  works without it.
- **`DATABASE_URL`** (a Neon Postgres connection string) — switches persistence to
  Postgres. After setting it, run `npm run db:migrate` and `npm run db:seed`.

Secrets live in `.env.local` (never committed).

## Tests

```bash
npm test
```

The tests concentrate on `lib/units` — that is where correctness matters and where
the evidenced pain is, so it's tested first and hardest. Coverage elsewhere is
deliberately not chased.

## Architecture

Domain logic lives in `lib/`; components render and dispatch. The list is a derived
view, projected at read time — never a stored table — so scaling, dropping a meal
and pantry tagging are all queries over the same projection, with no denormalised
copy to drift.

```
app/          Next.js pages + server actions (thin — render & dispatch)
components/   presentational UI
lib/
  units/      PURE unit engine (MASS/VOLUME/COUNT, convert, aggregate, render)
  aisles/     deterministic UK aisle assignment + ordering
  llm/        the LLM boundary: recipe text -> Zod-validated ingredients
  repo/       Repository interface + adapters (in-memory, Postgres)
  list/       the derived-list projection (read-time)
db/           Drizzle schema — only lib/repo touches SQL
docs/         the full design spec
```

See [`docs/design.md`](docs/design.md) for the full reasoning, the research behind
each feature, and the deliberate non-goals (sharing/sync, auth, offline).
