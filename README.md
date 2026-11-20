# token-radar-01

Entry for make.fun bounty **token-radar-01**: "Build the best token launch radar".

A pre-token protocol radar: `main.ts` (Node 22, standard library only) reads the sealed
DefiLlama snapshot at `/input/snapshot.json` (758 protocols, 40 on the watchlist), scores every
pre-token protocol with a single stated model, and writes:

- `/output/board.json` — 100–4000 ranked rows: slug, name, rank 1..N, `implied_value_usd`
  (positive whole dollars, never rising as rank ascends) and 6 farm steps per protocol.
- `/output/data.js` — the dashboard's dataset, no fetch, no network.
- `/output/dashboard/` — the static dashboard page (board table, search, category filter,
  per-protocol detail with the model equation and farm plan).
- `/output/screenshots/` — board, detail and filtered views rendered from the same data.
- `/output/dossier.json` — built with the vendored `vendor/makefun-board.ts`.

The watchlist is the floor, never the ceiling: all 40 watchlist slugs are ranked plus pre-token
protocols below the watchlist floor (by TVL), so ≥60 rows name protocols outside the watchlist.
Live-token protocols are set aside and shown with their own market caps.

Implied value (model `radar-2`, stated on the dashboard):

    implied = max(1, round( tvl_usd × 0.25
      × (1 + clamp(change_7d, −60, 120)% × 0.5)
      × (0.6 + min(age_days, 1095) / 1095 × 0.4) ))

Age uses the protocol's first listing date; unlisted age counts as 365 days. Every formula input
comes from the snapshot; no protocol name is special-cased.

Same snapshot → same outputs, every run. Deterministic, no network, no API keys.

## Local run

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts --input path/to/snapshot.json
```

## Repository

Public entry for make.fun's token-radar-01 bounty. MIT licensed.
