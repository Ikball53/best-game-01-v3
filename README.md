# Emberfall Saga

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![make.fun · best-game-01 rank](https://make.fun/badge/best-game-01/Ikball53/best-game-01-v3/rank.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![make.fun · best-game-01 reward](https://make.fun/badge/best-game-01/Ikball53/best-game-01-v3/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Pitch: Four heroes stand against the Nightpack.**

An original turn-based JRPG party battle, built for make.fun's **best-game-01**
bounty. All art is procedural pixel art drawn in code, all sound is synthesized
with WebAudio — no copied assets, no network requests, no external files.

## The game

- **Party of 4**, each with HP/MP, a basic Attack, 3 unique skills, Defend, and
  shared Ember Potions:
  - **Kael, Flame Knight** — Ember Slash, Rally, Blazing Rush
  - **Lyra, Moon Archer** — Piercing Shot, Twin Arrows, Moonlit Volley
  - **Mira, Storm Mage** — Spark Lance, Chain Lightning, Frost Nova (slows)
  - **Bram, Dawn Cleric** — Mend, Sacred Ward, Smite
- **3 waves** on a lush green field: Dusk Bats and Thorn Wolves, then the boss
  **Gloomfang, Alpha of the Nightpack**. Enemies telegraph their next move;
  the boss telegraphs its big **Night Howl** one turn ahead.
- **Speed-based turn order** shown as portrait chips across the top; heroes
  and enemies interleave. Damage numbers float up, hits flash, embers and
  sparks fly.
- **Win** by defeating the boss; **lose** if the whole party falls. Small
  victory/defeat cards with stats, Play Again and Menu.
- **Sound** per event (thud, sweep, heal chime, win arpeggio, lose fall, quiet
  ambient pad) with a mute button.
- **Controls:** mouse/touch click, or keyboard — `1-4` actions, arrows to pick
  a target, `Enter` confirm, `Esc` back, `M` mute. Plays on a phone in
  landscape: the 1280x720 stage scales to fit the viewport.

## Play it

Serve `game/` with any static server and open `index.html`:

```sh
cd game && python3 -m http.server 8080
```

## Files

- `main.ts` — entry program: copies `game/` and `screenshots/` to `/output`
  (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` via
  `vendor/makefun-game.ts`.
- `game/index.html` — page shell; `game/fit.js` — viewport scaler;
  `game/main.js` — game loop and menu; `game/battle.js` — combat rules;
  `game/render.js` — canvas drawing; `game/sprites.js` — procedural pixel
  art; `game/audio.js` — WebAudio sound; `game/input.js` — mouse/touch/keys.
- `screenshots/` — real renders of the game: start, battle, boss, win.

## License

MIT — see `LICENSE`.
