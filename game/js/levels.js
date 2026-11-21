// Level definitions for Moonlit Dock Heist: three harbour-yard levels, each a
// top-down map of walls, crates, bushes, loot, guard patrols, a player start
// and a glowing exit. Coordinates live in the 1280 x 600 playfield.

export const FIELD_W = 1280;
export const FIELD_H = 600;

// rect helper: { x, y, w, h } with x,y the top-left corner.
function rect(x, y, w, h) {
  return { x, y, w, h };
}

export const LEVELS = [
  {
    name: 'Moonlit Dock',
    subtitle: 'Level 1 of 3 · The Harbour at Full Moon',
    par: '2:30',
    playerStart: { x: 90, y: 520 },
    exit: rect(1185, 55, 70, 70),
    walls: [
      rect(500, 170, 300, 24),
      rect(850, 300, 24, 220),
      rect(180, 250, 24, 160),
    ],
    crates: [
      rect(380, 330, 70, 70),
      rect(452, 330, 70, 70),
      rect(700, 420, 70, 70),
      rect(150, 130, 70, 70),
      rect(1050, 350, 70, 70),
      rect(950, 480, 70, 70),
    ],
    bushes: [
      rect(250, 450, 100, 60),
      rect(950, 110, 110, 60),
      rect(620, 70, 100, 60),
    ],
    loot: [
      { x: 205, y: 120, name: 'Moon Pearl' },
      { x: 770, y: 500, name: 'Brass Compass' },
      { x: 1130, y: 480, name: 'Jade Idol' },
    ],
    guards: [
      {
        name: 'Dockhand Bram',
        path: [[300, 250], [900, 250]],
        speed: 72,
        range: 230,
        fov: 0.58,
      },
      {
        name: 'Watchman Odo',
        path: [[1000, 180], [1000, 440]],
        speed: 82,
        range: 220,
        fov: 0.58,
      },
    ],
  },
  {
    name: 'Lantern Warehouse',
    subtitle: 'Level 2 of 3 · Crates, Lanterns and Long Shadows',
    par: '3:00',
    playerStart: { x: 80, y: 90 },
    exit: rect(1185, 480, 70, 70),
    walls: [
      rect(300, 120, 24, 260),
      rect(560, 320, 320, 24),
      rect(960, 120, 24, 240),
      rect(150, 430, 260, 24),
    ],
    crates: [
      rect(420, 160, 70, 70),
      rect(492, 160, 70, 70),
      rect(700, 180, 70, 70),
      rect(1070, 430, 70, 70),
      rect(620, 470, 70, 70),
      rect(240, 300, 70, 70),
      rect(880, 260, 70, 70),
    ],
    bushes: [
      rect(120, 480, 110, 60),
      rect(500, 500, 100, 60),
      rect(1080, 120, 110, 60),
      rect(800, 90, 100, 60),
    ],
    loot: [
      { x: 360, y: 520, name: 'Silver Bell' },
      { x: 760, y: 120, name: 'Ivory Die' },
      { x: 1020, y: 500, name: 'Ruby Lantern' },
      { x: 1190, y: 300, name: 'Gold Sextant' },
    ],
    guards: [
      {
        name: 'Foreman Kett',
        path: [[380, 380], [880, 380]],
        speed: 80,
        range: 235,
        fov: 0.58,
      },
      {
        name: 'Watchman Odo',
        path: [[620, 90], [620, 280]],
        speed: 88,
        range: 225,
        fov: 0.58,
      },
      {
        name: 'Night Guard Sable',
        path: [[1040, 300], [1040, 520], [820, 520]],
        speed: 76,
        range: 230,
        fov: 0.6,
      },
    ],
  },
  {
    name: "The Captain's Vault",
    subtitle: 'Level 3 of 3 · One Door, Four Lanterns, No Mercy',
    par: '3:30',
    playerStart: { x: 640, y: 530 },
    exit: rect(90, 55, 70, 70),
    walls: [
      rect(240, 140, 24, 300),
      rect(700, 140, 24, 300),
      rect(1016, 140, 24, 300),
      rect(420, 300, 420, 24),
    ],
    crates: [
      rect(340, 180, 70, 70),
      rect(800, 180, 70, 70),
      rect(1100, 180, 70, 70),
      rect(340, 420, 70, 70),
      rect(800, 420, 70, 70),
      rect(1100, 420, 70, 70),
      rect(580, 90, 70, 70),
    ],
    bushes: [
      rect(120, 300, 100, 60),
      rect(1180, 300, 60, 90),
      rect(560, 500, 120, 60),
    ],
    loot: [
      { x: 150, y: 120, name: 'Moon Pearl' },
      { x: 460, y: 120, name: 'Brass Compass' },
      { x: 900, y: 120, name: 'Jade Idol' },
      { x: 460, y: 480, name: 'Silver Bell' },
      { x: 900, y: 480, name: 'Ruby Lantern' },
    ],
    guards: [
      {
        name: 'Captain Mire',
        path: [[480, 90], [480, 280]],
        speed: 90,
        range: 245,
        fov: 0.6,
      },
      {
        name: 'Foreman Kett',
        path: [[960, 320], [960, 520]],
        speed: 90,
        range: 245,
        fov: 0.6,
      },
      {
        name: 'Watchman Odo',
        path: [[90, 200], [90, 460]],
        speed: 86,
        range: 230,
        fov: 0.58,
      },
      {
        name: 'Night Guard Sable',
        path: [[1060, 90], [1240, 90]],
        speed: 86,
        range: 230,
        fov: 0.58,
      },
    ],
  },
];

// True when point (x, y) lies inside rect r (with a small margin).
export function pointInRect(x, y, r, margin = 0) {
  return (
    x >= r.x - margin && x <= r.x + r.w + margin &&
    y >= r.y - margin && y <= r.y + r.h + margin
  );
}

// True when the segment from (x1, y1) to (x2, y2) crosses rect r.
// Walls, crates and bushes all block a guard's line of sight.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}
