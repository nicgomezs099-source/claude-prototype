# OUT OF ORDER

**One sentence pitch:** OUT OF ORDER is a daily pop-culture memory arcade — five
quick challenge types test whether you remember what came *before* what in
Movies & TV, not the exact year, so a stranger who's never seen a wireframe
still gets it in ten seconds.

**Track:** A — Knowledge (trivia / guess-the-order), leaning on an arcade-style
timer and streak system for the "feedback and progress" design challenge.

**Live game:** https://nicgomezs099-source.github.io/claude-prototype/out-of-order/
**Repo:** https://github.com/nicgomezs099-source/claude-prototype
**Design page (Week 1):** _add the link or file here before submitting_

---

## How to play

One daily run = **10 rounds**, about 3 minutes, mixing five challenge types:

| Type | What you do |
|---|---|
| **Timeline** | Drag (or use the Earlier/Later buttons) 3 cards into oldest → newest order. Partial credit if you get some of it right. |
| **Which Came First?** | Two titles, tap the one that came out first. |
| **Pixel Scene** | One pixel-art scene, recognize it from 3 title options. |
| **Odd One Out** | Four titles, three share something in common — tap the one that doesn't. |
| **Quote** | A famous line, pick which Movie/Series it's from. |

Every round has a soft timer (answering fast earns a **speed bonus**, but
running out of time never blocks you — it just locks in whatever you'd
picked). Chain correct answers to build a **Streak**, which raises **Heat**
and unlocks power-ups (+5 seconds, Reveal a year). Before submitting you can
**Double Down** — right doubles your points, wrong zeroes the round and
resets your streak.

The day's genre (Horror or Sci-Fi right now) is picked by the calendar, so
everyone gets the same tape on the same day — mixed 70/30 with "Archive
Wildcard" rounds pulled from a general pop-culture pool, so it's never 100%
one genre. Finish a run to earn **Archive Tokens**, spend 50 on a **Mystery
Tape** to unlock a Beta Collectible, or keep going in **Encore Mode** (3
lives, gets harder every 4 rounds) after the daily run ends.

---

## Tools used

- **Claude** (via Claude Code, conversational + CLI) — the only AI tool used
  for this build. No v0 / Lovable / Bolt / Figma Make.
- **Plain HTML, CSS and vanilla JavaScript.** No framework, no build step, no
  npm — deliberately, so the whole thing runs straight off GitHub Pages and
  every file is readable without a bundler.
- **Google Fonts** — Bungee (display), Space Grotesk (UI), Permanent Marker
  (VHS handwriting), each with a system fallback stack.
- **GitHub Pages** for hosting.

---

## Project structure

```
out-of-order/
├─ index.html          Home — today's tape, personal best, shelf, collection
├─ game.html            The 10-round daily run: HUD, challenge area, feedback
├─ how-to-play.html     Rules, in plain language
├─ css/style.css        One stylesheet: design tokens, VHS visual system, responsive
├─ js/game.js           One IIFE: content data, daily run engine, all 5 mechanics, scoring
└─ assets/images/
   ├─ cards/            Card art (with a CSS fallback poster if an image is missing)
   ├─ themes/           Horror / Sci-Fi hero backgrounds
   ├─ scenes/           The 4 Pixel Scene images
   ├─ collectibles/     Beta Collectible artwork (Mystery Tape rewards)
   └─ textures/         Optional grain/paper overlays
```

Same `<nav>` markup, copied by hand, on all three pages — no JS injection, so
each page is independently readable.

### Functions worth pointing at in the code walkthrough

- **`mulberry32(seed)`** and **`dayNumber(date)`** — a tiny seeded random
  number generator keyed off the calendar date. Same date → same theme, same
  10 rounds, for every player. No backend needed for a "daily" game.
- **`generateDailyRun(date)`** — the engine: seeds the RNG, decides which 3
  of the 10 rounds are Archive Wildcards, and builds each round's data from
  `CONTENT_ITEMS` / `QUOTE_CHALLENGES` / `PIXEL_SCENES` / `ODD_ONE_OUT`.
- **`calculateSpeedBonus()`** / **`calculatePartialTimelineScore()`** /
  **`calculateRoundScore()`** — three small, separable functions instead of
  one scoring blob, so each rule (speed tier, partial-credit timeline,
  Double Down multiplier) can be explained on its own.
- **`takeItemsDistinctYears()`** — the fix for the duplicate-year bug below;
  a good example of a rule that came from watching someone else play.

---

## Best prompts (and what changed because of them)

These aren't the "build me a game" prompt — they're the ones where steering
the AI actually mattered.

> **1.** *"En el oldest to newest no uses dos peliculas o series del mismo
> año, eso puede confundir a los jugadores. Trata de que las 3 sean de un
> año distinto por lo menos."*
> [Don't repeat a release year in a Timeline round — it confuses players.]
> This came from watching a Timeline round where two cards happened to share
> a year, which made "put them in order" feel unsolvable. Added
> `takeItemsDistinctYears()` as a standing rule for every Timeline round from
> then on.

> **2.** *"Me dicen que el juego de ser accesible con keyboard... hay que
> encontrar la manera de digitar la respuesta y darle Submit con el teclado,
> en mobile es más sencillo con el tap. ¿Puedes generar esto?"*
> [Testers said the game needs to be keyboard-playable on desktop — pick an
> answer and Submit without a mouse.] Result: number keys 1–9 select an
> option for every challenge type and auto-focus Submit, Timeline still
> reorders with arrow keys and now submits on Enter, and every challenge's
> help text states its shortcut.

> **3.** *"Veo que el VHS card del theme del día en dispositivo movil esta
> apareciendo abajo. Trata de ajustar sus dimensiones para que cuando sea
> responsive quede en la misma posición o en su defecto en una posición que
> no comprometa la estética..."*
> [On mobile, today's theme card was showing up at the bottom of the page —
> reposition it without breaking the look.] Fixed by splitting the home
> page's layout into named CSS Grid areas, so mobile reads intro → today's
> theme → everything else, while desktop keeps its original two-column look.

### One thing the AI got wrong

The very first version of the Timeline round could deal three cards where
two shared the same release year (e.g. two 2019 movies). The AI had no way
to know that would confuse a player until someone actually hit it during
testing — "put these in order" doesn't really make sense if two of them tied.
**Fix:** `takeItemsDistinctYears()` re-draws from the pool until all 3 cards
have different years, applied everywhere a Timeline-style round is built.

---

## Non-negotiables checklist

- [x] 3 pages, same nav — Home ([index.html](out-of-order/index.html)) ·
      Game ([game.html](out-of-order/game.html)) · How to Play
      ([how-to-play.html](out-of-order/how-to-play.html))
- [x] Playable on a phone — every mechanic renders as real tap targets;
      Timeline has always-visible Move Earlier / Move Later buttons, not
      drag-only
- [x] Keyboard playable on desktop, with visible focus states — number keys
      select, Enter submits, Timeline reorders with arrow keys; every
      interactive element has a `:focus-visible` outline
- [x] Never colour alone — correct/wrong is always a ✓ / ± / ✕ mark and a
      word ("Correct", "Not quite"), never just green/red
- [x] Live URL — GitHub Pages (link above)

---

## Run it locally

Needs to be served over HTTP (the pages load `css/` and `js/` with relative
paths — opening `index.html` straight from disk won't work).

```bash
cd out-of-order
python -m http.server 8000
# then open http://localhost:8000
```

`Images/` at the repo root holds the original source artwork; the optimized
copies actually used by the site live under `out-of-order/assets/images/`.
