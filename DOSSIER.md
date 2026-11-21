# Moonlit Dock Heist — Dossier

## What it is

A complete, original top-down stealth game for the make.fun bounty
"Make the best stealth game" (best-stealth-game-20261121-1759). It plays
offline in a desktop browser from its own static files — keyboard and mouse,
no network, no libraries. All art is drawn in code on a canvas; all sound is
synthesized with WebAudio.

## The game

You are a hooded thief in a harbour yard at full moon. Three levels —
**Moonlit Dock**, **Lantern Warehouse**, **The Captain's Vault** — each a
walled yard of crates, bushes, lantern light and patrolling guards. Reach the
glowing green exit. Pocket the glowing loot on the way for score. Never be
seen: a guard that catches you ends the heist.

## Mechanics

- **Vision cones.** Every guard sweeps a bright amber cone. Standing inside
  one with a clear line of sight fills the guard's suspicion — faster up
  close, slower while sneaking or hiding in a bush. Break line of sight and
  suspicion fades, giving you a chance to recover.
- **Guard states.** Patrol (waypoints with a pause and a look-around) →
  Suspicious (creeps toward where it glimpsed you, "?" overhead) → Alert
  (chases you, "!" overhead, red alarm flash) → Search (hunts the last seen
  spot, then returns to patrol).
- **Cover.** Walls and crates block movement and sight. Bushes never block
  movement but hide you inside them.
- **Noise.** Walking is loud: guards within earshot turn toward your
  footsteps. Sneaking (hold Shift) is slow and silent.
- **Sound.** Footsteps that tell you where a guard is, a loot chime, an
  alert sting, a caught sting and a win arpeggio — all synthesized.
- **Scoring.** Loot ×100, a time bonus, and +500 for finishing a level
  without ever being fully spotted.
- **HUD.** Level name and goal ("Reach the exit unseen"), alarm meter,
  timer, alerted-guard count, loot counter, Hint / Pause / Restart / Sound
  buttons, and a keyboard footer. 3 hints per level point to the nearest loot.

## Controls

WASD or arrow keys to move · Shift to sneak · H hint · P pause · R restart ·
M sound. Click the level buttons on the title screen to pick a level.

## Screenshots

1. `1-play.jpg` — mid-sneak: the thief crouched behind crates as a guard's
   cone sweeps past, one loot pocketed, alarm at a third.
2. `2-start.jpg` — title screen with level select and the goal.
3. `3-alert.jpg` — a guard fully alerted and chasing, alarm at full, red flash.
4. `4-win.jpg` — the perfect heist: all loot, never spotted, at the exit.

## Structure

- `game/index.html` — page shell, HUD, overlays
- `game/style.css` — HUD and overlay styling
- `game/js/main.js` — game loop, screens, input, HUD, screenshot staging
- `game/js/levels.js` — the three level maps and line-of-sight geometry
- `game/js/guards.js` — patrols, vision cones, suspicion, chase and search
- `game/js/player.js` — movement, sneaking, collision, noise, loot pickup
- `game/js/audio.js` — synthesized WebAudio sounds
- `game/js/render.js` — canvas drawing: floor, cover, cones, figures, exit
- `main.ts` — copies game/ and screenshots/ to /output and writes dossier.json
- `vendor/makefun-game.ts` — the kit's library, unchanged
