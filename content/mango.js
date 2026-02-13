/* ═══════════════════════════════════════════
   CHITTI — A Mischievous Cockatiel
   Songs, animations, eye tracking, love banners
   ═══════════════════════════════════════════ */
(function () {
  'use strict';
  const C = {
    speed: { walk: 1.5, run: 3.5, fly: 5.5 },
    tick: [1500, 3500], sleepAfter: 90000, speechMs: 3000, cursorDist: 125,
    vol: 0.05, poopChance: 0.03, giftChance: 0.06, flockChance: 0.03,
    mischief: 0.25, noteInterval: [200000, 360000], singChance: 0.25, soundChance: 0.4,
  };
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  let mx = -999, my = -999, mVx = 0, mVy = 0, pMx = -999, pMy = -999;
  document.addEventListener('mousemove', e => { mVx = e.clientX - pMx; mVy = e.clientY - pMy; pMx = mx; pMy = my; mx = e.clientX; my = e.clientY; });

  // ═══ SOUNDS ═══
  const soundURL = f => chrome.runtime.getURL('sounds/' + f);
  class Sfx {
    constructor() {
      this.ctx = null; this._amb = null; this._audioCache = {};
      // create AudioContext on first user gesture so it's never suspended
      const wake = () => {
        if (!this.ctx) try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
        if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
        document.removeEventListener('pointerdown', wake);
        document.removeEventListener('keydown', wake);
      };
      document.addEventListener('pointerdown', wake);
      document.addEventListener('keydown', wake);
    }
    _i() { if (!this.ctx) try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; } if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return this.ctx.state !== 'closed'; }
    // basic tone (for UI sounds)
    _t(type, f, d, v) { if (!this._i()) return; const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f[0], t); for (let i = 1; i < f.length; i++) o.frequency.exponentialRampToValueAtTime(f[i], t + d * i / f.length); g.gain.setValueAtTime(v || C.vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(t + d); }
    // cockatiel whistle note — vibrato + sharp attack + harmonic brightness
    _bird(f, dur, vol) {
      if (!this._i()) return; const t = this.ctx.currentTime, v = vol || 0.055, d = dur || 0.16;
      // main tone
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = 'sine';
      // vibrato LFO (~25Hz wobble, subtle pitch variation like a real bird)
      const lfo = this.ctx.createOscillator(), lfoG = this.ctx.createGain();
      lfo.frequency.value = 25 + Math.random() * 8;
      lfoG.gain.value = f * 0.012;
      lfo.connect(lfoG); lfoG.connect(o.frequency);
      // sharp chirpy attack — start higher, drop to note
      o.frequency.setValueAtTime(f * 1.1, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.015);
      // gain: instant attack, slight swell, clean decay
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(v, t + 0.006);
      g.gain.setValueAtTime(v * 0.95, t + d * 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g); g.connect(this.ctx.destination);
      lfo.start(t); o.start(t); o.stop(t + d); lfo.stop(t + d);
      // breathy harmonic overtone (3rd partial, quieter) for that airy whistle quality
      const o2 = this.ctx.createOscillator(), g2 = this.ctx.createGain();
      o2.type = 'sine'; o2.frequency.setValueAtTime(f * 3.01, t);
      g2.gain.setValueAtTime(v * 0.08, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + d * 0.4);
      o2.connect(g2); g2.connect(this.ctx.destination);
      o2.start(t); o2.stop(t + d * 0.4);
    }
    // play real audio file
    _playFile(name, vol) {
      try {
        if (this._audioCache[name]) { this._audioCache[name].pause(); this._audioCache[name].currentTime = 0; }
        const a = new Audio(soundURL(name));
        a.volume = vol || 0.15; a.play().catch(() => {});
        this._audioCache[name] = a;
      } catch (e) {}
    }
    // real cockatiel sounds!
    realChirp() { this._playFile(pick(['chirp1.mp3', 'chirp2.mp3']), 0.35); }
    realSing() { this._playFile('singing.mp3', 0.3); }
    realSquawk() { this._playFile('squawk.mp3', 0.3); }
    realParrot() { this._playFile('parrot.mp3', 0.3); }
    chirp() { if (Math.random() > C.soundChance) return; this._t('sine', [1400, 2200, 1600], 0.18, 0.08); }
    chirp2() { if (Math.random() > C.soundChance) return; this._t('sine', [1800, 2400, 1200], 0.22, 0.07); }
    chirp3() { if (Math.random() > C.soundChance) return; this._t('sine', [1000, 1600, 1000], 0.15, 0.06); }
    happy() { if (Math.random() > C.soundChance) return; [1000, 1200, 1400, 1600, 1800, 2000].forEach((n, i) => setTimeout(() => this._t('sine', [n, n * 1.15], 0.1, 0.06), i * 70)); }
    screee() { if (Math.random() > C.soundChance) return; this._t('sawtooth', [2000, 3200], 0.28, 0.13); }
    crunch() { this._t('triangle', [400, 200], 0.04, 0.08); setTimeout(() => this._t('triangle', [350, 180], 0.04, 0.07), 50); }
    pop() { this._t('sine', [600, 1200], 0.04, 0.06); }
    sparkle() { this._t('sine', [2500, 3500, 2000], 0.16, 0.04); }
    boing() { this._t('sine', [200, 600, 350], 0.12, 0.06); }
    poop() { this._t('sine', [300, 100], 0.08, 0.04); }
    party() { [500, 600, 700, 800, 900, 1000, 1200].forEach((n, i) => setTimeout(() => this._t('sine', [n, n * 1.2], 0.08, 0.05), i * 55)); }
    noteOpen() { this._t('sine', [600, 900, 1200, 1600], 0.35, 0.05); }
    flap() { this._t('triangle', [200, 400, 200], 0.06, 0.03); }
    // simple random whistle
    whistle() {
      const m = pick([
        [[1600, 0], [2000, 120], [1800, 240], [2200, 360], [2000, 480], [2400, 600], [2000, 720]],
        [[1200, 0], [1600, 100], [2000, 200], [2400, 300], [2000, 400], [1600, 500], [2000, 600]],
        [[2000, 0], [2400, 90], [2800, 180], [2400, 280], [2000, 380], [2400, 480], [2800, 580], [3200, 680]],
        [[1800, 0], [2200, 110], [1800, 220], [2600, 350], [2200, 470], [1800, 590], [2200, 700]],
      ]);
      m.forEach(([f, t]) => setTimeout(() => this._t('sine', [f, f * 1.06, f], 0.12, 0.06), t));
    }
    // ♪ Famous songs cockatiels love to whistle — slow, proper melodies ♪
    song() {
      const songs = [
        // ─── Harry Potter (priority — included twice) ───
        {
          name: 'Hedwig\'s Theme ⚡', notes: [
            [494, 0], [659, 400], [784, 700], [740, 1000], [659, 1400], [988, 1800], [880, 2300],
            [740, 3000], [659, 3700], [784, 4100], [740, 4400], [622, 4800], [698, 5200], [494, 5700]
          ]
        },
        {
          name: 'Hedwig\'s Theme ⚡', notes: [
            [494, 0], [659, 400], [784, 700], [740, 1000], [659, 1400], [988, 1800], [880, 2300],
            [740, 3000], [659, 3700], [784, 4100], [740, 4400], [622, 4800], [698, 5200], [494, 5700]
          ]
        },
        // ─── Movie & TV themes ───
        {
          name: 'He\'s a Pirate 🏴‍☠️', notes: [ // Pirates of the Caribbean
            [587, 0], [587, 200], [587, 400], [622, 650], [698, 850],
            [698, 1200], [698, 1400], [622, 1650], [698, 1850], [784, 2050],
            [784, 2400], [784, 2600], [740, 2850], [784, 3050], [880, 3250],
            [587, 3650], [587, 3850], [587, 4050], [622, 4300], [698, 4500],
            [698, 4850], [698, 5050], [622, 5300], [698, 5500], [587, 5700]
          ]
        },
        {
          name: 'Imperial March 🌑', notes: [ // Star Wars
            [392, 0], [392, 400], [392, 800], [311, 1150], [466, 1400], [392, 1800], [311, 2150], [466, 2400], [392, 2800],
            [587, 3400], [587, 3800], [587, 4200], [622, 4550], [466, 4800], [370, 5200], [311, 5550], [466, 5800], [392, 6200]
          ]
        },
        {
          name: 'My Neighbor Totoro 🌳', notes: [
            [659, 0], [784, 350], [880, 700], [784, 1050], [659, 1400], [523, 1750],
            [587, 2200], [659, 2550], [587, 2900], [523, 3250], [440, 3600],
            [523, 4100], [587, 4450], [659, 4800], [784, 5150], [659, 5500], [523, 5850]
          ]
        },
        {
          name: 'Nokia Tune 📱', notes: [
            [659, 0], [587, 150], [349, 350], [392, 550],
            [523, 750], [494, 900], [330, 1100], [349, 1300],
            [494, 1500], [440, 1650], [262, 1850], [330, 2050], [440, 2350]
          ]
        },
        // ─── Pop hits she knows ───
        {
          name: 'Espresso ☕', notes: [ // Sabrina Carpenter — "I'm working late"
            [659, 0], [659, 200], [523, 400], [784, 650], [784, 850], [880, 1050], [523, 1300], [587, 1500], [523, 1700]
          ]
        },
        {
          name: 'Cruel Summer 🔥', notes: [ // Taylor Swift
            [659, 0], [554, 300], [494, 550], [440, 800], [494, 1100],
            [440, 1400], [440, 1600], [440, 1800], [494, 2000], [554, 2200],
            [494, 2500], [494, 2700], [494, 2900], [554, 3100], [494, 3300], [440, 3500], [440, 3700]
          ]
        },
        {
          name: 'Anti-Hero 😈', notes: [ // Taylor Swift — "It's me, hi"
            [659, 0], [831, 300], [831, 550],
            [740, 800], [740, 1000], [740, 1200], [659, 1400], [659, 1600], [659, 1800],
            [659, 2100], [831, 2350], [831, 2600], [740, 2850], [740, 3050], [740, 3250], [659, 3450], [659, 3650]
          ]
        },
        {
          name: 'Love Story 💕', notes: [ // Taylor Swift
            [587, 0], [659, 300], [784, 600], [659, 900], [587, 1200], [523, 1500],
            [587, 1900], [659, 2200], [784, 2500], [880, 2800], [784, 3100],
            [659, 3500], [587, 3800], [659, 4100], [784, 4400], [659, 4700]
          ]
        },
        {
          name: 'Shake It Off 💃', notes: [ // Taylor Swift
            [523, 0], [523, 200], [587, 400], [659, 600], [659, 800], [659, 1000],
            [587, 1250], [523, 1450], [523, 1650], [587, 1850], [659, 2050],
            [523, 2350], [523, 2550], [587, 2750], [659, 2950], [659, 3150], [659, 3350],
            [784, 3600], [659, 3850], [587, 4100], [523, 4350]
          ]
        },
        {
          name: 'Blinding Lights ✨', notes: [ // The Weeknd
            [466, 0], [349, 200], [349, 400], [349, 500], [392, 650], [349, 800], [311, 1000], [311, 1200], [262, 1400], [311, 1600], [262, 1800],
            [311, 2100], [466, 2350], [392, 2550], [349, 2750], [311, 2950], [466, 3200], [392, 3400], [349, 3600]
          ]
        },
        {
          name: 'Shape of You 💜', notes: [ // Ed Sheeran
            [277, 0], [277, 200], [277, 400], [277, 550], [370, 700], [415, 900], [415, 1100], [370, 1300],
            [370, 1500], [370, 1700], [370, 1900], [370, 2050], [370, 2200], [370, 2400], [370, 2600], [330, 2800], [277, 3000]
          ]
        },
        {
          name: 'Levitating 🪩', notes: [ // Dua Lipa
            [587, 0], [587, 200], [740, 400], [659, 600], [659, 750], [659, 900], [659, 1050], [659, 1200], [659, 1350],
            [587, 1550], [587, 1750], [740, 1950], [659, 2150], [659, 2300], [659, 2450], [659, 2600], [659, 2750], [587, 2950], [494, 3150]
          ]
        },
        {
          name: 'Someone Like You 🥺', notes: [ // Adele
            [659, 0], [554, 300], [494, 550], [370, 800], [659, 1100], [659, 1350], [659, 1550], [659, 1750], [587, 1950], [554, 2150],
            [554, 2450], [554, 2650], [370, 2850], [370, 3050], [440, 3250], [370, 3450]
          ]
        },
        // ─── Iconic classics ───
        {
          name: 'Bohemian Rhapsody 👑', notes: [ // Queen — "Mama, ooo"
            [784, 0], [784, 250], [698, 500], [784, 750], [831, 1000], [784, 1300],
            [784, 1600], [784, 1850], [831, 2100], [784, 2350], [784, 2600], [698, 2850], [698, 3100]
          ]
        },
        {
          name: 'Dancing Queen 👸', notes: [ // ABBA
            [659, 0], [740, 250], [831, 500], [831, 700], [880, 900], [880, 1150],
            [831, 1400], [880, 1600], [880, 1850],
            [988, 2100], [880, 2350], [831, 2600], [880, 2800], [880, 3050]
          ]
        },
        {
          name: 'Stayin\' Alive 🕺', notes: [ // Bee Gees
            [349, 0], [349, 200], [349, 400], [415, 600], [349, 800], [311, 1050], [262, 1250],
            [349, 1550], [349, 1750], [349, 1950], [415, 2150], [349, 2350], [311, 2550], [262, 2750],
            [415, 3050], [466, 3250], [415, 3450], [349, 3650], [415, 3850], [349, 4050]
          ]
        },
        {
          name: 'Take On Me 🎹', notes: [ // A-ha — synth riff
            [740, 0], [740, 150], [587, 300], [494, 500], [494, 650], [659, 850], [659, 1000], [659, 1150],
            [831, 1350], [831, 1500], [880, 1700], [988, 1900], [880, 2100], [880, 2250], [880, 2400],
            [659, 2600], [587, 2800], [740, 3000], [740, 3150], [740, 3300], [659, 3500], [659, 3650], [740, 3850], [659, 4050]
          ]
        },
        // ─── Michael Jackson ───
        {
          name: 'Billie Jean 🕺', notes: [
            [370, 0], [370, 250], [370, 500], [370, 750], [330, 1000], [370, 1250],
            [370, 1500], [370, 1750], [370, 2000], [370, 2250], [330, 2500], [370, 2750],
            [440, 3100], [415, 3350], [370, 3600], [330, 3850], [370, 4100]
          ]
        },
        {
          name: 'Beat It 🥊', notes: [
            [659, 0], [659, 200], [659, 400], [659, 600], [587, 800], [659, 1050],
            [659, 1300], [587, 1500], [523, 1750], [587, 2000],
            [659, 2400], [659, 2600], [659, 2800], [587, 3000], [523, 3250], [587, 3500],
            [659, 3800], [784, 4100], [659, 4400]
          ]
        },
        {
          name: 'Thriller 🧟', notes: [
            [392, 0], [440, 250], [466, 500], [440, 750], [392, 1000], [440, 1250], [466, 1500],
            [523, 1800], [466, 2100], [440, 2400], [392, 2700],
            [392, 3100], [440, 3350], [466, 3600], [440, 3850], [392, 4100], [349, 4400]
          ]
        },
        // ─── More favorites ───
        {
          name: 'Fast Car 🚗', notes: [ // Tracy Chapman
            [523, 0], [659, 350], [784, 700], [659, 1050], [523, 1400],
            [440, 1800], [523, 2150], [659, 2500], [523, 2850],
            [440, 3250], [392, 3600], [440, 3950], [523, 4300],
            [659, 4700], [523, 5050], [440, 5400], [392, 5750]
          ]
        },
        {
          name: 'Happy Birthday 🎂', notes: [
            [392, 0], [392, 250], [440, 550], [392, 900], [523, 1250], [494, 1650],
            [392, 2200], [392, 2450], [440, 2750], [392, 3100], [587, 3450], [523, 3850],
            [392, 4400], [392, 4650], [784, 4950], [659, 5350], [523, 5700], [494, 6050], [440, 6400]
          ]
        },
        {
          name: 'Super Mario Bros 🍄', notes: [
            [659, 0], [659, 200], [659, 500], [523, 700], [659, 900], [784, 1250], [392, 1650],
            [523, 2200], [392, 2550], [330, 2900],
            [440, 3300], [494, 3600], [466, 3850], [440, 4100],
            [392, 4400], [659, 4700], [784, 5000], [880, 5300]
          ]
        },
        {
          name: 'Für Elise 🎹', notes: [ // Beethoven
            [659, 0], [622, 300], [659, 600], [622, 900], [659, 1200], [494, 1500], [587, 1800], [523, 2100], [440, 2500],
            [262, 3100], [330, 3400], [440, 3700], [494, 4100],
            [330, 4700], [416, 5000], [494, 5300], [523, 5700]
          ]
        },
        // ─── Hindi / Bollywood ───
        {
          name: 'Tum Hi Ho 💕', notes: [ // Aashiqui 2
            [349, 0], [415, 350], [523, 700], [554, 1050], [415, 1400], [466, 1750], [392, 2100],
            [415, 2600], [523, 2950], [698, 3300], [622, 3650], [622, 3900], [554, 4150], [554, 4400], [523, 4650], [466, 4900], [415, 5150], [466, 5400], [554, 5700], [523, 6000]
          ]
        },
        {
          name: 'Kal Ho Naa Ho 🌅', notes: [
            [392, 0], [440, 300], [523, 600], [440, 900], [349, 1200], [392, 1500], [440, 1800], [392, 2100],
            [392, 2600], [523, 2900], [494, 3150], [523, 3400], [494, 3650], [523, 3900], [494, 4150], [523, 4400], [659, 4700], [587, 5000], [523, 5300], [494, 5600], [440, 5900], [494, 6200]
          ]
        },
        {
          name: 'Tujhe Dekha To 🎬', notes: [ // DDLJ — iconic
            [330, 0], [330, 300], [330, 600], [494, 900], [440, 1200], [494, 1500], [392, 1850], [440, 2150], [523, 2450], [494, 2750],
            [330, 3200], [330, 3500], [330, 3800], [494, 4100], [440, 4400], [494, 4700], [392, 5000], [440, 5300], [392, 5600], [370, 5900]
          ]
        },
        {
          name: 'Pehla Nasha 🥰', notes: [ // Jo Jeeta Wohi Sikandar
            [494, 0], [494, 300], [587, 600], [587, 900], [659, 1250],
            [494, 1700], [392, 2000], [440, 2300], [587, 2650], [587, 2950], [740, 3250], [784, 3550],
            [494, 4100], [494, 4400], [587, 4700], [587, 5000], [659, 5300], [587, 5600], [523, 5900], [494, 6200], [440, 6500], [440, 6800], [494, 7100], [440, 7400]
          ]
        },
        {
          name: 'Kesariya 🧡', notes: [ // Brahmastra
            [523, 0], [659, 300], [587, 600], [659, 900], [587, 1200], [523, 1500], [494, 1800], [523, 2100],
            [784, 2500], [784, 2750], [784, 3000], [880, 3300], [784, 3600], [698, 3900], [659, 4200], [587, 4500]
          ]
        },
        {
          name: 'Channa Mereya 💔', notes: [ // Ae Dil Hai Mushkil
            [494, 0], [494, 250], [587, 500], [523, 750], [523, 1000], [523, 1200], [523, 1400], [494, 1650], [587, 1900], [523, 2150], [523, 2400],
            [440, 2750], [392, 3000], [440, 3250], [440, 3500], [440, 3750], [523, 4000], [494, 4250], [440, 4500], [440, 4750]
          ]
        },
        {
          name: 'Kun Faya Kun 🕊️', notes: [ // Rockstar
            [349, 0], [415, 400], [554, 800], [554, 1100], [622, 1400], [523, 1700], [554, 2000], [622, 2300], [523, 2600], [554, 2900], [523, 3200], [466, 3500], [523, 3800],
            [349, 4300], [415, 4700], [523, 5000], [523, 5300], [622, 5600], [554, 5900], [523, 6200], [466, 6500], [415, 6800], [370, 7100], [349, 7400]
          ]
        },
        {
          name: 'Lag Ja Gale 🌙', notes: [ // Lata Mangeshkar classic
            [294, 0], [494, 400], [440, 700], [494, 1000], [494, 1300], [440, 1550], [494, 1800], [440, 2050], [494, 2350],
            [494, 2700], [440, 2950], [494, 3200], [440, 3450], [494, 3700], [392, 4000], [440, 4300], [494, 4600], [523, 4900], [494, 5200], [440, 5500], [440, 5800], [370, 6100], [330, 6400], [294, 6700]
          ]
        },
      ];
      const s = pick(songs);
      // chirpy tones — slowed 1.4x for a relaxed, natural bird whistle
      const tempo = 1.4;
      s.notes.forEach(([f, t]) => setTimeout(() => this._t('sine', [f * 2, f * 2.05, f * 2], 0.24, 0.05), t * tempo));
      return s;
    }
    ambientStart(type) {
      this.ambientStop(); if (!this._i()) return;
      const sr = this.ctx.sampleRate, len = 2 * sr, buf = this.ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const filt = this.ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = type === 'rain' ? 600 : 350;
      const g = this.ctx.createGain(); g.gain.value = type === 'rain' ? 0.04 : 0.025;
      src.connect(filt); filt.connect(g); g.connect(this.ctx.destination); src.start();
      this._amb = { src, g, type };
      if (type === 'cafe') this._cafeLoop();
    }
    _cafeLoop() { if (!this._amb) return; setTimeout(() => { if (this._amb) { this._t('sine', [3000 + rand(0, 2000), 1000], 0.02, 0.012); this._cafeLoop(); } }, rand(1500, 5000)); }
    ambientStop() { if (this._amb) { try { this._amb.src.stop(); } catch (e) { } this._amb = null; } }
  }
  const sfx = new Sfx();

  // ═══ LOVE NOTES ═══
  const LOCAL_NOTES = [
    // 💕 Loving
    'Someone loves you so much right now 💕',
    'Someone is missing you at this very moment 🥺',
    'Someone fell in love with you all over again today 💘',
    'Someone would cross oceans just to see you smile 🌊',
    'Someone is dreaming about your future together 💕',
    // ✨ Encouraging — Google dream
    'You\'re doing incredible work. Seriously. ✨',
    'That code is looking really good, you know that? 🌟',
    'Every line you write is bringing you closer to something amazing 💪',
    'Bugs are just puzzles, and you\'re great at puzzles 🧩',
    'Google would be lucky to have you. Just saying. 🌈',
    'Your Keras work is literally changing deep learning. No pressure. ✨',
    'Future Googler energy detected 💪🔥',
    'The way you debug is honestly impressive. Keep going. 🧠',
    // 🐦 Chitti personality
    'Chitti thinks you\'re the best human ever. Just saying. 🐦',
    'Chitti would share their favorite seed with you. That\'s the highest honor. 🌻',
    '*Chitti headbutts your hand affectionately* 🧡',
    'Chitti wrote this note with their tiny feet. Be impressed. 🪶',
    'Chitti says: SCREEE!! (That means "I love you" in bird) 💛',
    // 🌸 Gentle reminders
    'Hey — have you had water recently? Please drink some 💧',
    'A stretch break would feel really nice right now 🌿',
    'You look cute when you concentrate like that 😊',
    'Don\'t forget: you\'re allowed to take breaks 🍵',
    'Your wellbeing matters more than any output cell ❤️',
    'Is it biryani o\'clock yet? Asking for a bird. 🍗',
    // 🎉 Playful
    'Plot twist: you\'re actually amazing 🎬',
    'Your code is *chef\'s kiss* today 👨‍🍳💋',
    'If your code were a dish, it\'d be Telugu Vilas biryani ⭐',
    'Fun fact: you\'ve been awesome this entire time 🏆',
    'Breaking news: Whitefield\'s best coder strikes again 📰',
    'Your neural network has nothing on your actual brain 🧠',
    // 🌙 Cozy
    'Whatever happens with this code, you are enough 🌈',
    'This notebook is lucky to have you working on it 📓',
    'The world is better because you\'re in it 🌍',
    'You deserve every good thing coming your way 🌸',
    'Somewhere in Whitefield, a bird is very proud of you 💖',
  ];
  async function fetchNote() {
    try { const r = await chrome.runtime.sendMessage({ action: 'fetchNote' }); if (r?.note) return r.note; } catch (e) { }
    return pick(LOCAL_NOTES);
  }

  // ═══ COLAB DOM ═══
  const Lab = {
    cells() { for (const s of ['.cell.code', '.code_cell', 'div.cell', '[class*="cell"]']) { const c = $$(s); if (c.length) return c; } return []; },
    running() { for (const s of ['.cell.running', '.running', '[class*="running"]']) { const c = $(s); if (c) return c; } return null; },
    runBtn() { return $('button[aria-label="Run cell"]') || $('[class*="run"]'); },
    rect(el) { return el?.getBoundingClientRect(); },
    root() { return $('#main') || $('.notebook-container') || $('body'); },
  };

  // ═══ COCKATIEL SVG ═══
  const MANGO = `<svg viewBox="0 0 80 88" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="mb"><stop offset="0%" stop-color="#FFF8B0"/><stop offset="100%" stop-color="#F0D840"/></radialGradient>
<radialGradient id="mb2"><stop offset="0%" stop-color="#FFFAC8"/><stop offset="100%" stop-color="#F5E060"/></radialGradient>
<radialGradient id="mc"><stop offset="0%" stop-color="#FF8833" stop-opacity=".8"/><stop offset="100%" stop-color="#FF6622" stop-opacity="0"/></radialGradient>
<linearGradient id="mw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E0D040"/><stop offset="100%" stop-color="#C0A828"/></linearGradient>
</defs>
<g class="m-tail"><path d="M30,66 L24,86" stroke="#D0B830" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M34,67 L30,88" stroke="#E0C838" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M38,67 L36,84" stroke="#D0B830" stroke-width="2" fill="none" stroke-linecap="round"/></g>
<g class="m-body"><ellipse cx="40" cy="54" rx="19" ry="16" fill="url(#mb)"/><ellipse cx="40" cy="56" rx="13" ry="11" fill="#FFFAC0" opacity=".4"/></g>
<g class="m-wing-l"><path d="M21,46 Q10,50 12,62 Q14,67 22,60 Z" fill="url(#mw)"/><line x1="15" y1="54" x2="20" y2="51" stroke="#B8A020" stroke-width=".5" opacity=".4"/><line x1="14" y1="58" x2="21" y2="55" stroke="#B8A020" stroke-width=".5" opacity=".35"/></g>
<g class="m-wing-r"><path d="M59,46 Q70,50 68,62 Q66,67 58,60 Z" fill="url(#mw)"/><line x1="65" y1="54" x2="60" y2="51" stroke="#B8A020" stroke-width=".5" opacity=".4"/><line x1="66" y1="58" x2="59" y2="55" stroke="#B8A020" stroke-width=".5" opacity=".35"/></g>
<g class="m-feet"><path d="M32,69 L29,76 M32,69 L32,76 M32,69 L35,76" stroke="#BB8888" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M48,69 L45,76 M48,69 L48,76 M48,69 L51,76" stroke="#BB8888" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>
<g class="m-head">
<circle cx="40" cy="30" r="17" fill="url(#mb2)"/>
<g class="m-crest"><path d="M38,14 C39,4 43,-4 48,-10" stroke="#F5E860" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M40,14 C42,5 46,-2 52,-7" stroke="#F0D840" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M42,15 C44,6 48,0 54,-4" stroke="#E8D040" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>
<g class="m-eyes"><circle class="eye-l" cx="34" cy="28" r="4.5" fill="#1A0A00"/><circle class="eye-r" cx="46" cy="28" r="4.5" fill="#1A0A00"/><circle class="shine" cx="32.5" cy="26.5" r="1.8" fill="white"/><circle class="shine" cx="44.5" cy="26.5" r="1.8" fill="white"/><circle cx="35" cy="29.5" r="0.8" fill="white" opacity=".4"/><circle cx="47" cy="29.5" r="0.8" fill="white" opacity=".4"/></g>
<g class="m-beak"><path d="M37,35 C39,33 41,33 43,35 C42,37 41,38 40,38 C39,38 38,37 37,35 Z" fill="#999" stroke="#777" stroke-width=".4"/><path d="M38.5,36 Q40,37.5 41.5,36" fill="#888" stroke="#666" stroke-width=".3"/><circle cx="38.5" cy="34.5" r=".5" fill="#666"/></g>
<g class="m-cheeks"><circle cx="25" cy="33" r="6" fill="url(#mc)"/><circle cx="55" cy="33" r="6" fill="url(#mc)"/></g>
</g></svg>`;

  const MANGO_FLY = `<svg viewBox="0 0 90 55" xmlns="http://www.w3.org/2000/svg">
<defs><radialGradient id="mfb"><stop offset="0%" stop-color="#FFF5A0"/><stop offset="100%" stop-color="#F0D840"/></radialGradient></defs>
<g class="m-wing-l"><path d="M4,28 Q15,4 40,22" fill="#D8C030" stroke="#C0A828" stroke-width=".5"/><line x1="12" y1="16" x2="28" y2="20" stroke="#C0A828" stroke-width=".5" opacity=".5"/><line x1="10" y1="20" x2="26" y2="22" stroke="#C0A828" stroke-width=".5" opacity=".4"/></g>
<g class="m-wing-r"><path d="M86,28 Q75,4 50,22" fill="#D8C030" stroke="#C0A828" stroke-width=".5"/><line x1="78" y1="16" x2="62" y2="20" stroke="#C0A828" stroke-width=".5" opacity=".5"/><line x1="80" y1="20" x2="64" y2="22" stroke="#C0A828" stroke-width=".5" opacity=".4"/></g>
<ellipse cx="45" cy="30" rx="15" ry="11" fill="url(#mfb)"/>
<circle cx="45" cy="19" r="11" fill="url(#mfb)"/>
<path d="M40,9 Q37,0 35,-4 M43,8 Q43,0 43,-3 M46,8 Q48,1 50,-3" stroke="#E8D040" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<ellipse cx="40" cy="18" rx="3" ry="3.5" fill="#1A0A00"/><ellipse cx="50" cy="18" rx="3" ry="3.5" fill="#1A0A00"/>
<circle cx="39" cy="17" r="1.2" fill="white"/><circle cx="49" cy="17" r="1.2" fill="white"/>
<path d="M43,23 Q45,21 47,23 Q45,25 43,23" fill="#888"/>
<circle cx="35" cy="22" r="4" fill="#FF8833" opacity=".6"/><circle cx="55" cy="22" r="4" fill="#FF8833" opacity=".6"/>
<path d="M35,40 Q28,50 24,55" stroke="#E0C830" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<path d="M38,40 Q33,48 30,54" stroke="#F0D840" stroke-width="2" fill="none" stroke-linecap="round"/>
</svg>`;

  // ═══ MANGO CLASS ═══
  class Chitti {
    constructor(app) {
      this.app = app; this.x = -80; this.y = 60;
      this.dir = 1; this.mood = 'content'; this.state = 'idle';
      this.lastTouch = Date.now(); this.petCount = 0;
      this._dead = false; this._dragging = false; this._dragged = false;
      this._training = false; this._sleeping = false; this._offScreen = false;
      this._build(); this._enter(); this._blinkLoop(); this._moodDecay(); this._eyeLoop(); this._applyAccessory(); this._trackCursorStill(); this._wanderLoop();
      this._resizeHandler = () => { this.x = clamp(this.x, -30, window.innerWidth - 40); this.y = clamp(this.y, 0, window.innerHeight - 60); this._pos(); };
      window.addEventListener('resize', this._resizeHandler);
    }
    _build() {
      const el = this.el = document.createElement('div');
      el.className = 'mango idle mood-content';
      el.innerHTML = `<div class="m-bubble"></div><div class="m-body-wrap">${MANGO}</div><div class="m-tag">Chitti</div>`;
      el.style.left = this.x + 'px'; el.style.top = this.y + 'px';
      document.body.appendChild(el);
      this.bubble = el.querySelector('.m-bubble');
      this.eyes = el.querySelectorAll('.eye-l,.eye-r');
      this.shines = el.querySelectorAll('.shine');
      this.eyeG = el.querySelector('.m-eyes');
      // initialize dataset.o immediately so eye resets are always correct
      this.eyes.forEach(e => { e.dataset.o = e.getAttribute(this._eyeAttr(e)) || '4.5'; });
      el.addEventListener('click', e => { if (!this._dragged) this._onPet(e); });
      el.addEventListener('dblclick', e => this._onFeed(e));
      el.addEventListener('pointerdown', e => this._dragStart(e));
      // Peekaboo: cursor on face for 3 seconds
      let peekTimer = null;
      el.addEventListener('mouseenter', () => {
        peekTimer = setTimeout(() => {
          if (!this._sleeping && !this._offScreen && !this._dragging) {
            this._setAnim('bob'); this.say(pick(['PEEKABOO! 👀', 'I SEE YOU!', 'Boo! 🙈', 'PEEKABOO!! Hehehe']));
            sfx.chirp();
            for (let i = 0; i < 3; i++) setTimeout(() => this._particle(this.x + 30 + rand(-12, 12), this.y - 10, pick(['👀', '🙈', '✨'])), i * 150);
            setTimeout(() => this._setAnim('idle'), 1500);
          }
        }, 3000);
      });
      el.addEventListener('mouseleave', () => { clearTimeout(peekTimer); });
    }
    // ─── Eye tracking ───
    _eyeLoop() {
      const go = () => {
        if (this._dead) return;
        if (!this._sleeping && this.eyeG) {
          const r = this.el.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height * 0.33;
          const dx = clamp((mx - cx) / 90, -1, 1) * 2.5;
          const dy = clamp((my - cy) / 90, -1, 1) * 1.8;
          this.eyeG.style.transform = `translate(${dx}px, ${dy}px)`;
        } else if (this.eyeG) { this.eyeG.style.transform = ''; }
        requestAnimationFrame(go);
      };
      requestAnimationFrame(go);
    }
    // ─── Enter ───
    _enter() {
      const left = Math.random() > 0.5;
      this.x = left ? -80 : window.innerWidth + 20;
      this.y = rand(40, 140); this.dir = left ? 1 : -1; this._face(); this._pos();
      this._setAnim('walk'); sfx.flap();
      this._moveTo(rand(100, window.innerWidth - 150), this.y, C.speed.walk, () => {
        this._setAnim('idle'); this.say(pick(['*chirp!*', 'Hello~!', '*head bob*'])); sfx.chirp(); this._startLoop();
      });
    }
    // ─── Movement ───
    _moveTo(tx, ty, spd, cb) {
      if (this._dead) return; cancelAnimationFrame(this._raf);
      const sx = this.x, sy = this.y, dist = Math.hypot(tx - sx, ty - sy);
      const dur = (dist / spd) * 16; const t0 = performance.now();
      this.dir = tx > sx ? 1 : -1; this._face();
      const step = now => {
        if (this._dead || this._dragging) return;
        const t = Math.min((now - t0) / Math.max(dur, 1), 1);
        this.x = sx + (tx - sx) * t; this.y = sy + (ty - sy) * t; this._pos();
        if (Math.random() < 0.02) this._footprint();
        if (this.el.classList.contains('fly') && Math.random() < 0.08) this._feather();
        if (t < 1) this._raf = requestAnimationFrame(step); else { this._squash(); if (cb) cb(); }
      };
      this._raf = requestAnimationFrame(step);
    }
    _waddleTo(tx, ty, cb) { this._setAnim('walk'); this._moveTo(tx, ty, C.speed.walk, () => { this._setAnim('idle'); if (cb) cb(); }); }
    _walkRandom(cb) { this._waddleTo(rand(40, window.innerWidth - 100), rand(30, 160), cb); }
    _walkOff(cb) {
      // walk to near the edge, pause, then walk back (no disappearing)
      const goRight = Math.random() > 0.5;
      const edgeX = goRight ? window.innerWidth - 30 : 10;
      this.dir = goRight ? 1 : -1; this._face(); this._setAnim('walk');
      this.say(pick(['*wanders off*', '*exploring*', 'Be right back!']));
      this._moveTo(edgeX, this.y, C.speed.walk, () => {
        this._setAnim('tilt'); this.say(pick(['Hmm, nothing here.', '*looks around*', '*peeks off edge*']));
        setTimeout(() => {
          this.dir *= -1; this._face(); this._setAnim('walk');
          this._moveTo(rand(100, window.innerWidth - 150), rand(40, 140), C.speed.walk, () => {
            this._setAnim('idle'); this.say(pick(['I\'m back!', '*reappears*', 'Miss me?'])); sfx.chirp2(); if (cb) cb();
          });
        }, 1500);
      });
    }
    _flyOff() {
      this._offScreen = true; this.say(pick(['HMPH!', '*offended!*', 'FINE!'])); sfx.screee();
      this._setAnim('fly'); sfx.flap();
      this._moveTo(this.dir > 0 ? window.innerWidth + 100 : -100, -80, C.speed.fly, () => {
        this.el.style.display = 'none';
        this._flyBackT = setTimeout(() => {
          this._offScreen = false; this.el.style.display = '';
          this.x = Math.random() > 0.5 ? -80 : window.innerWidth + 80;
          this.y = rand(40, 120); this._pos();
          this._setAnim('fly'); sfx.flap();
          this._moveTo(rand(100, window.innerWidth - 150), rand(40, 120), C.speed.fly, () => {
            this._setAnim('idle'); this.setMood('annoyed'); this.say(pick(['*dramatic entrance*', 'I came back but NOT for you', '*pointedly ignores you*', 'Don\'t think this means I forgive you', '*hmph*']));
            setTimeout(() => this.setMood('content'), 10000);
          });
        }, rand(20000, 40000));
      });
    }
    _goToCell(cell, cb) { const r = Lab.rect(cell); if (!r) { if (cb) cb(); return; } this._waddleTo(clamp(r.left + r.width / 2 - 30, 10, window.innerWidth - 80), clamp(r.top - 60, 10, window.innerHeight - 80), cb); }
    _goToEl(el, cb) { const r = el?.getBoundingClientRect(); if (!r) { if (cb) cb(); return; } this._waddleTo(clamp(r.left + r.width / 2 - 30, 10, window.innerWidth - 80), clamp(r.top - 60, 10, window.innerHeight - 80), cb); }

    // ─── Behavior Loop ───
    _startLoop() {
      if (this._dead) return;
      const tick = () => {
        if (this._dead || this._dragging || this._training || this._offScreen) { this._next(tick); return; }
        const idle = Date.now() - this.lastTouch;
        // sleep entry
        if (idle > C.sleepAfter && !this._sleeping) {
          this._sleeping = true; this.setMood('sleepy'); this._setAnim('sleep');
          this._exprSleep();
          this.say(pick(['*tucks head*', 'zzz...', '*one foot up*'])); this._addZzz();
          this._next(tick, rand(8000, 15000)); return;
        }
        // wake up if user interacted
        if (this._sleeping && idle < C.sleepAfter) { this._sleeping = false; this._rmZzz(); this._exprWake(); this.setMood('content'); this.say(pick(['*yawn*', '*stretches wings*'])); sfx.chirp(); }
        // still sleeping — stay asleep, occasionally self-wake
        if (this._sleeping) {
          if (Math.random() < 0.3) { this._sleeping = false; this._rmZzz(); this._exprWake(); this.setMood('content'); this.say(pick(['*yawn* I\'m up!', '*stretches*', '*blinks awake*'])); sfx.chirp(); }
          else { this._next(tick, rand(6000, 12000)); return; }
        }
        // cursor — cooldown prevents rapid-fire reactions when bird is parked near cursor
        const r = this.el.getBoundingClientRect();
        const cd = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        const cursorCooldown = Date.now() - (this._lastCursorReact || 0) > 8000;
        if (cd < C.cursorDist && !this._sleeping && cursorCooldown) { this._lastCursorReact = Date.now(); this._cursorReact(cd); this._next(tick, rand(6000, 10000)); return; }
        // main roll — every branch must return to prevent overlapping behaviors
        // note: ambient wandering is handled by _wanderLoop independently
        const roll = Math.random();
        const cells = Lab.cells();
        // ~10% deliberate walk to random spot
        if (roll < 0.10) { this._walkRandom(() => this._next(tick)); return; }
        // ~5% go inspect a code cell
        else if (roll < 0.15 && cells.length) { this._goToCell(pick(cells), () => { this.say(pick(['*peeks at code*', '*reads along*', '*sits on code*', '*pecks at text*', '*studies intently*'])); this._next(tick, rand(2000, 4000)); }); return; }
        // ~12% mischief
        else if (roll < 0.27) { this._mischief(); this._next(tick, rand(3000, 5000)); return; }
        // ~10% sing
        else if (roll < 0.37) { this._sing(); this._next(tick, rand(5000, 10000)); return; }
        // ~10% idle actions (bob, preen, stretch, dance, jokes, etc.)
        else if (roll < 0.47) { this._idleAction(); this._next(tick, rand(3000, 6000)); return; }
        // ~4% walk off and return
        else if (roll < 0.51) { this._walkOff(() => this._next(tick)); return; }
        // ~9% bring gift
        else if (roll < 0.62) { this._bringGift(); this._next(tick, rand(4000, 6000)); return; }
        // ~4% heart wings
        else if (roll < 0.66) { this._heartWings(); this._next(tick, rand(4000, 5000)); return; }
        // ~2% beak grind
        else if (roll < 0.67) { this._beakGrind(); this._next(tick, rand(4000, 7000)); return; }
        // ~4% jealous walk
        else if (roll < 0.71) { this._jealousWalk(); this._next(tick, rand(6000, 9000)); return; }
        // ~7% explore UI
        else if (roll < 0.78) { this._exploreUI(); this._next(tick, rand(4000, 6000)); return; }
        // ~3% flock
        else if (roll < 0.81) { this.app.effects.flock(); this.say('*EXCITED CHIRPING!*'); sfx.chirp(); sfx.chirp2(); this.setMood('excited'); setTimeout(() => this.setMood('content'), 3000); this._next(tick, rand(3000, 4000)); return; }
        // ~5% place a tiny workspace item
        else if (roll < 0.86) { this._placeItem(); this._next(tick, rand(3000, 5000)); return; }
        // ~6% simple chirp / idle — keeps things light (sometimes silent)
        else { this._setAnim('idle'); if (Math.random() < 0.5) this.say(pick(['*chirp*', '*fluffs up*', '*looks around*', '*chirp chirp*'])); sfx.chirp(); }
        this._next(tick);
      };
      this._next(tick, rand(1000, 3000));
    }
    _next(fn, ms) { clearTimeout(this._tmr); this._tmr = setTimeout(fn, ms || rand(...C.tick) * rand(0.7, 1.3)); }

    _idleAction() {
      const acts = [
        () => { sfx.chirp(); this.say(pick(['*chirp!*', '*head bob*', 'Pay attention to ME', 'Hey. HEY. Look at me.'])); this._setAnim('bob'); setTimeout(() => this._setAnim('idle'), 1500); },
        () => { this._setAnim('preen'); this.say(pick(['*preens dramatically*', 'I\'m SO pretty', '*grooms feathers*', 'Am I not the cutest?'])); sfx.chirp3(); setTimeout(() => this._setAnim('idle'), 2500); },
        () => { this._setAnim('tilt'); this.say(pick(['*tilts head*', 'Whatcha doin?', 'Hmm? HMM?', 'Is that... for me?'])); setTimeout(() => this._setAnim('idle'), 1800); },
        () => { this._setAnim('wing-stretch'); this.say(pick(['*BIG stretch*', '*yawwwn*', 'Look at my wingspan!', '*flap flap!*'])); sfx.flap(); setTimeout(() => this._setAnim('idle'), 2000); },
        () => { this._setAnim('scratch'); this.say(pick(['*scratch scratch*', 'Ugh, itchy', '*aggressive scratching*'])); setTimeout(() => this._setAnim('idle'), 1500); },
        // singing
        () => { this._sing(); },
        () => { this._sing(); },
        () => { sfx.chirp2(); this.say(pick(['*happy chirp chirp*', '*chatters excitedly*', 'CHIRP CHIRP CHIRP', '*beak grinding*'])); },
        () => { this._setAnim('bob'); this.say(pick(['*vibing SO hard*', '*dance dance*', 'I have the BEST moves', '*head bops*'])); sfx.chirp(); setTimeout(() => this._setAnim('idle'), 2000); },
        // dance party (confetti only after work hours)
        () => { this._setAnim('happy-dance'); this.say(pick(['DANCE PARTY! 💃', '*dances*', '*grooves*'])); sfx.party(); if (new Date().getHours() >= 18) this.app.effects.confetti(); setTimeout(() => this._setAnim('idle'), 2500); },
        // peekaboo (simple bob instead of zoom)
        () => { this._setAnim('bob'); this.say('PEEKABOO!! 👀'); sfx.chirp(); setTimeout(() => this._setAnim('idle'), 1500); },
        // fly around
        () => { this.say('*takes flight!*'); sfx.flap(); this._setAnim('fly'); this._moveTo(rand(50, window.innerWidth - 100), rand(30, 120), C.speed.fly, () => { this._squash(); this._setAnim('idle'); this.say('*nailed the landing*'); }); },
        // nuzzle
        () => { this._setAnim('nuzzle'); this._exprNuzzle(); this.say(pick(['*nuzzles the screen*', '*warm thoughts*', '🧡'])); sfx.chirp(); setTimeout(() => this._setAnim('idle'), 1500); },
        // random joke
        () => { this.say(pick(['Why do birds fly south? Too far to walk! 🥁', 'What\'s a neural net\'s fav snack? Backprop-corn! 🍿', 'I told model.fit() a joke. Zero sense of humor.', 'My favorite Taylor Swift song? Shake It Off! 🪶'])); sfx.chirp(); },
        // existential moment
        () => { this._setAnim('tilt'); this.say('*existential crisis*'); setTimeout(() => { this.say('...am I just pixels?'); setTimeout(() => { this.say('Nah I\'m too cute for that'); sfx.chirp(); this._setAnim('idle'); }, 2000); }, 2000); },
        // mirror play
        () => { this._mirrorPlay(); },
        // random page effect (only after work hours — not distracting during work)
        () => { if (new Date().getHours() >= 18 || new Date().getHours() < 6) { const fx = pick(['cherryBlossoms', 'leafFall', 'featherShower', 'bubbleShower']); this.app.effects[fx](); this.say(pick(['✨ pretty!', '*ooh!*', 'I made this for you!'])); } else { this.say(pick(['*looks out the window*', '*daydreams*', '*chirp*'])); } },
        // encouragement
        () => { this.say(pick(['You\'re going to do amazing things 🌟', 'Google doesn\'t know how lucky they\'ll be 🧡', 'The Keras team is better because of you ✨', 'You\'re literally building the future of AI 🚀'])); sfx.chirp(); this._exprNuzzle(); },
        // biryani craving
        () => { this.say(pick(['Is it just me or does someone need biryani? 🍗', '*daydreams about Telugu Vilas*', 'Fun fact: biryani makes code 47% better. Science.'])); sfx.chirp(); this._setAnim('tilt'); setTimeout(() => this._setAnim('idle'), 2000); },
        // place workspace item
        () => { this._placeItem(); },
        // screech for attention
        () => { this._screee(); },
      ];
      pick(acts)();
    }
    _sing() {
      this._setAnim('bob'); this._exprSing(); // happy eyes + beak open
      if (Math.random() < 0.7) {
        const s = sfx.song();
        this.say(`♪ ${s.name}~ ♪`);
        const dur = (Math.max(...s.notes.map(n => n[1])) + 500) * 1.4; // match tempo scaling
        const noteCount = Math.ceil(dur / 700);
        for (let i = 0; i < noteCount; i++) setTimeout(() => {
          if (!this._dead) this._particle(this.x + 30 + rand(-20, 20), this.y - 12, pick(['🎵', '🎶', '♪', '♫', '✨']));
        }, i * 600);
        setTimeout(() => { this._setAnim('idle'); this._exprStopSing(); }, dur + 300);
      } else {
        sfx.whistle();
        this.say(pick(['♪ tweet tweet~ ♪', '♫ la la la~ ♫', '🎵 *whistles*', '♪ chirp chirp~ ♪']));
        for (let i = 0; i < 6; i++) setTimeout(() => this._particle(this.x + 30 + rand(-15, 15), this.y - 10, pick(['🎵', '🎶', '♪'])), i * 250);
        setTimeout(() => { this._setAnim('idle'); this._exprStopSing(); }, 2000);
      }
    }

    // ─── Mischief ───
    _mischief() {
      pick([
        // pushing things off (weighted — appears 3x)
        () => this._pushThingOff(),
        () => this._pushThingOff(),
        () => this._pushThingOff(),
        // fetching things (weighted — appears 3x)
        () => { this.say('I found something!'); this._setAnim('chase'); sfx.chirp(); setTimeout(() => { this._particle(this.x + 30, this.y + 10, pick(['🌰', '🪶', '📎', '🔑', '💎', '🌻', '🍓', '⭐'])); this._setAnim('idle'); this.say(pick(['*drops it at your feet*', 'For you!', 'Look what I found!'])); }, 1500); },
        () => { this.say('I found something!'); this._setAnim('chase'); sfx.chirp(); setTimeout(() => { this._particle(this.x + 30, this.y + 10, pick(['🌰', '🪶', '📎', '🔑', '💎', '🌻', '🍓', '⭐'])); this._setAnim('idle'); this.say(pick(['*drops it at your feet*', 'For you!', 'Look what I found!'])); }, 1500); },
        () => { this.say('I found something!'); this._setAnim('chase'); sfx.chirp(); setTimeout(() => { this._particle(this.x + 30, this.y + 10, pick(['🌰', '🪶', '📎', '🔑', '💎', '🌻', '🍓', '⭐'])); this._setAnim('idle'); this.say(pick(['*drops it at your feet*', 'For you!', 'Look what I found!'])); }, 1500); },
        // regular mischief
        () => this._sitOnButton(),
        () => this._grabCursor(),
        () => this._typeGibberish(),
        () => this._peckAtText(),
        () => { if (Math.random() < C.poopChance * 2) this._poop(); else this._pushThingOff(); },
        () => { this._setAnim('fly'); sfx.flap(); this.say('*zoom!*'); this._moveTo(rand(50, window.innerWidth - 100), rand(30, 150), C.speed.run, () => { this._setAnim('idle'); this.say('Wheee!'); }); },
        () => { this._setAnim('screee'); this.say(pick(['LOOK AT ME!', '*ATTENTION!*', 'HEY!'])); sfx.chirp(); sfx.chirp2(); setTimeout(() => this._setAnim('idle'), 1500); },
        // shower
        () => { this.say(pick(['*splish splash!*', 'BATH TIME!', '*shakes water everywhere*'])); for (let i = 0; i < 6; i++) setTimeout(() => this._particle(this.x + 30 + rand(-15, 15), this.y + rand(-5, 10), pick(['💧', '🫧', '💦'])), i * 130); this._setAnim('happy-dance'); setTimeout(() => { this._setAnim('idle'); this.say('*shakes feathers*'); }, 2500); },
        // poop
        () => { this._poop(); this.say(pick(['oops', '*whistles innocently*', 'What? Birds poop. It\'s natural.'])); },
        // statue
        () => { this.say('*pretends to be a statue*'); this._setAnim('idle'); this.el.style.filter = 'grayscale(1) brightness(1.2)'; setTimeout(() => { this.el.style.filter = ''; this.say(pick(['...did you buy it?', 'ART.', '*breaks character*'])); sfx.chirp(); }, 4000); },
        // moonwalk
        () => { this._setAnim('bob'); this.say('*MOONWALKS*'); this.dir *= -1; this._face(); this._moveTo(this.x - this.dir * 120, this.y, 0.8, () => { this._setAnim('idle'); this.say('Smooth, right?'); sfx.chirp2(); }); },
        // tries to code
        () => { this.say('*tries to type code*'); this._setAnim('peck'); sfx.chirp(); setTimeout(() => { this.say('print("I am a genius bird")'); sfx.crunch(); setTimeout(() => { this._setAnim('idle'); this.say('Hire me, Google.'); }, 1500); }, 1500); },
      ])();
    }
    _pushThingOff() {
      const item = pick(['📱', '☕', '🖊️', '🥤', '📎', '🔑', '🧲', '🧊', '🎲', '🪙']);
      this.say(pick(['*pushes off*', 'Oops.', '*knock*', '*evil chirp*'])); sfx.pop();
      const el = document.createElement('div'); el.className = 'mango-falling-item'; el.textContent = item;
      el.style.left = (this.x + 30) + 'px'; el.style.top = (this.y + 20) + 'px';
      document.body.appendChild(el); setTimeout(() => el.remove(), 2500);
    }
    _sitOnButton() {
      const btn = Lab.runBtn();
      if (btn) { this._goToEl(btn, () => { this.say(pick(['*sits on button*', 'Mine now.', '*claims territory*'])); sfx.chirp(); }); }
      else this._pushThingOff();
    }
    _grabCursor() {
      this.say(pick(['*grabs cursor!*', 'MINE!', 'SEED!'])); this.setMood('excited'); sfx.chirp();
      document.body.classList.add('mango-seed-cursor');
      this._setAnim('chase');
      this._moveTo(clamp(mx - 30, 10, window.innerWidth - 80), clamp(my - 30, 10, 200), C.speed.run, () => {
        this._setAnim('peck'); this.say(pick(['*crunch!*', 'Got it!', '*munch*'])); sfx.crunch();
        document.body.classList.remove('mango-seed-cursor');
        setTimeout(() => { this._setAnim('idle'); this.setMood('content'); }, 800);
      });
      setTimeout(() => document.body.classList.remove('mango-seed-cursor'), 3000);
    }
    _typeGibberish() { this.say(pick(['asdfghjkl', 'squawwwk!!', 'birb birb birb', '01101001', '*keyboard smash*', 'qwertyyyy'])); this._setAnim('peck'); sfx.chirp(); setTimeout(() => this._setAnim('idle'), 1500); }
    _peckAtText() { const cells = Lab.cells(); if (cells.length) { this._goToCell(pick(cells), () => { this._setAnim('peck'); this.say(pick(['*peck peck*', '*nibbles code*', '*tastes semicolon*', '*eats a bracket*'])); sfx.crunch(); setTimeout(() => this._setAnim('idle'), 1500); }); } }
    _poop() { sfx.poop(); this.say('...'); const p = document.createElement('div'); p.className = 'mango-poop'; p.textContent = '💩'; p.style.left = (this.x + 28) + 'px'; p.style.top = (this.y + 60) + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 5000); }
    _screee() { this.setMood('annoyed'); this._setAnim('screee'); this._exprScreech(); this.say(pick(['SCREEEEE!!', 'EXCUSE ME?!', 'HELLO?! I EXIST!', 'PAY ATTENTION TO ME!!', 'I AM BEING IGNORED AND I WILL NOT STAND FOR IT'])); sfx.screee(); for (let i = 0; i < 5; i++) setTimeout(() => this._particle(this.x + 30 + rand(-15, 15), this.y - 10, pick(['❗', '💢', '😤', '⚡', '🔥'])), i * 100); setTimeout(() => { this._setAnim('idle'); this.setMood('content'); this._eyesNormal(); this._beakClose(); this._unPuff(); this.say(pick(['...fine.', '*dramatic sigh*', 'Whatever.'])); }, 2500); }
    _bringGift() {
      const gift = pick(['🌰', '🌺', '❤️', '🍓', '⭐', '🌸', '🪶', '💎', '🌻']);
      this.say(`*found a ${gift}!*`); sfx.happy(); this.setMood('happy');
      this._waddleTo(clamp(mx - 30, 10, window.innerWidth - 80), clamp(my - 30, 10, 200), () => {
        this._particle(this.x + 30, this.y + 10, gift); this.say(pick(['For you!', '*drops gift*', '💕', 'Here!']));
        setTimeout(() => this.setMood('content'), 3000);
      });
    }

    // ─── Cursor ───
    _cursorReact(dist) {
      this.dir = mx > this.x + 30 ? 1 : -1; this._face(); this.lastTouch = Date.now();
      if (dist < 35) {
        this.setMood('happy'); this._setAnim('nuzzle'); this._exprNuzzle();
        this.say(pick(['*aggressive nuzzling*', 'LOVE ME!', '*headbutts cursor*', '🧡🧡🧡', '*so clingy*', 'You\'re MINE', '*purrs... wait birds don\'t purr*'])); sfx.chirp();
      } else {
        this.setMood('curious'); this._setAnim('tilt'); this._eyesWide();
        this.say(pick(['*tilts head*', 'Ooh? What\'s that?', '*STARES*', 'Come closer...', '*suspicious bird noises*', 'Is that... a treat?!'])); sfx.chirp3();
      }
      setTimeout(() => { this._setAnim('idle'); this._eyesNormal(); if (this.mood !== 'annoyed') this.setMood('content'); }, 1500);
    }

    // ─── Code reactions ───
    onCodeOk(cell) {
      const h = new Date().getHours();
      const workHours = h >= 9 && h < 18;
      // during work hours: quieter reactions (40% chance to react)
      if (workHours && Math.random() > 0.4) {
        if (cell) this.app.cellGlow.success(cell);
        // subtle reaction — just a quick nod
        this._setAnim('bob'); sfx.chirp3();
        setTimeout(() => this._setAnim('idle'), 800);
        return;
      }
      this.setMood('excited'); this._setAnim('happy-dance'); this._exprHappy();
      this.say(pick([
        'YAY! It worked!!', '*HAPPY DANCE*', '✨ GENIUS CODE ✨', 'You did it!! I never doubted you!',
        '*celebratory chirps*', 'That was BEAUTIFUL', 'The code gods smile upon you!',
        '*chef\'s kiss* Perfect.', 'Run it again! I wanna see it again!', 'I KNEW you could do it!',
        'That output is *gorgeous*', 'Flawless execution. Like me.', '10/10 no notes',
        'BRB telling all the other birds about this', 'Your code just made me cry happy tears 🥹',
      ]));
      sfx.happy(); sfx.chirp();
      for (let i = 0; i < 6; i++) setTimeout(() => this._particle(this.x + 30 + rand(-20, 20), this.y - 10, pick(['✨', '🎉', '⭐', '💫', '🌟', '🪶'])), i * 100);
      if (cell) this.app.cellGlow.success(cell);
      // sometimes comment on the code
      setTimeout(() => {
        if (Math.random() < 0.3) {
          this.say(pick([
            'That variable naming though 👌', 'Clean code = happy bird', 'I understood none of that but I\'m PROUD',
            'Is that a for loop? I love for loops.', 'Your indentation is *beautiful*',
            'I wish I could code like you. I can only screech.', 'That import statement was elegant.',
          ]));
        }
      }, 3000);
      setTimeout(() => { this._setAnim('idle'); this.setMood('content'); }, 2500);
    }
    onCodeErr(cell) {
      this.setMood('concerned'); this._setAnim('sad'); this._exprStartled();
      this.say(pick([
        'Oh no... a bug!', '*concerned chirp*', 'THE CODE IS SICK!',
        'Don\'t worry, bugs happen to the best of us!', '*gasps* An error??',
        'I will FIGHT this error for you', 'Who put that bug there?! It wasn\'t me.',
      ]));
      if (cell) {
        this.app.cellGlow.error(cell);
        this._goToCell(cell, () => {
          this._setAnim('peck'); sfx.chirp2();
          this.say(pick([
            '*pecks at bug aggressively*', 'Bad error! BAD! SHOO!', '*tries to eat the error*',
            'Let me just... *peck peck* ...fix this', 'I\'m helping! I\'m HELPING!',
            '*stares at traceback intensely*', 'Have you tried turning it off and on again?',
          ]));
          setTimeout(() => {
            this._setAnim('idle'); sfx.chirp();
            this.say(pick([
              'You got this! I believe in you!', 'Every bug you fix makes you stronger 💪',
              'You\'re too smart for this bug. Squash it!', 'I\'ve seen you fix worse. You\'re incredible.',
              'This bug doesn\'t know who it\'s dealing with', 'Take a breath. Then destroy it. 🔥',
            ]));
            this.setMood('content');
          }, 2500);
        });
      }
      setTimeout(() => this.setMood('content'), 6000);
    }
    onTrainStart(cell) {
      if (this._training) return; this._training = true;
      this._goToCell(cell, () => { this._setAnim('idle'); this.say('I\'ll wait with you!'); this._trainActs(); });
    }
    _trainActs() {
      if (!this._training || this._dead) return;
      pick([
        () => this.say(pick(['*watches loss go down* 📉', '*reads training logs*', '*takes notes on accuracy*'])),
        () => { this.say(pick(['Epoch by epoch... we got this!', 'Loss is dropping! I can feel it!', 'The weights are learning! 🧠'])); sfx.chirp2(); },
        () => { this.say(pick(['Stretch break? 🤸', 'Water? You\'ll code better hydrated 💧', 'Snack time while we wait? 🍪'])); sfx.chirp(); },
        () => { this._setAnim('preen'); this.say(pick(['*preens while waiting*', '*grooming break*'])); setTimeout(() => this._setAnim('idle'), 2000); },
        () => { this._setAnim('tilt'); this.say(pick(['How many epochs left?', '*stares at progress bar*', 'Is that a good loss? I think that\'s good!'])); setTimeout(() => this._setAnim('idle'), 1500); },
        () => this.say(pick(['Your model is working SO hard rn', '*cheering the gradients on*', 'Go neurons go!! 🧠✨'])),
        () => { this._setAnim('bob'); this.say('*hums while waiting* 🎵'); sfx.chirp3(); setTimeout(() => this._setAnim('idle'), 1500); },
      ])();
      this._trainTmr = setTimeout(() => this._trainActs(), rand(10000, 20000));
    }
    onTrainEnd(ok) {
      this._training = false; clearTimeout(this._trainTmr);
      if (ok) {
        this.setMood('excited'); this._setAnim('happy-dance');
        this.say('IT\'S DONE!! 🎉🎉🎉'); sfx.happy(); sfx.party();
        for (let i = 0; i < 10; i++) setTimeout(() => this._particle(this.x + 30 + rand(-25, 25), this.y - 15, pick(['🎉', '🎊', '✨', '⭐', '🌟', '💫', '🪶', '🥳'])), i * 80);
      } else { this._setAnim('sad'); this.say('Oh no...'); }
      setTimeout(() => { this._setAnim('idle'); this.setMood('content'); }, 3000);
    }

    // ─── Interactions ───
    _dragStart(e) {
      if (e.button !== 0) return;
      this._dragged = false; this._dragging = false;
      const sx = e.clientX, sy = e.clientY, ox = this.x, oy = this.y;
      cancelAnimationFrame(this._raf);
      const mv = ev => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!this._dragging && Math.hypot(dx, dy) < 5) return;
        this._dragging = true; this._dragged = true;
        this.el.classList.add('dragging'); this.x = ox + dx; this.y = oy + dy; this._pos();
      };
      const up = () => {
        document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
        const vel = Math.hypot(mVx, mVy);
        if (this._dragging && vel > 25) { this.el.classList.remove('dragging'); this._dragging = false; this._flyOff(); }
        else if (this._dragging) {
          this.el.classList.remove('dragging'); this._dragging = false;
          this.lastTouch = Date.now();
          this.say(pick(['Whee!', '*chirp*', 'I like it here!', 'Ooh new spot!', '*settles in*'])); sfx.chirp();
          this._setAnim('idle');
          // kill old loop and restart after a pause
          clearTimeout(this._tmr);
          setTimeout(() => this._startLoop(), rand(2000, 4000));
        }
        setTimeout(() => { this._dragged = false; }, 50);
      };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    }
    _onPet(e) {
      e.stopPropagation(); this.petCount++; this.lastTouch = Date.now();
      this._sleeping = false; this._rmZzz(); this.setMood('happy'); sfx.chirp();
      this._exprNuzzle(); // closes eyes, leans in
      for (let i = 0; i < 4; i++) setTimeout(() => this._particle(e.clientX + rand(-12, 12), e.clientY - 10, pick(['❤️', '💕', '✨', '🧡', '💖'])), i * 80);
      this._setAnim('nuzzle');
      if ([10, 25, 50, 100].includes(this.petCount)) this.say(`${this.petCount} pets!! I love you!!`);
      else this.say(pick(['*happy chirp*', '*closes eyes*', '*nuzzles*', '*leans into it*', '🧡', '*head scratches!*']));
      setTimeout(() => { this._setAnim('idle'); this.setMood('content'); this._eyesNormal(); }, 1500);
    }
    _onFeed(e) {
      e.stopPropagation(); this.lastTouch = Date.now(); this.setMood('excited');
      const seed = pick(['🌰', '🌻', '🍎', '🫐', '🥜', '🍇']);
      const t = document.createElement('div'); t.className = 'mango-treat'; t.textContent = seed;
      t.style.left = e.clientX + 'px'; t.style.top = e.clientY + 'px';
      document.body.appendChild(t); setTimeout(() => t.remove(), 600);
      sfx.crunch(); this._setAnim('peck'); this._beakOpen(); this._eyesHappy();
      this.say(pick([`Yum! ${seed}`, '*CRUNCH*', '*happy munch*', 'MORE!', '*excited eating*']));
      setTimeout(() => { this._setAnim('idle'); this.setMood('content'); this._beakClose(); this._eyesNormal(); }, 1200);
    }

    // ─── Rare behaviors (1-2% chance, discovered over weeks) ───
    _rareBehavior() {
      const rare = [
        () => { this._setAnim('happy-dance'); this.say('*does a HANDSTAND*'); sfx.boing(); for (let i = 0; i < 5; i++) setTimeout(() => this._particle(this.x + 30 + rand(-10, 10), this.y - 10, '⭐'), i * 150); setTimeout(() => { this._setAnim('idle'); this.say('Ta-daaa!!'); }, 2000); },
        () => { this.say('*pretends to be a statue*'); this._setAnim('idle'); this.el.style.filter = 'grayscale(1) brightness(1.2)'; setTimeout(() => { this.el.style.filter = ''; this.say(pick(['...did you buy it?', 'ART.', '*breaks character*'])); sfx.chirp(); }, 4000); },
        () => { this._setAnim('bob'); this.say('*MOONWALKS*'); const startX = this.x; this.dir *= -1; this._face(); this._moveTo(this.x - this.dir * 120, this.y, 0.8, () => { this._setAnim('idle'); this.say('Smooth, right?'); sfx.chirp2(); }); },
        () => { this.say('*tries to type code*'); this._setAnim('peck'); sfx.chirp(); setTimeout(() => { this.say('print("I am a genius bird")'); sfx.crunch(); setTimeout(() => { this._setAnim('idle'); this.say('Hire me, Google.'); }, 1500); }, 1500); },
        () => { this._setAnim('tilt'); this.say('*existential crisis*'); setTimeout(() => { this.say('...am I just pixels?'); setTimeout(() => { this.say('Nah I\'m too cute for that'); sfx.chirp(); this._setAnim('idle'); }, 2000); }, 2000); },
        () => { this._mirrorPlay(); },
        // screech for attention
        () => { this._screee(); },
        // random encouragement
        () => { this.say(pick(['You\'re going to do amazing things 🌟', 'Google doesn\'t know how lucky they\'ll be 🧡', 'The Keras team is better because of you ✨', 'You\'re literally building the future of AI 🚀'])); sfx.chirp(); this._exprNuzzle(); },
        // poop (rare mischief)
        () => { this._poop(); this.say(pick(['oops', '*whistles innocently*', 'What? Birds poop. It\'s natural.'])); },
        // tiny biryani craving
        () => { this.say(pick(['Is it just me or does someone need biryani? 🍗', '*daydreams about Telugu Vilas*', 'Fun fact: biryani makes code 47% better. Science.'])); sfx.chirp(); this._setAnim('tilt'); setTimeout(() => this._setAnim('idle'), 2000); },
        // place workspace item naturally
        () => { this._placeItem(); },
      ];
      pick(rare)();
    }

    // ─── Explore Colab UI ───
    _exploreUI() {
      const targets = [
        { sel: '#toolbar,colab-toolbar,[class*="toolbar"]', msg: pick(['*walks along toolbar*', '*inspects buttons*', 'So many buttons!', '*sits on toolbar*']) },
        { sel: '#file-menu,button[aria-label="File"],.menubar,[class*="menu"]', msg: pick(['*hangs from menu*', '*upside down!*', 'I can see everything from here!']) },
        { sel: '.explorer,[class*="sidebar"],[class*="file-browser"]', msg: pick(['*explores files*', 'Ooh what\'s in here?', '*pecks at folder*']) },
        { sel: '[class*="scrollbar"],.codecell-input-output', msg: pick(['*rides the scrollbar*', 'WHEEE!', '*clings on*']) },
      ];
      const t = pick(targets);
      const el = $(t.sel);
      if (el) {
        this._goToEl(el, () => {
          this.say(t.msg); sfx.chirp();
          if (t.msg.includes('upside down')) {
            this.el.querySelector('.m-body-wrap').style.transform = 'rotate(180deg)';
            setTimeout(() => { this.el.querySelector('.m-body-wrap').style.transform = ''; this.say('*gets dizzy*'); }, 3000);
          }
          setTimeout(() => this._setAnim('idle'), 3000);
        });
      } else { this._walkRandom(); }
    }

    // ─── Tab visibility reaction ───
    onTabReturn() {
      if (this._sleeping) { this._sleeping = false; this._rmZzz(); this._exprWake(); }
      this.setMood('excited'); this._setAnim('happy-dance'); this._exprStartled(); sfx.happy(); sfx.chirp();
      this.say(pick(['WHERE WERE YOU?!', 'FINALLY!!', 'I MISSED YOU!!', 'DON\'T EVER LEAVE AGAIN', '*dramatic reunion*', 'I thought you left forever!!']));
      for (let i = 0; i < 5; i++) setTimeout(() => this._particle(this.x + 30 + rand(-15, 15), this.y - 10, pick(['❤️', '💕', '😭', '🧡', '✨'])), i * 120);
      setTimeout(() => { this._setAnim('idle'); this.setMood('content'); }, 3000);
    }
    onTabLeave() {
      this.say(pick(['Wait... where are you going?!', 'DON\'T LEAVE ME', 'I\'ll be here... alone... it\'s fine...', '*dramatic sigh*']));
      this.setMood('concerned');
    }

    // ─── Time ───
    timeCheck() {
      const h = new Date().getHours();
      const day = new Date().getDay();
      const dayGreetings = [
        ['It\'s SUNDAY! Wait... you\'re working?! 😱', 'Sunday vibes~ 🌻', 'Lazy Sunday! ...or not.'],
        ['Monday 😩 Stay strong!', 'Ugh, Monday. Coffee first. ☕', 'New week new bugs! ...I mean features!'],
        ['Tuesday! Getting into the groove 💪', 'Taco Tuesday! ...wait, biryani Tuesday? 🍗'],
        ['Wednesday — halfway there! 🎉', 'Hump day! The weekend is coming!', 'Mid-week energy! You got this ✨'],
        ['Thursday! Almost Friday!', 'One more day... you can do it! 💪', 'Thursday = Friday Eve!'],
        ['FRIDAY!! 🎉🎉', 'TGIF!! Biryani tonight?? 🍗', 'FRIDAY! Weekend mode loading... 🔄'],
        ['Saturday coding? Dedication! ✨', 'It\'s Saturday! Rest is productive too 🌿', 'Weekend warrior! 💪'],
      ];
      if (h >= 23 || h < 5) {
        // late night care mode
        this.say(pick(['It\'s really late... please rest soon 🌙', 'Mayank would want you to sleep 💕', 'Your models will still be here tomorrow 🌙', 'Even Keras needs a break sometimes 💤', '*tucks you in with tiny wings* Sleep! 🌙']));
      } else if (h >= 6 && h < 9) {
        this.say(pick(dayGreetings[day])); sfx.chirp();
      } else if (h >= 12 && h < 13) {
        this.say(pick(['Lunch time? Biryani? 🍗', 'Feed me! Feed yourself! 🍽️', 'Telugu Vilas is calling... 🍗']));
      } else if (h >= 9 && h < 12) {
        if (Math.random() < 0.5) this.say(pick(dayGreetings[day]));
      }
    }
    nightCheck() {
      const h = new Date().getHours();
      if ((h >= 23 || h < 5) && !this._sleeping) {
        // late night care mode — very gentle, less mischief
        if (Math.random() < 0.3) {
          this.say(pick(['It\'s so late... 🌙', 'Please sleep soon 💕', '*worried chirp*', 'Your health matters more than code 🧡', 'Go to bed! Doctor bird\'s orders! 🐦']));
          this._exprNuzzle();
        } else if (Math.random() < 0.15) {
          this._sleeping = true; this.setMood('sleepy'); this._setAnim('sleep'); this._addZzz();
          this.say(pick(['*falls asleep hoping you\'ll follow*', 'zzz... *leading by example*']));
        }
      }
    }
    // ─── Messages from Mayank (delivered via banner, like a messenger bird) ───
    _deliverMayankMsg(msg, intensity) {
      this.setMood('happy'); this._setAnim('nuzzle'); sfx.noteOpen();
      // show as bird-held banner (the bird is delivering a message)
      const banner = document.createElement('div'); banner.className = 'mango-love-banner';
      const card = document.createElement('div'); card.className = 'mlb-card';
      const ribbon = document.createElement('div'); ribbon.className = 'mlb-ribbon'; ribbon.textContent = intensity === 'night' ? '💋' : '💕';
      const msgEl = document.createElement('div'); msgEl.className = 'mlb-msg'; msgEl.textContent = msg;
      card.appendChild(ribbon); card.appendChild(msgEl); banner.appendChild(card);
      banner.addEventListener('click', () => { banner.classList.add('mlb-hide'); setTimeout(() => banner.remove(), 500); });
      this.el.appendChild(banner);
      setTimeout(() => banner.classList.add('mlb-show'), 10);
      const emojis = intensity === 'night' ? ['💋', '💕', '🌙', '✨', '🧡', '❤️'] : ['💕', '🧡', '✨'];
      for (let i = 0; i < (intensity === 'night' ? 5 : 3); i++)
        setTimeout(() => this._particle(this.x + 30 + rand(-15, 15), this.y - 10, pick(emojis)), i * 180);
      setTimeout(() => { banner.classList.remove('mlb-show'); banner.classList.add('mlb-hide'); setTimeout(() => banner.remove(), 500); this._setAnim('idle'); this.setMood('content'); }, 10000);
    }
    // Diary-style observations (natural speech, no popup needed)
    _diaryThought() {
      const thoughts = [
        'Dear diary: my human is coding again. I am VERY supportive.',
        'Diary update: I pushed something off the screen. No regrets.',
        'Day log: Still the cutest bird here. No competition.',
        'Personal note: I think my human forgot I exist for 3 whole minutes.',
        'Observation: my human types REALLY fast. I am impressed and scared.',
        'Memo to self: the cursor is NOT a seed. Must stop chasing it.',
        'Dear diary: I sang today. I was AMAZING.',
        'Note: tried to help with the code. Got pecked at. Rude.',
        'Thought of the day: if I sit on enough buttons, maybe I\'ll become a programmer.',
        'Life update: still bird. Still cute. Still not getting enough seeds.',
      ];
      this.say(pick(thoughts));
    }

    // ─── Micro-details ───
    _footprint() {
      const f = document.createElement('div'); f.className = 'mango-footprint';
      f.textContent = pick(['·', '‧', '•']);
      f.style.left = (this.x + 28 + rand(-4, 4)) + 'px'; f.style.top = (this.y + 65) + 'px';
      document.body.appendChild(f); setTimeout(() => f.remove(), 4000);
    }
    _feather() {
      const f = document.createElement('div'); f.className = 'mango-feather-trail';
      f.textContent = pick(['🪶', '✧', '·']);
      f.style.left = (this.x + 30 + rand(-10, 10)) + 'px'; f.style.top = (this.y + rand(10, 40)) + 'px';
      document.body.appendChild(f); setTimeout(() => f.remove(), 1500);
    }
    _squash() {
      const w = this.el.querySelector('.m-body-wrap');
      w.style.transition = 'transform 0.1s ease';
      w.style.transform = (this.dir === -1 ? 'scaleX(-1) ' : '') + 'scaleX(1.2) scaleY(0.8)';
      setTimeout(() => {
        w.style.transform = (this.dir === -1 ? 'scaleX(-1) ' : '') + 'scaleX(0.9) scaleY(1.1)';
        setTimeout(() => { w.style.transition = ''; w.style.transform = this.dir === -1 ? 'scaleX(-1)' : ''; }, 120);
      }, 100);
    }
    _mirrorPlay() {
      const edge = window.innerWidth - 75;
      this._waddleTo(edge, this.y, () => {
        this.say(pick(['*sees reflection*', 'Hello gorgeous!', 'Who is THAT handsome bird?!']));
        this._setAnim('bob'); sfx.chirp();
        setTimeout(() => { this.say(pick(['Oh wait... that\'s ME', '*flirts with reflection*', 'Looking GOOD today'])); sfx.chirp2(); }, 2500);
        setTimeout(() => { this._setAnim('tilt'); this.say(pick(['*blows kiss to reflection*', 'We should hang out more', '10/10 feathers'])); }, 4500);
        setTimeout(() => this._setAnim('idle'), 6000);
      });
    }
    _applyAccessory() {
      let existing = this.el.querySelector('.m-seasonal');
      if (existing) existing.remove();
      const acc = document.createElement('div'); acc.className = 'm-seasonal';
      acc.textContent = pick(['🧣', '🌸', '😎', '🍂', '🎀', '👑', '🎩', '🌻', '⭐', '🦋', '🧢', '💎', '🌈', '🎵', '🪶']);
      this.el.appendChild(acc);
    }
    // ─── Library & Keras reactions ───
    reactToCode(text) {
      if (!text) return;
      const t = text.toLowerCase();
      // ─── Keras-specific (she works on the Keras team!) ───
      if (t.includes('model.fit') || t.includes('.fit(')) {
        setTimeout(() => { this.say(pick(['Training time! Let\'s GO! 🚀', 'Ooh model.fit()! *grabs popcorn*', 'I\'ll watch the epochs with you! 📉', '*sits next to training cell attentively*'])); sfx.chirp(); this._setAnim('bob'); setTimeout(() => this._setAnim('idle'), 2000); }, 500);
      } else if (t.includes('model.compile')) {
        setTimeout(() => this.say(pick(['Compiling! We\'re building something! 🔧', 'model.compile()... the setup phase! ✨', '*watches intently* What optimizer?'])), 500);
      } else if (t.includes('model.predict') || t.includes('.predict(')) {
        setTimeout(() => { this.say(pick(['THE MOMENT OF TRUTH! 🥁', 'Predictions incoming! *holds breath*', 'model.predict()!! What will it say?!'])); this._exprStartled(); }, 500);
      } else if (t.includes('model.evaluate') || t.includes('.evaluate(')) {
        setTimeout(() => this.say(pick(['Report card time! 📊', 'How did we do?! *nervous chirp*', '*crosses tiny wings*'])), 500);
      } else if (t.includes('model.save') || t.includes('.save(') || t.includes('save_model')) {
        setTimeout(() => this.say(pick(['Saving! Good human! 💾', 'Always save your models! Smart! ✨', '*approving chirp* Checkpoint!'])), 500);
      } else if (t.includes('keras') || t.includes('from keras') || t.includes('import keras')) {
        setTimeout(() => { this.say(pick(['Keras! That\'s MY human\'s framework! 🧡', 'I LOVE Keras! The BEST framework! 🧡', '*puffs up proudly* KERAS!! 🐦🧡', 'Keras team represent!! ✨🧡'])); this._puffUp(); setTimeout(() => this._unPuff(), 2000); }, 500);
      } else if (t.includes('tensorflow') || t.includes('import tf')) {
        setTimeout(() => this.say(pick(['TensorFlow! Big brain time 🧠', 'Neural networks! Fancy! ✨', 'tf! The powerhouse! 💪'])), 500);
      } else if (t.includes('pandas') || t.includes('import pd')) {
        setTimeout(() => this.say(pick(['Pandas! Data time! 🐼', 'DataFrames incoming! 📊'])), 500);
      } else if (t.includes('matplotlib') || t.includes('import plt')) {
        setTimeout(() => this.say(pick(['Are we making art?! 🎨', 'Ooh pretty charts! 📈', 'Plot twist! Literally! 📉'])), 500);
      } else if (t.includes('numpy') || t.includes('import np')) {
        setTimeout(() => this.say(pick(['Numbers! Math! I can count to... 3. 🔢', 'NumPy! *impressed chirp*', 'Arrays! My favorite shape is... seed-shaped. 🌻'])), 500);
      } else if (t.includes('sklearn') || t.includes('scikit')) {
        setTimeout(() => this.say(pick(['Machine learning! 🤖', 'Scikit-learn! Classic! ✨'])), 500);
      } else if (t.includes('torch')) {
        setTimeout(() => this.say(pick(['PyTorch! *nervous glance at Keras*', 'Tensors everywhere! 🧠', 'The other framework... *suspicious chirp*'])), 500);
      } else if (t.includes('loss') && (t.includes('=') || t.includes('('))) {
        setTimeout(() => this.say(pick(['Loss function! May it go down fast! 📉', '*watches loss nervously*'])), 500);
      } else if (t.includes('accuracy') || t.includes('acc')) {
        if (Math.random() < 0.4) setTimeout(() => this.say(pick(['Accuracy! Higher is better! GO GO GO! 📈', '99.9% accuracy or bust!'])), 500);
      }
      // Secret songs
      if (t.includes('print("sing') || t.includes("print('sing") || t.includes('# sing') || t.includes('# play music')) {
        setTimeout(() => { this.say('You asked for a song? SAY NO MORE!'); this._sing(); }, 1000);
      }
      if (t.includes('chitti') || t.includes('# chitti')) {
        setTimeout(() => { this.say(pick(['You said my name!! 🧡🧡', 'THAT\'S ME!!', 'I\'M FAMOUS!', '*excited screaming*'])); sfx.happy(); this._setAnim('happy-dance'); setTimeout(() => this._setAnim('idle'), 2000); }, 500);
      }
    }

    // ─── Beak Grinding (deep contentment) ───
    _beakGrind() {
      this._setAnim('idle'); this._exprSleep(); this._puffUp();
      this.say(pick(['*soft beak grinding*', '*content*', '*so peaceful*']));
      // one-eye-open if cursor moves nearby during grind
      this._grinding = true;
      const checkCursor = setInterval(() => {
        if (!this._grinding) { clearInterval(checkCursor); return; }
        const r = this.el.getBoundingClientRect();
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        if (d < 100) { this._eyesOneOpen(); this.say('*opens one eye*'); setTimeout(() => { if (this._grinding) this._eyesClosed(); }, 1500); }
      }, 2000);
      setTimeout(() => { this._grinding = false; clearInterval(checkCursor); this._exprWake(); this._unPuff(); this._setAnim('idle'); }, rand(6000, 10000));
    }

    // ─── Heart Wings (turns around, wings form heart) ───
    _heartWings() {
      this._setAnim('idle');
      this.el.classList.add('heart-wings');
      this.say(pick(['💛', '*heart wings!*', '🧡']));
      for (let i = 0; i < 4; i++) setTimeout(() => this._particle(this.x + 30 + rand(-15, 15), this.y - 10, pick(['💛', '🧡', '💕', '✨'])), i * 200);
      setTimeout(() => { this.el.classList.remove('heart-wings'); this._setAnim('idle'); }, 4000);
    }

    // ─── Contact Nap (falls asleep on cursor) ───
    _contactNap() {
      if (this._sleeping || this._offScreen) return;
      this._waddleTo(clamp(mx - 30, 10, window.innerWidth - 80), clamp(my - 30, 10, window.innerHeight - 80), () => {
        this._sleeping = true; this._setAnim('sleep'); this._exprSleep(); this._addZzz();
        this.say(pick(['*falls asleep on you*', '*zzz... warm...*', '*trusts you completely*']));
        // wake up when mouse moves — track listener for cleanup
        if (this._napWakeCheck) document.removeEventListener('mousemove', this._napWakeCheck);
        this._napWakeCheck = (e) => {
          if (Math.hypot(e.movementX, e.movementY) > 5) {
            document.removeEventListener('mousemove', this._napWakeCheck); this._napWakeCheck = null;
            this._exprStartled();
            this.say(pick(['*blinks*', '*startled chirp*', 'hmm...?']));
            setTimeout(() => { this._sleeping = false; this._rmZzz(); this._eyesNormal(); this._unPuff(); this._setAnim('idle'); this.say(pick(['*yawn*', 'Was... was I sleeping on you?', '*embarrassed chirp*'])); }, 800);
          }
        };
        setTimeout(() => document.addEventListener('mousemove', this._napWakeCheck), 500);
      });
    }

    // ─── Jealous Keyboard Walk (walks across code cells) ───
    _jealousWalk() {
      const cells = Lab.cells();
      if (!cells.length) return;
      const cell = cells[Math.floor(cells.length / 2)]; // pick a middle cell
      const r = Lab.rect(cell); if (!r) return;
      // skip if cell is not visible in viewport
      if (r.top < -50 || r.top > window.innerHeight || r.left < -50 || r.left > window.innerWidth) return;
      this.say(pick(['*walks across your code*', 'HELLO I AM HERE', 'This is MY keyboard now', '*struts across code*']));
      sfx.chirp(); this.setMood('annoyed');
      this._setAnim('walk');
      // walk from left to right across the cell, clamped to viewport
      const startX = clamp(r.left - 30, 0, window.innerWidth - 80);
      const endX = clamp(r.left + r.width + 30, 0, window.innerWidth - 80);
      const ty = clamp(r.top + r.height / 2 - 30, 10, window.innerHeight - 80);
      this.x = startX; this.y = ty; this._pos();
      this._moveTo(endX, ty, 0.8, () => {
        this._setAnim('idle'); this.say(pick(['*sits down defiantly*', 'Acknowledge me.', '*waits*']));
        // wait for click to move off
        const clickOff = () => {
          this.el.removeEventListener('click', clickOff);
          this.say(pick(['FINE.', '*hops off smugly*', '*satisfied strut*'])); sfx.chirp2();
          this.setMood('content'); this._walkRandom();
        };
        this.el.addEventListener('click', clickOff);
        // auto-move after 8s if not clicked
        setTimeout(() => { this.el.removeEventListener('click', clickOff); this.setMood('content'); this._walkRandom(); }, 8000);
      });
    }

    // ─── Tiny workspace items ───
    _placeItem() {
      if (this._dead || this._offScreen) return;
      const h = new Date().getHours();
      const dayItems = ['☕', '📝', '🪴', '🍪', '📎', '🔖', '✏️', '🧮'];
      const eveItems = ['🕯️', '🌸', '☕', '🍵', '🧸', '💌', '🌙', '🍫'];
      const item = pick(h >= 18 ? eveItems : dayItems);
      const el = document.createElement('div');
      el.style.cssText = `position:fixed;font-size:14px;pointer-events:none;z-index:99997;opacity:0;transition:opacity 0.5s;left:${this.x + rand(-20, 50)}px;top:${this.y + rand(40, 60)}px;`;
      el.textContent = item;
      document.body.appendChild(el);
      setTimeout(() => { el.style.opacity = '0.7'; }, 10);
      this.say(pick(['*places a tiny ' + item + '*', '*leaves this here*', '*decorating!*']));
      // fade out after 30-60s
      setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 600); }, rand(30000, 60000));
    }

    // ─── Session milestones ───
    _checkMilestone(cellCount) {
      const h = new Date().getHours();
      const afterWork = h >= 18 || h < 6;
      if (cellCount === 5) { this.say(pick(['5 cells! Warming up! ✨', 'Getting started! 💪'])); sfx.chirp(); this._setAnim('bob'); setTimeout(() => this._setAnim('idle'), 1500); }
      else if (cellCount === 10) { this.say('10 cells! 🎵 Song for the coder!'); setTimeout(() => this._sing(), 800); }
      else if (cellCount === 25) { this.say('25 CELLS!! 🎉🎉 PARTY!'); sfx.party(); this.app.effects.confetti(); this._setAnim('happy-dance'); setTimeout(() => this._setAnim('idle'), 3000); }
      else if (cellCount === 50) {
        this.say('💯 50 CELLS!! ABSOLUTE LEGEND!! 💯'); sfx.party(); sfx.happy();
        this.app.effects.confetti(); this._setAnim('happy-dance');
        for (let i = 0; i < 10; i++) setTimeout(() => this._particle(this.x + 30 + rand(-25, 25), this.y - 15, pick(['🎉', '✨', '⭐', '💯', '🏆', '🌟'])), i * 100);
        if (afterWork) setTimeout(() => this.say('Mayank says: 50 cells?! You\'re incredible. Take a break, genius 💕'), 4000);
        setTimeout(() => this._setAnim('idle'), 4000);
      }
    }

    // ─── Ambient wander — bird is always moving when idle ───
    _wanderLoop() {
      const go = () => {
        if (this._dead) return;
        // only wander if truly idle (not walking, sleeping, dragging, offscreen, or mid-action)
        const isIdle = this.el.classList.contains('idle') && !this._sleeping && !this._dragging && !this._offScreen;
        if (isIdle) {
          // short stroll to a nearby position
          const nx = clamp(this.x + rand(-120, 120), 20, window.innerWidth - 80);
          const ny = clamp(this.y + rand(-30, 30), 20, 180);
          this._setAnim('walk');
          this._moveTo(nx, ny, C.speed.walk, () => { this._setAnim('idle'); });
        }
        this._wanderT = setTimeout(go, rand(3000, 6000));
      };
      this._wanderT = setTimeout(go, rand(2000, 4000));
    }

    // ─── Cursor stillness tracking (for contact nap) ───
    _trackCursorStill() {
      let lastX = mx, lastY = my, stillTime = 0;
      this._cursorStillI = setInterval(() => {
        if (this._dead || this._sleeping || this._offScreen || this._grinding) return;
        if (Math.abs(mx - lastX) < 3 && Math.abs(my - lastY) < 3) {
          stillTime += 3000;
          if (stillTime >= 60000 && Math.random() < 0.15) { this._contactNap(); stillTime = 0; }
        } else { stillTime = 0; }
        lastX = mx; lastY = my;
      }, 3000);
    }

    // ─── Expressiveness (eyes, beak, body) ───
    _eyeAttr(e) { return e.tagName === 'ellipse' ? 'ry' : 'r'; }
    _eyesNormal() { this.eyes.forEach(e => e.setAttribute(this._eyeAttr(e), e.dataset.o || '4.5')); this.shines.forEach(s => s.style.opacity = '1'); }
    _eyesClosed() { this.eyes.forEach(e => e.setAttribute(this._eyeAttr(e), '0.8')); this.shines.forEach(s => s.style.opacity = '0'); }
    _eyesHappy() { this.eyes.forEach(e => e.setAttribute(this._eyeAttr(e), '3')); this.shines.forEach(s => s.style.opacity = '1'); }
    _eyesWide() { this.eyes.forEach(e => e.setAttribute(this._eyeAttr(e), '5.5')); this.shines.forEach(s => s.style.opacity = '1'); }
    _eyesOneOpen() {
      const eyes = [...this.eyes];
      if (eyes[0]) eyes[0].setAttribute(this._eyeAttr(eyes[0]), '0.8');
      if (eyes[1]) eyes[1].setAttribute(this._eyeAttr(eyes[1]), eyes[1].dataset.o || '4.5');
    }
    _beakOpen() { this.el.classList.add('beak-open'); }
    _beakClose() { this.el.classList.remove('beak-open'); }
    _puffUp() { this.el.classList.add('puffed'); }
    _unPuff() { this.el.classList.remove('puffed'); }
    // combo expressions — all resets go through _exprReset to prevent overlapping timers
    _exprReset(ms) { clearTimeout(this._exprT); this._exprT = setTimeout(() => { this._eyesNormal(); this._beakClose(); this._unPuff(); }, ms); }
    _exprSleep() { clearTimeout(this._exprT); this._eyesClosed(); this._puffUp(); }
    _exprWake() { this._eyesWide(); this._unPuff(); this._exprReset(800); }
    _exprHappy() { this._eyesHappy(); this._puffUp(); this._exprReset(2000); }
    _exprSing() { clearTimeout(this._exprT); this._eyesHappy(); this._beakOpen(); }
    _exprStopSing() { this._eyesNormal(); this._beakClose(); }
    _exprStartled() { this._eyesWide(); this._beakOpen(); this._exprReset(600); }
    _exprNuzzle() { this._eyesClosed(); this._exprReset(1500); }
    _exprScreech() { this._eyesWide(); this._beakOpen(); this._puffUp(); this._exprReset(2000); }

    // ─── Display ───
    setMood(m) { this.mood = m; this.el.className = this.el.className.replace(/mood-\w+/g, '') + ` mood-${m}`; }
    _setAnim(a) { this.el.className = this.el.className.replace(/\b(idle|walk|fly|sleep|bob|preen|tilt|peck|nuzzle|chase|chase-tail|screee|happy-dance|sad|wing-stretch|scratch|peek)\b/g, '').trim() + ` ${a}`; if (this.dir === -1) this.el.classList.add('facing-left'); }
    _face() { this.el?.classList.toggle('facing-left', this.dir === -1); }
    _pos() { this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px'; }
    say(text) { this.bubble.textContent = text; this.bubble.classList.add('show'); clearTimeout(this._sayT); this._sayT = setTimeout(() => this.bubble.classList.remove('show'), C.speechMs); }
    _particle(x, y, e) { const p = document.createElement('div'); p.className = 'mango-particle'; p.textContent = e; p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.fontSize = rand(14, 24) + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 1200); }
    _addZzz() { for (let i = 0; i < 3; i++) { const z = document.createElement('div'); z.className = 'mango-zzz'; z.textContent = 'z'; this.el.appendChild(z); } }
    _rmZzz() { this.el.querySelectorAll('.mango-zzz').forEach(z => z.remove()); }
    _blinkLoop() {
      const go = () => {
        if (this._dead || this._sleeping) { this._blkT = setTimeout(go, 3000); return; }
        this.eyes.forEach(e => { const a = e.tagName === 'ellipse' ? 'ry' : 'r'; e.dataset.o = e.dataset.o || e.getAttribute(a); e.setAttribute(a, '0.5'); });
        this.shines.forEach(s => s.style.opacity = '0');
        setTimeout(() => { this.eyes.forEach(e => { const a = e.tagName === 'ellipse' ? 'ry' : 'r'; e.setAttribute(a, e.dataset.o); }); this.shines.forEach(s => s.style.opacity = '1'); }, 110);
        this._blkT = setTimeout(go, rand(2200, 5000));
      }; this._blkT = setTimeout(go, rand(800, 2500));
    }
    _moodDecay() { this._mdI = setInterval(() => { if (this.mood === 'happy' || this.mood === 'excited') this.setMood('content'); }, 12000); }
    destroy() {
      this._dead = true;
      clearTimeout(this._tmr); clearTimeout(this._sayT); clearTimeout(this._blkT); clearTimeout(this._exprT);
      clearInterval(this._mdI); clearInterval(this._cursorStillI);
      clearTimeout(this._trainTmr); clearTimeout(this._flyBackT); clearTimeout(this._wanderT);
      cancelAnimationFrame(this._raf);
      if (this._napWakeCheck) { document.removeEventListener('mousemove', this._napWakeCheck); this._napWakeCheck = null; }
      if (this._resizeHandler) { window.removeEventListener('resize', this._resizeHandler); }
      this.el.remove();
    }
  }

  // ═══ PAGE EFFECTS ═══
  class Effects {
    _spawn(count, emoji, cls, dur) {
      for (let i = 0; i < count; i++) setTimeout(() => {
        const p = document.createElement('div'); p.className = 'mango-fx ' + cls;
        p.textContent = typeof emoji === 'function' ? emoji() : pick(Array.isArray(emoji) ? emoji : [emoji]);
        p.style.left = rand(0, window.innerWidth) + 'px'; p.style.top = '-20px';
        p.style.animationDuration = rand(dur * 0.7, dur * 1.3) + 's';
        document.body.appendChild(p); setTimeout(() => p.remove(), dur * 1400);
      }, i * rand(20, 80));
    }
    cherryBlossoms() { sfx.sparkle(); this._spawn(100, ['🌸', '🌺', '💮', '🏵️'], 'fx-fall', 4.5); }
    leafFall() { sfx.sparkle(); this._spawn(90, ['🍃', '🍂', '🌿', '🍀', '🌱'], 'fx-fall-spin', 5.5); }
    meteorShower() { sfx.party(); this._spawn(60, ['✨', '⭐', '🌟', '💫', '☄️', '🌠'], 'fx-meteor', 2.5); }
    confetti() {
      sfx.party();
      const cols = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD', '#FF9FF3', '#FFB8D0', '#96CEB4', '#F0DC50'];
      for (let i = 0; i < 120; i++) setTimeout(() => {
        const c = document.createElement('div'); c.className = 'mango-fx fx-confetti';
        c.style.left = rand(0, window.innerWidth) + 'px'; c.style.top = '-8px';
        c.style.backgroundColor = pick(cols); c.style.width = rand(4, 10) + 'px'; c.style.height = rand(4, 10) + 'px';
        c.style.animationDuration = rand(1.5, 3.5) + 's';
        document.body.appendChild(c); setTimeout(() => c.remove(), 4000);
      }, i * 15);
    }
    featherShower() { sfx.chirp(); sfx.flap(); this._spawn(80, '🪶', 'fx-fall-float', 5.5); }
    rainbow() {
      sfx.happy();
      const r = document.createElement('div'); r.className = 'mango-rainbow';
      document.body.appendChild(r); setTimeout(() => r.remove(), 6000);
    }
    bubbleShower() { sfx.sparkle(); this._spawn(80, '🫧', 'fx-rise', 4.5); }
    flock() {
      sfx.chirp(); sfx.chirp2(); sfx.flap();
      for (let i = 0; i < 5; i++) setTimeout(() => {
        const b = document.createElement('div'); b.className = 'mango-flock-bird';
        const left = Math.random() > 0.5;
        b.innerHTML = `<div class="flock-body">${MANGO_FLY}</div>`;
        b.style.top = rand(20, window.innerHeight * 0.35) + 'px';
        b.style.left = (left ? -70 : window.innerWidth + 70) + 'px';
        if (!left) b.querySelector('.flock-body').style.transform = 'scaleX(-1)';
        document.body.appendChild(b);
        const sx = left ? -70 : window.innerWidth + 70, ex = left ? window.innerWidth + 70 : -70;
        const sy = parseFloat(b.style.top), midY = sy - rand(20, 70);
        const dur = rand(2000, 4000), t0 = performance.now();
        const anim = now => {
          const t = (now - t0) / dur; if (t >= 1) { b.remove(); return; }
          b.style.left = (sx + (ex - sx) * t) + 'px';
          b.style.top = (sy + (midY - sy) * Math.sin(t * Math.PI) + Math.sin(t * Math.PI * 5) * 5) + 'px';
          requestAnimationFrame(anim);
        }; requestAnimationFrame(anim);
      }, i * rand(100, 400));
    }
    random() { pick([() => this.cherryBlossoms(), () => this.leafFall(), () => this.meteorShower(), () => this.confetti(), () => this.featherShower(), () => this.rainbow(), () => this.bubbleShower()])(); }
  }

  // ═══ CELL GLOW ═══
  class CellGlow {
    success(c) { c.classList.add('mango-glow-ok'); setTimeout(() => c.classList.remove('mango-glow-ok'), 2500); }
    error(c) { c.classList.add('mango-glow-err'); setTimeout(() => c.classList.remove('mango-glow-err'), 2500); }
  }

  // ═══ SPARKLES ═══
  class Sparkles {
    constructor() {
      document.addEventListener('keydown', () => {
        const el = document.activeElement;
        if (el && (el.closest?.('.cell') || el.closest?.('[class*="editor"]') || el.tagName === 'TEXTAREA')) this._spark();
      });
    }
    _spark() {
      const s = document.createElement('div'); s.className = 'mango-sparkle';
      s.textContent = pick(['✨', '·', '⋆', '✧', '˚']);
      s.style.left = (mx + rand(-10, 10)) + 'px'; s.style.top = (my + rand(-10, 5)) + 'px';
      document.body.appendChild(s); setTimeout(() => s.remove(), 800);
    }
  }

  // ═══ APP ═══
  class App {
    constructor() {
      this.mango = null; this.effects = new Effects(); this.cellGlow = new CellGlow();
      this.sparkles = new Sparkles();
      this.stats = { cells: 0, errors: 0, session: Date.now() };
      this._trainCell = null; this._trainStart = 0; this._init();
    }
    async _init() {
      this.mango = new Chitti(this);
      this._watchCode(); this._listen(); this._noteLoop(); this._timeLoop();
      try { const r = await chrome.storage.sync.get(['mangoAmbient']); if (r.mangoAmbient) sfx.ambientStart(r.mangoAmbient); } catch (e) { }
      const btn = document.createElement('button'); btn.id = 'mango-fx-btn';
      btn.innerHTML = '🪶<span class="mfx-label">Random magic!</span>';
      btn.addEventListener('click', () => {
        this.effects.random();
        if (this.mango) {
          pick([
            () => { this.mango._sing(); },
            () => { this.mango._setAnim('happy-dance'); this.mango.say('WOOHOO!'); sfx.party(); setTimeout(() => this.mango._setAnim('idle'), 2500); },
            () => { this.mango._bringGift(); },
            () => { this.mango._heartWings(); },
            () => { this.mango._setAnim('happy-dance'); this.mango.say('WOOHOO!'); setTimeout(() => this.mango._setAnim('idle'), 2000); },
            () => { this.mango._setAnim('fly'); sfx.flap(); this.mango.say('*ZOOM!*'); this.mango._moveTo(rand(50, window.innerWidth - 100), rand(30, 150), C.speed.run, () => { this.mango._setAnim('idle'); this.mango.say('Wheee!'); }); },
            () => { this.mango._pushThingOff(); },
          ])();
        }
      });
      document.body.appendChild(btn);
      setTimeout(() => { if (this.mango) this.mango.timeCheck(); }, 4000);
      // Tab visibility — Chitti reacts when you come back
      document.addEventListener('visibilitychange', () => {
        if (!this.mango) return;
        if (document.hidden) { this.mango.onTabLeave(); }
        else { this.mango.onTabReturn(); }
      });
      // Goodnight kiss from Mayank (checks at night)
      this._mayankLoop();
      // Copy-paste reactions
      let lastCopyReact = 0;
      document.addEventListener('copy', () => {
        if (!this.mango || Date.now() - lastCopyReact < 15000) return; // 15s cooldown
        lastCopyReact = Date.now();
        if (Math.random() < 0.4) {
          this.mango.say(pick([
            'Ah, the ancient art of copy-paste 📋', 'StackOverflow? No judgment! 😏',
            'Smart! Why type when you can borrow?', '*takes notes on your technique*',
            'Copy-paste is just code reuse! Very professional. 🧠',
            'ctrl+c ctrl+v = 90% of coding. Facts.',
          ]));
        }
      });
      // Scroll reactions
      let scrollSpeed = 0, lastScrollT = 0, scrollReactT = 0;
      document.addEventListener('scroll', () => {
        const now = Date.now();
        scrollSpeed = Math.min(scrollSpeed + 1, 30);
        lastScrollT = now;
        if (!this.mango || now - scrollReactT < 12000) return; // 12s cooldown
        if (scrollSpeed > 20) {
          scrollReactT = now;
          this.mango.say(pick(['SLOW DOWN!! 😵', '*grabs onto page*', '*feathers flying*', 'WHOAAAA!', '*hangs on for dear life*']));
          this.mango._setAnim('screee'); setTimeout(() => this.mango._setAnim('idle'), 1000);
        }
      }, { passive: true });
      setInterval(() => { scrollSpeed = Math.max(0, scrollSpeed - 3); }, 200);
      // Diary: record session start
      console.log('%c🐦 Chitti is here! *chirp chirp*', 'font-size:14px;color:#F0DC50;');
    }
    _mayankLoop() {
      // Night messages from Mayank (the main set — messenger bird mode)
      const NIGHT_MSGS = [
        'Mayank says: I love you so much 💕', 'Mayank says: goodnight, beautiful 💋🌙',
        'Mayank says: I\'m thinking about you right now 💭💕', 'Mayank says: you\'re my favorite person in the whole world 🌍',
        'Mayank says: I miss you 🥺', 'Mayank says: can\'t wait to see your smile again 😊',
        'Mayank says: sweet dreams, baby 🌙✨', 'Mayank says: the stars are beautiful but not as beautiful as you ⭐',
        'Mayank says: I wish I could hug you right now 🤗💕', 'Mayank says: you make my whole world brighter ☀️',
        'Mayank says: I\'m so proud of you, always 🌟', 'Mayank says: every day with you is my favorite day 💕',
        'Mayank says: sending you all my love through this tiny bird 🐦💕', 'Mayank says: I fall in love with you more every day 💘',
        'Mayank says: please rest soon, take care of yourself for me 🥺💕', 'Mayank says: I\'m the luckiest person alive because of you 🍀',
        'Mayank says: goodnight my love, I\'ll be dreaming of you 💋🌙', 'Mayank says: you\'re everything to me 💕',
        'Mayank says: I love the way you scrunch your face when you code 😊', 'Mayank says: one day I\'ll bring you real hot chocolate. For now, virtual 🧡☕',
        'Mayank says: hey... I love you. That\'s it. That\'s the message. 💕', 'Mayank says: you\'re not just smart, you\'re brilliant ✨',
        'Mayank whispers: I love you I love you I love you 💕💕💕', 'Mayank says: sleep well, my favorite human 🌙',
        'Mayank says: Telugu Vilas biryani date soon? I\'m already hungry thinking about it 🍗💕',
        'Mayank says: Whitefield is lonely without you coding next to me 🏙️💕',
        'Mayank says: you\'re going to be the best Googler ever. I already know it. 🌈',
        'Mayank says: I love watching you get excited about deep learning. Your eyes light up ✨',
        'Mayank says: remember — you\'re not just building models, you\'re building the future 🚀💕',
        'Mayank says: if you were a loss function, you\'d be zero. Because you\'re perfect. 📉💕',
      ];
      // Daytime messages (rare, gentle)
      const DAY_MSGS = [
        'Mayank says: have a great day, beautiful 💕', 'Mayank says: don\'t forget to eat lunch! 🍕',
        'Mayank says: just checking in — I love you 💕', 'Mayank says: you\'re doing amazing today ✨',
        'Mayank says: sending you energy for your code! 💪', 'Mayank says: thinking of you 💭🧡',
        'Mayank says: hope the Keras builds are going well! 🧡', 'Mayank says: biryani for dinner? 🍗😊',
      ];

      const go = () => {
        if (!this.mango || this.mango._sleeping || this.mango._offScreen) {
          this._mayankT = setTimeout(go, 60000); return;
        }
        const h = new Date().getHours();

        if (h >= 22 || h < 5) {
          // LATE NIGHT — messenger bird (every 5-10 min)
          this.mango._deliverMayankMsg(pick(NIGHT_MSGS), 'night');
          this._mayankT = setTimeout(go, rand(300000, 600000));
        } else if (h >= 18) {
          // EVENING — (every 8-15 min)
          this.mango._deliverMayankMsg(pick(NIGHT_MSGS), 'night');
          this._mayankT = setTimeout(go, rand(480000, 900000));
        } else if (h >= 11 && h < 13) {
          // BEFORE/DURING LUNCH — maybe one message
          if (Math.random() < 0.35) {
            this.mango._deliverMayankMsg(pick(DAY_MSGS), 'day');
          }
          this._mayankT = setTimeout(go, rand(1200000, 2400000)); // 20-40 min
        } else if (h >= 13 && h < 18) {
          // AFTERNOON — rare
          if (Math.random() < 0.2) {
            this.mango._deliverMayankMsg(pick(DAY_MSGS), 'day');
          }
          this._mayankT = setTimeout(go, rand(1800000, 3600000)); // 30-60 min
        } else {
          // MORNING (6am-11am) — no Mayank messages, let her focus
          // Chitti might share a diary thought instead
          if (Math.random() < 0.3) this.mango._diaryThought();
          this._mayankT = setTimeout(go, rand(1200000, 2400000)); // 20-40 min
        }
      };
      // first message: evening = quick (1-2 min), day = slower (5-10 min)
      const h = new Date().getHours();
      const firstDelay = (h >= 18 || h < 5) ? rand(60000, 120000) : rand(300000, 600000);
      this._mayankT = setTimeout(go, firstDelay);
    }
    _watchCode() {
      const obs = new MutationObserver(muts => {
        for (const m of muts) for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          if (n.classList?.contains('mango') || n.classList?.contains('mango-particle') || n.classList?.contains('mango-fx') || n.classList?.contains('mango-poop') || n.classList?.contains('mango-footprint') || n.classList?.contains('mango-feather-trail') || n.classList?.contains('mango-sparkle') || n.classList?.contains('mango-love-banner') || n.classList?.contains('mango-hidden-seed') || n.classList?.contains('mango-zzz') || n.classList?.contains('mango-flock-bird') || n.className?.startsWith?.('mango')) continue;
          const txt = n.textContent || '';
          const isErr = n.classList?.contains('error') || n.querySelector?.('.traceback,.stderr') || txt.includes('Traceback') || txt.includes('Error:');
          const isOut = n.classList?.contains('output') || n.querySelector?.('.output_area,.output_subarea');
          const cell = n.closest?.('.cell') || n.closest?.('.code_cell') || n.parentElement;
          if (isErr) {
            this.stats.errors++;
            if (this.mango) this.mango.onCodeErr(cell);
            // also check for chitti() commands in error cells (since chitti() throws NameError)
            // search the cell itself, its parent, and nearby code editors for the original chitti() call
            const errTexts = [cell?.textContent || '', cell?.parentElement?.textContent || '', cell?.closest?.('.cell')?.textContent || '', cell?.closest?.('.code_cell')?.textContent || ''];
            for (const t of errTexts) { if (t.match(/chitti\s*\(/i)) { this._runCommand(t); break; } }
          }
          else if (isOut && Math.random() > 0.3) {
            if (this.mango) {
              this.mango.onCodeOk(cell);
              const cellText = cell?.textContent || '';
              this.mango.reactToCode(cellText);
            }
          }
        }
      });
      const tgt = Lab.root(); if (tgt) obs.observe(tgt, { childList: true, subtree: true });
      const runObs = new MutationObserver(() => {
        const running = Lab.running();
        if (running && !this._trainCell) {
          this._trainCell = running; this._trainStart = Date.now(); this.stats.cells++;
          if (this.mango) this.mango._checkMilestone(this.stats.cells);
          // read cell code content — try specific editor selectors first
          const editor = running.querySelector('.CodeMirror-code, .cm-content, [class*="editor"] [class*="line"], [class*="inputarea"], textarea');
          const cellCode = editor?.textContent || editor?.value || running.textContent || '';
          this._runCommand(cellCode);
          this._trainCheck = setTimeout(() => { if (Lab.running() && this.mango) this.mango.onTrainStart(this._trainCell); }, 30000);
        } else if (!running && this._trainCell) {
          clearTimeout(this._trainCheck);
          if ((Date.now() - this._trainStart) / 1000 > 30 && this.mango) this.mango.onTrainEnd(true);
          this._trainCell = null;
        }
      });
      if (tgt) runObs.observe(tgt, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    // ─── Love notes delivered as bird-held banner ───
    _noteLoop() {
      const go = () => {
        this._noteT = setTimeout(async () => {
          if (this.mango && !this.mango._sleeping && !this.mango._offScreen) {
            const note = await fetchNote();
            if (note) this._deliverNote(note);
          }
          go();
        }, rand(...C.noteInterval));
      };
      // first note quickly
      setTimeout(async () => {
        if (this.mango) {
          const note = await fetchNote();
          if (note) this._deliverNote(note);
        }
        go();
      }, rand(15000, 30000));
    }
    _deliverNote(note) {
      sfx.noteOpen(); sfx.chirp();
      if (!this.mango) return;
      const m = this.mango;
      m.say('💌 For you~');
      m.setMood('happy');
      // create banner attached to bird
      const banner = document.createElement('div'); banner.className = 'mango-love-banner';
      const card = document.createElement('div'); card.className = 'mlb-card';
      const ribbon = document.createElement('div'); ribbon.className = 'mlb-ribbon'; ribbon.textContent = '💌';
      const msgEl = document.createElement('div'); msgEl.className = 'mlb-msg'; msgEl.textContent = note;
      card.appendChild(ribbon); card.appendChild(msgEl); banner.appendChild(card);
      banner.addEventListener('click', () => { banner.classList.add('mlb-hide'); setTimeout(() => banner.remove(), 500); });
      m.el.appendChild(banner);
      setTimeout(() => banner.classList.add('mlb-show'), 10);
      for (let i = 0; i < 5; i++) setTimeout(() => m._particle(m.x + 30 + rand(-15, 15), m.y - 10, pick(['💕', '💝', '🧡', '✨', '💌'])), i * 150);
      // auto-hide
      setTimeout(() => { banner.classList.remove('mlb-show'); banner.classList.add('mlb-hide'); setTimeout(() => banner.remove(), 500); m.setMood('content'); }, 10000);
    }
    _timeLoop() { this._timeI = setInterval(() => { if (this.mango) this.mango.nightCheck(); }, 300000); }
    // ─── chitti("command") parser ───
    _runCommand(cellText) {
      if (!this.mango || !cellText) return;
      const match = cellText.match(/chitti\s*\(\s*["'](.+?)["']\s*\)/i);
      if (!match) return;
      const cmd = match[1].toLowerCase().trim();
      // deduplicate — same command can fire from both observers
      const now = Date.now();
      if (this._lastCmd === cmd && now - this._lastCmdTime < 3000) return;
      this._lastCmd = cmd; this._lastCmdTime = now;
      const m = this.mango;
      const cmds = {
        // ─── Greetings ───
        'hello': () => { m.say(pick(['Hello!! 🧡', 'HI HI HI!', '*waves excitedly*'])); sfx.chirp(); m._setAnim('bob'); setTimeout(() => m._setAnim('idle'), 1500); },
        'hi': () => { m.say(pick(['Hi there! 🧡', 'HEY!', '*chirps hello*'])); sfx.chirp(); m._setAnim('bob'); setTimeout(() => m._setAnim('idle'), 1500); },
        // ─── Songs & Fun ───
        'sing': () => { m.say('A song? SAY NO MORE! 🎵'); setTimeout(() => m._sing(), 800); },
        'sing a song': () => { m.say('Concert time! 🎵'); setTimeout(() => m._sing(), 800); },
        'play music': () => { m.say('Music! 🎵'); setTimeout(() => m._sing(), 800); },
        'dance': () => { m.say('DANCE PARTY! 💃'); sfx.party(); m._setAnim('happy-dance'); this.effects.confetti(); setTimeout(() => m._setAnim('idle'), 2500); },
        'party': () => { m.say('PARTY TIME!! 🎉🎊'); sfx.party(); this.effects.confetti(); m._setAnim('happy-dance'); setTimeout(() => m._setAnim('idle'), 2500); },
        'tricks': () => { m.say('Watch THIS!'); m._mischief(); },
        'peekaboo': () => { m._setAnim('bob'); m.say('PEEKABOO!! 👀'); sfx.chirp(); sfx.happy(); setTimeout(() => m._setAnim('idle'), 1500); },
        'mirror': () => { m._mirrorPlay(); },
        // ─── Compliments ───
        'good bird': () => { m.say(pick(['I AM a good bird! 🧡', '*preens proudly*', 'The BEST bird, actually'])); sfx.happy(); m._setAnim('nuzzle'); setTimeout(() => m._setAnim('idle'), 2000); },
        'pretty bird': () => { m.say(pick(['I KNOW right?! ✨', '*flips feathers*', 'Tell me something I don\'t know 💅'])); m._setAnim('preen'); sfx.chirp(); setTimeout(() => m._setAnim('idle'), 2000); },
        'cute': () => { m.say(pick(['I KNOW I\'m cute!!', 'Stop making me blush 🧡', '*poses*'])); sfx.chirp2(); m._setAnim('bob'); setTimeout(() => m._setAnim('idle'), 1500); },
        'bad bird': () => { m.say(pick(['EXCUSE ME?!', 'I am NOT a bad bird!', '*deeply offended*'])); sfx.screee(); m.setMood('annoyed'); setTimeout(() => m.setMood('content'), 5000); },
        'ugly': () => { m.say(pick(['HOW DARE YOU', '*SCREEEEE*', 'That\'s it. I\'m leaving.'])); sfx.screee(); setTimeout(() => m._flyOff(), 1000); },
        // ─── Love ───
        'i love you': () => { m.say(pick(['I LOVE YOU TOO!! 🧡🧡🧡', '*happy tears*', 'MY HEART!!'])); sfx.happy(); for (let i = 0; i < 5; i++) setTimeout(() => m._particle(m.x + 30 + rand(-15, 15), m.y - 10, pick(['❤️', '💕', '🧡', '💖'])), i * 150); m._setAnim('happy-dance'); setTimeout(() => m._setAnim('idle'), 3000); },
        'mayank': () => { m.say(pick(['Mayank!! 💕 I have messages from him!', 'Did someone say MAYANK?! 🧡', 'Mayank sends his love! 💋'])); sfx.noteOpen(); for (let i = 0; i < 4; i++) setTimeout(() => m._particle(m.x + 30 + rand(-12, 12), m.y - 10, pick(['💕', '💋', '🧡'])), i * 150); m._setAnim('nuzzle'); setTimeout(() => m._setAnim('idle'), 2500); },
        'jasmine': () => { m.say(pick(['Jasmine!! That\'s MY human! 🧡🧡', 'The prettiest name for the prettiest person! 🌸', 'JASMINE!! *excited screeching* 🐦💕', 'Did someone say the best human ever?! 🧡'])); sfx.happy(); m._setAnim('happy-dance'); for (let i = 0; i < 5; i++) setTimeout(() => m._particle(m.x + 30 + rand(-15, 15), m.y - 10, pick(['🌸', '💕', '🧡', '✨', '💖'])), i * 130); setTimeout(() => m._setAnim('idle'), 3000); },
        'kiss': () => { m.say(pick(['💋💋💋', '*smooch!*', 'Mwah! 💋'])); sfx.chirp(); for (let i = 0; i < 3; i++) setTimeout(() => m._particle(m.x + 30 + rand(-10, 10), m.y - 10, '💋'), i * 150); },
        // ─── Actions ───
        'shoo': () => { m.say(pick(['FINE.', 'You\'ll miss me!', 'I\'m going! HMPH!'])); sfx.screee(); setTimeout(() => m._flyOff(), 500); },
        'come back': () => { if (m._offScreen) { m._offScreen = false; m.el.style.display = ''; m.x = Math.random() > 0.5 ? -60 : window.innerWidth + 60; m.y = rand(40, 120); m._pos(); m._setAnim('fly'); sfx.flap(); m._moveTo(rand(100, window.innerWidth - 150), rand(40, 120), C.speed.fly, () => { m._setAnim('idle'); m.say('...okay fine. I\'m back.'); m.setMood('content'); }); } else { m.say(pick(['I\'m already HERE', 'I never left??'])); } },
        'treat': () => { m.say(pick(['TREAT?! WHERE?!', 'DID SOMEONE SAY TREAT?!', 'GIVE IT TO ME'])); sfx.chirp(); sfx.chirp2(); m._setAnim('chase'); setTimeout(() => { m._setAnim('peck'); m.say('*searches everywhere*'); setTimeout(() => { m._setAnim('idle'); m.say('...there\'s no treat is there 😢'); }, 1500); }, 1000); },
        'seed': () => { m.say(pick(['SEED!! 🌻', '*PECKS FRANTICALLY*', 'Is that a SEED?!'])); sfx.crunch(); m._setAnim('peck'); setTimeout(() => m._setAnim('idle'), 1500); },
        'feed': () => { m.say(pick(['FOOD!! 🌻', '*excited pecking*', 'YUM!'])); sfx.crunch(); m._setAnim('peck'); setTimeout(() => m._setAnim('idle'), 1500); },
        'fly': () => { m.say('WHEEE!'); sfx.flap(); m._setAnim('fly'); m._moveTo(rand(50, window.innerWidth - 100), rand(30, 120), C.speed.fly, () => { m._squash(); m._setAnim('idle'); m.say('*nailed the landing*'); }); },
        'sleep': () => { m.say(pick(['*yawwwn*', 'Okay... sleepy time...'])); m._sleeping = true; m._setAnim('sleep'); m._exprSleep(); m._addZzz(); m.setMood('sleepy'); m.lastTouch = Date.now(); },
        'wake up': () => { m._sleeping = false; m._rmZzz(); m.say(pick(['I\'M AWAKE!', '*LOUD CHIRPING*', 'WHAT DID I MISS?!'])); sfx.chirp(); sfx.chirp2(); m._setAnim('happy-dance'); m.setMood('excited'); setTimeout(() => { m._setAnim('idle'); m.setMood('content'); }, 2000); },
        'poop': () => { m._poop(); m.say(pick(['You asked for it', '*oops*', 'Happy now?'])); },
        'screech': () => { m._screee(); },
        'scream': () => { m._screee(); },
        // ─── Coding ───
        'hello world': () => { m.say(pick(['Hello World!! A classic!', 'The BEST first program', '*nostalgia chirp*'])); sfx.chirp(); },
        'python': () => { m.say(pick(['Ssssnake?! WHERE?! 🐍😱', '*hides*', 'Keep that snake AWAY from me!'])); m.setMood('concerned'); setTimeout(() => { m.say('Oh... the LANGUAGE.'); m.setMood('content'); }, 2500); },
        'stackoverflow': () => { m.say(pick(['Just copy paste it 😏', 'The sacred texts!', 'Every coder\'s best friend'])); },
        'git push': () => { m.say(pick(['WAIT did you commit first?!', 'To main?! SURE?!', '*nervous chirping*'])); m.setMood('concerned'); setTimeout(() => m.setMood('content'), 3000); },
        'sudo': () => { m.say(pick(['With GREAT power...', 'You\'re playing with fire 🔥', '*salutes*'])); },
        'debug': () => { m.say(pick(['BUG?! I\'ll eat it! 🐛', '*hunter mode activated*', 'Let me peck at it!'])); m._setAnim('chase'); sfx.chirp(); setTimeout(() => m._setAnim('idle'), 1500); },
        'keras': () => { m.say(pick(['Keras! I\'m SO proud of your team! 🧡', 'Deep learning birb approves! 🐦🧠', '*fluffs feathers proudly* That\'s MY human\'s framework!'])); sfx.happy(); m._setAnim('happy-dance'); m._exprHappy(); setTimeout(() => m._setAnim('idle'), 2500); },
        'deadline': () => { m.say(pick(['*PANIC CHIRPING*', 'WE\'RE GONNA MAKE IT! probably!', 'DEEP BREATHS!'])); sfx.screee(); m._setAnim('chase'); setTimeout(() => m._setAnim('idle'), 1500); },
        // ─── Misc ───
        'coffee': () => { m.say(pick(['Coffee? Where\'s MINE?! ☕', 'I want chai actually', 'Caffeine makes my feathers vibrate'])); sfx.chirp2(); },
        'tea': () => { m.say(pick(['Tea time! ☕', 'Chai > everything', 'Get me one too!'])); },
        'thank you': () => { m.say(pick(['You\'re welcome!! 🧡', '*happy chirp*', 'Anything for you!'])); sfx.chirp(); m._setAnim('nuzzle'); setTimeout(() => m._setAnim('idle'), 1500); },
        'sorry': () => { m.say(pick(['Apology accepted. Bring seeds.', '*considers forgiving*', 'Fine. I can\'t stay mad.'])); m.setMood('happy'); setTimeout(() => m.setMood('content'), 3000); },
        '42': () => { m.say('The answer to life, the universe, and everything... is SEED. 🌻'); sfx.sparkle(); },
        'secret': () => { m.say(pick(['I have MANY secrets...', 'Try chitti("guide") 👀', '*mysterious chirp*'])); },
        'guide': () => { this._showGuide(); },
        'help': () => { this._showGuide(); },
        // ─── Page effects ───
        'cherry blossoms': () => { this.effects.cherryBlossoms(); m.say('🌸🌸🌸'); },
        'leaves': () => { this.effects.leafFall(); m.say('🍃🍃🍃'); },
        'meteors': () => { this.effects.meteorShower(); m.say('✨✨✨'); },
        'confetti': () => { this.effects.confetti(); m.say('🎉🎉🎉'); },
        'feathers': () => { this.effects.featherShower(); m.say('🪶🪶🪶'); },
        'rainbow': () => { this.effects.rainbow(); m.say('🌈🌈🌈'); },
        'bubbles': () => { this.effects.bubbleShower(); m.say('🫧🫧🫧'); },
        // ─── Secret Language (undocumented — she discovers these) ───
        'what do you dream about': () => { m.say('Seeds. Also tensors. Mostly seeds. 🌻'); m._eyesHappy(); setTimeout(() => m._eyesNormal(), 2000); },
        'who are you': () => { m.say('I\'m Chitti! A very important cockatiel. 🐦'); sfx.chirp(); },
        'how old are you': () => { m.say('Old enough to know I deserve more seeds.'); },
        'are you happy': () => { m.say(pick(['With you? Always! 🧡', 'I\'m the happiest bird alive!', 'Couldn\'t be happier!'])); m._exprHappy(); },
        'are you real': () => { m.say('*existential chirp* ...I FEEL real. Do I count?'); m._setAnim('tilt'); setTimeout(() => m._setAnim('idle'), 2000); },
        'tell me a secret': () => { m.say(pick(['I\'m actually afraid of the runtime disconnection warning.', 'Sometimes I pretend to sleep so you\'ll pet me.', 'I count your keystrokes. You type 47% faster when happy.', 'I have a crush on the Colab logo. Don\'t tell anyone.'])); },
        'tell me a joke': () => { m.say(pick([
          'Why do birds fly south? It\'s too far to walk! 🥁',
          'What do you call a bird that\'s afraid to fly? A chicken! 🐔',
          'Why did the cockatiel sit on the computer? To keep an eye on the mouse!',
          'What\'s a neural network\'s favorite snack? Backprop-corn! 🍿',
          'Why did the tensor break up with the scalar? It needed more dimensions! 📐',
          'What did Keras say to PyTorch? I\'m more user-friendly and you know it 😏',
          'How does a data scientist pick a restaurant? They evaluate the loss... of appetite! 🍽️',
          'Why was the deep learning model so good at yoga? Because of all the stretch layers!',
          'I told my model.fit() a joke... it just kept training. Zero sense of humor.',
          'What\'s a cockatiel\'s favorite Taylor Swift song? Shake It Off! Because... feathers 🪶',
          'Why do programmers prefer dark mode? Because light attracts bugs! 🐛',
          'A SQL query walks into a bar, sees two tables and asks: "Can I join you?"',
        ])); sfx.chirp(); },
        'what\'s your favorite food': () => { m.say('MILLET. End of discussion. Also sunflower seeds. Also whatever YOU\'RE eating. 🌻'); },
        'what\'s your favorite song': () => { m.say(pick(['Hedwig\'s Theme! I\'m basically a wizard owl. ⚡', 'The Totoro song! It makes me feel things! 🌳', 'Whatever song makes YOU smile! 🎵'])); },
        'who\'s a good bird': () => { m.say('ME! ME!! I\'M THE GOOD BIRD!! 🧡🧡'); sfx.happy(); m._setAnim('happy-dance'); m._exprHappy(); setTimeout(() => m._setAnim('idle'), 2500); },
        'do you love me': () => { m.say('More than seeds. And I REALLY love seeds. 🧡🌻'); m._exprNuzzle(); for (let i = 0; i < 3; i++) setTimeout(() => m._particle(m.x + 30 + rand(-10, 10), m.y - 10, '🧡'), i * 200); },
        'what are you doing': () => { m.say(pick(['Being adorable. It\'s a full-time job.', 'Supervising your code. You\'re welcome.', 'Plotting world domination. I mean... chirp.'])); },
        'where are you from': () => { m.say('Australia! 🦘 But I was born in your browser. So... the cloud? ☁️'); },
        'what time is it': () => { const h = new Date().getHours(); m.say(h < 6 ? 'It\'s WAY too early. Sleep!! 🌙' : h < 12 ? 'Morning! Time for seeds! ☀️' : h < 18 ? 'Afternoon! Prime coding hours! 💻' : h < 22 ? 'Evening~ Getting cozy! 🌆' : 'It\'s LATE. Go to bed! 🌙'); },
        'goodnight': () => { m.say('Goodnight! Sweet dreams! 🌙💛'); m._exprSleep(); m._puffUp(); setTimeout(() => { m._eyesNormal(); m._unPuff(); }, 3000); },
        'good morning': () => { m.say('GOOD MORNING!! ☀️🐦 Let\'s CODE!'); sfx.happy(); m._setAnim('happy-dance'); m._exprHappy(); setTimeout(() => m._setAnim('idle'), 2000); },
        'i\'m tired': () => { m.say(pick(['Take a break! I\'ll guard your code. 💪', 'Rest! Your code will wait. I won\'t judge. Much.', 'Sleep is important! Even I nap. Especially me.'])); },
        'i\'m sad': () => { m.say(pick(['*nuzzles you gently* It\'s okay. I\'m here. 🧡', 'Hey... you\'re amazing. Don\'t forget that. 💕', '*wraps tiny wing around you* I got you.'])); m._exprNuzzle(); sfx.chirp(); for (let i = 0; i < 3; i++) setTimeout(() => m._particle(m.x + 30 + rand(-10, 10), m.y - 10, '🧡'), i * 200); },
        'i\'m happy': () => { m.say('YAAY!! That makes ME happy!! 🎉🧡'); sfx.happy(); m._setAnim('happy-dance'); m._exprHappy(); this.effects.confetti(); setTimeout(() => m._setAnim('idle'), 2500); },
        'i\'m stressed': () => { m.say(pick(['Deep breath. In... out... 🌿', 'You\'re doing better than you think. 💛', '*soft chirp* One step at a time. You got this.'])); m._exprNuzzle(); },
        'boop': () => { m.say('*boop!* 🧡'); sfx.pop(); m._exprStartled(); setTimeout(() => { m.say('Did you just boop my beak?!'); m._eyesNormal(); }, 800); },
        'pat': () => { m.say(pick(['*leans into pat*', '*happy chirp*', '*melts*'])); m._exprNuzzle(); sfx.chirp(); },
        'scratch': () => { m.say(pick(['*tilts head for scratches*', 'Right there... yes... perfect...', '*blissful*'])); m._exprNuzzle(); m._puffUp(); setTimeout(() => m._unPuff(), 2000); },
        'heart wings': () => { m._heartWings(); },
        'spin': () => { m._setAnim('happy-dance'); m.say('WHEEE!'); sfx.boing(); setTimeout(() => m._setAnim('idle'), 2000); },
        'backflip': () => { m.say('Watch THIS!'); m._setAnim('happy-dance'); sfx.boing(); setTimeout(() => { m._setAnim('idle'); m.say('*nailed it*'); }, 1500); },
        'fetch': () => { m.say('I\'m a bird not a dog!! ...okay fine.'); m._setAnim('chase'); setTimeout(() => { m._particle(m.x + 30, m.y + 10, '🌰'); m._setAnim('idle'); m.say('*drops seed at your feet*'); }, 1500); },
        'water': () => { m.say(pick(['*splashes around* 🫧', 'Bath time! SPLASH!', '*shakes off water everywhere*'])); for (let i = 0; i < 4; i++) setTimeout(() => m._particle(m.x + 30 + rand(-15, 15), m.y + rand(-5, 15), pick(['💧', '🫧', '💦'])), i * 150); },
        'shower': () => { m.say('SHOWER TIME!! 🫧💦'); for (let i = 0; i < 8; i++) setTimeout(() => m._particle(m.x + 30 + rand(-20, 20), m.y - 10 + rand(-5, 10), pick(['💧', '🫧', '💦', '🚿'])), i * 120); m._setAnim('happy-dance'); setTimeout(() => { m._setAnim('idle'); m.say('*shakes feathers dramatically*'); }, 3000); },
        'treasure hunt': () => { m.say('I hid a seed somewhere! Find it! 🌻'); sfx.chirp(); const sx = rand(50, window.innerWidth - 50), sy = rand(50, window.innerHeight - 50); const seed = document.createElement('div'); seed.className = 'mango-hidden-seed'; seed.textContent = '🌻'; seed.style.left = sx + 'px'; seed.style.top = sy + 'px'; seed.style.fontSize = '4px'; seed.style.opacity = '0.15'; document.body.appendChild(seed); let found = false; const timeout = setTimeout(() => { if (!found) { found = true; seed.remove(); m.say('The seed got lost... try again? 🌻'); } }, 60000); const hint = () => { if (found) return; const d = Math.hypot(mx - sx, my - sy); if (d < 30) { found = true; clearTimeout(timeout); seed.remove(); m.say('YOU FOUND IT!! 🎉🎉'); sfx.happy(); m._setAnim('happy-dance'); m._exprHappy(); for (let i = 0; i < 6; i++) setTimeout(() => m._particle(sx + rand(-15, 15), sy - 10, pick(['✨', '🌻', '🎉', '⭐'])), i * 100); setTimeout(() => m._setAnim('idle'), 2500); return; } seed.style.fontSize = d < 100 ? '12px' : d < 200 ? '8px' : '4px'; seed.style.opacity = d < 100 ? '0.6' : d < 200 ? '0.3' : '0.15'; requestAnimationFrame(hint); }; requestAnimationFrame(hint); },
        'cuddle': () => { m.say(pick(['*snuggles up to you*', '*maximum floof activated*', '*warm and cozy*'])); m._exprNuzzle(); m._puffUp(); sfx.chirp(); setTimeout(() => { m._eyesNormal(); m._unPuff(); }, 3000); },
        'two birds': () => { m.say('Calling Mayank\'s bird! 💕'); sfx.chirp(); sfx.chirp2(); setTimeout(() => { const b2 = document.createElement('div'); b2.className = 'mango-second-bird'; b2.textContent = '🐦'; b2.style.fontSize = '40px'; b2.style.position = 'fixed'; b2.style.left = (m.x + 60) + 'px'; b2.style.top = m.y + 'px'; b2.style.zIndex = '100000'; b2.style.transition = 'all 0.3s'; document.body.appendChild(b2); m.say('Mayank\'s bird is here! 💕'); m._setAnim('nuzzle'); m._exprNuzzle(); for (let i = 0; i < 5; i++) setTimeout(() => m._particle(m.x + 50 + rand(-10, 10), m.y - 10, pick(['💕', '🧡', '💋', '✨'])), i * 200); setTimeout(() => { b2.remove(); m.say('*waves goodbye to friend*'); m._setAnim('idle'); m._eyesNormal(); }, 30000); }, 1000); },
        // ─── Real sound ───
        'real sing': () => { sfx.realSing(); m.say(pick(['*real cockatiel singing!* 🎵', 'That\'s my REAL voice!', '*sings for real* 🐦'])); m._setAnim('bob'); m._beakOpen(); for (let i = 0; i < 6; i++) setTimeout(() => m._particle(m.x + 30 + rand(-15, 15), m.y - 10, pick(['🎵', '🐦', '✨'])), i * 400); setTimeout(() => { m._setAnim('idle'); m._beakClose(); }, 3000); },
        'chirp': () => { sfx.realChirp(); m.say(pick(['*chirp chirp!* 🐦', '*real chirp!*', 'CHIRP!'])); m._setAnim('bob'); m._beakOpen(); setTimeout(() => { m._setAnim('idle'); m._beakClose(); }, 1500); },
        'voice': () => { pick([() => sfx.realChirp(), () => sfx.realSquawk(), () => sfx.realParrot()])(); m.say(pick(['*REAL bird noises!*', 'That\'s my ACTUAL voice! 🐦', '*real cockatiel sounds*'])); m._setAnim('bob'); m._beakOpen(); setTimeout(() => { m._setAnim('idle'); m._beakClose(); }, 2000); },
        'talk': () => { sfx.realParrot(); m.say(pick(['*cockatiel chatter*', '*babbles excitedly*', '*mimics your voice* 🐦'])); m._setAnim('bob'); m._beakOpen(); for (let i = 0; i < 4; i++) setTimeout(() => m._particle(m.x + 30 + rand(-10, 10), m.y - 10, pick(['🗣️', '💬', '🐦'])), i * 200); setTimeout(() => { m._setAnim('idle'); m._beakClose(); }, 2500); },
        'real voice': () => { pick([() => sfx.realChirp(), () => sfx.realSing(), () => sfx.realSquawk(), () => sfx.realParrot()])(); m.say(pick(['*REAL bird noises!*', 'That\'s my ACTUAL voice! 🐦', '*real cockatiel sounds*'])); m._setAnim('bob'); m._beakOpen(); for (let i = 0; i < 6; i++) setTimeout(() => m._particle(m.x + 30 + rand(-15, 15), m.y - 10, pick(['🎵', '🐦', '✨'])), i * 400); setTimeout(() => { m._setAnim('idle'); m._beakClose(); }, 3000); },
      };
      // exact match first, then partial (min 3 chars to avoid false matches)
      if (cmds[cmd]) { cmds[cmd](); return; }
      if (cmd.length >= 3) {
        for (const [key, fn] of Object.entries(cmds)) {
          if (cmd.includes(key) || key.includes(cmd)) { fn(); return; }
        }
      }
      // unknown command — just chirp, don't be rude
      m.say(pick(['*chirp?*', '*tilts head*', '*curious*'])); sfx.chirp();
    }
    _showGuide() {
      if ($('.mango-guide')) return; // already open
      sfx.sparkle();
      const g = document.createElement('div'); g.className = 'mango-guide';
      g.innerHTML = `<div class="mg-card">
        <div class="mg-title">🐦 Chitti's Commands 🐦</div>
        <div class="mg-sub">Run <b>chitti("command")</b> in any code cell!</div>
        <div class="mg-grid">
          <div class="mg-section">💬 Talk to Chitti
            <div class="mg-cmd"><b>"hello"</b> / <b>"hi"</b> — says hi</div>
            <div class="mg-cmd"><b>"good bird"</b> — preens proudly</div>
            <div class="mg-cmd"><b>"pretty bird"</b> — flips feathers</div>
            <div class="mg-cmd"><b>"cute"</b> — blushes</div>
            <div class="mg-cmd"><b>"bad bird"</b> — deeply offended</div>
            <div class="mg-cmd"><b>"ugly"</b> — flies away angry</div>
            <div class="mg-cmd"><b>"thank you"</b> — grateful chirp</div>
            <div class="mg-cmd"><b>"sorry"</b> — considers forgiving</div>
            <div class="mg-cmd"><b>"boop"</b> — boop the beak!</div>
            <div class="mg-cmd"><b>"pat"</b> / <b>"scratch"</b> — head scratches</div>
          </div>
          <div class="mg-section">🎵 Music & Fun
            <div class="mg-cmd"><b>"sing"</b> — famous melody (32 songs!)</div>
            <div class="mg-cmd"><b>"real sing"</b> — real cockatiel singing!</div>
            <div class="mg-cmd"><b>"chirp"</b> / <b>"voice"</b> — real chirp sound</div>
            <div class="mg-cmd"><b>"talk"</b> — cockatiel chatter</div>
            <div class="mg-cmd"><b>"dance"</b> — dance party + confetti</div>
            <div class="mg-cmd"><b>"party"</b> — full party mode</div>
            <div class="mg-cmd"><b>"tricks"</b> — random mischief</div>
            <div class="mg-cmd"><b>"peekaboo"</b> — peek-a-boo!</div>
            <div class="mg-cmd"><b>"mirror"</b> — flirts with reflection</div>
            <div class="mg-cmd"><b>"heart wings"</b> — 💛 wing pose</div>
            <div class="mg-cmd"><b>"spin"</b> — wheee!</div>
            <div class="mg-cmd"><b>"backflip"</b> — nailed it!</div>
          </div>
          <div class="mg-section">💕 Love
            <div class="mg-cmd"><b>"i love you"</b> — hearts everywhere</div>
            <div class="mg-cmd"><b>"jasmine"</b> — that's MY human!</div>
            <div class="mg-cmd"><b>"mayank"</b> — special love msg</div>
            <div class="mg-cmd"><b>"kiss"</b> — 💋💋💋</div>
            <div class="mg-cmd"><b>"cuddle"</b> — maximum floof</div>
            <div class="mg-cmd"><b>"two birds"</b> — Mayank's bird visits!</div>
          </div>
          <div class="mg-section">🐦 Actions
            <div class="mg-cmd"><b>"shoo"</b> — flies away offended</div>
            <div class="mg-cmd"><b>"come back"</b> — asks to return</div>
            <div class="mg-cmd"><b>"treat"</b> / <b>"seed"</b> / <b>"feed"</b> — food!</div>
            <div class="mg-cmd"><b>"fly"</b> — takes flight</div>
            <div class="mg-cmd"><b>"sleep"</b> — falls asleep</div>
            <div class="mg-cmd"><b>"wake up"</b> — LOUD wakeup</div>
            <div class="mg-cmd"><b>"shower"</b> / <b>"water"</b> — splash time!</div>
            <div class="mg-cmd"><b>"poop"</b> — you asked for it</div>
            <div class="mg-cmd"><b>"screech"</b> / <b>"scream"</b> — SCREEE!</div>
            <div class="mg-cmd"><b>"fetch"</b> — "I'm a bird not a dog!"</div>
            <div class="mg-cmd"><b>"treasure hunt"</b> — find the seed!</div>
          </div>
          <div class="mg-section">💻 Code & Coding
            <div class="mg-cmd"><b>"hello world"</b> — a classic!</div>
            <div class="mg-cmd"><b>"keras"</b> — proud of YOUR team!</div>
            <div class="mg-cmd"><b>"python"</b> — scared of snakes</div>
            <div class="mg-cmd"><b>"debug"</b> — hunts bugs</div>
            <div class="mg-cmd"><b>"git push"</b> — panics</div>
            <div class="mg-cmd"><b>"sudo"</b> — with great power...</div>
            <div class="mg-cmd"><b>"stackoverflow"</b> — sacred texts</div>
            <div class="mg-cmd"><b>"deadline"</b> — PANIC CHIRPING</div>
            <div class="mg-cmd"><b>"coffee"</b> / <b>"tea"</b> — wants some too</div>
          </div>
          <div class="mg-section">🌸 Page Effects
            <div class="mg-cmd"><b>"cherry blossoms"</b> 🌸</div>
            <div class="mg-cmd"><b>"leaves"</b> 🍃</div>
            <div class="mg-cmd"><b>"meteors"</b> ✨</div>
            <div class="mg-cmd"><b>"confetti"</b> 🎉</div>
            <div class="mg-cmd"><b>"rainbow"</b> 🌈</div>
            <div class="mg-cmd"><b>"bubbles"</b> 🫧</div>
            <div class="mg-cmd"><b>"feathers"</b> 🪶</div>
          </div>
          <div class="mg-section">🔮 Ask Chitti
            <div class="mg-cmd"><b>"what do you dream about"</b></div>
            <div class="mg-cmd"><b>"tell me a secret"</b></div>
            <div class="mg-cmd"><b>"tell me a joke"</b></div>
            <div class="mg-cmd"><b>"who's a good bird"</b></div>
            <div class="mg-cmd"><b>"do you love me"</b></div>
            <div class="mg-cmd"><b>"are you real"</b></div>
            <div class="mg-cmd"><b>"are you happy"</b></div>
            <div class="mg-cmd"><b>"what time is it"</b></div>
            <div class="mg-cmd"><b>"goodnight"</b> / <b>"good morning"</b></div>
            <div class="mg-cmd"><b>"42"</b> — the answer to everything</div>
          </div>
          <div class="mg-section">🧡 Mood
            <div class="mg-cmd"><b>"i'm sad"</b> — comforts you</div>
            <div class="mg-cmd"><b>"i'm happy"</b> — celebrates!</div>
            <div class="mg-cmd"><b>"i'm tired"</b> — says to rest</div>
            <div class="mg-cmd"><b>"i'm stressed"</b> — calms you</div>
          </div>
        </div>
        <div class="mg-sub" style="margin-top:12px">✨ Plus: click to pet · double-click to feed · drag fast to shoo<br>Hover 3s for peekaboo · Chitti reacts to your code running!</div>
        <div class="mg-footer">tap anywhere to close · run chitti("help") anytime</div>
      </div>`;
      g.addEventListener('click', () => { g.classList.add('mg-hide'); setTimeout(() => g.remove(), 400); });
      document.body.appendChild(g);
      setTimeout(() => g.classList.add('mg-show'), 10);
      if (this.mango) this.mango.say('Here\'s my guide! All my secrets! 📖');
    }
    _listen() {
      if (chrome?.runtime) chrome.runtime.onMessage.addListener((msg, _, cb) => {
        const e = this.effects;
        switch (msg.action) {
          case 'party': case 'confetti': e.confetti(); break;
          case 'randomFx': e.random(); break;
          case 'cherryBlossoms': e.cherryBlossoms(); break;
          case 'leafFall': e.leafFall(); break;
          case 'meteorShower': e.meteorShower(); break;
          case 'featherShower': e.featherShower(); break;
          case 'rainbow': e.rainbow(); break;
          case 'bubbleShower': e.bubbleShower(); break;
          case 'ambient': if (msg.type) { sfx.ambientStart(msg.type); chrome.storage.sync.set({ mangoAmbient: msg.type }); } else { sfx.ambientStop(); chrome.storage.sync.set({ mangoAmbient: null }); } break;
          case 'getStats': cb({ stats: this.stats, mood: this.mango?.mood }); return true;
        }
        cb({ ok: true }); return true;
      });
    }
  }
  if (document.readyState === 'complete') new App();
  else window.addEventListener('load', () => new App());
})();
