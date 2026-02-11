/* ============================================
   COLAB PETS v2 - Cute Interactive Animals
   Now with flying birds, cursor chasing,
   code cell perching, and much more!
   ============================================ */

(function () {
  'use strict';

  // ─── CONFIG ───────────────────────────────────────────
  const C = {
    walkSpeed: { min: 0.3, max: 1.2 },
    idleTime: { min: 1500, max: 6000 },
    walkTime: { min: 1500, max: 5000 },
    sleepAfter: 50000,
    speechDuration: 3000,
    blinkInterval: { min: 2000, max: 6000 },
    cursorReactDist: 150,
    cursorChaseDist: 250,
    flyInterval: { min: 12000, max: 35000 },
    loveMessageInterval: { min: 25000, max: 60000 },
    perchChance: 0.15,
    size: 56,
    maxPets: 5,
  };

  // ─── LOVE & ENCOURAGEMENT MESSAGES ────────────────────
  const LOVE_MSGS = [
    'Mayank loves you!',
    'Mayank is thinking of you~',
    'Mayank says you\'re amazing!',
    'Mayank misses you right now',
    'Mayank is so proud of you!',
    'Mayank thinks you\'re the cutest',
    'You make Mayank so happy!',
    'Mayank believes in you!',
    'Mayank says: take a break?',
    'Mayank wants to remind you to drink water!',
    'Mayank is sending you a hug right now',
    'Mayank says you\'re doing great!',
    'You\'re Mayank\'s favorite person!',
    'Mayank says: don\'t forget to eat!',
    'Mayank would give you head pats rn',
  ];

  const ENCOURAGE_MSGS = [
    'You\'re doing amazing!',
    'Keep going, you got this!',
    'You\'re so smart!',
    'That code looks great!',
    'You\'re a coding queen!',
    'Take a deep breath, you\'re doing fine~',
    'Remember to stretch!',
    'You\'re unstoppable!',
    'Proud of you!',
    'Hydration check!',
    'You make the world better!',
    'Your brain is so big!',
    'Snack break soon?',
    'You\'re literally the best',
    'Don\'t be too hard on yourself~',
    'Every bug you fix makes you stronger!',
  ];

  // ─── CURSOR TRACKING ─────────────────────────────────
  let mouseX = -1000, mouseY = -1000;
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

  // ─── HELPERS ──────────────────────────────────────────
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ─── SVG ANIMALS ──────────────────────────────────────
  const ANIMALS = {
    cat: {
      name: 'Whiskers', emoji: '🐱', color: '#FF9B50',
      sounds: ['Mew~', 'Purrrr', 'Mrow?', 'Nyaa~', '*purrs*', '*stretches*', 'Prrrt!', '*blinks slowly*'],
      happySounds: ['PURRRR!!', 'Mew mew!', '*happy kneading*', '=^.^=', '*slow blink*'],
      sadSounds: ['Mew...', '*hisses at bug*', '>.<', '*knocks error off table*'],
      sleepSounds: ['zzz...', '*curls into ball*', '*ear twitch*'],
      treats: ['🐟', '🥛', '🧶'], pawprint: '🐾',
      specialBehaviors: ['cleaning', 'knocking', 'stalking', 'loafing'],
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="42" rx="18" ry="14" fill="#FF9B50"/>
        <circle cx="32" cy="24" r="14" fill="#FF9B50"/>
        <polygon points="20,14 18,2 26,10" fill="#FF9B50" stroke="#E8853A" stroke-width="1"/>
        <polygon points="44,14 46,2 38,10" fill="#FF9B50" stroke="#E8853A" stroke-width="1"/>
        <polygon points="21,12 20,4 26,10" fill="#FFB8D0"/>
        <polygon points="43,12 44,4 38,10" fill="#FFB8D0"/>
        <ellipse class="pet-eye left-eye" cx="26" cy="22" rx="3" ry="3.5" fill="#333"/>
        <ellipse class="pet-eye right-eye" cx="38" cy="22" rx="3" ry="3.5" fill="#333"/>
        <circle cx="25" cy="21" r="1" fill="white" class="eye-shine"/>
        <circle cx="37" cy="21" r="1" fill="white" class="eye-shine"/>
        <ellipse cx="32" cy="27" rx="2" ry="1.5" fill="#FFB8D0"/>
        <path d="M30,29 Q32,32 34,29" fill="none" stroke="#333" stroke-width="0.8"/>
        <line x1="14" y1="25" x2="24" y2="26" stroke="#333" stroke-width="0.5" class="whisker"/>
        <line x1="14" y1="28" x2="24" y2="28" stroke="#333" stroke-width="0.5" class="whisker"/>
        <line x1="40" y1="26" x2="50" y2="25" stroke="#333" stroke-width="0.5" class="whisker"/>
        <line x1="40" y1="28" x2="50" y2="28" stroke="#333" stroke-width="0.5" class="whisker"/>
        <path class="pet-tail" d="M50,42 Q58,30 54,20" fill="none" stroke="#FF9B50" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="22" cy="54" rx="5" ry="3" fill="#FFD4A8"/>
        <ellipse cx="42" cy="54" rx="5" ry="3" fill="#FFD4A8"/>
        <circle cx="20" cy="28" r="3" fill="#FFB8D0" opacity="0.5"/>
        <circle cx="44" cy="28" r="3" fill="#FFB8D0" opacity="0.5"/>
      </svg>`,
    },

    dog: {
      name: 'Biscuit', emoji: '🐶', color: '#C4956A',
      sounds: ['Woof!', 'Arf!', '*tail wag*', 'Bork!', '*pant pant*', '*tilts head*', 'Yip!'],
      happySounds: ['WOOF WOOF!!', '*ZOOMIES!!*', '*tail helicopter*', '*brings ball*', 'SO HAPPY!'],
      sadSounds: ['Whimper...', '*puppy eyes*', 'Awoo...', '*lies down sadly*'],
      sleepSounds: ['*woof...zzz*', '*leg twitch*', '*dream bork*'],
      treats: ['🦴', '🥩', '🎾'], pawprint: '🐾',
      specialBehaviors: ['zoomies', 'rolling', 'fetching', 'tailwag'],
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="42" rx="18" ry="14" fill="#C4956A"/>
        <circle cx="32" cy="24" r="14" fill="#C4956A"/>
        <ellipse cx="18" cy="18" rx="8" ry="14" fill="#A67B5B" transform="rotate(-15, 18, 18)"/>
        <ellipse cx="46" cy="18" rx="8" ry="14" fill="#A67B5B" transform="rotate(15, 46, 18)"/>
        <ellipse cx="32" cy="28" rx="8" ry="6" fill="#E8C9A0"/>
        <circle class="pet-eye left-eye" cx="26" cy="22" r="3.5" fill="#333"/>
        <circle class="pet-eye right-eye" cx="38" cy="22" r="3.5" fill="#333"/>
        <circle cx="25" cy="21" r="1.2" fill="white" class="eye-shine"/>
        <circle cx="37" cy="21" r="1.2" fill="white" class="eye-shine"/>
        <path d="M23,17 Q26,15 29,17" fill="none" stroke="#A67B5B" stroke-width="1.5"/>
        <path d="M35,17 Q38,15 41,17" fill="none" stroke="#A67B5B" stroke-width="1.5"/>
        <ellipse cx="32" cy="27" rx="3" ry="2.5" fill="#333"/>
        <path d="M29,30 Q32,34 35,30" fill="#FF7B9C" stroke="#333" stroke-width="0.5"/>
        <ellipse class="pet-tongue" cx="32" cy="33" rx="2.5" ry="3" fill="#FF7B9C"/>
        <path class="pet-tail" d="M50,38 Q56,28 52,18" fill="none" stroke="#C4956A" stroke-width="5" stroke-linecap="round"/>
        <ellipse cx="22" cy="54" rx="5" ry="3" fill="#E8C9A0"/>
        <ellipse cx="42" cy="54" rx="5" ry="3" fill="#E8C9A0"/>
        <circle cx="20" cy="28" r="3" fill="#FFB8D0" opacity="0.4"/>
        <circle cx="44" cy="28" r="3" fill="#FFB8D0" opacity="0.4"/>
      </svg>`,
    },

    bird: {
      name: 'Peep', emoji: '🐦', color: '#7EC8E3',
      sounds: ['Tweet!', 'Chirp!', '*flutters*', 'Pip pip!', '*head tilt*', 'Tweee~', '*preens*'],
      happySounds: ['TWEET TWEET!!', '*happy flutter*', '*sings melody*', '*dances*', 'LA LA LA~'],
      sadSounds: ['...peep', '*ruffles feathers*', '*sad chirp*', '*hides under wing*'],
      sleepSounds: ['*tucks beak*', '*puffs up*', 'pip...zzz'],
      treats: ['🌻', '🍎', '🫐'], pawprint: '·',
      specialBehaviors: ['singing', 'flying', 'perching', 'headtilt'],
      canFly: true,
      flySvg: `<svg viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="28" rx="14" ry="10" fill="#7EC8E3"/>
        <ellipse cx="32" cy="30" rx="9" ry="7" fill="#D4F0FF"/>
        <circle cx="32" cy="18" r="9" fill="#7EC8E3"/>
        <circle class="pet-eye" cx="28" cy="16" r="2" fill="#333"/>
        <circle cx="27.5" cy="15.5" r="0.8" fill="white"/>
        <polygon points="32,19 29,22 35,22" fill="#FFB347"/>
        <path d="M18,24 Q6,14 14,30 Q16,34 22,30" fill="#5BB5D5"/>
        <path d="M46,24 Q58,14 50,30 Q48,34 42,30" fill="#5BB5D5"/>
        <path d="M28,38 Q26,42 24,44" fill="none" stroke="#5BB5D5" stroke-width="2" stroke-linecap="round"/>
        <path d="M36,38 Q38,42 40,44" fill="none" stroke="#5BB5D5" stroke-width="2" stroke-linecap="round"/>
        <path d="M30,10 Q28,4 32,7 Q34,4 34,10" fill="#FF7B9C"/>
        <circle cx="22" cy="20" r="2" fill="#FFD4E8" opacity="0.5"/>
        <circle cx="42" cy="20" r="2" fill="#FFD4E8" opacity="0.5"/>
      </svg>`,
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="38" rx="16" ry="18" fill="#7EC8E3"/>
        <ellipse cx="32" cy="42" rx="11" ry="13" fill="#D4F0FF"/>
        <circle cx="32" cy="20" r="12" fill="#7EC8E3"/>
        <circle cx="20" cy="22" r="3" fill="#FFD4E8" opacity="0.6"/>
        <circle cx="44" cy="22" r="3" fill="#FFD4E8" opacity="0.6"/>
        <circle class="pet-eye left-eye" cx="27" cy="18" r="3" fill="#333"/>
        <circle class="pet-eye right-eye" cx="37" cy="18" r="3" fill="#333"/>
        <circle cx="26" cy="17" r="1.2" fill="white" class="eye-shine"/>
        <circle cx="36" cy="17" r="1.2" fill="white" class="eye-shine"/>
        <polygon points="32,22 28,26 36,26" fill="#FFB347"/>
        <line x1="28" y1="26" x2="36" y2="26" stroke="#E8953A" stroke-width="0.5"/>
        <path class="pet-wing-left" d="M16,34 Q8,28 12,42 Q14,48 20,44" fill="#5BB5D5"/>
        <path class="pet-wing-right" d="M48,34 Q56,28 52,42 Q50,48 44,44" fill="#5BB5D5"/>
        <path d="M28,54 Q26,60 22,62" fill="none" stroke="#5BB5D5" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M32,54 Q32,60 32,62" fill="none" stroke="#5BB5D5" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M36,54 Q38,60 42,62" fill="none" stroke="#5BB5D5" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M26,56 L24,60 M26,56 L26,60 M26,56 L28,60" stroke="#FFB347" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M38,56 L36,60 M38,56 L38,60 M38,56 L40,60" stroke="#FFB347" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M30,9 Q28,2 32,6 Q34,2 34,9" fill="#FF7B9C"/>
      </svg>`,
    },

    bunny: {
      name: 'Mochi', emoji: '🐰', color: '#F5F5F5',
      sounds: ['*nose wiggle*', '*thump*', '*binky!*', '*munch munch*', '*hops*', '*flops*'],
      happySounds: ['*BINKY!!*', '*zoom hop*', '*flops happily*', '*popcorns*', '*wiggles nose SO fast*'],
      sadSounds: ['*thumps foot*', '...', '*hides*', '*flat bunny*'],
      sleepSounds: ['*loaf mode*', '*flops sideways*', '...zzz'],
      treats: ['🥕', '🍌', '🌿'], pawprint: '·',
      specialBehaviors: ['binky', 'nosewiggle', 'loafing', 'thumping'],
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="44" rx="16" ry="14" fill="#F5F5F5"/>
        <circle cx="32" cy="28" r="13" fill="#F5F5F5"/>
        <ellipse cx="24" cy="8" rx="5" ry="14" fill="#F5F5F5" stroke="#E0E0E0" stroke-width="0.5"/>
        <ellipse cx="40" cy="8" rx="5" ry="14" fill="#F5F5F5" stroke="#E0E0E0" stroke-width="0.5"/>
        <ellipse cx="24" cy="8" rx="3" ry="11" fill="#FFB8D0"/>
        <ellipse cx="40" cy="8" rx="3" ry="11" fill="#FFB8D0"/>
        <circle class="pet-eye left-eye" cx="26" cy="26" r="3" fill="#333"/>
        <circle class="pet-eye right-eye" cx="38" cy="26" r="3" fill="#333"/>
        <circle cx="25" cy="25" r="1.2" fill="white" class="eye-shine"/>
        <circle cx="37" cy="25" r="1.2" fill="white" class="eye-shine"/>
        <ellipse cx="32" cy="31" rx="2" ry="1.5" fill="#FFB8D0"/>
        <path d="M30,33 Q32,35 34,33" fill="none" stroke="#999" stroke-width="0.6"/>
        <line x1="16" y1="30" x2="26" y2="31" stroke="#CCC" stroke-width="0.4"/>
        <line x1="16" y1="33" x2="26" y2="33" stroke="#CCC" stroke-width="0.4"/>
        <line x1="38" y1="31" x2="48" y2="30" stroke="#CCC" stroke-width="0.4"/>
        <line x1="38" y1="33" x2="48" y2="33" stroke="#CCC" stroke-width="0.4"/>
        <ellipse cx="22" cy="56" rx="5" ry="3" fill="#F0E8E0"/>
        <ellipse cx="42" cy="56" rx="5" ry="3" fill="#F0E8E0"/>
        <circle cx="48" cy="46" r="5" fill="#F5F5F5" stroke="#E0E0E0" stroke-width="0.5"/>
        <circle cx="20" cy="30" r="3.5" fill="#FFB8D0" opacity="0.4"/>
        <circle cx="44" cy="30" r="3.5" fill="#FFB8D0" opacity="0.4"/>
      </svg>`,
    },

    hamster: {
      name: 'Nugget', emoji: '🐹', color: '#F5C27A',
      sounds: ['Squeak!', '*stuffs cheeks*', '*wheel sounds*', '*nibble*', '*waddles*'],
      happySounds: ['SQUEAK!!', '*runs on wheel*', '*happy nibbles*', '*chubby dance*'],
      sadSounds: ['*hides in bedding*', 'squeak...', '*tiny yawn*'],
      sleepSounds: ['*curls into ball*', '*tiny snore*', 'zzz...'],
      treats: ['🌻', '🥜', '🧀'], pawprint: '·',
      specialBehaviors: ['cheekstuff', 'wheelrun', 'waddle'],
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="32" cy="42" rx="18" ry="16" fill="#F5C27A"/>
        <ellipse cx="32" cy="44" rx="12" ry="12" fill="#FFF3D4"/>
        <circle cx="32" cy="24" r="14" fill="#F5C27A"/>
        <ellipse cx="18" cy="28" rx="7" ry="6" fill="#FDDCA8"/>
        <ellipse cx="46" cy="28" rx="7" ry="6" fill="#FDDCA8"/>
        <circle cx="20" cy="12" r="5" fill="#F5C27A"/>
        <circle cx="44" cy="12" r="5" fill="#F5C27A"/>
        <circle cx="20" cy="12" r="3" fill="#FFB8D0"/>
        <circle cx="44" cy="12" r="3" fill="#FFB8D0"/>
        <circle class="pet-eye left-eye" cx="26" cy="22" r="3.5" fill="#333"/>
        <circle class="pet-eye right-eye" cx="38" cy="22" r="3.5" fill="#333"/>
        <circle cx="25" cy="21" r="1.5" fill="white" class="eye-shine"/>
        <circle cx="37" cy="21" r="1.5" fill="white" class="eye-shine"/>
        <circle cx="32" cy="27" r="2" fill="#FFB8D0"/>
        <path d="M30,29 Q32,31 34,29" fill="none" stroke="#999" stroke-width="0.6"/>
        <ellipse cx="22" cy="56" rx="4" ry="2.5" fill="#FDDCA8"/>
        <ellipse cx="42" cy="56" rx="4" ry="2.5" fill="#FDDCA8"/>
        <circle cx="19" cy="28" r="2.5" fill="#FFB8D0" opacity="0.5"/>
        <circle cx="45" cy="28" r="2.5" fill="#FFB8D0" opacity="0.5"/>
      </svg>`,
    },
  };

  // ─── PET CLASS ────────────────────────────────────────
  class Pet {
    constructor(type, controller) {
      this.type = type;
      this.data = ANIMALS[type];
      this.ctrl = controller;
      this.x = rand(80, window.innerWidth - 140);
      this.y = 0; // bottom-relative
      this.mood = 85;
      this.state = 'idle';
      this.dir = Math.random() > 0.5 ? 1 : -1;
      this.speed = rand(C.walkSpeed.min, C.walkSpeed.max);
      this.lastInteract = Date.now();
      this.petCount = 0;
      this.name = this.data.name;
      this.isPerched = false;
      this.blinking = false;
      this._animFrame = null;

      this._build();
      this._startBehavior();
      this._startBlink();
      this._startMoodDecay();
    }

    // ── Build DOM ──
    _build() {
      this.el = document.createElement('div');
      this.el.className = 'colab-pet idle';
      this.el.innerHTML = `
        <div class="pet-mood"></div>
        <div class="pet-speech-bubble"></div>
        <div class="pet-body">${this.data.svg}</div>
        <div class="pet-nametag">${this.name}</div>
      `;
      this.el.style.left = this.x + 'px';
      this.ctrl.ground.appendChild(this.el);

      this.bubble = this.el.querySelector('.pet-speech-bubble');
      this.moodEl = this.el.querySelector('.pet-mood');
      this.eyes = this.el.querySelectorAll('.pet-eye');
      this.shines = this.el.querySelectorAll('.eye-shine');
      this._updateMood();

      this.el.addEventListener('click', e => this._onPet(e));
      this.el.addEventListener('dblclick', e => this._onFeed(e));

      this.say(pick([`Hi! I'm ${this.name}!`, `${this.data.emoji}`, '*appears*', 'Hello~!']));
    }

    // ── Interactions ──
    _onPet(e) {
      e.stopPropagation();
      this.petCount++;
      this.mood = Math.min(100, this.mood + 12);
      this.lastInteract = Date.now();
      this._updateMood();

      for (let i = 0; i < 4; i++) {
        setTimeout(() => this._spawnParticle(e.clientX, e.clientY, pick(['❤️', '💕', '💖', '✨', '💗'])), i * 120);
      }

      const milestones = [10, 25, 50, 100];
      if (milestones.includes(this.petCount)) {
        this.say(`${this.petCount} pets! I love you!!`);
      } else {
        this.say(pick(this.data.sounds));
      }

      this._setState('happy');
      setTimeout(() => { if (this.state === 'happy') this._setState('idle'); }, 1200);
    }

    _onFeed(e) {
      e.stopPropagation();
      const treat = pick(this.data.treats);
      this.mood = Math.min(100, this.mood + 18);
      this.lastInteract = Date.now();
      this._updateMood();

      const t = document.createElement('div');
      t.className = 'pet-treat';
      t.textContent = treat;
      t.style.left = e.clientX + 'px';
      t.style.top = e.clientY + 'px';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 700);

      this.say(pick([`Yum! ${treat}`, '*munch munch*', `${treat}!!! Thank you!`, '*nom nom nom*', 'SO YUMMY']));
      this._setState('happy');
      setTimeout(() => { if (this.state === 'happy') this._setState('idle'); }, 1800);
    }

    _spawnParticle(x, y, emoji) {
      const p = document.createElement('div');
      p.className = 'pet-particle';
      p.textContent = emoji;
      p.style.left = (x + rand(-20, 20)) + 'px';
      p.style.top = (y - 10) + 'px';
      p.style.fontSize = rand(14, 22) + 'px';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1300);
    }

    // ── Eye blinking ──
    _startBlink() {
      const doBlink = () => {
        if (this.state === 'sleeping') return;
        this.eyes.forEach(eye => {
          const origRy = eye.getAttribute('ry') || eye.getAttribute('r');
          eye.dataset.origRy = origRy;
          if (eye.tagName === 'ellipse') {
            eye.setAttribute('ry', '0.5');
          } else {
            eye.setAttribute('r', '0.5');
          }
        });
        this.shines.forEach(s => s.style.opacity = '0');

        setTimeout(() => {
          this.eyes.forEach(eye => {
            if (eye.tagName === 'ellipse') {
              eye.setAttribute('ry', eye.dataset.origRy);
            } else {
              eye.setAttribute('r', eye.dataset.origRy);
            }
          });
          this.shines.forEach(s => s.style.opacity = '1');
        }, 150);

        this._blinkTimer = setTimeout(doBlink, rand(C.blinkInterval.min, C.blinkInterval.max));
      };
      this._blinkTimer = setTimeout(doBlink, rand(1000, 3000));
    }

    // ── State Machine ──
    _setState(state) {
      // Clear old classes & zzz
      this.el.className = 'colab-pet';
      this.el.querySelectorAll('.pet-zzz').forEach(z => z.remove());

      this.state = state;
      this.el.classList.add(state);

      if (this.dir === -1) this.el.classList.add('facing-left');

      if (state === 'sleeping') {
        for (let i = 0; i < 3; i++) {
          const z = document.createElement('div');
          z.className = 'pet-zzz';
          z.textContent = 'z';
          this.el.appendChild(z);
        }
      }
    }

    // ── Movement ──
    _startBehavior() {
      const tick = () => {
        const idle = Date.now() - this.lastInteract;

        // Sleep if idle too long
        if (idle > C.sleepAfter && this.state !== 'sleeping') {
          this._setState('sleeping');
          this.say(pick(this.data.sleepSounds));
          this._nextTick(rand(6000, 12000));
          return;
        }

        // Wake up
        if (this.state === 'sleeping' && idle < C.sleepAfter) {
          this.say(pick(['*yawn*', '*stretches*', 'Hmm?']));
          this._setState('idle');
        }

        // Cursor reaction — check proximity
        const rect = this.el.getBoundingClientRect();
        const petCX = rect.left + rect.width / 2;
        const petCY = rect.top + rect.height / 2;
        const distToCursor = Math.hypot(mouseX - petCX, mouseY - petCY);

        if (distToCursor < C.cursorReactDist && this.state !== 'sleeping') {
          this._reactToCursor(distToCursor);
          this._nextTick(rand(800, 1500));
          return;
        }

        // Random behavior choice
        const roll = Math.random();

        // Randomize speed each behavior cycle
        this.speed = rand(C.walkSpeed.min, C.walkSpeed.max);

        // Weighted random behavior — shuffle the odds each time
        const weights = [
          { w: rand(0.2, 0.4), fn: () => this._walk() },
          { w: rand(0.15, 0.3), fn: () => this._doSpecialBehavior() },
          { w: rand(0.05, 0.15), fn: () => this._tryPerchOnCell() },
          { w: rand(0.05, 0.1), fn: () => {
            this._setState('idle');
            if (Math.random() > 0.4) this.say(pick(this.data.sounds));
          }},
        ];
        if (this.data.canFly) {
          weights.push({ w: rand(0.08, 0.18), fn: () => {
            this.ctrl.launchFlyby(this.type);
            this.say(pick(['*watches friend fly*', 'Wheee!', 'Up up!']));
            this._setState('idle');
          }});
        }

        // Normalize and pick
        const total = weights.reduce((s, w) => s + w.w, 0);
        let r = Math.random() * total;
        for (const w of weights) {
          r -= w.w;
          if (r <= 0) { w.fn(); break; }
        }

        // Randomize the next tick timing too
        this._nextTick(rand(C.idleTime.min, C.idleTime.max) * rand(0.7, 1.4));
      };

      this._nextTick(rand(500, 2000));
      this._tickFn = tick;
    }

    _nextTick(ms) {
      clearTimeout(this._behaviorTimer);
      this._behaviorTimer = setTimeout(this._tickFn || (() => {}), ms);
    }

    _reactToCursor(dist) {
      if (this.type === 'cat') {
        // Cat stalks cursor
        if (dist < 80) {
          this.say(pick(['*pounce?*', '*wiggles butt*', '*eyes dilate*']));
          this._setState('chasing');
        } else {
          this.say(pick(['*watches intently*', '...', '*pupils get big*']));
          this._setState('idle');
        }
        // Face toward cursor
        const rect = this.el.getBoundingClientRect();
        this.dir = mouseX > rect.left + rect.width / 2 ? 1 : -1;
        this.el.classList.toggle('facing-left', this.dir === -1);

      } else if (this.type === 'dog') {
        // Dog follows cursor excitedly
        this.say(pick(['*tail wag intensifies*', 'FRIEND!', '*pant pant*', 'Play?!']));
        this._setState('chasing');
        this._chaseCursor();

      } else if (this.type === 'bird') {
        // Bird startles a bit, then tilts head
        if (dist < 60) {
          this.say(pick(['*flutter!*', 'EEP!']));
          this._setState('idle');
        } else {
          this.say(pick(['*tilts head*', 'Hmm?', 'Chirp?']));
          this._setState('head-tilt');
        }

      } else if (this.type === 'bunny') {
        if (dist < 60) {
          this.say(pick(['*thump!*', '*freezes*', '*nose wiggle intensifies*']));
        } else {
          this.say(pick(['*sniff sniff*', '*nose wiggle*', '*curious hop*']));
        }
        this._setState('idle');

      } else {
        this.say(pick(['Squeak!', '*looks up*']));
        this._setState('idle');
      }
    }

    _chaseCursor() {
      let frames = 0;
      const chase = () => {
        if (this.state !== 'chasing' || frames > 80) {
          this._setState('idle');
          this.say(pick(['*pant*', 'Hehe!', 'Again?!']));
          return;
        }
        frames++;
        const rect = this.el.getBoundingClientRect();
        const petCX = rect.left + rect.width / 2;
        const dx = mouseX - petCX;

        if (Math.abs(dx) > 30) {
          this.dir = dx > 0 ? 1 : -1;
          this.el.classList.toggle('facing-left', this.dir === -1);
          this.x += this.dir * 2;
          this.x = Math.max(10, Math.min(window.innerWidth - C.size - 10, this.x));
          this.el.style.left = this.x + 'px';
        }

        if (Math.random() < 0.03) this._leavePaw();
        this._animFrame = requestAnimationFrame(chase);
      };
      this._animFrame = requestAnimationFrame(chase);
    }

    _walk() {
      this._setState('walking');
      if (Math.random() > 0.4) this.dir *= -1;
      this.el.classList.toggle('facing-left', this.dir === -1);

      const dur = rand(C.walkTime.min, C.walkTime.max);
      const start = Date.now();

      const step = () => {
        if (this.state !== 'walking') return;
        if (Date.now() - start > dur) { this._setState('idle'); return; }

        this.x += this.speed * this.dir;
        if (this.x < 10) { this.x = 10; this.dir = 1; this.el.classList.remove('facing-left'); }
        else if (this.x > window.innerWidth - C.size - 10) {
          this.x = window.innerWidth - C.size - 10; this.dir = -1; this.el.classList.add('facing-left');
        }
        this.el.style.left = this.x + 'px';
        if (Math.random() < 0.015) this._leavePaw();
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    _leavePaw() {
      const p = document.createElement('div');
      p.className = 'pet-pawprint';
      p.textContent = this.data.pawprint;
      p.style.left = (this.x + 24) + 'px';
      p.style.top = '58px';
      this.ctrl.ground.appendChild(p);
      setTimeout(() => p.remove(), 4500);
    }

    // ── Special Behaviors ──
    _doSpecialBehavior() {
      const behavior = pick(this.data.specialBehaviors);

      switch (behavior) {
        case 'cleaning': // cat
          this._setState('cleaning');
          this.say(pick(['*lick lick*', '*grooms self*', '*cleans paw*', '*so clean*']));
          setTimeout(() => this._setState('idle'), 2000);
          break;

        case 'knocking': // cat pushes something off edge
          this.say(pick(['*pushes thing off edge*', '*slowly... pushes...*', '*watches it fall*', 'Oops.']));
          this._setState('idle');
          // Launch a falling item
          const item = pick(['📱', '🖊️', '☕', '📎', '🧊']);
          const falling = document.createElement('div');
          falling.className = 'pet-confetti';
          falling.textContent = item;
          falling.style.left = (this.x + 28) + 'px';
          falling.style.top = '60px';
          falling.style.fontSize = '16px';
          falling.style.background = 'none';
          falling.style.width = 'auto';
          falling.style.height = 'auto';
          document.body.appendChild(falling);
          setTimeout(() => falling.remove(), 2600);
          break;

        case 'stalking': // cat
          this.say(pick(['*wiggles butt*', '*eyes something*', '*hunter mode*']));
          this._setState('chasing');
          setTimeout(() => this._setState('idle'), 1500);
          break;

        case 'loafing': // cat or bunny
          this.say(pick(['*becomes loaf*', '*maximum cozy*', '*loaf mode activated*']));
          this._setState('idle');
          break;

        case 'zoomies': // dog
          this._setState('zoomies');
          this.say(pick(['*ZOOMIES!!!*', 'GOTTA GO FAST', '*NYOOM*', '*zoom zoom zoom*']));
          // Actually move fast
          const zoomDir = this.dir;
          let zf = 0;
          const zoom = () => {
            if (zf > 40) { this._setState('idle'); this.say('*pant pant*'); return; }
            zf++;
            this.x += zoomDir * 4;
            if (this.x < 10 || this.x > window.innerWidth - C.size - 10) {
              this.x = Math.max(10, Math.min(window.innerWidth - C.size - 10, this.x));
              this._setState('idle');
              return;
            }
            this.el.style.left = this.x + 'px';
            if (Math.random() < 0.1) this._leavePaw();
            requestAnimationFrame(zoom);
          };
          requestAnimationFrame(zoom);
          break;

        case 'rolling': // dog
          this._setState('rolling');
          this.say(pick(['*rolls over*', '*belly up!*', '*wiggles*', 'Rub my belly?']));
          setTimeout(() => this._setState('idle'), 1200);
          break;

        case 'fetching': // dog
          this.say(pick(['*brings you a ball*', '🎾 Fetch?', '*drops toy at your feet*', '*proud face*']));
          this._spawnParticle(this.x + 28, 50, '🎾');
          this._setState('happy');
          setTimeout(() => this._setState('idle'), 2000);
          break;

        case 'tailwag': // dog
          this.say(pick(['*wag wag wag*', '*tail goes brrr*', '*happiness intensifies*']));
          this._setState('happy');
          setTimeout(() => this._setState('idle'), 1500);
          break;

        case 'singing': // bird
          this._setState('happy');
          this.say(pick(['*sings*', 'La la la~', 'Tweet tweet tweet~', '*beautiful melody*']));
          // Spawn musical notes
          for (let i = 0; i < 4; i++) {
            setTimeout(() => {
              const note = document.createElement('div');
              note.className = 'pet-note';
              note.textContent = pick(['🎵', '🎶', '♪', '♫']);
              note.style.left = (this.x + 28 + rand(-10, 10)) + 'px';
              note.style.top = (10 + rand(0, 20)) + 'px';
              document.body.appendChild(note);
              setTimeout(() => note.remove(), 2200);
            }, i * 400);
          }
          setTimeout(() => this._setState('idle'), 2500);
          break;

        case 'flying': // bird
          this.ctrl.launchFlyby(this.type);
          this.say(pick(['*takes off!*', 'Wheee!', '*flutter flutter*']));
          this._setState('idle');
          break;

        case 'perching': // bird
          this._tryPerchOnCell();
          break;

        case 'headtilt': // bird
          this._setState('head-tilt');
          this.say(pick(['*tilts head*', 'Hmm?', '*curious*', '*stares at code*']));
          setTimeout(() => this._setState('idle'), 2000);
          break;

        case 'binky': // bunny
          this._setState('happy');
          this.say(pick(['*BINKY!*', '*boing boing*', '*popcorn jump!*', '*pure joy!*']));
          setTimeout(() => this._setState('idle'), 1500);
          break;

        case 'nosewiggle': // bunny
          this.say(pick(['*wiggle wiggle*', '*sniff sniff sniff*', '*nose goes brrrr*']));
          this._setState('idle');
          break;

        case 'thumping': // bunny
          this.say(pick(['*THUMP*', '*stamps foot*', '*thump thump*', 'Hey!']));
          this._setState('idle');
          break;

        case 'cheekstuff': // hamster
          this.say(pick(['*stuffs cheeks*', '*cheeks: FULL*', '*so much food*', '*hamster.zip*']));
          this._setState('happy');
          setTimeout(() => this._setState('idle'), 1500);
          break;

        case 'wheelrun': // hamster
          this.say(pick(['*runs on wheel*', '*squeak squeak squeak*', '*hamster.exe running*']));
          this._setState('chasing');
          setTimeout(() => { this._setState('idle'); this.say('*tiny pant*'); }, 2000);
          break;

        case 'waddle': // hamster
          this.say(pick(['*waddle waddle*', '*chubby walk*', '*round boy moving*']));
          this._walk();
          break;

        default:
          this._setState('idle');
      }
    }

    // ── Perch on Code Cells ──
    _tryPerchOnCell() {
      const cells = document.querySelectorAll(
        '.cell, .code-cell, [class*="cell-"], .jp-Cell, .notebook-cell-list > div'
      );
      if (cells.length === 0) return;

      const cell = pick([...cells].slice(0, 10)); // pick from visible cells
      const rect = cell.getBoundingClientRect();

      if (rect.top < 0 || rect.bottom > window.innerHeight) return; // off screen

      // Move pet to perch on top of the cell
      this.isPerched = true;
      this.el.style.position = 'fixed';
      this.el.style.top = (rect.top - 50) + 'px';
      this.el.style.left = (rect.left + rand(20, Math.min(200, rect.width - 60))) + 'px';
      this._setState('perched');

      this.say(pick([
        '*sits on your code*',
        '*supervising*',
        'Nice code!',
        '*judges silently*',
        'I help!',
        '*quality assurance*',
        this.type === 'bird' ? '*perches*' : '*sits*',
        this.type === 'cat' ? '*sits on keyboard*' : '*watches intently*',
        'Mayank would be proud!',
        'You\'re doing so well!',
      ]));

      // Return to top bar after a while
      setTimeout(() => {
        this.isPerched = false;
        this.el.style.position = 'absolute';
        this.el.style.top = '8px';
        this.el.style.left = this.x + 'px';
        this._setState('idle');
        if (this.type === 'bird') this.say(pick(['*hops back up*', '*flutter*']));
      }, rand(4000, 8000));
    }

    // ── Speech ──
    say(text) {
      this.bubble.textContent = text;
      this.bubble.classList.add('visible');
      clearTimeout(this._speechTimer);
      this._speechTimer = setTimeout(() => this.bubble.classList.remove('visible'), C.speechDuration);
    }

    // ── Mood ──
    _startMoodDecay() {
      this._moodInt = setInterval(() => {
        this.mood = Math.max(0, this.mood - 0.5);
        this._updateMood();
      }, 8000);
    }

    _updateMood() {
      const m = this.mood;
      this.moodEl.textContent = m >= 80 ? '😊' : m >= 60 ? '🙂' : m >= 40 ? '😐' : m >= 20 ? '😢' : '😞';
    }

    // ── Code Reactions ──
    onCodeSuccess() {
      this.mood = Math.min(100, this.mood + 8);
      this._updateMood();
      this._setState('happy');
      this.say(pick(this.data.happySounds));
      if (this.type === 'bird') {
        // Bird sings on success
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const n = document.createElement('div');
            n.className = 'pet-note';
            n.textContent = pick(['🎵', '🎶', '♪']);
            n.style.left = (this.x + 28 + rand(-10, 10)) + 'px';
            n.style.top = (10 + rand(0, 15)) + 'px';
            document.body.appendChild(n);
            setTimeout(() => n.remove(), 2200);
          }, i * 300);
        }
      }
      setTimeout(() => { if (this.state === 'happy') this._setState('idle'); }, 2500);
    }

    onCodeError() {
      this.mood = Math.max(0, this.mood - 5);
      this._updateMood();
      this._setState('sad');
      this.say(pick(this.data.sadSounds));
      setTimeout(() => { if (this.state === 'sad') this._setState('idle'); }, 3000);
    }

    // ── Cleanup ──
    destroy() {
      clearTimeout(this._behaviorTimer);
      clearTimeout(this._speechTimer);
      clearTimeout(this._blinkTimer);
      clearInterval(this._moodInt);
      cancelAnimationFrame(this._animFrame);
      this.el.remove();
    }
  }

  // ─── MAIN CONTROLLER ─────────────────────────────────
  class ColabPets {
    constructor() {
      this.pets = [];
      this._buildLayers();
      this._loadPrefs().then(() => {
        if (this._savedPets.length === 0) {
          this.addPet('cat');
        } else {
          this._savedPets.forEach(t => this.addPet(t));
        }
      });
      this._watchCode();
      this._listenMessages();
      this._startFlyTimer();
      this._startLoveMessages();
      console.log('%c🐾 Colab Pets loaded! Mayank loves you!', 'font-size:14px; color:#FF6B9D;');
    }

    _buildLayers() {
      this.ground = document.createElement('div');
      this.ground.id = 'colab-pets-container';
      document.body.appendChild(this.ground);

      this.sky = document.createElement('div');
      this.sky.id = 'colab-pets-sky';
      document.body.appendChild(this.sky);
    }

    // ── Pet Management ──
    addPet(type) {
      if (!ANIMALS[type] || this.pets.length >= C.maxPets) return;
      const pet = new Pet(type, this);
      this.pets.push(pet);
      this._savePrefs();
      return pet;
    }

    removePet(type) {
      const i = this.pets.findIndex(p => p.type === type);
      if (i !== -1) { this.pets[i].destroy(); this.pets.splice(i, 1); this._savePrefs(); }
    }

    removeAll() {
      this.pets.forEach(p => p.destroy());
      this.pets = [];
      this._savePrefs();
    }

    // ── Flying Birds ──
    _startFlyTimer() {
      const scheduleFly = () => {
        this._flyTimer = setTimeout(() => {
          // Only fly if there's a bird pet active
          const hasBird = this.pets.some(p => p.data.canFly);
          if (hasBird) this.launchFlyby('bird');
          scheduleFly();
        }, rand(C.flyInterval.min, C.flyInterval.max));
      };
      scheduleFly();
    }

    // ── Love & Encouragement Messages ──
    _startLoveMessages() {
      const schedule = () => {
        this._loveTimer = setTimeout(() => {
          if (this.pets.length > 0) {
            const pet = pick(this.pets);
            // Alternate between love msgs from Mayank and encouragement
            const isLove = Math.random() > 0.4;
            const msg = isLove ? pick(LOVE_MSGS) : pick(ENCOURAGE_MSGS);
            pet.say(msg);

            // Spawn a little heart or sparkle with it
            if (isLove) {
              const rect = pet.el.getBoundingClientRect();
              for (let i = 0; i < 2; i++) {
                setTimeout(() => {
                  pet._spawnParticle(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    pick(['💝', '💌', '✨', '🥰', '💕'])
                  );
                }, i * 200);
              }
            }
          }
          schedule();
        }, rand(C.loveMessageInterval.min, C.loveMessageInterval.max));
      };
      // First love message after 8-15 seconds
      this._loveTimer = setTimeout(() => {
        if (this.pets.length > 0) {
          const pet = pick(this.pets);
          pet.say(pick(['Mayank loves you!', 'Mayank says hi!', 'You\'re the best! -Mayank']));
          const rect = pet.el.getBoundingClientRect();
          pet._spawnParticle(rect.left + rect.width / 2, rect.top + 20, '💝');
        }
        schedule();
      }, rand(8000, 15000));
    }

    launchFlyby(type) {
      const data = ANIMALS[type];
      if (!data || !data.flySvg) return;

      const bird = document.createElement('div');
      bird.className = 'flying-bird';

      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? -60 : window.innerWidth + 60;
      const endX = fromLeft ? window.innerWidth + 60 : -60;
      const startY = rand(40, window.innerHeight * 0.4);
      const midY = startY + rand(-80, -30); // arc upward

      bird.innerHTML = `<div class="pet-body">${data.flySvg}</div>`;
      if (!fromLeft) bird.querySelector('.pet-body').style.transform = 'scaleX(-1)';

      bird.style.left = startX + 'px';
      bird.style.top = startY + 'px';
      this.sky.appendChild(bird);

      const duration = rand(4000, 7000);
      const startTime = Date.now();

      const animate = () => {
        const t = (Date.now() - startTime) / duration;
        if (t >= 1) { bird.remove(); return; }

        // Bezier-like arc
        const x = startX + (endX - startX) * t;
        const y = startY + (midY - startY) * Math.sin(t * Math.PI) + Math.sin(t * Math.PI * 3) * 8;

        bird.style.left = x + 'px';
        bird.style.top = y + 'px';
        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }

    // ── Confetti Party ──
    throwConfetti() {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FF3', '#FFB8D0'];
      for (let i = 0; i < 60; i++) {
        setTimeout(() => {
          const c = document.createElement('div');
          c.className = 'pet-confetti';
          c.style.left = rand(0, window.innerWidth) + 'px';
          c.style.top = '-10px';
          c.style.backgroundColor = pick(colors);
          c.style.width = rand(4, 10) + 'px';
          c.style.height = rand(4, 10) + 'px';
          c.style.animationDuration = rand(1.8, 3.5) + 's';
          document.body.appendChild(c);
          setTimeout(() => c.remove(), 4000);
        }, i * 25);
      }
      this.pets.forEach(p => {
        p.say(pick(['PARTY!!', 'WOOHOO!', '*dances*', 'YAY!!']));
        p._setState('happy');
      });
    }

    // ── Code Execution Watching ──
    _watchCode() {
      const obs = new MutationObserver(muts => {
        for (const m of muts) {
          for (const node of m.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;

            const text = node.textContent || '';
            const isErr = node.classList?.contains('error') ||
              node.querySelector?.('.error-message, .traceback, .stderr') ||
              text.includes('Traceback') || text.includes('Error:');

            const isOut = node.classList?.contains('output') ||
              node.classList?.contains('cell-output') ||
              node.querySelector?.('.output_area, .output_subarea');

            if (isErr) {
              this.pets.forEach(p => p.onCodeError());
            } else if (isOut) {
              if (Math.random() > 0.5) this.pets.forEach(p => p.onCodeSuccess());
            }
          }
        }
      });

      const target = document.querySelector('#main, .notebook-container, #notebook-container, body');
      if (target) obs.observe(target, { childList: true, subtree: true });

      // Jupyter kernel events
      try {
        if (window.Jupyter) {
          window.Jupyter.notebook.events.on('shell_reply.Kernel', (_, data) => {
            if (data.reply.content.status === 'error') {
              this.pets.forEach(p => p.onCodeError());
            } else if (Math.random() > 0.5) {
              this.pets.forEach(p => p.onCodeSuccess());
            }
          });
        }
      } catch (e) {}
    }

    // ── Preferences ──
    async _loadPrefs() {
      this._savedPets = ['cat'];
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const r = await chrome.storage.sync.get(['activePets', 'petNames']);
          if (r.activePets) this._savedPets = r.activePets;
          if (r.petNames) Object.entries(r.petNames).forEach(([t, n]) => { if (ANIMALS[t]) ANIMALS[t].name = n; });
        }
      } catch (e) {}
    }

    _savePrefs() {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.sync.set({ activePets: this.pets.map(p => p.type) });
        }
      } catch (e) {}
    }

    // ── Message Handling ──
    _listenMessages() {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener((msg, _, respond) => {
          switch (msg.action) {
            case 'addPet': this.addPet(msg.type); break;
            case 'removePet': this.removePet(msg.type); break;
            case 'removeAll': this.removeAll(); break;
            case 'party': this.throwConfetti(); break;
            case 'renamePet':
              const pet = this.pets.find(p => p.type === msg.type);
              if (pet) {
                pet.name = msg.name;
                pet.el.querySelector('.pet-nametag').textContent = msg.name;
                ANIMALS[msg.type].name = msg.name;
                try { chrome.storage.sync.get(['petNames'], r => {
                  const n = r.petNames || {}; n[msg.type] = msg.name;
                  chrome.storage.sync.set({ petNames: n });
                }); } catch (e) {}
              }
              break;
          }
          respond({ ok: true });
        });
      }
    }
  }

  // ─── BOOT ─────────────────────────────────────────────
  if (document.readyState === 'complete') {
    window.__colabPets = new ColabPets();
  } else {
    window.addEventListener('load', () => { window.__colabPets = new ColabPets(); });
  }
})();
