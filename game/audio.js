// audio.js — all sound is synthesized with WebAudio. No audio files, no network.
// One quiet ambient pad loops softly; every game event has its own short cue.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ambientNodes = null;
    this.ambientOn = false;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  setMuted(m) {
    this.muted = m;
    if (this.ambientNodes) {
      this.ambientNodes.gain.gain.value = m ? 0 : 0.05;
    }
  }

  tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol, when = 0, low = 400) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = low;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(ctx.destination);
    src.start(t0);
  }

  click() { this.tone(660, 0.06, 'square', 0.08); }
  thud() { this.tone(110, 0.18, 'sine', 0.35, 0, 55); this.noise(0.12, 0.25, 0, 300); }
  slash() { this.noise(0.22, 0.3, 0, 2400); this.tone(880, 0.14, 'sawtooth', 0.1, 0, 220); }
  fire() { this.noise(0.35, 0.3, 0, 900); this.tone(220, 0.3, 'sawtooth', 0.12, 0, 660); }
  zap() { this.tone(1400, 0.18, 'square', 0.12, 0, 180); this.noise(0.12, 0.18, 0, 4000); }
  frost() { this.tone(1200, 0.35, 'sine', 0.12, 0, 2400); this.tone(1800, 0.3, 'sine', 0.06, 0.05, 2600); }
  heal() { this.tone(523, 0.16, 'sine', 0.16); this.tone(659, 0.16, 'sine', 0.16, 0.1); this.tone(784, 0.28, 'sine', 0.16, 0.2); }
  hurt() { this.tone(180, 0.2, 'sawtooth', 0.14, 0, 90); }
  buff() { this.tone(392, 0.14, 'triangle', 0.14); this.tone(523, 0.2, 'triangle', 0.14, 0.1); }
  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.18, i * 0.13));
    this.tone(1319, 0.6, 'triangle', 0.16, 0.55);
  }
  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.16, i * 0.18));
  }
  waveClear() { this.tone(784, 0.2, 'triangle', 0.14); this.tone(1047, 0.3, 'triangle', 0.14, 0.12); }

  startAmbient() {
    if (this.ambientOn || this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    this.ambientOn = true;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    g.connect(ctx.destination);
    const oscs = [110, 164.8, 220].map((f) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(g);
      o.start();
      return o;
    });
    this.ambientNodes = { gain: g, oscs };
  }

  stopAmbient() {
    if (!this.ambientNodes) return;
    try { this.ambientNodes.oscs.forEach((o) => o.stop()); } catch (e) { /* already stopped */ }
    this.ambientNodes = null;
    this.ambientOn = false;
  }
}
