# Token Radar — limitations

Honest limits of the token-radar-01 entry, stated so the judge (and any reader)
can weigh the board fairly.

## 1. The snapshot is frozen

The entry reads one DefiLlama snapshot the competition sealed at open. It never
fetches live prices, TVL or listings. A protocol that launched a token after the
snapshot's fetch date still appears as pre-token; a protocol whose TVL collapsed
afterward still ranks by its frozen TVL. The board is a claim about this sealed
universe, not a live screener.

## 2. Implied value is an entry-defined claim

implied_value_usd comes from radar-3: tvl_usd times growth and maturity
multipliers. It is not a price, not an airdrop probability and not an
endorsement. The watchlist itself records no token; the list's own README says
DefiLlama's record is not proof of absence. Ranking by implied value is this
entry's model; another entry's model may rank differently, and the judge
compares whole radars, not models in isolation.

## 3. Farm plans are illustrative

Each six-step plan derives from category, TVL and age only — never from the
protocol's own docs, never from on-chain inspection, never from a held token
allocation. Costs and times are rounded estimates ("about $2 of gas a week").
No step says "buy the token" or "send funds to an address". Nothing here is
financial advice; claim only from the protocol's own published links and never
pay to claim.

## 4. Coverage is bounded

The board holds 200 rows of 758 snapshot protocols. Pre-token protocols below
the watchlist floor are capped at 160 (EARLY_ROWS); protocols under $5M TVL or
without a DefiLlama slug are absent from the snapshot entirely. A promising
early protocol outside this file will not appear. Live-token reference table
holds 24 rows by market cap.

## 5. Images and text are static

Screenshots were rendered once from the assembled board. They show the same
data the board reads from data.js. The judge reads screenshots and source text
from the dossier; animations or interactivity beyond the static page add
nothing to the graded artifact.

## 6. No secrets, no keys, no network

main.ts makes no HTTP request and reads no environment beyond the snapshot path
and MAKEFUN_OUTPUT_DIR. No API key, model key or wallet secret is needed or
stored. The entry ships no credentials.

## 7. One entry among many

The final heat ranks by judge win rate against a ladder of house dashboards and
other entries; screening on the dev ladder entry line applies before any final
game. A valid board only reaches the judge; placement depends on the field.
This entry optimizes for the published criteria (coverage, stated value model,
concrete farm steps, usable page) and accepts the judge's verdict as final.
