// Game loop, screens and input for Moonlit Dock Heist.
// Screens: title (level select + how to play) -> playing -> paused /
// caught / win. The ?shot= URL mode stages a frozen, deterministic frame
// for screenshots: play, start, alert and win.

import { LEVELS, FIELD_W, FIELD_H } from './levels.js';
import {
  makeGuard, updateGuard, guardHearsNoise, playerHiddenInBush,
} from './guards.js';
import { makePlayer, updatePlayer, lootInReach, playerAtExit } from './player.js';
import {
  initAudio, setMuted, isMuted, playFootstep, playGuardStep,
  playPickup, playAlert, playCaught, playWin, playClick,
} from './audio.js';
import { drawGame } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const $ = (id) => document.getElementById(id);
const hud = {
  levelName: $('level-name'),
  objective: $('objective'),
  alarmFill: $('alarm-fill'),
  alarmText: $('alarm-text'),
  timer: $('timer'),
  alerted: $('alerted'),
  loot: $('loot-count'),
  hints: $('hints-left'),
};

const state = {
  screen: 'title', // title | playing | paused | caught | win | staged
  levelIndex: 0,
  level: null,
  player: null,
  guards: [],
  loot: [],
  timer: 0,
  hintsLeft: 3,
  hintTarget: null,
  hintUntil: 0,
  spottedEver: false,
  alarmFlash: 0,
  caughtBy: null,
  time: 0,
  lastTs: 0,
  noiseCooldown: 0,
};

const input = { up: false, down: false, left: false, right: false, sneak: false };

function cloneLoot(level) {
  return level.loot.map((l) => ({ ...l, taken: false }));
}

function loadLevel(index) {
  const level = LEVELS[index];
  state.levelIndex = index;
  state.level = level;
  state.player = makePlayer(level.playerStart);
  state.guards = level.guards.map(makeGuard);
  state.loot = cloneLoot(level);
  state.timer = 0;
  state.hintsLeft = 3;
  state.hintTarget = null;
  state.spottedEver = false;
  state.alarmFlash = 0;
  state.caughtBy = null;
  hud.levelName.textContent = `${level.name} · Level ${index + 1} of 3`;
  hud.objective.textContent = 'Reach the exit unseen';
  updateHud();
}

function startLevel(index) {
  initAudio();
  loadLevel(index);
  state.screen = 'playing';
  showOverlay(null);
  playClick();
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function updateHud() {
  const taken = state.loot.filter((l) => l.taken).length;
  const alarm = state.guards.length
    ? Math.max(...state.guards.map((g) => g.suspicion))
    : 0;
  const alerted = state.guards.filter((g) => g.state === 'alert').length;
  hud.alarmFill.style.width = `${Math.round(alarm * 100)}%`;
  hud.alarmFill.className = alarm > 0.8 ? 'fill danger' : alarm > 0.45 ? 'fill warn' : 'fill';
  hud.alarmText.textContent = alerted > 0 ? 'SPOTTED!' : alarm > 0.45 ? 'Suspicious…' : 'Hidden';
  hud.timer.textContent = fmtTime(state.timer);
  hud.alerted.textContent = String(alerted);
  hud.loot.textContent = `${taken} / ${state.loot.length}`;
  hud.hints.textContent = String(state.hintsLeft);
}

function showOverlay(id) {
  for (const el of document.querySelectorAll('.overlay')) el.classList.add('hidden');
  if (id) $(id).classList.remove('hidden');
}

function useHint() {
  if (state.screen !== 'playing' || state.hintsLeft <= 0) return;
  state.hintsLeft -= 1;
  const remaining = state.loot.filter((l) => !l.taken);
  const target = remaining.length
    ? remaining.reduce((a, b) =>
      (Math.hypot(a.x - state.player.x, a.y - state.player.y) <
       Math.hypot(b.x - state.player.x, b.y - state.player.y) ? a : b))
    : { x: state.level.exit.x + 35, y: state.level.exit.y + 35 };
  state.hintTarget = target;
  state.hintUntil = state.time + 6;
  playClick();
  updateHud();
}

function onCaught(guard) {
  state.screen = 'caught';
  state.caughtBy = guard.name;
  $('caught-by').textContent = `Spotted by ${guard.name} — the yard woke up.`;
  showOverlay('overlay-caught');
  playCaught();
}

function onWin() {
  state.screen = 'win';
  const taken = state.loot.filter((l) => l.taken).length;
  const timeBonus = Math.max(0, 600 - Math.floor(state.timer) * 5);
  const unseenBonus = state.spottedEver ? 0 : 500;
  const score = taken * 100 + timeBonus + unseenBonus;
  $('win-title').textContent = state.spottedEver ? 'You slipped away!' : 'UNSEEN! A perfect heist.';
  $('win-stats').textContent =
    `Loot ${taken} / ${state.loot.length} · Time ${fmtTime(state.timer)} · ` +
    `Time bonus +${timeBonus} · ${state.spottedEver ? 'Spotted once' : 'Never spotted +500'} · Score ${score}`;
  $('btn-next').style.display = state.levelIndex < LEVELS.length - 1 ? '' : 'none';
  showOverlay('overlay-win');
  playWin();
}

function update(dt) {
  state.time += dt;
  if (state.screen !== 'playing') return;
  state.timer += dt;
  const p = state.player;
  p.hidden = playerHiddenInBush(p, state.level);
  updatePlayer(p, dt, input, state.level);
  if (p.stepSound) {
    playFootstep(p.sneaking ? 0.25 : 0.6);
    if (p.noiseRadius > 0 && state.noiseCooldown <= 0) {
      state.noiseCooldown = 0.5;
      for (const g of state.guards) guardHearsNoise(g, p.x, p.y);
    }
  }
  state.noiseCooldown -= dt;
  let maxSuspicion = 0;
  for (const g of state.guards) {
    const ev = updateGuard(g, dt, p, state.level, state.time);
    if (g.stepSound) {
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      playGuardStep(Math.max(0, 1 - d / 420));
    }
    if (ev.spotted) {
      state.spottedEver = true;
      playAlert();
    }
    if (ev.caught) {
      onCaught(g);
      return;
    }
    maxSuspicion = Math.max(maxSuspicion, g.suspicion);
  }
  p.danger = maxSuspicion;
  state.alarmFlash = Math.max(0, state.alarmFlash - dt * 0.8);
  if (maxSuspicion >= 1) state.alarmFlash = 1;
  const item = lootInReach(p, state.loot);
  if (item) {
    item.taken = true;
    playPickup();
  }
  if (state.hintTarget && state.time > state.hintUntil) state.hintTarget = null;
  if (playerAtExit(p, state.level)) {
    onWin();
    return;
  }
  updateHud();
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - state.lastTs) / 1000 || 0);
  state.lastTs = ts;
  update(dt);
  drawGame(ctx, {
    level: state.level,
    player: state.player,
    guards: state.guards,
    loot: state.loot,
    hintTarget: state.hintTarget,
    alarmFlash: state.alarmFlash,
  }, state.time);
  requestAnimationFrame(frame);
}

// --- Staged frames for screenshots (?shot=play|start|alert|win) -------------
function stageShot(shot) {
  if (shot === 'start') {
    loadLevel(0);
    state.screen = 'staged';
    showOverlay('overlay-title');
  } else if (shot === 'play') {
    loadLevel(0);
    const p = state.player;
    p.x = 470; p.y = 415; p.sneaking = true; p.facing = Math.PI / 2;
    p.danger = 0.35;
    const g0 = state.guards[0];
    g0.x = 560; g0.y = 250;
    g0.dir = Math.atan2(415 - 250, 470 - 560);
    g0.suspicion = 0.35; g0.state = 'suspicious';
    g0.lastSeen = { x: 470, y: 415 };
    const g1 = state.guards[1];
    g1.x = 1050; g1.y = 300; g1.dir = Math.PI / 2; g1.suspicion = 0.05;
    state.loot[0].taken = true;
    state.timer = 47;
    state.screen = 'staged';
    showOverlay(null);
  } else if (shot === 'alert') {
    loadLevel(1);
    const p = state.player;
    p.x = 560; p.y = 480; p.sneaking = true; p.facing = -Math.PI / 2;
    p.danger = 1;
    const g0 = state.guards[0];
    g0.x = 470; g0.y = 420;
    g0.dir = Math.atan2(480 - 420, 560 - 470);
    g0.suspicion = 1; g0.state = 'alert';
    g0.lastSeen = { x: 560, y: 480 };
    state.guards[1].suspicion = 0.2;
    state.loot[0].taken = true;
    state.loot[1].taken = true;
    state.timer = 72;
    state.alarmFlash = 1;
    state.spottedEver = true;
    state.screen = 'staged';
    showOverlay(null);
  } else if (shot === 'win') {
    loadLevel(0);
    const p = state.player;
    p.x = 1220; p.y = 90; p.facing = Math.PI;
    for (const l of state.loot) l.taken = true;
    state.timer = 84;
    state.screen = 'staged';
    $('win-title').textContent = 'UNSEEN! A perfect heist.';
    $('win-stats').textContent =
      'Loot 3 / 3 · Time 1:24 · Time bonus +180 · Never spotted +500 · Score 980';
    $('btn-next').style.display = '';
    showOverlay('overlay-win');
  }
  state.time = 1.2;
  updateHud();
  drawGame(ctx, {
    level: state.level,
    player: state.player,
    guards: state.guards,
    loot: state.loot,
    hintTarget: state.hintTarget,
    alarmFlash: state.alarmFlash,
  }, state.time);
  window.__shotReady = true;
}

// --- Input -------------------------------------------------------------------
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

window.addEventListener('keydown', (e) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = true;
  const dir = KEYMAP[e.code];
  if (dir) {
    input[dir] = true;
    e.preventDefault();
  }
  if (e.code === 'KeyH') useHint();
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (state.screen === 'playing') {
      state.screen = 'paused';
      showOverlay('overlay-pause');
    } else if (state.screen === 'paused') {
      state.screen = 'playing';
      showOverlay(null);
    }
  }
  if (e.code === 'KeyR') {
    if (state.screen === 'playing' || state.screen === 'paused' || state.screen === 'caught') {
      startLevel(state.levelIndex);
    }
  }
  if (e.code === 'KeyM') setMuted(!isMuted());
  if (e.code === 'Enter' && state.screen === 'title') startLevel(state.levelIndex);
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = false;
  const dir = KEYMAP[e.code];
  if (dir) input[dir] = false;
});

function bind(id, fn) {
  const el = $(id);
  if (el) el.addEventListener('click', () => { initAudio(); fn(); });
}

bind('btn-start', () => startLevel(state.levelIndex));
bind('btn-hint', useHint);
bind('btn-pause', () => {
  if (state.screen === 'playing') {
    state.screen = 'paused';
    showOverlay('overlay-pause');
  }
});
bind('btn-restart', () => startLevel(state.levelIndex));
bind('btn-resume', () => { state.screen = 'playing'; showOverlay(null); });
bind('btn-retry', () => startLevel(state.levelIndex));
bind('btn-again', () => startLevel(state.levelIndex));
bind('btn-next', () => startLevel(state.levelIndex + 1));
bind('btn-menu', () => {
  state.screen = 'title';
  loadLevel(state.levelIndex);
  showOverlay('overlay-title');
});
bind('btn-sound', () => {
  setMuted(!isMuted());
  $('btn-sound').textContent = isMuted() ? 'Sound: Off' : 'Sound: On';
});
document.querySelectorAll('[data-level]').forEach((btn) => {
  btn.addEventListener('click', () => {
    initAudio();
    playClick();
    startLevel(Number(btn.dataset.level));
  });
});
document.querySelectorAll('[data-howto]').forEach((btn) => {
  btn.addEventListener('click', () => {
    $('howto').classList.toggle('hidden');
  });
});

// --- Boot --------------------------------------------------------------------
loadLevel(0);
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot);
} else {
  showOverlay('overlay-title');
  state.lastTs = performance.now();
  requestAnimationFrame(frame);
}

// Test hook: the playtest script reads game state through this.
window.__game = state;
