# Claude Prototype

## OUT OF ORDER

A daily pop-culture timeline arcade game — put Movies & TV history in order,
build streaks, take risks. Built with **plain HTML, CSS and vanilla JavaScript**
(no frameworks, no build step) for a college web-development assignment.

The game lives in **[`out-of-order/`](out-of-order/)**.

```
out-of-order/
├─ index.html        Home / Start — today's themed archive
├─ game.html         The daily run (10 rounds)
├─ how-to-play.html  Rules
├─ css/style.css     One stylesheet: design tokens, VHS visual system, responsive
├─ js/game.js        One IIFE: content data, daily run, all challenge logic
└─ assets/images/    Card / theme / texture artwork (with CSS fallbacks)
```

### Run it locally

It needs to be served over HTTP (the pages load `css/` and `js/` with relative
paths). Any static server works, e.g.:

```bash
cd out-of-order
python -m http.server 8000
# then open http://localhost:8000
```

### Status

Staged build, in progress. Done so far: the full core loop (Home, Daily Theme,
the ORDER / BEFORE-AFTER / INSERT / QUOTE challenges, soft timer, speed bonus,
score, streak, Heat, Double Down, +5 sec / Reveal power-ups, Personal Best,
results screen) plus the beta content pass (theme-tagged content, 70/30
themed-vs-wildcard selection). Still to come: theme background art, the Archive
Tokens / Mystery Tape / My Archive collection system, and the beta test docs.

`Images/` holds the original source artwork; optimised copies used by the site
live under `out-of-order/assets/images/`.
