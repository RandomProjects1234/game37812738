const AudioSys = {
  ctx: null,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { this.ctx = null; }
  },
  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
  jump()   { this.tone(320, 0.18, 'square', 0.12, 620); },
  meow()   { this.tone(520, 0.3, 'sawtooth', 0.08, 300); },
  pickup() { this.tone(700, 0.1, 'square', 0.12); setTimeout(()=>this.tone(1050,0.14,'square',0.12), 80); },
  hurt()   { this.tone(200, 0.25, 'sawtooth', 0.15, 90); },
  stomp()  { this.tone(140, 0.2, 'square', 0.18, 60); },
  door()   { this.tone(440, 0.12, 'triangle', 0.14); setTimeout(()=>this.tone(660,0.18,'triangle',0.14), 110); },
  tweet()  { this.tone(900, 0.08, 'square', 0.07, 500); },
  bossHit(){ this.tone(300, 0.3, 'sawtooth', 0.18, 80); },
  win() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => this.tone(n, 0.25, 'square', 0.14), i * 160));
  },
  lose() {
    const notes = [400, 320, 250, 160];
    notes.forEach((n, i) => setTimeout(() => this.tone(n, 0.35, 'sawtooth', 0.15), i * 220));
  }
};
