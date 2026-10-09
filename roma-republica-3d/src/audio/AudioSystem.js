/**
 * Áudio ambiente 100% procedural (Web Audio API) — nenhum arquivo de som externo.
 *
 * Camadas sintetizadas:
 *   - crowd:   murmúrio de multidão (ruído filtrado em bandas de voz, modulado em ritmo silábico)
 *   - market:  murmúrio mais intenso + tilintar de moedas/objetos
 *   - water:   água corrente (latrinas, fontes, Cloaca)
 *   - workshop: batidas de ferramentas (oficinas da Subura)
 *   - animals: cacarejos/latidos ocasionais simplificados
 *   - birds:   pios no céu (global, ao ar livre)
 *   - wind:    vento suave (global, mais forte nas colinas)
 *   - quiet:   zona que abafa o ambiente externo (interiores)
 *   - passos do jogador
 *
 * Os sítios registram zonas com ctx.audio.addZone({ x, z, radius, type, gain }).
 * O contexto de áudio só é criado após um gesto do usuário (política dos navegadores).
 */

const TYPES = ['crowd', 'market', 'water', 'workshop', 'animals', 'birds', 'wind'];

export class AudioSystem {
  constructor() {
    this.zones = [];
    this.ctx = null;
    this.enabled = false;
    this.volume = 0.6;
    this.layers = {};
    this.levels = {};
  }

  /** Registra uma zona sonora. */
  addZone(z) {
    this.zones.push({ gain: 1, radius: 30, ...z });
  }

  /** Cria o AudioContext (chamar num gesto do usuário). */
  start() {
    if (this.ctx) {
      this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? this.volume : 0;
    this.master.connect(this.ctx.destination);
    this.noiseBuf = this._noiseBuffer(4);
    this.brownBuf = this._brownBuffer(4);
    this._buildCrowd('crowd', 0.5);
    this._buildCrowd('market', 0.75);
    this._buildWater();
    this._buildWind();
    for (const t of ['workshop', 'animals', 'birds']) {
      const g = this.ctx.createGain();
      g.gain.value = 0;
      g.connect(this.master);
      this.layers[t] = { gain: g };
    }
    this.marketClink = 0;
    this.nextEvent = { market: 0, workshop: 0, animals: 0, birds: 0, water: 0 };
  }

  setEnabled(on) {
    this.enabled = on;
    if (on) this.start();
    if (this.master) this.master.gain.setTargetAtTime(on ? this.volume : 0, this.ctx.currentTime, 0.3);
  }

  setVolume(v) {
    this.volume = v;
    if (this.master && this.enabled) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  _noiseBuffer(sec) {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * sec, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  _brownBuffer(sec) {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * sec, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    return b;
  }

  _loopSource(buf) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = true;
    s.loopStart = Math.random();
    s.start(0, Math.random() * 3);
    return s;
  }

  /** Murmúrio: várias "vozes" de ruído em bandas de formantes com envelope silábico. */
  _buildCrowd(name, level) {
    const out = this.ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master);
    const voices = 6;
    for (let i = 0; i < voices; i++) {
      const src = this._loopSource(this.noiseBuf);
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 300 + Math.random() * 900;
      bp.Q.value = 2.5 + Math.random() * 2;
      const amp = this.ctx.createGain();
      amp.gain.value = 0.0;
      // LFO silábico (3–6 Hz) + LFO lento de frases
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 2.5 + Math.random() * 3.5;
      const lfoG = this.ctx.createGain();
      lfoG.gain.value = 0.06 * level;
      lfo.connect(lfoG).connect(amp.gain);
      const slow = this.ctx.createOscillator();
      slow.frequency.value = 0.1 + Math.random() * 0.25;
      const slowG = this.ctx.createGain();
      slowG.gain.value = 0.05 * level;
      slow.connect(slowG).connect(amp.gain);
      const dc = this.ctx.createConstantSource();
      dc.offset.value = 0.08 * level;
      dc.connect(amp.gain);
      lfo.start();
      slow.start();
      dc.start();
      src.connect(bp).connect(amp).connect(out);
    }
    // camada grave de fundo
    const low = this._loopSource(this.brownBuf);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    const lg = this.ctx.createGain();
    lg.gain.value = 0.25 * level;
    low.connect(lp).connect(lg).connect(out);
    this.layers[name] = { gain: out };
  }

  _buildWater() {
    const out = this.ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master);
    const src = this._loopSource(this.noiseBuf);
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2200;
    bp.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.value = 0.18;
    src.connect(hp).connect(bp).connect(g).connect(out);
    // modulação do filtro para dar "borbulhar"
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.7;
    const lg = this.ctx.createGain();
    lg.gain.value = 700;
    lfo.connect(lg).connect(bp.frequency);
    lfo.start();
    this.layers.water = { gain: out };
  }

  _buildWind() {
    const out = this.ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master);
    const src = this._loopSource(this.brownBuf);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    const g = this.ctx.createGain();
    g.gain.value = 0.35;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = this.ctx.createGain();
    lg.gain.value = 0.18;
    lfo.connect(lg).connect(g.gain);
    lfo.start();
    src.connect(lp).connect(g).connect(out);
    this.layers.wind = { gain: out };
  }

  /* ----------------------------- eventos curtos ----------------------------- */

  _clink(dest, freq = 3200, vol = 0.08) {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.97, t + 0.25);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.32);
  }

  _thud(dest, vol = 0.25, freq = 180) {
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 1.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(bp).connect(g).connect(dest);
    src.start(t, Math.random() * 2, 0.15);
  }

  _chirp(dest) {
    const t = this.ctx.currentTime;
    const n = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const o = this.ctx.createOscillator();
      const st = t + i * (0.09 + Math.random() * 0.05);
      const f = 2600 + Math.random() * 2600;
      o.frequency.setValueAtTime(f, st);
      o.frequency.exponentialRampToValueAtTime(f * (0.7 + Math.random() * 0.6), st + 0.07);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.03, st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.08);
      o.connect(g).connect(dest);
      o.start(st);
      o.stop(st + 0.1);
    }
  }

  _cluck(dest) {
    const t = this.ctx.currentTime;
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const st = t + i * 0.13;
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(520 + Math.random() * 120, st);
      o.frequency.exponentialRampToValueAtTime(360, st + 0.06);
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1100;
      bp.Q.value = 3;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.05, st + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.08);
      o.connect(bp).connect(g).connect(dest);
      o.start(st);
      o.stop(st + 0.1);
    }
  }

  /** Som de passo (chamado pelo Player). */
  step(speed) {
    if (!this.ctx || !this.enabled) return;
    this._thud(this.master, Math.min(0.2, 0.07 + speed * 0.02), 260 + Math.random() * 120);
  }

  /* ------------------------------- atualização ------------------------------ */

  /**
   * @param {THREE.Vector3} pos posição do jogador
   * @param {number} heightAboveForum altura (para o vento)
   */
  update(pos, heightAboveForum = 0) {
    if (!this.ctx || !this.enabled) return;
    const lv = {};
    for (const t of TYPES) lv[t] = 0;
    let quiet = 0;
    for (const z of this.zones) {
      const d = Math.hypot(pos.x - z.x, pos.z - z.z);
      if (d > z.radius * 1.6) continue;
      const k = Math.max(0, 1 - d / (z.radius * 1.6));
      const w = k * k * z.gain;
      if (z.type === 'quiet') quiet = Math.max(quiet, k > 0.55 ? 1 : k / 0.55);
      else lv[z.type] = Math.max(lv[z.type] ?? 0, w);
    }
    // camadas globais
    lv.birds = Math.max(lv.birds, 0.5);
    lv.wind = Math.max(lv.wind, 0.15 + Math.min(0.6, Math.max(0, heightAboveForum) / 50));
    const muff = 1 - quiet * 0.8;
    const now = this.ctx.currentTime;
    for (const t of TYPES) {
      const L = this.layers[t];
      if (!L) continue;
      const target = (t === 'water' || t === 'workshop' ? lv[t] : lv[t] * muff) * 1;
      L.gain.gain.setTargetAtTime(target, now, 0.4);
      this.levels[t] = target;
    }
    // eventos aleatórios proporcionais ao nível
    const r = Math.random;
    if (lv.market > 0.05 && now > this.nextEvent.market) {
      this._clink(this.layers.market.gain, 2400 + r() * 2400, 0.05 + r() * 0.06);
      this.nextEvent.market = now + 0.3 + r() * 1.5 / lv.market;
    }
    if (lv.workshop > 0.05 && now > this.nextEvent.workshop) {
      this._clink(this.layers.workshop.gain, 1400 + r() * 600, 0.12);
      this._thud(this.layers.workshop.gain, 0.2, 140);
      this.nextEvent.workshop = now + 0.45 + r() * 0.6;
    }
    if (lv.animals > 0.05 && now > this.nextEvent.animals) {
      this._cluck(this.layers.animals.gain);
      this.nextEvent.animals = now + 2 + r() * 8;
    }
    if (now > this.nextEvent.birds) {
      this._chirp(this.layers.birds.gain);
      this.nextEvent.birds = now + 0.8 + r() * 4;
    }
    for (const t of ['workshop', 'animals', 'birds']) {
      const target = t === 'birds' ? lv.birds * muff : lv[t];
      this.layers[t].gain.gain.setTargetAtTime(target, now, 0.4);
    }
  }
}
