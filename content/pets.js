/* ============================================
   COLAB PETS v4 - Cute Image Pets
   Fluent Emoji images, sounds, diverse tricks,
   drag-and-drop, walk in/out, love messages
   ============================================ */
(function () {
  'use strict';

  // ─── CONFIG ─────────────────────────────────
  const C = {
    speed: { min: 0.5, max: 1.5 },
    tick: { min: 1200, max: 4500 },
    sleepAfter: 50000,
    speechMs: 3200,
    flyEvery: { min: 12000, max: 30000 },
    loveEvery: { min: 20000, max: 55000 },
    cursorDist: 140,
    petSize: 60,
    startY: 38,
    soundVol: 0.12,
  };

  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const imgURL = f => chrome.runtime.getURL('images/' + f);

  let mx = -999, my = -999;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  // ─── SOUND ENGINE (Web Audio API) ──────────
  class SoundEngine {
    constructor() { this.ctx = null; }
    _init() {
      if (!this.ctx) {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { return false; }
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    _tone(type, freqs, dur, vol) {
      if (!this._init()) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freqs[0], t);
      for (let i = 1; i < freqs.length; i++)
        o.frequency.exponentialRampToValueAtTime(freqs[i], t + dur * i / freqs.length);
      g.gain.setValueAtTime(vol || C.soundVol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(t + dur);
    }
    meow() { this._tone('sine', [700, 500, 800], 0.35, 0.1); }
    purr() { for (let i = 0; i < 5; i++) setTimeout(() => this._tone('sine', [55, 50], 0.12, 0.05), i * 100); }
    bark() { this._tone('sawtooth', [300, 200], 0.12, 0.08); setTimeout(() => this._tone('sawtooth', [350, 250], 0.1, 0.07), 140); }
    chirp() { this._tone('sine', [1200, 2000, 1400], 0.22, 0.07); }
    sing() { [800, 1000, 900, 1100, 850, 1200].forEach((n, i) => setTimeout(() => this._tone('sine', [n, n * 1.1], 0.13, 0.05), i * 160)); }
    squeak() { this._tone('sine', [2000, 1500], 0.1, 0.06); }
    thump() { this._tone('sine', [80, 40], 0.18, 0.12); }
    quack() { this._tone('sawtooth', [400, 250], 0.13, 0.07); }
    chitter() { for (let i = 0; i < 3; i++) setTimeout(() => this._tone('sine', [1500, 1200], 0.07, 0.05), i * 80); }
    ribbit() { this._tone('sine', [200, 150], 0.18, 0.09); setTimeout(() => this._tone('sine', [180, 130], 0.22, 0.09), 230); }
    pop() { this._tone('sine', [600, 1200], 0.04, 0.07); }
    sparkle() { this._tone('sine', [2500, 3500, 2000], 0.18, 0.04); }
    boing() { this._tone('sine', [200, 600, 300], 0.13, 0.07); }
    kiss() { this._tone('sine', [1000, 2500], 0.07, 0.05); }
    party() { [500, 600, 700, 800, 900, 1000].forEach((n, i) => setTimeout(() => this._tone('sine', [n, n * 1.2], 0.08, 0.04), i * 70)); }
    whee() { this._tone('sine', [400, 800, 1200, 800], 0.3, 0.06); }
  }
  const sfx = new SoundEngine();

  // ─── LOVE & ENCOURAGEMENT ───────────────────
  const LOVE = [
    'Someone special loves you!', 'Someone is thinking of you~', 'Someone says you\'re amazing!',
    'Someone misses you right now', 'Someone is so proud of you!',
    'Someone thinks you\'re the cutest', 'You make someone so happy!',
    'Someone believes in you!', 'Someone says: take a break?',
    'Someone says: drink some water!', 'Someone is sending a hug!',
    'Someone says you\'re doing great!', 'You\'re someone\'s favorite person!',
    'Someone would give you head pats rn', 'Someone is lucky to have you!',
    'You are so loved!', 'Someone\'s heart beats for you~', 'You\'re someone\'s whole world!',
  ];
  const CHEER = [
    'You\'re doing amazing!', 'Keep going, you got this!', 'You\'re so smart!',
    'That code looks great!', 'You\'re a coding queen!',
    'Take a deep breath~', 'Remember to stretch!', 'You\'re unstoppable!',
    'Proud of you!', 'Hydration check!', 'You make the world better!',
    'Snack break soon?', 'You\'re literally the best',
    'Don\'t be too hard on yourself~', 'Every bug makes you stronger!',
    'Your brain is amazing!', 'You\'ve got magic in your fingers!',
  ];

  // ─── ANIMALS ────────────────────────────────
  const ANIMALS = {
    cat: {
      name: 'Whiskers', emoji: '🐱', img: 'cat.png', sound: 'meow',
      sounds: ['Mew~', 'Purrrr', 'Mrow?', 'Nyaa~', '*purrs*', '*stretches*', 'Prrrt!', '*slow blink*'],
      happy: ['PURRRR!!', 'Mew mew!', '*kneading*', '=^.^=', '*slow blink of love*'],
      sad: ['Mew...', '*hisses at bug*', '>.<', '*knocks error off table*'],
      sleep: ['zzz...', '*curls up*', '*ear twitch*'],
      treats: ['🐟', '🥛', '🧶'], paw: '🐾',
      tricks: ['clean', 'knock', 'stalk', 'loaf', 'wiggle', 'chase-tail', 'peek', 'dance'],
    },
    dog: {
      name: 'Biscuit', emoji: '🐶', img: 'dog.png', sound: 'bark',
      sounds: ['Woof!', 'Arf!', '*tail wag*', 'Bork!', '*pant pant*', '*tilts head*', 'Yip!'],
      happy: ['WOOF WOOF!!', '*ZOOMIES!!*', '*tail helicopter*', '*brings ball*', 'SO HAPPY!'],
      sad: ['Whimper...', '*puppy eyes*', 'Awoo...', '*lies down sadly*'],
      sleep: ['*woof...zzz*', '*leg twitch*', '*dream bork*'],
      treats: ['🦴', '🥩', '🎾'], paw: '🐾',
      tricks: ['zoomies', 'roll', 'fetch', 'wiggle', 'hop', 'dance', 'spin', 'play-dead', 'wave'],
    },
    bird: {
      name: 'Peep', emoji: '🐦', img: 'bird.png', flyImg: 'bird-fly.png', canFly: true, sound: 'chirp',
      sounds: ['Tweet!', 'Chirp!', '*flutters*', 'Pip pip!', '*head tilt*', 'Tweee~'],
      happy: ['TWEET TWEET!!', '*happy flutter*', '*sings melody*', 'LA LA LA~'],
      sad: ['...peep', '*ruffles feathers*', '*sad chirp*'],
      sleep: ['*tucks beak*', '*puffs up*', 'pip...zzz'],
      treats: ['🌻', '🍎', '🫐'], paw: '·',
      tricks: ['sing', 'fly', 'tilt', 'wiggle', 'dance', 'peek', 'hop'],
    },
    bunny: {
      name: 'Mochi', emoji: '🐰', img: 'bunny.png', sound: 'thump',
      sounds: ['*nose wiggle*', '*thump*', '*binky!*', '*munch*', '*hops*', '*flops*'],
      happy: ['*BINKY!!*', '*zoom hop*', '*flops happily*', '*popcorns*'],
      sad: ['*thumps foot*', '...', '*hides*', '*flat bunny*'],
      sleep: ['*loaf mode*', '*flops sideways*', '...zzz'],
      treats: ['🥕', '🍌', '🌿'], paw: '·',
      tricks: ['hop', 'wiggle', 'roll', 'tilt', 'peek', 'dance', 'backflip'],
    },
    hamster: {
      name: 'Nugget', emoji: '🐹', img: 'hamster.png', sound: 'squeak',
      sounds: ['Squeak!', '*stuffs cheeks*', '*wheel sounds*', '*nibble*', '*waddles*'],
      happy: ['SQUEAK!!', '*runs on wheel*', '*happy nibbles*', '*chubby dance*'],
      sad: ['*hides in bedding*', 'squeak...', '*tiny yawn*'],
      sleep: ['*curls into ball*', '*tiny snore*', 'zzz...'],
      treats: ['🌻', '🥜', '🧀'], paw: '·',
      tricks: ['wiggle', 'roll', 'hop', 'spin', 'dance', 'peek'],
    },
    duck: {
      name: 'Quackers', emoji: '🦆', img: 'duck.png', sound: 'quack',
      sounds: ['Quack!', '*waddle waddle*', 'Quack quack!', '*splash*', '*preens*'],
      happy: ['QUACK QUACK!!', '*happy waddle*', '*splashes everywhere*', '*flaps wings*'],
      sad: ['quack...', '*sad paddle*', '*droopy feathers*'],
      sleep: ['*tucks bill*', '*floats asleep*', 'zzz...'],
      treats: ['🍞', '🌾', '🐛'], paw: '·',
      tricks: ['wiggle', 'hop', 'sing', 'roll', 'dance', 'spin', 'wave'],
    },
    redpanda: {
      name: 'Maple', emoji: '🦝', img: 'redpanda.png', sound: 'chitter',
      sounds: ['*chitters*', '*fluffy tail swish*', '*curious sniff*', '*rolls*', '*stretches*'],
      happy: ['*HAPPY CHITTERS*', '*rolls around*', '*tail poof!*', '*so fluffy!*'],
      sad: ['*sad chitter*', '*hides face*', '*curls up tight*'],
      sleep: ['*curls in tail*', '*cozy ball*', 'zzz...'],
      treats: ['🎋', '🍇', '🍎'], paw: '🐾',
      tricks: ['roll', 'wiggle', 'hop', 'clean', 'dance', 'peek', 'spin'],
    },
    frog: {
      name: 'Ribbert', emoji: '🐸', img: 'frog.png', sound: 'ribbit',
      sounds: ['Ribbit!', '*hops*', 'Croak!', '*boing*', '*catches fly*', '*sits on lilypad*'],
      happy: ['RIBBIT RIBBIT!!', '*BIG HOP*', '*catches bug!*', '*happy croak*'],
      sad: ['ribbit...', '*sad croak*', '*sits in rain*'],
      sleep: ['*sits still*', '*blinks slowly*', 'rrr...zzz'],
      treats: ['🪰', '🦟', '🪲'], paw: '·',
      tricks: ['hop', 'wiggle', 'tilt', 'roll', 'backflip', 'dance', 'spin'],
    },
  };

  // ─── PET CLASS ──────────────────────────────
  class Pet {
    constructor(type, ctrl) {
      this.type = type; this.d = ANIMALS[type]; this.ctrl = ctrl;
      this.x = -70; this.y = C.startY;
      this.dir = 1; this.speed = rand(C.speed.min, C.speed.max);
      this.state = 'idle'; this.mood = 85; this.pets = 0;
      this.lastTouch = Date.now(); this.name = this.d.name;
      this._dead = false; this._isDragging = false; this._dragged = false;
      this._build();
      this._enterFromEdge();
      this._moodDecay();
    }

    _build() {
      const el = this.el = document.createElement('div');
      el.className = 'colab-pet idle';
      const imgSrc = imgURL(this.d.img);
      el.innerHTML = `<div class="pet-bubble"></div><div class="pet-body"><img src="${imgSrc}" alt="${this.name}" draggable="false"/></div><div class="pet-tag">${this.name}</div>`;
      el.style.left = this.x + 'px'; el.style.top = this.y + 'px';
      this.ctrl.layer.appendChild(el);
      this.bubble = el.querySelector('.pet-bubble');
      el.addEventListener('click', e => { if (!this._dragged) this._pet(e); });
      el.addEventListener('dblclick', e => this._feed(e));
      el.addEventListener('pointerdown', e => this._dragStart(e));
    }

    _enterFromEdge() {
      const left = Math.random() > 0.5;
      this.x = left ? -70 : window.innerWidth + 10;
      this.y = rand(30, 120);
      this.dir = left ? 1 : -1;
      this.el.classList.toggle('facing-left', this.dir === -1);
      this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px';
      this._setAnim('walk');
      const tx = rand(80, window.innerWidth - 120);
      this._moveTo(tx, this.y, rand(1, 2), () => {
        this._setAnim('idle');
        this.say(pick([`Hi! I'm ${this.name}!`, `${this.d.emoji}`, 'Hello~!', '*appears*']));
        this._playSound();
        this._startLoop();
      });
    }

    _moveTo(tx, ty, spd, cb) {
      if (this._dead) return;
      cancelAnimationFrame(this._raf);
      const sx = this.x, sy = this.y;
      const dist = Math.hypot(tx - sx, ty - sy);
      const dur = (dist / (spd || this.speed)) * 16;
      const t0 = performance.now();
      const step = now => {
        if (this._dead || this._isDragging) return;
        const t = Math.min((now - t0) / Math.max(dur, 1), 1);
        this.x = sx + (tx - sx) * t; this.y = sy + (ty - sy) * t;
        this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px';
        if (Math.random() < 0.008) this._paw();
        if (t < 1) this._raf = requestAnimationFrame(step); else if (cb) cb();
      };
      this._raf = requestAnimationFrame(step);
    }

    _walkRandom(cb) {
      this.speed = rand(C.speed.min, C.speed.max);
      const tx = rand(40, window.innerWidth - 80), ty = rand(25, 140);
      this.dir = tx > this.x ? 1 : -1;
      this.el.classList.toggle('facing-left', this.dir === -1);
      this._setAnim('walk');
      this._moveTo(tx, ty, this.speed, () => { this._setAnim('idle'); if (cb) cb(); });
    }

    _walkOff(cb) {
      const edge = Math.random() > 0.5 ? -70 : window.innerWidth + 70;
      this.dir = edge < 0 ? -1 : 1;
      this.el.classList.toggle('facing-left', this.dir === -1);
      this._setAnim('walk');
      this._moveTo(edge, this.y, rand(1, 2), () => {
        const ns = edge < 0 ? window.innerWidth + 60 : -60;
        this.x = ns; this.y = rand(30, 120);
        this.dir = ns > window.innerWidth ? -1 : 1;
        this.el.classList.toggle('facing-left', this.dir === -1);
        this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px';
        this._setAnim('walk');
        this._moveTo(rand(80, window.innerWidth - 120), this.y, rand(1, 2), () => {
          this._setAnim('idle');
          this.say(pick(['I\'m back!', '*reappears*', 'Miss me?']));
          if (cb) cb();
        });
      });
    }

    _startLoop() {
      if (this._dead) return;
      const tick = () => {
        if (this._dead || this._isDragging) { this._next(tick); return; }
        const idle = Date.now() - this.lastTouch;
        if (idle > C.sleepAfter && this.state !== 'sleep') {
          this._setAnim('idle'); this._addZzz(); this.state = 'sleep';
          this.say(pick(this.d.sleep)); this._next(tick, rand(5000, 10000)); return;
        }
        if (this.state === 'sleep' && idle < C.sleepAfter) {
          this._rmZzz(); this.state = 'idle'; this.say(pick(['*yawn*', '*stretches*', 'Hmm?']));
        }
        const r = this.el.getBoundingClientRect();
        const cd = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        if (cd < C.cursorDist && this.state !== 'sleep') {
          this._cursorReact(cd); this._next(tick, rand(800, 2000)); return;
        }
        const roll = Math.random();
        if (roll < 0.30) { this._walkRandom(() => this._next(tick)); return; }
        else if (roll < 0.50) { this._doTrick(pick(this.d.tricks)); }
        else if (roll < 0.60) { this._walkOff(() => this._next(tick)); return; }
        else if (roll < 0.68 && this.d.canFly) { this.ctrl.launchFly(this.type); this.say(pick(['Wheee!', '*watches*'])); }
        else { this._setAnim('idle'); if (Math.random() > 0.4) this.say(pick(this.d.sounds)); }
        this._next(tick);
      };
      this._next(tick, rand(800, 2500));
    }

    _next(fn, ms) { clearTimeout(this._tmr); this._tmr = setTimeout(fn, ms || rand(C.tick.min, C.tick.max) * rand(0.7, 1.5)); }

    _cursorReact(dist) {
      this.dir = mx > this.x + 30 ? 1 : -1;
      this.el.classList.toggle('facing-left', this.dir === -1);
      if (this.type === 'cat') {
        this.say(pick(dist < 60 ? ['*POUNCE!*', '*wiggles butt*'] : ['*stares...*', '*pupils big*']));
        this._setAnim(dist < 60 ? 'chase' : 'idle');
        if (dist < 60) sfx.meow();
        setTimeout(() => this._setAnim('idle'), 1200);
      } else if (this.type === 'dog') {
        this.say(pick(['FRIEND!', '*tail wag!!*', 'Play?!']));
        this._setAnim('chase'); sfx.bark();
        this._moveTo(Math.max(10, Math.min(mx - 30, window.innerWidth - 70)), Math.max(10, Math.min(my - 30, 200)), 2.5,
          () => { this._setAnim('idle'); this.say(pick(['*pant*', 'Hehe!'])); });
      } else if (this.type === 'bird') {
        this.say(pick(dist < 50 ? ['EEP!', '*flutter!*'] : ['*tilts head*', 'Chirp?']));
        this._setAnim(dist < 50 ? 'hop' : 'tilt');
        if (dist < 50) sfx.chirp();
        setTimeout(() => this._setAnim('idle'), 1500);
      } else if (this.type === 'frog') {
        this.say(pick(['*tongue!*', 'RIBBIT!']));
        this._setAnim('hop'); sfx.ribbit();
        setTimeout(() => this._setAnim('idle'), 1200);
      } else if (this.type === 'bunny') {
        this.say(pick(['*nose twitch*', '*binkies!*']));
        this._setAnim('hop'); sfx.thump();
        setTimeout(() => this._setAnim('idle'), 1200);
      } else if (this.type === 'duck') {
        this.say(pick(['QUACK!', '*waddles closer*']));
        this._setAnim('wiggle'); sfx.quack();
        setTimeout(() => this._setAnim('idle'), 1200);
      } else {
        this.say(pick(this.d.sounds)); this._playSound();
        this._setAnim('wiggle');
        setTimeout(() => this._setAnim('idle'), 1200);
      }
    }

    _doTrick(trick) {
      switch (trick) {
        case 'clean':
          this._setAnim('clean'); this.say(pick(['*lick lick*', '*grooms*', '*so clean*']));
          sfx.purr(); setTimeout(() => this._setAnim('idle'), 1800); break;
        case 'knock':
          this.say(pick(['*pushes thing off edge*', 'Oops.', '*knocks over cup*']));
          sfx.pop(); this._spawn(pick(['📱', '🖊️', '☕', '🥤']), this.x + 28, this.y + 20, 'pet-confetti'); break;
        case 'stalk':
          this._setAnim('chase'); this.say(pick(['*wiggles butt*', '*hunter mode*', '*pounce prep*']));
          sfx.meow(); setTimeout(() => this._setAnim('idle'), 1500); break;
        case 'loaf':
          this.say(pick(['*becomes loaf*', '*maximum cozy*', '*loaf mode activated*'])); break;
        case 'zoomies':
          this._setAnim('zoomies'); this.say(pick(['*ZOOMIES!!!*', 'NYOOM', '*zoom zoom*']));
          sfx.whee();
          this._moveTo(Math.max(10, Math.min(this.x + this.dir * rand(150, 300), window.innerWidth - 70)), this.y, 4,
            () => { this._setAnim('idle'); this.say('*pant pant*'); });
          break;
        case 'roll':
          this._setAnim('roll'); this.say(pick(['*rolls over*', '*belly up!*', 'Rub my belly?']));
          sfx.boing(); setTimeout(() => this._setAnim('idle'), 1000); break;
        case 'fetch':
          this.say(pick(['*brings ball*', '🎾 Fetch?', '*drops toy*']));
          sfx.bark(); this._particle(this.x + 28, this.y + 50, '🎾');
          this._setAnim('happy'); setTimeout(() => this._setAnim('idle'), 2000); break;
        case 'sing':
          this._setAnim('happy'); this.say(pick(['*sings~*', 'La la la~', '♪ tweet tweet ♪']));
          sfx.sing();
          for (let i = 0; i < 5; i++) setTimeout(() => {
            const n = document.createElement('div'); n.className = 'pet-note'; n.textContent = pick(['🎵', '🎶', '♪', '♫']);
            n.style.left = (this.x + 30 + rand(-12, 12)) + 'px'; n.style.top = (this.y - 5) + 'px';
            document.body.appendChild(n); setTimeout(() => n.remove(), 2000);
          }, i * 300);
          setTimeout(() => this._setAnim('idle'), 2500); break;
        case 'fly':
          this.ctrl.launchFly(this.type); this.say('*takes off!*'); sfx.chirp(); break;
        case 'tilt':
          this._setAnim('tilt'); this.say(pick(['*tilts head*', 'Hmm?', '*curious*']));
          setTimeout(() => this._setAnim('idle'), 1800); break;
        case 'hop':
          this._setAnim('hop'); this.say(pick(['*boing!*', '*hop hop*', '*bounce!*']));
          sfx.boing(); setTimeout(() => this._setAnim('idle'), 1500); break;
        case 'wiggle':
          this._setAnim('wiggle'); this.say(pick(this.d.sounds));
          setTimeout(() => this._setAnim('idle'), 1000); break;
        // ─── NEW DIVERSE TRICKS ───
        case 'dance':
          this._setAnim('dance'); this.say(pick(['*dances!*', '💃 Groove~', '*boogie!*', '*disco time*']));
          sfx.party();
          for (let i = 0; i < 4; i++) setTimeout(() => this._particle(this.x + 30 + rand(-15, 15), this.y - 5, pick(['✨', '💫', '⭐', '🌟'])), i * 200);
          setTimeout(() => this._setAnim('idle'), 2400); break;
        case 'spin':
          this._setAnim('spin'); this.say(pick(['*spins!*', 'Wheee!', '*dizzy~*']));
          sfx.whee(); setTimeout(() => { this._setAnim('idle'); this.say('*wobbly*'); }, 1200); break;
        case 'play-dead':
          this._setAnim('play-dead'); this.say(pick(['*plays dead*', 'x_x', '*dramatic flop*']));
          sfx.pop();
          setTimeout(() => { this._setAnim('idle'); this.say(pick(['*revives!*', 'Just kidding!', '*ta-da!*'])); }, 2500); break;
        case 'backflip':
          this._setAnim('backflip'); this.say(pick(['*BACKFLIP!*', 'Watch this!', '*acrobatic!*']));
          sfx.boing(); sfx.whee();
          setTimeout(() => { this._setAnim('idle'); this.say(pick(['Nailed it!', '*lands perfectly*', '10/10!'])); }, 1000); break;
        case 'wave':
          this._setAnim('wave'); this.say(pick(['*waves*', 'Hi there!', 'Hello~!', '*waves paw*']));
          sfx.sparkle();
          this._particle(this.x + 40, this.y + 5, '👋');
          setTimeout(() => this._setAnim('idle'), 1800); break;
        case 'peek':
          this._setAnim('peek'); this.say(pick(['Peek-a-boo!', '*hides*', 'BOO!']));
          sfx.pop();
          setTimeout(() => { this._setAnim('idle'); this.say(pick(['*giggles*', 'Hehe!', 'Found you!'])); }, 1500); break;
        case 'chase-tail':
          this._setAnim('chase-tail'); this.say(pick(['*chases tail*', 'Must... catch... it!', '*spins in circles*']));
          sfx.whee();
          setTimeout(() => { this._setAnim('idle'); this.say(pick(['*dizzy*', 'Where\'d it go?', '*pants*'])); }, 2000); break;
        case 'blow-kiss':
          this.say(pick(['*blows kiss*', 'Mwah!', '😘💕']));
          sfx.kiss();
          for (let i = 0; i < 3; i++) setTimeout(() => this._particle(this.x + 30 + rand(-5, 25), this.y - 5 - i * 10, pick(['💋', '💕', '💗', '😘'])), i * 200);
          this._setAnim('happy'); setTimeout(() => this._setAnim('idle'), 1500); break;
        case 'moonwalk':
          this.say(pick(['*moonwalks*', '*smooth~*', '*hee hee*']));
          sfx.party(); this.dir *= -1;
          this.el.classList.toggle('facing-left', this.dir === -1);
          this._setAnim('moonwalk');
          this._moveTo(Math.max(10, Math.min(this.x - this.dir * rand(80, 160), window.innerWidth - 70)), this.y, 1.5,
            () => { this._setAnim('idle'); this.say('*ta-da*'); });
          break;
        default:
          this._setAnim('wiggle'); this.say(pick(this.d.sounds)); setTimeout(() => this._setAnim('idle'), 1000);
      }
    }

    _dragStart(e) {
      if (e.button !== 0) return;
      this._dragged = false; this._isDragging = false;
      const sx = e.clientX, sy = e.clientY, ox = this.x, oy = this.y;
      cancelAnimationFrame(this._raf);
      const mv = ev => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!this._isDragging && Math.hypot(dx, dy) < 5) return;
        this._isDragging = true; this._dragged = true;
        this.el.classList.add('dragging');
        this.x = ox + dx; this.y = oy + dy;
        this.el.style.left = this.x + 'px'; this.el.style.top = this.y + 'px';
      };
      const up = () => {
        document.removeEventListener('pointermove', mv);
        document.removeEventListener('pointerup', up);
        if (this._isDragging) {
          this.el.classList.remove('dragging'); this._isDragging = false;
          this.lastTouch = Date.now();
          this.say(pick(['Whee!', '*placed!*', 'I like it here!', 'New spot!', 'Cozy~']));
          this._playSound();
        }
        setTimeout(() => { this._dragged = false; }, 50);
      };
      document.addEventListener('pointermove', mv);
      document.addEventListener('pointerup', up);
    }

    _pet(e) {
      e.stopPropagation(); this.pets++; this.mood = Math.min(100, this.mood + 12);
      this.lastTouch = Date.now(); this._rmZzz(); this.state = 'idle';
      this._playSound();
      for (let i = 0; i < 3; i++) setTimeout(() => this._particle(e.clientX + rand(-15, 15), e.clientY - 10, pick(['❤️', '💕', '💖', '✨'])), i * 100);
      this.say([10, 25, 50, 100].includes(this.pets) ? `${this.pets} pets! I love you!!` : pick(this.d.sounds));
      this._setAnim('happy'); setTimeout(() => this._setAnim('idle'), 1200);
    }

    _feed(e) {
      e.stopPropagation(); const treat = pick(this.d.treats);
      this.mood = Math.min(100, this.mood + 18); this.lastTouch = Date.now();
      const t = document.createElement('div'); t.className = 'pet-treat'; t.textContent = treat;
      t.style.left = e.clientX + 'px'; t.style.top = e.clientY + 'px';
      document.body.appendChild(t); setTimeout(() => t.remove(), 600);
      this.say(pick([`Yum! ${treat}`, '*nom nom*', `${treat}!!!`, 'SO YUMMY']));
      sfx.pop(); this._setAnim('happy'); setTimeout(() => this._setAnim('idle'), 1500);
    }

    _playSound() {
      if (this.d.sound && sfx[this.d.sound]) sfx[this.d.sound]();
    }

    _setAnim(cls) { this.el.className = 'colab-pet ' + cls; if (this.dir === -1) this.el.classList.add('facing-left'); }
    say(text) { this.bubble.textContent = text; this.bubble.classList.add('show'); clearTimeout(this._sayT); this._sayT = setTimeout(() => this.bubble.classList.remove('show'), C.speechMs); }
    _particle(x, y, e) { const p = document.createElement('div'); p.className = 'pet-particle'; p.textContent = e; p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.fontSize = rand(13, 22) + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 1200); }
    _spawn(e, x, y, c) { const el = document.createElement('div'); el.className = c || 'pet-particle'; el.textContent = e; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.fontSize = '16px'; el.style.background = 'none'; el.style.width = 'auto'; el.style.height = 'auto'; document.body.appendChild(el); setTimeout(() => el.remove(), 2800); }
    _paw() { const p = document.createElement('div'); p.className = 'pet-paw'; p.textContent = this.d.paw; p.style.left = (this.x + 26) + 'px'; p.style.top = (this.y + 56) + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 4000); }
    _addZzz() { for (let i = 0; i < 3; i++) { const z = document.createElement('div'); z.className = 'pet-zzz'; z.textContent = 'z'; this.el.appendChild(z); } }
    _rmZzz() { this.el.querySelectorAll('.pet-zzz').forEach(z => z.remove()); }
    _moodDecay() { this._mdI = setInterval(() => { this.mood = Math.max(0, this.mood - 0.5); }, 8000); }

    onCodeOk() {
      this.mood = Math.min(100, this.mood + 8); this._setAnim('happy'); this.say(pick(this.d.happy));
      this._playSound();
      if (this.type === 'bird' || this.type === 'duck') {
        for (let i = 0; i < 3; i++) setTimeout(() => {
          const n = document.createElement('div'); n.className = 'pet-note'; n.textContent = pick(['🎵', '🎶', '♪']);
          n.style.left = (this.x + 30 + rand(-8, 8)) + 'px'; n.style.top = (this.y - 5) + 'px';
          document.body.appendChild(n); setTimeout(() => n.remove(), 2000);
        }, i * 250);
      }
      setTimeout(() => this._setAnim('idle'), 2000);
    }
    onCodeErr() { this.mood = Math.max(0, this.mood - 5); this._setAnim('sad'); this.say(pick(this.d.sad)); setTimeout(() => this._setAnim('idle'), 2500); }

    destroy() { this._dead = true; clearTimeout(this._tmr); clearTimeout(this._sayT); clearInterval(this._mdI); cancelAnimationFrame(this._raf); this.el.remove(); }
  }

  // ─── CONTROLLER ─────────────────────────────
  class App {
    constructor() {
      this.pets = [];
      this.layer = document.createElement('div'); this.layer.id = 'colab-pets-layer'; document.body.appendChild(this.layer);
      const btn = document.createElement('button'); btn.id = 'pet-tricks-btn';
      btn.innerHTML = '🐾<span class="btn-label">Do a trick!</span>';
      btn.addEventListener('click', () => this._allTricks()); document.body.appendChild(btn);
      this._loadPrefs().then(() => { const l = this._saved.length ? this._saved : ['cat']; l.forEach(t => this.addPet(t)); });
      this._watchCode(); this._listen(); this._flyLoop(); this._loveLoop();
      console.log('%c🐾 Colab Pets v4! Someone special loves you!', 'font-size:14px;color:#FF6B9D;');
    }
    addPet(t) { if (!ANIMALS[t] || this.pets.length >= 5) return; const p = new Pet(t, this); this.pets.push(p); this._save(); return p; }
    removePet(t) { const i = this.pets.findIndex(p => p.type === t); if (i !== -1) { this.pets[i].destroy(); this.pets.splice(i, 1); this._save(); } }
    removeAll() { this.pets.forEach(p => p.destroy()); this.pets = []; this._save(); }

    _allTricks() {
      if (!this.pets.length) return;
      sfx.sparkle();
      this.pets.forEach(p => p._doTrick(pick(p.d.tricks)));
      if (Math.random() > 0.7) this.throwConfetti();
    }

    _flyLoop() {
      const go = () => {
        this._fT = setTimeout(() => {
          const f = this.pets.filter(p => p.d.canFly);
          if (f.length) this.launchFly(pick(f).type);
          go();
        }, rand(C.flyEvery.min, C.flyEvery.max));
      }; go();
    }
    launchFly(type) {
      const d = ANIMALS[type]; if (!d || !d.flyImg) return;
      const b = document.createElement('div'); b.className = 'fly-bird';
      const left = Math.random() > 0.5; const sx = left ? -60 : window.innerWidth + 60; const ex = left ? window.innerWidth + 60 : -60;
      const sy = rand(30, window.innerHeight * 0.35);
      b.innerHTML = `<div class="pet-body"><img src="${imgURL(d.flyImg)}" alt="flying" draggable="false"/></div>`;
      if (!left) b.querySelector('.pet-body').style.transform = 'scaleX(-1)';
      b.style.left = sx + 'px'; b.style.top = sy + 'px'; this.layer.appendChild(b);
      sfx.chirp();
      const dur = rand(3500, 6500); const t0 = performance.now(); const midY = sy - rand(30, 80);
      const anim = now => {
        const t = (now - t0) / dur; if (t >= 1) { b.remove(); return; }
        b.style.left = (sx + (ex - sx) * t) + 'px';
        b.style.top = (sy + (midY - sy) * Math.sin(t * Math.PI) + Math.sin(t * Math.PI * 3) * 6) + 'px';
        requestAnimationFrame(anim);
      }; requestAnimationFrame(anim);
    }

    _loveLoop() {
      const go = () => {
        this._lT = setTimeout(() => {
          if (this.pets.length) {
            const p = pick(this.pets);
            const msg = Math.random() > 0.4 ? pick(LOVE) : pick(CHEER);
            p.say(msg); sfx.sparkle();
            if (msg.includes('love') || msg.includes('heart') || msg.includes('miss')) {
              const r = p.el.getBoundingClientRect();
              for (let i = 0; i < 2; i++) setTimeout(() => p._particle(r.left + r.width / 2 + rand(-10, 10), r.top + 10, pick(['💝', '💌', '🥰', '💕'])), i * 180);
            }
          }
          go();
        }, rand(C.loveEvery.min, C.loveEvery.max));
      };
      setTimeout(() => {
        if (this.pets.length) {
          const p = pick(this.pets);
          p.say(pick(['Someone special loves you!', 'You are so loved!']));
          sfx.sparkle();
          const r = p.el.getBoundingClientRect();
          p._particle(r.left + r.width / 2, r.top + 10, '💝');
        }
        go();
      }, rand(6000, 12000));
    }

    throwConfetti() {
      const cols = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FF3', '#FFB8D0'];
      sfx.party();
      for (let i = 0; i < 50; i++) setTimeout(() => {
        const c = document.createElement('div'); c.className = 'pet-confetti';
        c.style.left = rand(0, window.innerWidth) + 'px'; c.style.top = '-8px'; c.style.backgroundColor = pick(cols);
        c.style.width = rand(4, 9) + 'px'; c.style.height = rand(4, 9) + 'px'; c.style.animationDuration = rand(1.5, 3) + 's';
        document.body.appendChild(c); setTimeout(() => c.remove(), 3500);
      }, i * 25);
      this.pets.forEach(p => { p.say(pick(['PARTY!!', 'WOOHOO!', 'YAY!!'])); p._setAnim('happy'); });
    }

    _watchCode() {
      const obs = new MutationObserver(muts => {
        for (const m of muts) for (const n of m.addedNodes) {
          if (!(n instanceof HTMLElement)) continue; const txt = n.textContent || '';
          const isErr = n.classList?.contains('error') || n.querySelector?.('.traceback,.stderr') || txt.includes('Traceback') || txt.includes('Error:');
          const isOut = n.classList?.contains('output') || n.querySelector?.('.output_area,.output_subarea');
          if (isErr) this.pets.forEach(p => p.onCodeErr());
          else if (isOut && Math.random() > 0.5) this.pets.forEach(p => p.onCodeOk());
        }
      });
      const tgt = document.querySelector('#main,.notebook-container,#notebook-container,body');
      if (tgt) obs.observe(tgt, { childList: true, subtree: true });
      try {
        if (window.Jupyter) window.Jupyter.notebook.events.on('shell_reply.Kernel', (_, d) => {
          if (d.reply.content.status === 'error') this.pets.forEach(p => p.onCodeErr());
          else if (Math.random() > 0.5) this.pets.forEach(p => p.onCodeOk());
        });
      } catch (e) {}
    }

    async _loadPrefs() {
      this._saved = ['cat'];
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const r = await chrome.storage.sync.get(['activePets']);
          if (r.activePets) this._saved = r.activePets.filter(t => ANIMALS[t]);
        }
      } catch (e) {}
    }
    _save() { try { if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.sync.set({ activePets: this.pets.map(p => p.type) }); } catch (e) {} }

    _listen() {
      if (typeof chrome !== 'undefined' && chrome.runtime) chrome.runtime.onMessage.addListener((msg, _, cb) => {
        switch (msg.action) {
          case 'addPet': this.addPet(msg.type); break;
          case 'removePet': this.removePet(msg.type); break;
          case 'removeAll': this.removeAll(); break;
          case 'party': this.throwConfetti(); break;
          case 'tricks': this._allTricks(); break;
        }
        cb({ ok: true });
      });
    }
  }

  if (document.readyState === 'complete') window.__colabPets = new App();
  else window.addEventListener('load', () => { window.__colabPets = new App(); });
})();
