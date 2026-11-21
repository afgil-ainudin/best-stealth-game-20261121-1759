// The thief: movement, sneaking, collision with walls and crates, and the
// noise each footstep makes. Bushes never block movement — they are cover,
// not walls.

import { FIELD_W, FIELD_H, pointInRect } from './levels.js';

export const PLAYER_RADIUS = 14;
export const WALK_SPEED = 168;
export const SNEAK_SPEED = 86;

export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: PLAYER_RADIUS,
    sneaking: false,
    moving: false,
    facing: -Math.PI / 2,
    stepPhase: 0,
    stepSound: false,
    noiseRadius: 0,
  };
}

// Solid obstacles: walls and crates. Bushes are soft cover.
function solidRects(level) {
  return [...level.walls, ...level.crates];
}

function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r;
}

function blockedAt(x, y, level) {
  if (x < PLAYER_RADIUS || x > FIELD_W - PLAYER_RADIUS) return true;
  if (y < PLAYER_RADIUS || y > FIELD_H - PLAYER_RADIUS) return true;
  return solidRects(level).some((r) => circleHitsRect(x, y, PLAYER_RADIUS, r));
}

// Move the player one step. Axis-separated so sliding along a wall works.
// Returns true when the player actually moved.
export function updatePlayer(player, dt, input, level) {
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (mx === 0 && my === 0) {
    player.moving = false;
    player.noiseRadius = 0;
    return false;
  }
  const len = Math.hypot(mx, my);
  mx /= len;
  my /= len;
  player.sneaking = !!input.sneak;
  const speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
  const step = speed * dt;
  const before = Math.floor(player.stepPhase / 30);
  const nx = player.x + mx * step;
  const ny = player.y + my * step;
  if (!blockedAt(nx, player.y, level)) player.x = nx;
  if (!blockedAt(player.x, ny, level)) player.y = ny;
  player.facing = Math.atan2(my, mx);
  player.moving = true;
  player.stepPhase += step;
  player.stepSound = Math.floor(player.stepPhase / 30) > before;
  // Walking is loud enough to hear; sneaking is silent.
  player.noiseRadius = player.sneaking ? 0 : 58;
  return true;
}

// Loot the player is standing on (within pickup range).
export function lootInReach(player, loot) {
  return loot.find((l) => !l.taken && Math.hypot(l.x - player.x, l.y - player.y) < 30);
}

// True when the player stands inside the glowing exit.
export function playerAtExit(player, level) {
  return pointInRect(player.x, player.y, level.exit, -4);
}
