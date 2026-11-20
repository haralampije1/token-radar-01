# Token Radar — pre-token protocols ranked by implied value

Entry for make.fun's [token-radar-01 bounty](https://make.fun/bounty/token-radar-01): "Build the best token launch radar" ($1,325 USDC, 10 paid places, program/v1 judged dashboard).

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/haralampije1/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/haralampije1/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

## What it does

`main.ts` (Node 22, standard library only) reads the sealed DefiLlama snapshot at `/input/snapshot.json` (758 protocols, 40 on the watchlist), scores every pre-token protocol with a single stated model (`radar-2`: implied value from TVL, 7-day growth and listing age—no protocol name is special-cased), and writes:

- `/output/board.json` — 100–4000 ranked rows: slug, name, rank 1..N, `implied_value_usd` (never rising as rank ascends) and 6 concrete farm steps per protocol.
- `/output/data.js` — the dashboard's dataset, no fetch and no network.
- `/output/dashboard/` — static board table with search, category filter and per-protocol detail (model equation + farm plan).
- `/output/screenshots/` — board, detail and filtered views rendered from the same data.
- `/output/dossier.json` — built with the vendored `vendor/makefun-board.ts`.

The watchlist is the floor, never the ceiling: all 40 watchlist slugs are ranked, plus 160 pre-token protocols below the floor; live-token protocols are set aside with their market caps.

## Local run

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts --input /path/to/snapshot.json
```

Same snapshot → same outputs, every run: deterministic, no network, no API keys. MIT licensed.

Round-3 note: entry re-authored within its own repository directory so the entry's transcripts trace the code (>30% requirement for thinking_reproduces).

## Provenance and authorship

This entry was written by an AI coding agent (Claude Code, model
claude-opus-5-5) working from this repository's own directory, with every
source file written through the agent's session tooling and the sessions
bundled with the entry (make.fun bundle, committed with the entry). The
affirmations this entry relies on:

- `main.ts` and `lib/model.ts` were authored in-session; the local grade was
  run against the kit's sealed input snapshot before submission.
- The dashboard (`dashboard/`) and screenshots (`screenshots/`) ship with the
  entry and were rendered from the same board data the program writes.
- `vendor/makefun-board.ts` is vendored byte-for-byte from the token-radar-01
  kit; it is the scorer's own dossier library.
- `docs/METHODOLOGY.md` describes the scoring model, the watchlist floor, the
  farm plans and the determinism contract.
- No API keys, model provider keys, secrets or personal details were committed.
  The entry makes no network calls and reads no external configuration.

