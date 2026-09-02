# GTOMaxy — Poker GTO Preflop Trainer

A free, browser-based trainer for learning game-theory-optimal (GTO) preflop poker strategy. No install, no account, no backend — visit the URL and start training.

**Live site:** https://asantavilla.github.io/GTOMaxy/

## What it is

GTOMaxy deals you a random position and a random hand, then shows you the GTO fold/call/raise percentages for that spot with color-coded strength. You pick an action, and the trainer tells you whether you matched GTO, were close, or missed — building pattern recognition for optimal preflop ranges.

## Features

- **Random position each hand** — any of the 6 seats (UTG, MP, CO, BTN, SB, BB), not a fixed rotation
- **Random hand generation** — two cards dealt each scenario
- **Color-coded GTO percentages** — shown *before* you act, so you can learn the shape of the range
- **Action feedback** — a separate color system tells you how your choice compared to GTO *after* you act
- **Accuracy & streak tracking** — persisted locally via `localStorage`, survives refresh
- **Mobile responsive** — playable on desktop, tablet, or phone

## Quick Start

Just open **https://asantavilla.github.io/GTOMaxy/** — nothing to install. Click FOLD, CALL, or RAISE, read the feedback, then click "Next Hand."

To run locally:

```bash
git clone https://github.com/asantavilla/GTOMaxy.git
cd GTOMaxy
python -m http.server 8000
# visit http://localhost:8000
```

(A local server is needed because `data.json` is loaded via `fetch`, which browsers block on `file://` URLs.)

## How It Works

1. A position and a hand are generated at random.
2. GTO fold/call/raise percentages for that position load from `data.json` and display immediately, color-coded by value.
3. You click FOLD, CALL, or RAISE.
4. The trainer compares your action to the highest-percentage GTO action and shows feedback.
5. Stats update, and you move to the next hand.

## Color System

**GTO percentages (shown before you act)** — colored by the value itself:

| Range | Color | Meaning |
|---|---|---|
| 50–100% | 🟢 Green | Clearly the GTO play |
| 25–49% | 🟡 Yellow | Marginal / mixed strategy |
| 1–24% | 🔴 Red | Not recommended |
| 0% | ⚫ Grey | Never plays here |

**Action feedback (shown after you act)** — colored by correctness, not by percentage:

| Result | Color | Meaning |
|---|---|---|
| You matched the top GTO action | 🟢 Green | "Correct!" |
| Within 15 points of the top action | 🟡 Yellow | "Close call" |
| More than 15 points off | 🔴 Red | "Incorrect" |

**Action buttons:** FOLD is red, CALL is yellow, RAISE is green — matching the psychology of each action.

## Tech Stack

- Plain HTML, CSS, and JavaScript — no frameworks, no build step
- Static GTO ranges in `data.json`
- Client-side only — all logic runs in the browser
- `localStorage` for stats persistence
- Hosted free on GitHub Pages

## Project Structure

```
GTOMaxy/
├── index.html   # page structure
├── style.css    # poker table look, color system, responsive layout
├── script.js    # game logic: random position/hand, scoring, stats
├── data.json    # GTO preflop ranges per position
└── README.md
```

## Roadmap

- **Phase 1 (current)** — preflop trainer with random positions/hands, color-coded GTO %, action feedback, accuracy tracking
- **Phase 2** — postflop trainer (flop/turn/river), tournament chip EV, custom range builder
- **Phase 3** — user accounts, cross-device sync, leaderboards

## Contributing

Bug reports and feature requests are welcome via [Issues](https://github.com/asantavilla/GTOMaxy/issues). GTO range accuracy checks and postflop range contributions are especially useful as the project grows into Phase 2.

## License

MIT

## Contact

[@asantavilla](https://github.com/asantavilla)
