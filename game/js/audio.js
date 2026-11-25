// audio.js — tiny synthesised sound effects through WebAudio. No audio files:
// every sound is an oscillator (or filtered noise) shaped by a gain envelope,
// so the game stays a handful of static files and plays fully offline.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = new Set();
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type = 'sine', vol = 0.18, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // Short burst of filtered noise — a chop thud, a sizzle tick, a trash clunk.
  noise(dur, filterFreq, vol = 0.2, type = 'lowpass', delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  chop() { this.noise(0.09, 900, 0.35); this.tone(140, 0.08, 'triangle', 0.22, 70); }
  pickup() { this.tone(520, 0.07, 'sine', 0.14, 760); }
  place() { this.tone(340, 0.07, 'sine', 0.14, 240); this.noise(0.05, 1200, 0.12); }
  sizzleStart() { this.noise(0.25, 5200, 0.10, 'highpass'); }
  ding() {
    this.tone(880, 0.16, 'sine', 0.20);
    this.tone(1318, 0.28, 'sine', 0.16, null, 0.09);
  }
  serve() {
    this.tone(659, 0.12, 'triangle', 0.20);
    this.tone(880, 0.12, 'triangle', 0.20, null, 0.09);
    this.tone(1174, 0.24, 'triangle', 0.20, null, 0.18);
  }
  error() { this.tone(180, 0.16, 'square', 0.10, 120); }
  tick() { this.tone(980, 0.05, 'sine', 0.10); }
  rush() {
    this.tone(392, 0.14, 'triangle', 0.20);
    this.tone(523, 0.14, 'triangle', 0.20, null, 0.12);
    this.tone(659, 0.22, 'triangle', 0.20, null, 0.24);
  }
  gameOver() {
    this.tone(523, 0.2, 'triangle', 0.18);
    this.tone(392, 0.2, 'triangle', 0.18, null, 0.18);
    this.tone(330, 0.4, 'triangle', 0.18, null, 0.36);
  }
}
