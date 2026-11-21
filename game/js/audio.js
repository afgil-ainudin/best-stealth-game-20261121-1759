// All sound is synthesized with WebAudio — no audio files, no network.
// Footsteps (soft ticks, louder for guards when they are near), a loot
// chime, an alert sting, a caught sting and a win arpeggio.

let ctx = null;
let master = null;
let muted = false;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, lowpass) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t0);
}

// A soft shoe on wooden boards. volume 0..1 by who is walking and how near.
export function playFootstep(volume) {
  noiseBurst(0.07, 0.16 * volume, 900);
}

// A guard's heavier boot, heard through the dark.
export function playGuardStep(volume) {
  noiseBurst(0.09, 0.22 * volume, 500);
}

export function playPickup() {
  tone(880, 0.12, 'sine', 0.25);
  tone(1318, 0.18, 'sine', 0.2, 0.07);
}

export function playAlert() {
  tone(220, 0.16, 'square', 0.16, 0, 330);
  tone(330, 0.2, 'square', 0.16, 0.14, 220);
}

export function playCaught() {
  tone(196, 0.5, 'sawtooth', 0.2, 0, 98);
  tone(147, 0.6, 'sawtooth', 0.18, 0.12, 73);
}

export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.22, i * 0.11));
}

export function playClick() {
  tone(660, 0.06, 'sine', 0.15);
}
