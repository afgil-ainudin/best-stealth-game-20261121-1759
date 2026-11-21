// Guard patrols, vision cones and the detection system for Moonlit Dock Heist.
// A guard patrols waypoints, grows suspicious when the thief enters its cone
// with a clear line of sight, gives chase when fully alerted, searches the
// last seen spot when the trail goes cold, then returns to its patrol.

import { pointInRect, segmentHitsRect } from './levels.js';

const TAU = Math.PI * 2;

// Wrap an angle to (-PI, PI].
export function wrapAngle(a) {
  while (a > Math.PI) a -= TAU;
  while (a <= -Math.PI) a += TAU;
  return a;
}

// Everything that blocks a guard's sight: walls, crates and bushes.
export function sightBlockers(level) {
  return [...level.walls, ...level.crates, ...level.bushes];
}

export function makeGuard(def) {
  const [sx, sy] = def.path[0];
  return {
    name: def.name,
    path: def.path,
    speed: def.speed,
    range: def.range,
    fov: def.fov,
    x: sx,
    y: sy,
    dir: 0,
    waypoint: 1,
    pause: 0,
    state: 'patrol', // patrol | suspicious | alert | search
    suspicion: 0, // 0 .. 1 ; 1 means fully alerted
    lastSeen: null,
    searchTime: 0,
    lostTime: 0,
    stepPhase: 0,
    stepSound: false,
  };
}

// Can this guard see the player right now? Distance, cone angle and a clear
// line of sight (no wall, crate or bush in between).
export function guardCanSee(guard, player, level) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > guard.range) return false;
  const angle = Math.atan2(dy, dx);
  if (Math.abs(wrapAngle(angle - guard.dir)) > guard.fov) return false;
  for (const b of sightBlockers(level)) {
    if (segmentHitsRect(guard.x, guard.y, player.x, player.y, b)) return false;
  }
  return true;
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.dir = Math.atan2(dy, dx);
  guard.stepPhase += step;
  return dist - step < 2;
}

// One simulation step. Returns events the game loop turns into sound and HUD:
// { spotted, lostSight, caught, heardNoise }.
export function updateGuard(guard, dt, player, level, now) {
  const events = { spotted: false, lostSight: false, caught: false, heardNoise: false };
  const sees = guardCanSee(guard, player, level);
  const dist = Math.hypot(player.x - guard.x, player.y - guard.y);

  if (sees) {
    // Closer is scarier; sneaking and hiding in a bush slow the rise.
    let rate = (1 - dist / guard.range) * 1.7 + 0.35;
    if (player.sneaking) rate *= 0.5;
    if (player.hidden) rate *= 0.25;
    guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.lostTime = 0;
    if (guard.suspicion >= 1 && guard.state !== 'alert') {
      guard.state = 'alert';
      events.spotted = true;
    } else if (guard.suspicion >= 0.55 && guard.state === 'patrol') {
      guard.state = 'suspicious';
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - 0.45 * dt);
    if (guard.state === 'alert') {
      guard.lostTime += dt;
      if (guard.lostTime > 3) {
        guard.state = 'search';
        guard.searchTime = 0;
        events.lostSight = true;
      }
    } else if (guard.state === 'suspicious' && guard.suspicion < 0.25) {
      guard.state = 'patrol';
    }
  }

  // Footsteps: the loop plays a step sound each time the phase crosses a stride.
  const before = Math.floor(guard.stepPhase / 34);
  switch (guard.state) {
    case 'patrol': {
      if (guard.pause > 0) {
        guard.pause -= dt;
        // Look around while paused at a waypoint: sweep the cone.
        guard.dir += Math.sin(now * 0.9 + guard.x * 0.01) * 0.55 * dt;
        break;
      }
      const target = guard.path[guard.waypoint];
      if (moveToward(guard, target[0], target[1], guard.speed, dt)) {
        guard.waypoint = (guard.waypoint + 1) % guard.path.length;
        guard.pause = 1.1;
      }
      break;
    }
    case 'suspicious': {
      // Creep toward where the thief was last glimpsed, cone fixed on it.
      if (guard.lastSeen) {
        guard.dir = Math.atan2(guard.lastSeen.y - guard.y, guard.lastSeen.x - guard.x);
        moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, guard.speed * 0.45, dt);
      }
      break;
    }
    case 'alert': {
      // Chase the thief. Touching the thief ends the level.
      moveToward(guard, player.x, player.y, guard.speed * 1.9, dt);
      if (dist < 24) events.caught = true;
      break;
    }
    case 'search': {
      guard.searchTime += dt;
      if (guard.lastSeen) {
        if (moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, guard.speed * 0.7, dt)) {
          guard.dir += 1.4 * dt; // scan the spot
        }
      }
      if (guard.searchTime > 4) {
        guard.state = 'patrol';
        guard.suspicion = 0.35;
      }
      break;
    }
  }
  guard.stepSound = Math.floor(guard.stepPhase / 34) > before;
  return events;
}

// A loud footstep (walking, not sneaking) within earshot turns a patrolling
// guard toward the noise and raises its suspicion a little.
export function guardHearsNoise(guard, x, y) {
  if (guard.state === 'alert') return false;
  const dist = Math.hypot(x - guard.x, y - guard.y);
  if (dist > 130) return false;
  guard.dir = Math.atan2(y - guard.y, x - guard.x);
  guard.suspicion = Math.min(0.95, guard.suspicion + 0.16);
  if (guard.suspicion >= 0.55 && guard.state === 'patrol') guard.state = 'suspicious';
  guard.lastSeen = { x, y };
  return true;
}

// Is the player hidden inside a bush right now?
export function playerHiddenInBush(player, level) {
  return level.bushes.some((b) => pointInRect(player.x, player.y, b, -6));
}
