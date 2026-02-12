/* ═══════════════════════════════════════════
   CHITTI — A Mischievous Cockatiel
   Songs, animations, eye tracking, love banners
   ═══════════════════════════════════════════ */
(function () {
  'use strict';
  const C = {
    speed: { walk: 1.2, run: 3, fly: 5 },
    tick: [2000, 5500], sleepAfter: 75000, speechMs: 3500, cursorDist: 125,
    vol: 0.09, poopChance: 0.03, giftChance: 0.06, flockChance: 0.03,
    mischief: 0.25, noteInterval: [150000, 280000], singChance: 0.25,
  };
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  let mx = -999, my = -999, mVx = 0, mVy = 0, pMx = -999, pMy = -999;
  document.addEventListener('mousemove', e => { mVx = e.clientX - pMx; mVy = e.clientY - pMy; pMx = mx; pMy = my; mx = e.clientX; my = e.clientY; });

  // ═══ SOUNDS ═══
  class Sfx {
    constructor() { this.ctx = null; this._amb = null; }
    _i() { if (!this.ctx) try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return false; } if (this.ctx.state === 'suspended') this.ctx.resume(); return true; }
    _t(type, f, d, v) { if (!this._i()) return; const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f[0], t); for (let i = 1; i < f.length; i++) o.frequency.exponentialRampToValueAtTime(f[i], t + d * i / f.length); g.gain.setValueAtTime(v || C.vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(t + d); }
    chirp() { this._t('sine', [1400, 2200, 1600], 0.18, 0.08); }
    chirp2() { this._t('sine', [1800, 2400, 1200], 0.22, 0.07); }
    chirp3() { this._t('sine', [1000, 1600, 1000], 0.15, 0.06); }
    happy() { [1000, 1200, 1400, 1600, 1800, 2000].forEach((n, i) => setTimeout(() => this._t('sine', [n, n * 1.15], 0.1, 0.06), i * 70)); }
    screee() { this._t('sawtooth', [2000, 3200], 0.28, 0.13); }
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
        [[800,0],[1000,130],[900,260],[1100,390],[1000,520],[1200,650],[1000,780]],
        [[600,0],[800,110],[1000,220],[1200,330],[1000,440],[800,550],[1000,660]],
        [[1000,0],[1200,100],[1400,200],[1200,300],[1000,400],[1200,500],[1400,600],[1600,700]],
      ]);
      m.forEach(([f, t]) => setTimeout(() => this._t('sine', [f, f * 1.05], 0.14, 0.06), t));
    }
    // ♪ Famous songs cockatiels love to whistle — slow, proper melodies ♪
    song() {
      const songs = [
        { name: 'Hedwig\'s Theme ⚡', notes: [ // Harry Potter
          [494,0],[659,400],[784,700],[740,1000],[659,1400],[988,1800],[880,2300],
          [740,3000],[659,3700],[784,4100],[740,4400],[622,4800],[698,5200],[494,5700]
        ]},
        { name: 'He\'s a Pirate 🏴‍☠️', notes: [ // Pirates of the Caribbean
          [587,0],[587,200],[587,400],[622,650],[698,850],
          [698,1200],[698,1400],[622,1650],[698,1850],[784,2050],
          [784,2400],[784,2600],[740,2850],[784,3050],[880,3250],
          [587,3650],[587,3850],[587,4050],[622,4300],[698,4500],
          [698,4850],[698,5050],[622,5300],[698,5500],[587,5700],
          [587,6100],[587,6400]
        ]},
        { name: 'Twinkle Twinkle ⭐', notes: [
          [523,0],[523,400],[784,800],[784,1200],[880,1600],[880,2000],[784,2500],
          [698,3000],[698,3400],[659,3800],[659,4200],[587,4600],[587,5000],[523,5500]
        ]},
        { name: 'Happy Birthday 🎂', notes: [
          [392,0],[392,250],[440,550],[392,900],[523,1250],[494,1650],
          [392,2200],[392,2450],[440,2750],[392,3100],[587,3450],[523,3850],
          [392,4400],[392,4650],[784,4950],[659,5350],[523,5700],[494,6050],[440,6400]
        ]},
        { name: 'Imperial March 🌑', notes: [ // Star Wars
          [392,0],[392,400],[392,800],[311,1150],[466,1400],[392,1800],[311,2150],[466,2400],[392,2800],
          [587,3400],[587,3800],[587,4200],[622,4550],[466,4800],[370,5200],[311,5550],[466,5800],[392,6200]
        ]},
        { name: 'My Neighbor Totoro 🌳', notes: [
          [659,0],[784,350],[880,700],[784,1050],[659,1400],[523,1750],
          [587,2200],[659,2550],[587,2900],[523,3250],[440,3600],
          [523,4100],[587,4450],[659,4800],[784,5150],[659,5500],[523,5850]
        ]},
        { name: 'My Heart Will Go On 💙', notes: [ // Titanic
          [659,0],[659,400],[659,800],[587,1100],[659,1400],
          [698,1800],[659,2200],[587,2550],[523,2900],
          [587,3400],[659,3800],[659,4200],[587,4500],[523,4800],
          [587,5200],[659,5600],[698,6000],[659,6400]
        ]},
        { name: 'Für Elise 🎹', notes: [ // Beethoven
          [659,0],[622,300],[659,600],[622,900],[659,1200],[494,1500],[587,1800],[523,2100],[440,2500],
          [262,3100],[330,3400],[440,3700],[494,4100],
          [330,4700],[416,5000],[494,5300],[523,5700]
        ]},
        { name: 'Can Can 💃', notes: [
          [659,0],[659,200],[698,450],[659,650],[698,900],[659,1100],[523,1350],
          [659,1600],[659,1800],[698,2050],[659,2250],[523,2500],
          [587,2750],[523,2950],[587,3200],[659,3450],[698,3700],
          [784,3950],[698,4200],[659,4500],[587,4800],[523,5100]
        ]},
        { name: 'Jingle Bells 🔔', notes: [
          [659,0],[659,350],[659,750],
          [659,1200],[659,1550],[659,1950],
          [659,2400],[784,2750],[523,3050],[587,3350],[659,3800],
          [698,4300],[698,4650],[698,4950],[698,5200],[659,5500],[659,5800],
          [659,6050],[587,6350],[587,6650],[659,6950],[587,7250],[784,7600]
        ]},
        { name: 'River Flows in You 🌊', notes: [ // Yiruma
          [440,0],[523,350],[659,700],[523,1050],[440,1400],
          [523,1850],[659,2200],[784,2550],[659,2900],
          [523,3350],[440,3700],[523,4050],[659,4400],
          [523,4750],[440,5100],[392,5450],[440,5800]
        ]},
        { name: 'Zelda\'s Lullaby 🧝', notes: [
          [494,0],[587,500],[440,1000],
          [494,1700],[587,2200],[440,2700],
          [494,3400],[587,3900],[880,4400],[784,4900],
          [587,5500],[523,6000],[440,6500]
        ]},
      ];
      const s = pick(songs);
      // play each note with proper sustain for a whistling cockatiel
      s.notes.forEach(([f, t]) => setTimeout(() => this._t('sine', [f, f * 1.02], 0.28, 0.07), t));
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
    ambientStop() { if (this._amb) { try { this._amb.src.stop(); } catch(e){} this._amb = null; } }
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
    // ✨ Encouraging
    'You\'re doing incredible work. Seriously. ✨',
    'That code is looking really good, you know that? 🌟',
    'Every line you write is bringing you closer to something amazing 💪',
    'Bugs are just puzzles, and you\'re great at puzzles 🧩',
    'Your persistence is genuinely inspiring 🔥',
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
    // 🎉 Playful
    'Plot twist: you\'re actually amazing 🎬',
    'Your code is *chef\'s kiss* today 👨‍🍳💋',
    'If your code were a dish, it\'d be a Michelin star ⭐',
    'Fun fact: you\'ve been awesome this entire time 🏆',
    'Breaking news: local genius writes incredible code 📰',
    // 🌙 Cozy
    'Whatever happens with this code, you are enough 🌈',
    'This notebook is lucky to have you working on it 📓',
    'The world is better because you\'re in it 🌍',
    'You deserve every good thing coming your way 🌸',
    'Somewhere right now, someone is really proud of you 💖',
  ];
  async function fetchNote() {
    try { const r = await chrome.runtime.sendMessage({ action: 'fetchNote' }); if (r?.note) return r.note; } catch (e) {}
    return pick(LOCAL_NOTES);
  }

  // ═══ COLAB DOM ═══
  const Lab = {
    cells() { for (const s of ['.cell.code','.code_cell','div.cell','[class*="cell"]']) { const c = $$(s); if (c.length) return c; } return []; },
    running() { for (const s of ['.cell.running','.running','[class*="running"]']) { const c = $(s); if (c) return c; } return null; },
    runBtn() { return $('button[aria-label="Run cell"]') || $('[class*="run"]'); },
    rect(el) { return el?.getBoundingClientRect(); },
    root() { return $('#main') || $('.notebook-container') || $('body'); },
  };

  // ═══ COCKATIEL SVG ═══
  const MANGO = `<svg viewBox="0 0 72 82" xmlns="http://www.w3.org/2000/svg">
<defs>
<radialGradient id="mb"><stop offset="0%" stop-color="#FFF5A0"/><stop offset="100%" stop-color="#F0D840"/></radialGradient>
<radialGradient id="mc"><stop offset="0%" stop-color="#FF8833" stop-opacity=".85"/><stop offset="100%" stop-color="#FF7722" stop-opacity="0"/></radialGradient>
<linearGradient id="mw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8D040"/><stop offset="100%" stop-color="#C8B030"/></linearGradient>
</defs>
<g class="m-tail"><path d="M26,60 Q18,74 14,84" stroke="#E0C830" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M30,61 Q24,74 20,86" stroke="#F0D840" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M34,61 Q30,72 28,82" stroke="#E0C830" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M38,60 Q36,70 36,78" stroke="#D8C028" stroke-width="2" fill="none" stroke-linecap="round"/></g>
<g class="m-body"><ellipse cx="36" cy="48" rx="18" ry="15" fill="url(#mb)"/><ellipse cx="36" cy="50" rx="12" ry="10" fill="#FFFAC0" opacity=".4"/></g>
<g class="m-wing-l"><path d="M18,40 Q8,44 10,56 Q12,62 20,54 L18,40" fill="url(#mw)"/><line x1="13" y1="48" x2="18" y2="46" stroke="#C8B030" stroke-width=".6" opacity=".5"/><line x1="12" y1="52" x2="19" y2="49" stroke="#C8B030" stroke-width=".6" opacity=".5"/><line x1="13" y1="56" x2="19" y2="52" stroke="#C8B030" stroke-width=".6" opacity=".4"/></g>
<g class="m-wing-r"><path d="M54,40 Q64,44 62,56 Q60,62 52,54 L54,40" fill="url(#mw)"/><line x1="59" y1="48" x2="54" y2="46" stroke="#C8B030" stroke-width=".6" opacity=".5"/><line x1="60" y1="52" x2="53" y2="49" stroke="#C8B030" stroke-width=".6" opacity=".5"/><line x1="59" y1="56" x2="53" y2="52" stroke="#C8B030" stroke-width=".6" opacity=".4"/></g>
<g class="m-feet"><path d="M27,62 L24,69 M27,62 L27,69 M27,62 L30,69" stroke="#CC9090" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M45,62 L42,69 M45,62 L45,69 M45,62 L48,69" stroke="#CC9090" stroke-width="1.8" fill="none" stroke-linecap="round"/></g>
<g class="m-head">
<circle cx="36" cy="26" r="16" fill="url(#mb)"/>
<g class="m-crest"><path d="M30,11 Q27,0 25,-6" stroke="#F5E860" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M34,10 Q33,0 32,-5" stroke="#F0D840" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M38,10 Q39,1 40,-4" stroke="#E8D040" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M42,12 Q44,3 47,-2" stroke="#E0C830" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>
<g class="m-eyes"><ellipse class="eye-l" cx="29" cy="24" rx="3.5" ry="4.2" fill="#1A0A00"/><ellipse class="eye-r" cx="43" cy="24" rx="3.5" ry="4.2" fill="#1A0A00"/><circle class="shine" cx="27.5" cy="22" r="1.6" fill="white"/><circle class="shine" cx="41.5" cy="22" r="1.6" fill="white"/><circle cx="30" cy="25.5" r=".8" fill="white" opacity=".4"/><circle cx="44" cy="25.5" r=".8" fill="white" opacity=".4"/></g>
<g class="m-beak"><path d="M33,31 Q36,28 39,31" fill="#888" stroke="#666" stroke-width=".6"/><path d="M34,31 Q36,34 38,31" fill="#999" stroke="#777" stroke-width=".4"/><circle cx="34.5" cy="30" r=".6" fill="#555"/></g>
<g class="m-cheeks"><circle cx="20" cy="29" r="6" fill="url(#mc)"/><circle cx="52" cy="29" r="6" fill="url(#mc)"/></g>
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
      this._build(); this._enter(); this._blinkLoop(); this._moodDecay(); this._eyeLoop();
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
      el.addEventListener('click', e => { if (!this._dragged) this._onPet(e); });
      el.addEventListener('dblclick', e => this._onFeed(e));
      el.addEventListener('pointerdown', e => this._dragStart(e));
      // Peekaboo: cursor on face for 3 seconds
      let peekTimer = null;
      el.addEventListener('mouseenter', () => {
        peekTimer = setTimeout(() => {
          if (!this._sleeping && !this._offScreen && !this._dragging) {
            this._setAnim('peek'); this.say(pick(['PEEKABOO! 👀', 'I SEE YOU!', 'Boo! 🙈', 'PEEKABOO!! Hehehe']));
            sfx.chirp(); sfx.happy();
            for (let i = 0; i < 4; i++) setTimeout(() => this._particle(this.x + 30 + rand(-12, 12), this.y - 10, pick(['👀', '🙈', '✨', '😄'])), i * 150);
            setTimeout(() => this._setAnim('idle'), 2000);
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
        if (t < 1) this._raf = requestAnimationFrame(step); else if (cb) cb();
      };
      this._raf = requestAnimationFrame(step);
    }
    _waddleTo(tx, ty, cb) { this._setAnim('walk'); this._moveTo(tx, ty, C.speed.walk, () => { this._setAnim('idle'); if (cb) cb(); }); }
    _walkRandom(cb) { this._waddleTo(rand(40, window.innerWidth - 100), rand(30, 160), cb); }
    _walkOff(cb) {
      const edge = Math.random() > 0.5 ? -80 : window.innerWidth + 80;
      this.dir = edge < 0 ? -1 : 1; this._face(); this._setAnim('walk');
      this._moveTo(edge, this.y, C.speed.walk, () => {
        this.x = edge < 0 ? window.innerWidth + 60 : -60; this.y = rand(40, 140);
        this.dir = this.x > window.innerWidth ? -1 : 1; this._face(); this._pos();
        this._setAnim('walk');
        this._moveTo(rand(100, window.innerWidth - 150), this.y, C.speed.walk, () => {
          this._setAnim('idle'); this.say(pick(['I\'m back!', '*reappears*', 'Miss me?'])); sfx.chirp2(); if (cb) cb();
        });
      });
    }
    _flyOff() {
      this._offScreen = true; this.say(pick(['HMPH!', '*offended!*', 'FINE!'])); sfx.screee();
      this._setAnim('fly'); sfx.flap();
      this._moveTo(this.dir > 0 ? window.innerWidth + 100 : -100, -80, C.speed.fly, () => {
        this.el.style.display = 'none';
        setTimeout(() => {
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
        if (idle > C.sleepAfter && !this._sleeping) {
          this._sleeping = true; this.setMood('sleepy'); this._setAnim('sleep');
          this.say(pick(['*tucks head*', 'zzz...', '*one foot up*'])); this._addZzz();
          this._next(tick, rand(8000, 15000)); return;
        }
        if (this._sleeping && idle < C.sleepAfter) { this._sleeping = false; this._rmZzz(); this.setMood('content'); this.say(pick(['*yawn*', '*stretches wings*'])); sfx.chirp(); }
        if (idle > C.sleepAfter * 1.5 && Math.random() < 0.2) { this._sleeping = false; this._rmZzz(); this._screee(); this._next(tick, 5000); return; }
        // cursor
        const r = this.el.getBoundingClientRect();
        const cd = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        if (cd < C.cursorDist && !this._sleeping) { this._cursorReact(cd); this._next(tick, rand(1200, 2500)); return; }
        // main roll
        const roll = Math.random();
        const cells = Lab.cells();
        if (roll < 0.20) { this._walkRandom(() => this._next(tick)); return; }
        else if (roll < 0.32 && cells.length) { this._goToCell(pick(cells), () => { this.say(pick(['*peeks at code*', '*reads along*', '*sits on code*', '*pecks at text*', '*studies intently*'])); this._next(tick, rand(3000, 7000)); }); return; }
        else if (roll < 0.32 + C.mischief) { this._mischief(); }
        else if (roll < 0.70) { this._sing(); this._next(tick, rand(6000, 12000)); return; }
        else if (roll < 0.78) { this._idleAction(); }
        else if (roll < 0.84) { this._walkOff(() => this._next(tick)); return; }
        else if (Math.random() < C.giftChance) { this._bringGift(); }
        else if (Math.random() < C.flockChance) { this.app.effects.flock(); this.say('*EXCITED CHIRPING!*'); sfx.chirp(); sfx.chirp2(); this.setMood('excited'); setTimeout(() => this.setMood('content'), 3000); }
        else if (Math.random() < 0.015) { this._rareBehavior(); }
        else if (Math.random() < 0.12) { this._exploreUI(); }
        else { this._setAnim('idle'); this.say(pick(['*chirp*', '*fluffs up*', '*looks around*'])); }
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
        // SINGING — happens frequently
        () => { this._sing(); },
        () => { this._sing(); },
        () => { sfx.chirp2(); this.say(pick(['*happy chirp chirp*', '*chatters excitedly*', 'CHIRP CHIRP CHIRP', '*beak grinding*'])); },
        () => { this._setAnim('bob'); this.say(pick(['*vibing SO hard*', '*dance dance*', 'I have the BEST moves', '*head bops*'])); sfx.chirp(); setTimeout(() => this._setAnim('idle'), 2000); },
      ];
      pick(acts)();
    }
    _sing() {
      this._setAnim('bob');
      if (Math.random() < 0.7) {
        // famous song!
        const s = sfx.song();
        this.say(`♪ ${s.name}~ ♪`);
        // find the longest note time to know song duration
        const dur = Math.max(...s.notes.map(n => n[1])) + 500;
        // emit music notes throughout the song
        const noteCount = Math.ceil(dur / 600);
        for (let i = 0; i < noteCount; i++) setTimeout(() => {
          if (!this._dead) this._particle(this.x + 30 + rand(-20, 20), this.y - 12, pick(['🎵', '🎶', '♪', '♫', '✨']));
        }, i * 600);
        setTimeout(() => this._setAnim('idle'), dur + 300);
      } else {
        sfx.whistle();
        this.say(pick(['♪ tweet tweet~ ♪', '♫ la la la~ ♫', '🎵 *whistles*', '♪ chirp chirp~ ♪']));
        for (let i = 0; i < 6; i++) setTimeout(() => this._particle(this.x + 30 + rand(-15, 15), this.y - 10, pick(['🎵', '🎶', '♪'])), i * 250);
        setTimeout(() => this._setAnim('idle'), 2000);
      }
    }

    // ─── Mischief ───
    _mischief() {
      pick([
        () => this._pushThingOff(),
        () => this._sitOnButton(),
        () => this._grabCursor(),
        () => this._typeGibberish(),
        () => this._peckAtText(),
        () => { if (Math.random() < C.poopChance * 2) this._poop(); else this._pushThingOff(); },
        () => { this._setAnim('fly'); sfx.flap(); this.say('*zoom!*'); this._moveTo(rand(50, window.innerWidth - 100), rand(30, 150), C.speed.run, () => { this._setAnim('idle'); this.say('Wheee!'); }); },
        () => { this._setAnim('screee'); this.say(pick(['LOOK AT ME!', '*ATTENTION!*', 'HEY!'])); sfx.chirp(); sfx.chirp2(); setTimeout(() => this._setAnim('idle'), 1500); },
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
    _screee() { this.setMood('annoyed'); this._setAnim('screee'); this.say(pick(['SCREEEEE!!', 'EXCUSE ME?!', 'HELLO?! I EXIST!', 'PAY ATTENTION TO ME!!', 'I AM BEING IGNORED AND I WILL NOT STAND FOR IT'])); sfx.screee(); for (let i = 0; i < 5; i++) setTimeout(() => this._particle(this.x + 30 + rand(-15, 15), this.y - 10, pick(['❗', '💢', '😤', '⚡', '🔥'])), i * 100); setTimeout(() => { this._setAnim('idle'); this.setMood('content'); this.say(pick(['...fine.', '*dramatic sigh*', 'Whatever.'])); }, 2500); }
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
        this.setMood('happy'); this._setAnim('nuzzle');
        this.say(pick(['*aggressive nuzzling*', 'LOVE ME!', '*headbutts cursor*', '🧡🧡🧡', '*so clingy*', 'You\'re MINE', '*purrs... wait birds don\'t purr*'])); sfx.chirp();
      } else {
        this.setMood('curious'); this._setAnim('tilt');
        this.say(pick(['*tilts head*', 'Ooh? What\'s that?', '*STARES*', 'Come closer...', '*suspicious bird noises*', 'Is that... a treat?!'])); sfx.chirp3();
      }
      setTimeout(() => { this._setAnim('idle'); if (this.mood !== 'annoyed') this.setMood('content'); }, 1500);
    }

    // ─── Code reactions ───
    onCodeOk(cell) {
      this.setMood('excited'); this._setAnim('happy-dance');
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
      this.setMood('concerned'); this._setAnim('sad');
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
        () => this.say(pick(['*reads a tiny book*', '*studies with you*', '*takes notes*'])),
        () => { this.say(pick(['Still going!', 'Stretch?', 'Water break?', 'Snack time?'])); sfx.chirp2(); },
        () => { this._setAnim('preen'); this.say('*preens*'); setTimeout(() => this._setAnim('idle'), 2000); },
        () => { this._sing(); },
        () => { this._setAnim('tilt'); this.say(pick(['*stargazes*', '*watches clouds*', '*daydreams*'])); setTimeout(() => this._setAnim('idle'), 1500); },
      ])();
      this._trainTmr = setTimeout(() => this._trainActs(), rand(8000, 18000));
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
          // restart behavior loop after a pause (the old loop dies when drag cancels RAF mid-movement)
          setTimeout(() => this._startLoop(), rand(2000, 4000));
        }
        setTimeout(() => { this._dragged = false; }, 50);
      };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    }
    _onPet(e) {
      e.stopPropagation(); this.petCount++; this.lastTouch = Date.now();
      this._sleeping = false; this._rmZzz(); this.setMood('happy'); sfx.chirp();
      for (let i = 0; i < 4; i++) setTimeout(() => this._particle(e.clientX + rand(-12, 12), e.clientY - 10, pick(['❤️', '💕', '✨', '🧡', '💖'])), i * 80);
      this._setAnim('nuzzle');
      if ([10, 25, 50, 100].includes(this.petCount)) this.say(`${this.petCount} pets!! I love you!!`);
      else this.say(pick(['*happy chirp*', '*closes eyes*', '*nuzzles*', '*leans into it*', '🧡', '*head scratches!*']));
      setTimeout(() => { this._setAnim('idle'); this.setMood('content'); }, 1500);
    }
    _onFeed(e) {
      e.stopPropagation(); this.lastTouch = Date.now(); this.setMood('excited');
      const seed = pick(['🌰', '🌻', '🍎', '🫐', '🥜', '🍇']);
      const t = document.createElement('div'); t.className = 'mango-treat'; t.textContent = seed;
      t.style.left = e.clientX + 'px'; t.style.top = e.clientY + 'px';
      document.body.appendChild(t); setTimeout(() => t.remove(), 600);
      sfx.crunch(); this._setAnim('peck');
      this.say(pick([`Yum! ${seed}`, '*CRUNCH*', '*happy munch*', 'MORE!', '*excited eating*']));
      setTimeout(() => { this._setAnim('idle'); this.setMood('content'); }, 1200);
    }

    // ─── Rare behaviors (1-2% chance, discovered over weeks) ───
    _rareBehavior() {
      const rare = [
        () => { this._setAnim('happy-dance'); this.say('*does a HANDSTAND*'); sfx.boing(); for (let i = 0; i < 5; i++) setTimeout(() => this._particle(this.x + 30 + rand(-10, 10), this.y - 10, '⭐'), i * 150); setTimeout(() => { this._setAnim('idle'); this.say('Ta-daaa!!'); }, 2000); },
        () => { this.say('*falls off edge*'); this._setAnim('fly'); sfx.screee(); this._moveTo(this.x, window.innerHeight + 50, C.speed.fly, () => { setTimeout(() => { this.y = -50; this._pos(); this._setAnim('fly'); sfx.flap(); this._moveTo(rand(100, window.innerWidth - 100), rand(40, 120), C.speed.walk, () => { this._setAnim('idle'); this.say(pick(['...that never happened', '*brushes self off*', 'I MEANT to do that'])); }); }, 1500); }); },
        () => { this.say('*pretends to be a statue*'); this._setAnim('idle'); this.el.style.filter = 'grayscale(1) brightness(1.2)'; setTimeout(() => { this.el.style.filter = ''; this.say(pick(['...did you buy it?', 'ART.', '*breaks character*'])); sfx.chirp(); }, 4000); },
        () => { this._setAnim('bob'); this.say('*MOONWALKS*'); const startX = this.x; this.dir *= -1; this._face(); this._moveTo(this.x - this.dir * 120, this.y, 0.8, () => { this._setAnim('idle'); this.say('Smooth, right?'); sfx.chirp2(); }); },
        () => { this.say('*tries to type code*'); this._setAnim('peck'); sfx.chirp(); setTimeout(() => { this.say('print("I am a genius bird")'); sfx.crunch(); setTimeout(() => { this._setAnim('idle'); this.say('Hire me.'); }, 1500); }, 1500); },
        () => { this._setAnim('tilt'); this.say('*existential crisis*'); setTimeout(() => { this.say('...am I just pixels?'); setTimeout(() => { this.say('Nah I\'m too cute for that'); sfx.chirp(); this._setAnim('idle'); }, 2000); }, 2000); },
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
      if (this._sleeping) { this._sleeping = false; this._rmZzz(); }
      this.setMood('excited'); this._setAnim('happy-dance'); sfx.happy(); sfx.chirp();
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
      if (h >= 23 || h < 5) this.say(pick(['*yawns*', 'It\'s late...', 'Sleep soon?', '🌙']));
      else if (h >= 6 && h < 9) { this.say(pick(['Good morning! ☀️', 'Ready to code?', '*morning chirp!*'])); sfx.chirp(); }
      else if (h >= 12 && h < 13) this.say(pick(['Lunch time?', 'Feed me too!', '🍽️']));
    }
    nightCheck() {
      const h = new Date().getHours();
      if ((h >= 23 || h < 5) && !this._sleeping && Math.random() < 0.3) {
        this._sleeping = true; this.setMood('sleepy'); this._setAnim('sleep'); this._addZzz();
        this.say(pick(['*sleepy chirp*', 'zzz...']));
        setTimeout(() => { if (this._sleeping) this.say(pick(['*opens one eye*', 'still coding...?', '🌙'])); }, 30000);
      }
    }
    // ─── Messages from Mayank (delivered via banner, like a messenger bird) ───
    _deliverMayankMsg(msg, intensity) {
      this.setMood('happy'); this._setAnim('nuzzle'); sfx.noteOpen();
      // show as bird-held banner (the bird is delivering a message)
      const banner = document.createElement('div'); banner.className = 'mango-love-banner';
      banner.innerHTML = `<div class="mlb-card"><div class="mlb-ribbon">${intensity === 'night' ? '💋' : '💕'}</div><div class="mlb-msg">${msg}</div></div>`;
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

    // ─── Display ───
    setMood(m) { this.mood = m; this.el.className = this.el.className.replace(/mood-\w+/g, '') + ` mood-${m}`; }
    _setAnim(a) { this.el.className = this.el.className.replace(/\b(idle|walk|fly|sleep|bob|preen|tilt|peck|nuzzle|chase|screee|happy-dance|sad|wing-stretch|scratch|peek)\b/g, '').trim() + ` ${a}`; if (this.dir === -1) this.el.classList.add('facing-left'); }
    _face() { this.el?.classList.toggle('facing-left', this.dir === -1); }
    _pos() { this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px'; }
    say(text) { this.bubble.textContent = text; this.bubble.classList.add('show'); clearTimeout(this._sayT); this._sayT = setTimeout(() => this.bubble.classList.remove('show'), C.speechMs); }
    _particle(x, y, e) { const p = document.createElement('div'); p.className = 'mango-particle'; p.textContent = e; p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.fontSize = rand(14, 24) + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 1200); }
    _addZzz() { for (let i = 0; i < 3; i++) { const z = document.createElement('div'); z.className = 'mango-zzz'; z.textContent = 'z'; this.el.appendChild(z); } }
    _rmZzz() { this.el.querySelectorAll('.mango-zzz').forEach(z => z.remove()); }
    _blinkLoop() {
      const go = () => { if (this._dead || this._sleeping) { this._blkT = setTimeout(go, 3000); return; }
        this.eyes.forEach(e => { const a = e.tagName === 'ellipse' ? 'ry' : 'r'; e.dataset.o = e.dataset.o || e.getAttribute(a); e.setAttribute(a, '0.5'); });
        this.shines.forEach(s => s.style.opacity = '0');
        setTimeout(() => { this.eyes.forEach(e => { const a = e.tagName === 'ellipse' ? 'ry' : 'r'; e.setAttribute(a, e.dataset.o); }); this.shines.forEach(s => s.style.opacity = '1'); }, 110);
        this._blkT = setTimeout(go, rand(2200, 5000));
      }; this._blkT = setTimeout(go, rand(800, 2500));
    }
    _moodDecay() { this._mdI = setInterval(() => { if (this.mood === 'happy' || this.mood === 'excited') this.setMood('content'); }, 12000); }
    destroy() { this._dead = true; clearTimeout(this._tmr); clearTimeout(this._sayT); clearTimeout(this._blkT); clearInterval(this._mdI); clearTimeout(this._trainTmr); cancelAnimationFrame(this._raf); this.el.remove(); }
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
        const anim = now => { const t = (now - t0) / dur; if (t >= 1) { b.remove(); return; }
          b.style.left = (sx + (ex - sx) * t) + 'px';
          b.style.top = (sy + (midY - sy) * Math.sin(t * Math.PI) + Math.sin(t * Math.PI * 5) * 5) + 'px';
          requestAnimationFrame(anim); }; requestAnimationFrame(anim);
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
    constructor() { document.addEventListener('keydown', () => {
      const el = document.activeElement;
      if (el && (el.closest?.('.cell') || el.closest?.('[class*="editor"]') || el.tagName === 'TEXTAREA')) this._spark();
    }); }
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
      this.sparkles = new Sparkles(); this.stats = { cells: 0, errors: 0, session: Date.now() };
      this._trainCell = null; this._trainStart = 0; this._init();
    }
    async _init() {
      this.mango = new Chitti(this);
      this._watchCode(); this._listen(); this._noteLoop(); this._timeLoop();
      try { const r = await chrome.storage.sync.get(['mangoAmbient']); if (r.mangoAmbient) sfx.ambientStart(r.mangoAmbient); } catch(e){}
      const btn = document.createElement('button'); btn.id = 'mango-fx-btn';
      btn.innerHTML = '🪶<span class="mfx-label">Random magic!</span>';
      btn.addEventListener('click', () => {
        this.effects.random();
        if (this.mango) {
          // Chitti also does a random trick
          const tricks = [
            () => { this.mango._sing(); },
            () => { this.mango._screee(); },
            () => { this.mango._pushThingOff(); },
            () => { this.mango._setAnim('happy-dance'); this.mango.say('WOOHOO! PARTY!'); sfx.party(); setTimeout(() => this.mango._setAnim('idle'), 2500); },
            () => { this.mango._bringGift(); },
            () => { this.mango._grabCursor(); },
            () => { this.mango._setAnim('fly'); sfx.flap(); this.mango.say('*ZOOM!*'); this.mango._moveTo(rand(50, window.innerWidth - 100), rand(30, 150), C.speed.run, () => { this.mango._setAnim('happy-dance'); sfx.happy(); setTimeout(() => this.mango._setAnim('idle'), 1500); }); },
            () => { this.mango._poop(); this.mango.say('*oops*'); },
          ];
          pick(tricks)();
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
      ];
      // Daytime messages (rare, gentle)
      const DAY_MSGS = [
        'Mayank says: have a great day, beautiful 💕', 'Mayank says: don\'t forget to eat lunch! 🍕',
        'Mayank says: just checking in — I love you 💕', 'Mayank says: you\'re doing amazing today ✨',
        'Mayank says: sending you energy for your code! 💪', 'Mayank says: thinking of you 💭🧡',
      ];

      const go = () => {
        if (!this.mango || this.mango._sleeping || this.mango._offScreen) {
          setTimeout(go, 60000); return;
        }
        const h = new Date().getHours();

        if (h >= 22 || h < 5) {
          // LATE NIGHT — messenger bird (every 5-10 min)
          this.mango._deliverMayankMsg(pick(NIGHT_MSGS), 'night');
          setTimeout(go, rand(300000, 600000));
        } else if (h >= 18) {
          // EVENING — (every 8-15 min)
          this.mango._deliverMayankMsg(pick(NIGHT_MSGS), 'night');
          setTimeout(go, rand(480000, 900000));
        } else if (h >= 11 && h < 13) {
          // BEFORE/DURING LUNCH — maybe one message
          if (Math.random() < 0.35) {
            this.mango._deliverMayankMsg(pick(DAY_MSGS), 'day');
          }
          setTimeout(go, rand(1200000, 2400000)); // 20-40 min
        } else if (h >= 13 && h < 18) {
          // AFTERNOON — rare
          if (Math.random() < 0.2) {
            this.mango._deliverMayankMsg(pick(DAY_MSGS), 'day');
          }
          setTimeout(go, rand(1800000, 3600000)); // 30-60 min
        } else {
          // MORNING (6am-11am) — no Mayank messages, let her focus
          // Chitti might share a diary thought instead
          if (Math.random() < 0.3) this.mango._diaryThought();
          setTimeout(go, rand(1200000, 2400000)); // 20-40 min
        }
      };
      // first message: evening = quick (1-2 min), day = slower (5-10 min)
      const h = new Date().getHours();
      const firstDelay = (h >= 18 || h < 5) ? rand(60000, 120000) : rand(300000, 600000);
      setTimeout(go, firstDelay);
    }
    _watchCode() {
      const obs = new MutationObserver(muts => {
        for (const m of muts) for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue;
          const txt = n.textContent || '';
          const isErr = n.classList?.contains('error') || n.querySelector?.('.traceback,.stderr') || txt.includes('Traceback') || txt.includes('Error:');
          const isOut = n.classList?.contains('output') || n.querySelector?.('.output_area,.output_subarea');
          const cell = n.closest?.('.cell') || n.closest?.('.code_cell') || n.parentElement;
          if (isErr) { this.stats.errors++; if (this.mango) this.mango.onCodeErr(cell); }
          else if (isOut && Math.random() > 0.3) { if (this.mango) this.mango.onCodeOk(cell); }
        }
      });
      const tgt = Lab.root(); if (tgt) obs.observe(tgt, { childList: true, subtree: true });
      const runObs = new MutationObserver(() => {
        const running = Lab.running();
        if (running && !this._trainCell) {
          this._trainCell = running; this._trainStart = Date.now(); this.stats.cells++;
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
      banner.innerHTML = `<div class="mlb-card"><div class="mlb-ribbon">💌</div><div class="mlb-msg">${note}</div></div>`;
      banner.addEventListener('click', () => { banner.classList.add('mlb-hide'); setTimeout(() => banner.remove(), 500); });
      m.el.appendChild(banner);
      setTimeout(() => banner.classList.add('mlb-show'), 10);
      for (let i = 0; i < 5; i++) setTimeout(() => m._particle(m.x + 30 + rand(-15, 15), m.y - 10, pick(['💕', '💝', '🧡', '✨', '💌'])), i * 150);
      // auto-hide
      setTimeout(() => { banner.classList.remove('mlb-show'); banner.classList.add('mlb-hide'); setTimeout(() => banner.remove(), 500); m.setMood('content'); }, 10000);
    }
    _timeLoop() { setInterval(() => { if (this.mango) this.mango.nightCheck(); }, 300000); }
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
