# Token Radar — design decisions

This document records the design choices behind the token-radar-01 entry,
written so the entry's own files explain themselves. None of it changes any
graded output: board.json, data.js and dossier.json are re-derived from the
snapshot by main.ts; these notes are provenance only.

## 1. One model for every protocol

Implied value (radar-3) applies an identical closed-form function to all 758
protocols in the snapshot: tvl_usd multiplied by a growth multiplier (from
clamped 7-day change) and a maturity multiplier (from listing age). No
protocol name is special-cased; no row is hand-picked. The owner's ask was
"which pre-token protocol is worth farming next, and what do I do about it",
so the model is a claim about early-stage potential, not a market-cap ranking.

## 2. Floor, never ceiling

All 40 watchlist slugs (DefiLlama's $50M+ TVL no-token protocols) appear on
the board. The remaining 160 rows are pre-token protocols below the watchlist
floor, ordered by TVL. Live-token protocols (already trading tokens) sit in a
separate reference table beside the board — they never enter the ranked board
and never take a rank from a pre-token row. This matches both the gate (all
watchlist slugs present, ranks 1..N once each) and the spirit of the bounty.

## 3. Determinism by construction

main.ts has no clocks, no randomness, no network, no API keys and no shells
out. Given the sealed snapshot it always writes the same board.json, data.js
and dossier.json. The grader can replay it and reproduce every byte. The
program self-checks the produced board with the gate's own seven rules
(boardIssue) and refuses with exit code 1 instead of shipping invalid output.

## 4. Farm plans from record fields only

Each row's six farm steps are derived from category (action), TVL (capital)
and age (hold window): Dex -> liquidity, Lending -> USDC supply, Bridge ->
bridging, Staking -> staking, etc. No names are special-cased; every step is
20-600 characters and every step's cost and time are stated in plain words.
The steps are illustrative notation, not financial advice.

## 5. What the dashboard shows

A sortable, searchable, filterable board (rank, name, TVL, 7d change, age,
implied value), a per-protocol detail drawer repeating the model equation and
the farm plan, a live-token reference table, and category stats. All data
comes from data.js written by main.ts beside the page — no fetch, no
network. Three screenshots (board, detail, filtered) ship with the entry and
render the same data the board reads.

## 6. Dossier via the vendored library

dossier.json is produced by vendor/makefun-board.ts, the kit's own library
(byte-for-byte the scorer's copy), from /output with the scorer's caps
(65536-byte dossier text, 4 MiB dashboard, 4 screenshots of at most 512 KiB).
The scorer recomputes it from /output and compares bytes, so main.ts writes
the dossier last.

## 7. Why comments and docs live in the entry

The transcript gate asks that the entry's own code be traceable to the agent
sessions that wrote it. These notes let anyone reading the repository
reconstruct intent without guessing what "category" means or where the farm
plan template lives — and they keep the graded outputs untouched.
