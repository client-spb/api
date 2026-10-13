const AudioManager = {
  ctx: null,
  enabled: true,
  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      this.enabled = false;
      return;
    }
    this.ctx = new AudioCtx();
  },
  tone(freq, duration, type = 'sine', volume = 0.05, sweep = 0) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (sweep) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  },
  beepSuccess() {
    this.tone(640, 0.08, 'square', 0.04, 90);
    setTimeout(() => this.tone(920, 0.08, 'triangle', 0.03, 120), 30);
  },
  beepCrash() {
    this.tone(180, 0.22, 'sawtooth', 0.07, -80);
  },
  beepMove() {
    this.tone(430, 0.06, 'triangle', 0.025, 60);
  }
};
