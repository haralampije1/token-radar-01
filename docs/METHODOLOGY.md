# Token Radar — methodology

This document explains how the token-radar-01 entry (`main.ts` + `lib/model.ts`)
turns the sealed DefiLlama snapshot into the ranked board that the judge reads.

## Scope

- Input: `/input/snapshot.json` — 758 protocols at or above $5,000,000 TVL, of
  which 40 are on the watchlist (snapshot frozen by make.fun; read-only).
- Output: `/output/board.json` — 200 ranked rows: all 40 watchlist protocols plus
  160 pre-token protocols below the watchlist floor, plus a 24-row live-token
  reference set shown beside the board (not ranked).
- Dashboard: static, single-file data (`data.js`), no network, no framework.

## Model (`radar-3`)

One function scores every protocol from the snapshot's own figures only:

    implied = max(1, round( tvl_usd * 0.25
      * (1 + clamp(change_7d, -60, 120)% * 0.5)
      * (0.6 + min(age_days, 1095) / 1095 * 0.4) ))

- `tvl_usd`: the protocol's total value locked, whole dollars, truncated.
- `change_7d`: 7-day TVL change in percent, clamped to [-60, 120].
- `age_days`: days since DefiLlama first listed the protocol; unlisted age
  counts as 365 days; maturity rises from 0.6 towards 1.0 over the first 3
  years.

No protocol name is special-cased; no row is hand-picked. TVL is the dominant
term: the radar surfaces large, young, fast-growing pre-token protocols first
— exactly the "worth farming next, early" question in the owner's ask.

## Watchlist floor

Every watchlist slug appears on the board (floor, never ceiling). The remaining
160 rows are the highest-TVL pre-token protocols below the $50,000,000 floor —
the early radar the bounty asks for. Live-token protocols (already-trading
tokens) are shown separately with their market caps; they are never mixed into
the ranked board and never ranked by this model.

## Farm plans

Each row carries 6 farm steps derived from the protocol's own record
(category → action, TVL → capital, age → hold window). No names are
special-cased: a Dex gets liquidity provisions, a Lending protocol gets USDC
supply, a Bridge gets bridging, and so on. Every step is 20-600 characters.

## Determinism

Same snapshot → same outputs, every run. No clocks, no randomness, no network,
no API keys, no external fetches. The grader can replay `main.ts` against the
sealed snapshot and reproduce `board.json` byte for byte.

## Dashboard

One static page: ranked board with search, category filter, sortable columns,
per-protocol detail drawer (model equation + farm plan), plus a live-token
reference table. Reads `window.RADAR` from `data.js` written by `main.ts` — no
fetch, no network. Three screenshots (board, detail, filtered) rendered from
the same data and shipped with an identical rendering.

## Validation

`main.ts` self-checks the produced board with the same seven rules the grader's
gate applies (watchlist coverage, ranks 1..N, implied value monotonically
non-increasing with rank, no all-equal board, 3-12 farm steps of 20-600
characters, positive whole implied values) and refuses to hand in an invalid
board. The shipped `dossier.json` is rebuilt by the vendored
`vendor/makefun-board.ts` library from the very same `/output` tree.
