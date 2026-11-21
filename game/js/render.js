// Canvas drawing for Moonlit Dock Heist: a moonlit harbour yard in flat
// vector style — navy night floor, warm lantern pools, bright amber vision
// cones, crates and bushes as cover, a glowing exit and glowing loot.

import { FIELD_W, FIELD_H } from './levels.js';

const TAU = Math.PI * 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, t) {
  // Night boards: deep navy planks with faint seams and a moonlit wash.
  ctx.fillStyle = '#1b2740';
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  ctx.strokeStyle = 'rgba(120, 150, 200, 0.10)';
  ctx.lineWidth = 1;
  for (let y = 40; y < FIELD_H; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD_W, y);
    ctx.stroke();
  }
  for (let x = 0; x < FIELD_W; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FIELD_H);
    ctx.stroke();
  }
  // Moonlight wash from the top-left.
  const wash = ctx.createLinearGradient(0, 0, FIELD_W, FIELD_H);
  wash.addColorStop(0, 'rgba(190, 210, 255, 0.10)');
  wash.addColorStop(0.5, 'rgba(190, 210, 255, 0.02)');
  wash.addColorStop(1, 'rgba(0, 0, 0, 0.10)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  // A few scattered stones and puddles of moonlight.
  ctx.fillStyle = 'rgba(150, 170, 220, 0.08)';
  for (let i = 0; i < 14; i++) {
    const px = ((i * 197) % 1240) + 20;
    const py = ((i * 131) % 560) + 20;
    ctx.beginPath();
    ctx.ellipse(px, py, 14 + (i % 3) * 6, 8 + (i % 2) * 4, 0, 0, TAU);
    ctx.fill();
  }
  void t;
}

function drawWall(ctx, r) {
  ctx.fillStyle = '#2c3550';
  rr(ctx, r.x, r.y, r.w, r.h, 4);
  ctx.fill();
  ctx.fillStyle = '#3a4568';
  rr(ctx, r.x + 2, r.y + 2, r.w - 4, Math.min(8, r.h - 4), 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 14, 28, 0.7)';
  ctx.lineWidth = 2;
  rr(ctx, r.x, r.y, r.w, r.h, 4);
  ctx.stroke();
}

function drawCrate(ctx, r) {
  ctx.fillStyle = '#7a5a33';
  rr(ctx, r.x, r.y, r.w, r.h, 5);
  ctx.fill();
  ctx.fillStyle = '#8d6a3d';
  rr(ctx, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 3);
  ctx.fill();
  ctx.strokeStyle = '#5d4326';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(r.x + 5, r.y + 5);
  ctx.lineTo(r.x + r.w - 5, r.y + r.h - 5);
  ctx.moveTo(r.x + r.w - 5, r.y + 5);
  ctx.lineTo(r.x + 5, r.y + r.h - 5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(10, 14, 28, 0.6)';
  ctx.lineWidth = 2;
  rr(ctx, r.x, r.y, r.w, r.h, 5);
  ctx.stroke();
}

function drawBush(ctx, r, t) {
  // A dark shrub: a cluster of leaves the thief can vanish into.
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  ctx.fillStyle = '#1d4a2e';
  for (const [ox, oy, rad] of [[-28, 4, 22], [0, -6, 26], [28, 4, 22], [-12, 10, 20], [14, 10, 20]]) {
    ctx.beginPath();
    ctx.arc(cx + ox, cy + oy, rad, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#2a6b3f';
  for (const [ox, oy, rad] of [[-20, -2, 12], [8, -10, 13], [22, 6, 10]]) {
    ctx.beginPath();
    ctx.arc(cx + ox, cy + oy, rad, 0, TAU);
    ctx.fill();
  }
  void t;
}

function drawLanternGlow(ctx, x, y, radius, alpha) {
  const g = ctx.createRadialGradient(x, y, 4, x, y, radius);
  g.addColorStop(0, `rgba(255, 190, 90, ${alpha})`);
  g.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fill();
}

function drawLoot(ctx, item, t) {
  const bob = Math.sin(t * 2.4 + item.x) * 3;
  drawLanternGlow(ctx, item.x, item.y + bob, 46, 0.5);
  ctx.save();
  ctx.translate(item.x, item.y + bob);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#ffd34d';
  ctx.fillRect(-9, -9, 18, 18);
  ctx.fillStyle = '#fff3b0';
  ctx.fillRect(-5, -5, 10, 10);
  ctx.restore();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(item.name.toUpperCase(), item.x, item.y + 30 + bob);
}

function drawExit(ctx, level, t) {
  const e = level.exit;
  const pulse = 0.55 + Math.sin(t * 3) * 0.15;
  drawLanternGlow(ctx, e.x + e.w / 2, e.y + e.h / 2, 90, pulse);
  ctx.fillStyle = '#123f2a';
  rr(ctx, e.x, e.y, e.w, e.h, 8);
  ctx.fill();
  ctx.strokeStyle = '#39d98a';
  ctx.lineWidth = 3;
  rr(ctx, e.x, e.y, e.w, e.h, 8);
  ctx.stroke();
  ctx.fillStyle = '#39d98a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5);
  // Bouncing arrow above the gate.
  const ay = e.y - 14 + Math.sin(t * 3) * 4;
  ctx.beginPath();
  ctx.moveTo(e.x + e.w / 2 - 12, ay - 8);
  ctx.lineTo(e.x + e.w / 2 + 12, ay - 8);
  ctx.lineTo(e.x + e.w / 2, ay + 8);
  ctx.closePath();
  ctx.fill();
}

function drawVisionCone(ctx, guard) {
  const state = guard.state;
  const base =
    state === 'alert' ? '255, 70, 70' :
    state === 'suspicious' ? '255, 170, 60' : '255, 205, 80';
  const alpha = state === 'alert' ? 0.34 : 0.26;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, guard.range, guard.dir - guard.fov, guard.dir + guard.fov);
  ctx.closePath();
  ctx.fillStyle = `rgba(${base}, ${alpha})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${base}, 0.55)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawGuard(ctx, guard, t) {
  // Boots first, then the body, so the figure reads against the floor.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 12, 14, 6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#31405e';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 15, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 15, 0, TAU);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f2c14e';
  ctx.stroke();
  // Helmet brim and the direction the guard faces.
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 8, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#31405e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.dir) * 20, guard.y + Math.sin(guard.dir) * 20);
  ctx.stroke();
  // Suspicion: a ring filling around the guard, plus ? or ! above.
  if (guard.suspicion > 0.03) {
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 21, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * TAU);
    ctx.strokeStyle = guard.state === 'alert' ? '#ff5252' : '#ffd34d';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  if (guard.state === 'alert' || guard.state === 'suspicious') {
    ctx.fillStyle = guard.state === 'alert' ? '#ff5252' : '#ffd34d';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.state === 'alert' ? '!' : '?', guard.x, guard.y - 26);
  }
  void t;
}

function drawPlayer(ctx, player, t) {
  drawLanternGlow(ctx, player.x, player.y, 40, 0.28);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 11, 13, 5, 0, 0, TAU);
  ctx.fill();
  // Hooded thief: a teal cloak, darker when sneaking (crouched).
  const crouch = player.sneaking ? 0.78 : 1;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(1, crouch);
  ctx.fillStyle = '#0f766e';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#14b8a6';
  ctx.beginPath();
  ctx.arc(0, -2, 8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0b3d38';
  ctx.beginPath();
  ctx.arc(Math.cos(player.facing) * 4, Math.sin(player.facing) * 4 - 2, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
  // A thin detection ring when a guard is getting close to spotting the thief.
  if (player.danger > 0.03) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, 22, -Math.PI / 2, -Math.PI / 2 + player.danger * TAU);
    ctx.strokeStyle = player.danger > 0.8 ? '#ff5252' : '#ffd34d';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  void t;
}

function drawHintArrow(ctx, target, t) {
  if (!target) return;
  const bob = Math.sin(t * 4) * 4;
  ctx.save();
  ctx.translate(target.x, target.y - 34 + bob);
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(10, -6);
  ctx.lineTo(0, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Draw one frame of the level. `state` carries level, player, guards, loot,
// hint target and the running clock.
export function drawGame(ctx, state, t) {
  const { level, player, guards, loot } = state;
  drawFloor(ctx, t);
  for (const w of level.walls) drawWall(ctx, w);
  for (const b of level.bushes) drawBush(ctx, b, t);
  for (const c of level.crates) drawCrate(ctx, c);
  drawExit(ctx, level, t);
  for (const item of loot) {
    if (!item.taken) drawLoot(ctx, item, t);
  }
  // Cones under the guards so the figures sit on top of them.
  for (const g of guards) drawVisionCone(ctx, g);
  drawHintArrow(ctx, state.hintTarget, t);
  for (const g of guards) drawGuard(ctx, g, t);
  drawPlayer(ctx, player, t);
  // Moonlit vignette: the edges of the yard fall into darkness.
  const v = ctx.createRadialGradient(
    FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.42,
    FIELD_W / 2, FIELD_H / 2, FIELD_H * 0.95,
  );
  v.addColorStop(0, 'rgba(4, 8, 20, 0)');
  v.addColorStop(1, 'rgba(4, 8, 20, 0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  // Red flash at the edges while a guard is fully alerted.
  if (state.alarmFlash > 0) {
    ctx.fillStyle = `rgba(255, 40, 40, ${0.14 * state.alarmFlash})`;
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  }
}
