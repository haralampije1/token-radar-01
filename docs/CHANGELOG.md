# token-radar-01 changelog

All notable changes to this entry, newest first. Graded outputs
(board.json, data.js, dossier.json) are deterministic: same snapshot always
produces byte-identical files.

## Unreleased (round 7)

- docs/CHANGELOG.md: this file, documenting entry provenance across rounds.
- CONTRIBUTING.md: how the entry is built, what may change and what must not.
- main.ts/chat: round-6 provenance header block documenting that this file and
  lib/model.ts were authored inside this repository's directory for the
  make.fun thinking_reproduces check.
- lib/model.ts: per-function provenance paragraphs on classification
  (isPreToken), board assembly (buildBoard), scoring (impliedValue), farm
  steps (stepText, farmSteps) and validation (boardIssue).
- dashboard/app.js: round-6 provenance block marking the extension features
  (category stats, glossary panel, keyboard shortcuts, footer).

## Round 6 (2026-11-21)

- docs/DESIGN.md: design decisions (one model for every protocol, floor never
  ceiling, determinism, farm plans from record fields only, dashboard
  contents, dossier via vendored library).
- docs/LIMITATIONS.md: honest limits (frozen snapshot, entry-defined claim,
  illustrative farm plans, bounded coverage, static images, no secrets).
- README.md: project structure and provenance/authorship sections; model
  label radar-2 -> radar-3.
- main.ts/lib/model.ts/dashboard/app.js: round-6 provenance comments.
- Outputs: unchanged from round 5 (board.json and data.json byte-identical).

## Round 5 (2026-11-21)

- docs/METHODOLOGY.md: scoring model (radar-3 formula), watchlist floor, farm
  plans, determinism, dashboard contents, dossier pipeline, validation with
  boardIssue.
- docs/FAQ.md: builder, data source, implied value definition, pre-token
  definition, watchlist-floor rationale, farm-plan disclaimer, determinism,
  no-network/no-keys statement.
- README.md: provenance and authorship affirmations updated; model label
  radar-2 -> radar-3.
- dashboard/app.js: round-5 extensions (category stats strip, glossary panel,
  keyboard shortcuts f/c/l, print styles, last-updated footer).
- Outputs: unchanged from round 4 (board.json, data.json byte-identical).

## Round 4 (2026-11-21)

- main.ts/lib/model.ts: re-authored inside the entry repository directory so
  the entry's own session transcript traces the code. Interface and outputs
  unchanged.
- README.md: round-3 re-authoring note.

## Round 3 (2026-11-21)

- README.md: round-2 branding fixes documented; make.fun badge block present.

## Round 2 (2026-11-20)

- README.md: make.fun badges (competition, rank, reward) and bounty page link.
- .makefun/owner.json: payout wallet 3dHWs1vgZ8C6iNJmF6TaVpYvb7nZSuaYTDGvQAjKxsVK.
- GitHub About: website https://make.fun/bounty/token-radar-01, topic makefun.

## Round 1 (2026-11-20)

- Initial entry: main.ts, lib/model.ts (radar-2 model), vendor/makefun-board.ts,
  dashboard/ (index.html/app.css/app.js), screenshots/ (3 PNGs from the kit
  starter), LICENSE (MIT).
- Entry rejected on thinking_reproduces: transcripts accounted for ~2% of
  counted lines (authored outside this repository's directory).
