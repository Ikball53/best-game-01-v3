// battle.js — the combat rules of Emberfall Saga: party, waves, speed turn order,
// skills, items, telegraphs, buffs and the boss's big attack. Pure logic; rendering
// lives in render.js and sound cues are queued here for main.js to play.

export const HERO_DEFS = [
  {
    id: 'kael', name: 'Kael', role: 'Flame Knight', sprite: 'kael', color: '#e74c3c',
    maxHp: 320, maxMp: 60, spd: 12, atk: 34,
    skills: [
      { name: 'Ember Slash', cost: 12, mult: 1.6, kind: 'dmg', target: 'enemy', element: 'fire', desc: '1.6x fire damage' },
      { name: 'Rally', cost: 10, mult: 0, kind: 'buffDef', target: 'self', element: 'buff', desc: 'Party DEF up, 3 turns' },
      { name: 'Blazing Rush', cost: 25, mult: 2.4, kind: 'dmg', target: 'enemy', element: 'fire', desc: '2.4x fire damage' },
    ],
  },
  {
    id: 'lyra', name: 'Lyra', role: 'Moon Archer', sprite: 'lyra', color: '#2ecc71',
    maxHp: 240, maxMp: 80, spd: 16, atk: 30,
    skills: [
      { name: 'Piercing Shot', cost: 8, mult: 1.5, kind: 'dmg', target: 'enemy', element: 'pierce', desc: '1.5x damage' },
      { name: 'Twin Arrows', cost: 14, mult: 0.85, kind: 'dmgMulti', target: 'enemy', element: 'pierce', desc: '2 hits, 0.85x each' },
      { name: 'Moonlit Volley', cost: 22, mult: 1.1, kind: 'dmgAll', target: 'enemy', element: 'moon', desc: 'Hits all enemies' },
    ],
  },
  {
    id: 'mira', name: 'Mira', role: 'Storm Mage', sprite: 'mira', color: '#9b59b6',
    maxHp: 200, maxMp: 120, spd: 14, atk: 32,
    skills: [
      { name: 'Spark Lance', cost: 10, mult: 1.7, kind: 'dmg', target: 'enemy', element: 'zap', desc: '1.7x lightning' },
      { name: 'Chain Lightning', cost: 20, mult: 1.2, kind: 'dmgAll', target: 'enemy', element: 'zap', desc: 'Hits all, 1.2x' },
      { name: 'Frost Nova', cost: 16, mult: 1.0, kind: 'slow', target: 'enemy', element: 'frost', desc: '1.0x + slows target' },
    ],
  },
  {
    id: 'bram', name: 'Bram', role: 'Dawn Cleric', sprite: 'bram', color: '#f1c40f',
    maxHp: 280, maxMp: 100, spd: 10, atk: 26,
    skills: [
      { name: 'Mend', cost: 12, mult: 0, kind: 'heal', target: 'ally', element: 'heal', desc: 'Heal ally 40% HP' },
      { name: 'Sacred Ward', cost: 14, mult: 0, kind: 'shield', target: 'ally', element: 'heal', desc: 'Shield an ally' },
      { name: 'Smite', cost: 18, mult: 2.0, kind: 'dmg', target: 'enemy', element: 'holy', desc: '2.0x holy damage' },
    ],
  },
];

export const ENEMY_DEFS = {
  bat: { name: 'Dusk Bat', sprite: 'bat', scale: 5, maxHp: 90, atk: 16, spd: 15, move: 'Wing Slash', xp: 1 },
  wolf: { name: 'Thorn Wolf', sprite: 'wolf', scale: 5, maxHp: 150, atk: 22, spd: 11, move: 'Savage Bite', xp: 1 },
  boss: { name: 'Gloomfang', sprite: 'boss', scale: 6, maxHp: 520, atk: 30, spd: 13, move: 'Shadow Pounce', xp: 1, isBoss: true },
};

export const WAVES = [
  [{ type: 'bat' }, { type: 'bat' }, { type: 'wolf' }],
  [{ type: 'wolf' }, { type: 'wolf' }, { type: 'wolf' }, { type: 'bat' }],
  [{ type: 'boss' }, { type: 'bat' }],
];

// Fixed stage slots (canvas 1280x720). Heroes left, enemies right, ground near y=470.
export const ENEMY_SLOTS = [
  { x: 950, y: 300 }, { x: 840, y: 390 }, { x: 990, y: 430 }, { x: 800, y: 300 },
];
export const HERO_SLOTS = [
  { x: 150, y: 300 }, { x: 300, y: 380 }, { x: 170, y: 430 }, { x: 380, y: 300 },
];

export function makeHero(def) {
  return {
    ...def, hp: def.maxHp, mp: def.maxMp, dead: false,
    defending: false, shield: 0, slowed: false, flash: 0, kind: 'hero',
  };
}

export function makeEnemy(type, slot) {
  const def = ENEMY_DEFS[type];
  return {
    ...def, type, hp: def.maxHp, dead: false, flash: 0, kind: 'enemy',
    x: slot.x, y: slot.y, telegraph: def.move, nextBig: false, bigCount: 0, slowed: false,
  };
}

export function createBattle() {
  const b = {
    wave: 0,
    heroes: HERO_DEFS.map(makeHero),
    enemies: [],
    queue: [],
    qi: 0,
    phase: 'idle', // idle | heroWait | enemyWait | anim | waveClear | won | lost
    timer: 0,
    potions: 3,
    defUpTurns: 0,
    turnCount: 0,
    damageDealt: 0,
    startedAt: 0,
    note: '',
    noteT: 0,
    floaters: [],
    particles: [],
    anim: null,
    sfxQueue: [],
    skillFlash: null,
  };
  return b;
}

export function aliveHeroes(b) { return b.heroes.filter((h) => !h.dead); }
export function aliveEnemies(b) { return b.enemies.filter((e) => !e.dead); }
export function currentUnit(b) { return b.queue[b.qi] || null; }

export function effSpd(u) { return u.slowed ? Math.max(1, Math.floor(u.spd / 2)) : u.spd; }

export function buildQueue(b) {
  const all = [...aliveHeroes(b), ...aliveEnemies(b)];
  all.sort((a, c) => effSpd(c) - effSpd(a) || (a.kind === 'hero' ? -1 : 1));
  b.queue = all;
  b.qi = 0;
}

export function startWave(b, idx) {
  b.wave = idx;
  b.enemies = WAVES[idx].map((w, i) => makeEnemy(w.type, ENEMY_SLOTS[i]));
  b.floaters = [];
  b.particles = [];
  b.anim = null;
  buildQueue(b);
  b.qi = -1; // advanceTurn() increments first, so -1 lets the fastest unit act first
  b.phase = 'idle';
  b.timer = 0.4;
  b.note = idx === 2 ? 'Final Wave — Gloomfang, Alpha of the Nightpack' : 'Wave ' + (idx + 1) + ' of 3';
  b.noteT = 2.2;
}

export function startBattle(b) {
  b.heroes = HERO_DEFS.map(makeHero);
  b.potions = 3;
  b.defUpTurns = 0;
  b.turnCount = 0;
  b.damageDealt = 0;
  b.startedAt = Date.now();
  startWave(b, 0);
}

function addFloater(b, x, y, text, color) {
  b.floaters.push({ x, y, text, color, t: 0, dur: 1.1 });
}

function burst(b, x, y, color, n, speed = 160) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    b.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, color, size: 2 + Math.random() * 4, t: 0, dur: 0.5 + Math.random() * 0.4 });
  }
}

function unitPos(u) {
  if (u.kind === 'hero') {
    const i = u.id === 'kael' ? 0 : u.id === 'lyra' ? 1 : u.id === 'mira' ? 2 : 3;
    return HERO_SLOTS[i];
  }
  return { x: u.x, y: u.y };
}

function centerOf(u) {
  const p = unitPos(u);
  return { x: p.x + 40, y: p.y + 30 };
}

export function dealDamage(b, target, raw, element) {
  let dmg = Math.round(raw * (0.9 + Math.random() * 0.2));
  let crit = false;
  if (Math.random() < 0.1) { dmg = Math.round(dmg * 1.5); crit = true; }
  if (target.defending) dmg = Math.max(1, Math.round(dmg * 0.5));
  if (target.kind === 'hero' && b.defUpTurns > 0) dmg = Math.max(1, Math.round(dmg * 0.7));
  if (target.shield > 0) {
    const absorbed = Math.min(target.shield, dmg);
    target.shield -= absorbed;
    dmg -= absorbed;
  }
  target.hp = Math.max(0, target.hp - dmg);
  target.flash = 0.35;
  const c = centerOf(target);
  addFloater(b, c.x, c.y - 20, (crit ? 'CRIT ' : '') + dmg, crit ? '#ffd54a' : element === 'heal' ? '#7CFC9A' : '#ffffff');
  burst(b, c.x, c.y, element === 'fire' ? '#ff7043' : element === 'zap' ? '#ffee58' : element === 'frost' ? '#80d8ff' : element === 'holy' ? '#fff176' : '#ff8a80', crit ? 16 : 9);
  if (target.hp <= 0) {
    target.dead = true;
    burst(b, c.x, c.y, '#b0bec5', 22, 220);
  }
  return dmg;
}

function healUnit(b, target, amount) {
  const healed = Math.min(target.maxHp - target.hp, amount);
  target.hp += healed;
  const c = centerOf(target);
  addFloater(b, c.x, c.y - 20, '+' + healed, '#7CFC9A');
  burst(b, c.x, c.y, '#7CFC9A', 12, 90);
  return healed;
}

function checkEnd(b) {
  if (aliveEnemies(b).length === 0) {
    if (b.wave >= 2) {
      b.phase = 'won';
      b.sfxQueue.push('win');
    } else {
      b.phase = 'waveClear';
      b.timer = 1.5;
      b.note = 'Wave cleared!';
      b.noteT = 1.5;
      b.sfxQueue.push('waveClear');
      aliveHeroes(b).forEach((h) => {
        h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * 0.15));
        h.mp = Math.min(h.maxMp, h.mp + Math.round(h.maxMp * 0.2));
      });
    }
    return true;
  }
  if (aliveHeroes(b).length === 0) {
    b.phase = 'lost';
    b.sfxQueue.push('lose');
    return true;
  }
  return false;
}

// --- Hero actions (called from the menu) ---
export function heroAttack(b, hero, target) {
  if (!target || target.dead) return false;
  b.turnCount++;
  b.anim = { kind: 'attack', actor: hero, target, t: 0, dur: 0.55, element: 'slash', applied: false };
  b.phase = 'anim';
  return true;
}

export function heroSkill(b, hero, skill, target) {
  if (hero.mp < skill.cost) return false;
  if ((skill.target === 'enemy' || skill.target === 'ally') && (!target || target.dead)) return false;
  hero.mp -= skill.cost;
  b.turnCount++;
  b.anim = { kind: 'skill', actor: hero, target, skill, t: 0, dur: 0.7, element: skill.element, applied: false };
  b.phase = 'anim';
  b.skillFlash = { name: skill.name, hero: hero.name, t: 0, dur: 0.9 };
  return true;
}

export function heroDefend(b, hero) {
  b.turnCount++;
  hero.defending = true;
  b.sfxQueue.push('buff');
  const c = centerOf(hero);
  addFloater(b, c.x, c.y - 20, 'Defend', '#80d8ff');
  advanceTurn(b);
  return true;
}

export function heroItem(b, hero, target) {
  if (b.potions <= 0 || !target || target.dead) return false;
  b.potions--;
  b.turnCount++;
  healUnit(b, target, Math.round(target.maxHp * 0.35));
  b.sfxQueue.push('heal');
  advanceTurn(b);
  return true;
}

function applyAnimHit(b) {
  const a = b.anim;
  if (!a || a.applied) return;
  a.applied = true;
  const actor = a.actor;
  if (a.kind === 'attack') {
    const dmg = dealDamage(b, a.target, actor.atk, 'slash');
    if (actor.kind === 'hero') b.damageDealt += dmg;
    b.sfxQueue.push(a.target.kind === 'hero' ? 'hurt' : 'thud');
  } else if (a.kind === 'skill') {
    const s = a.skill;
    const sfxMap = { fire: 'fire', zap: 'zap', frost: 'frost', holy: 'zap', heal: 'heal', buff: 'buff', pierce: 'slash', moon: 'slash' };
    b.sfxQueue.push(sfxMap[s.element] || 'slash');
    if (s.kind === 'dmg') {
      const dmg = dealDamage(b, a.target, actor.atk * s.mult, s.element);
      if (actor.kind === 'hero') b.damageDealt += dmg;
    } else if (s.kind === 'dmgMulti') {
      let total = 0;
      total += dealDamage(b, a.target, actor.atk * s.mult, s.element);
      if (!a.target.dead) total += dealDamage(b, a.target, actor.atk * s.mult, s.element);
      if (actor.kind === 'hero') b.damageDealt += total;
    } else if (s.kind === 'dmgAll') {
      aliveEnemies(b).forEach((e) => { b.damageDealt += dealDamage(b, e, actor.atk * s.mult, s.element); });
    } else if (s.kind === 'slow') {
      const dmg = dealDamage(b, a.target, actor.atk * s.mult, s.element);
      if (actor.kind === 'hero') b.damageDealt += dmg;
      a.target.slowed = true;
      addFloater(b, centerOf(a.target).x, centerOf(a.target).y - 44, 'Slowed', '#80d8ff');
    } else if (s.kind === 'heal') {
      healUnit(b, a.target, Math.round(a.target.maxHp * 0.4));
    } else if (s.kind === 'shield') {
      a.target.shield = 70;
      const c = centerOf(a.target);
      addFloater(b, c.x, c.y - 20, 'Ward +70', '#80d8ff');
      burst(b, c.x, c.y, '#80d8ff', 12, 90);
    } else if (s.kind === 'buffDef') {
      b.defUpTurns = 3;
      aliveHeroes(b).forEach((h) => {
        const c = centerOf(h);
        addFloater(b, c.x, c.y - 20, 'Rally!', '#ffd54a');
      });
    }
  } else if (a.kind === 'enemy') {
    if (a.aoe) {
      aliveHeroes(b).forEach((h) => dealDamage(b, h, actor.atk * 1.6, 'shadow'));
    } else {
      dealDamage(b, a.target, actor.atk, 'shadow');
    }
    b.sfxQueue.push('hurt');
  }
}

// --- Enemy turns ---
export function enemyAct(b, enemy) {
  const heroes = aliveHeroes(b);
  if (heroes.length === 0) return;
  let aoe = false;
  if (enemy.isBoss) {
    if (enemy.nextBig) {
      aoe = true;
      enemy.nextBig = false;
      enemy.bigCount = 0;
      enemy.telegraph = 'Shadow Pounce';
    } else {
      enemy.bigCount++;
      if (enemy.bigCount >= 2) {
        enemy.nextBig = true;
        enemy.telegraph = 'Night Howl — next turn!';
      }
    }
  }
  const target = heroes[Math.floor(Math.random() * heroes.length)];
  b.anim = { kind: 'enemy', actor: enemy, target, aoe, t: 0, dur: 0.6, element: 'shadow', applied: false };
  b.phase = 'anim';
  if (aoe) b.skillFlash = { name: 'Night Howl', hero: 'Gloomfang', t: 0, dur: 0.9 };
}

export function advanceTurn(b) {
  if (checkEnd(b)) return;
  b.qi++;
  while (b.qi < b.queue.length && b.queue[b.qi].dead) b.qi++;
  if (b.qi >= b.queue.length) {
    if (b.defUpTurns > 0) b.defUpTurns--;
    buildQueue(b);
  }
  const u = currentUnit(b);
  if (!u) { b.phase = 'idle'; return; }
  if (u.kind === 'hero') {
    u.defending = false;
    b.phase = 'heroWait';
  } else {
    b.phase = 'enemyWait';
    b.timer = 0.75;
    // Refresh telegraphs for the enemies that are not the boss's big warning.
    b.enemies.forEach((e) => {
      if (!e.dead && !e.isBoss) e.telegraph = ENEMY_DEFS[e.type].move;
      if (!e.dead && e.isBoss && !e.nextBig) e.telegraph = 'Shadow Pounce';
    });
  }
}

export function updateBattle(b, dt) {
  // Floaters and particles always animate.
  b.floaters = b.floaters.filter((f) => { f.t += dt; return f.t < f.dur; });
  b.particles = b.particles.filter((p) => {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 320 * dt;
    return p.t < p.dur;
  });
  b.heroes.forEach((h) => { if (h.flash > 0) h.flash -= dt; });
  b.enemies.forEach((e) => { if (e.flash > 0) e.flash -= dt; });
  if (b.skillFlash) {
    b.skillFlash.t += dt;
    if (b.skillFlash.t >= b.skillFlash.dur) b.skillFlash = null;
  }
  if (b.noteT > 0) b.noteT -= dt;

  if (b.phase === 'idle') {
    b.timer -= dt;
    if (b.timer <= 0) advanceTurn(b);
  } else if (b.phase === 'enemyWait') {
    b.timer -= dt;
    if (b.timer <= 0) enemyAct(b, currentUnit(b));
  } else if (b.phase === 'anim') {
    const a = b.anim;
    if (a) {
      a.t += dt;
      if (!a.applied && a.t >= a.dur * 0.45) applyAnimHit(b);
      if (a.t >= a.dur) {
        b.anim = null;
        advanceTurn(b);
      }
    }
  } else if (b.phase === 'waveClear') {
    b.timer -= dt;
    if (b.timer <= 0) startWave(b, b.wave + 1);
  }
}

export function battleStats(b) {
  const secs = Math.max(1, Math.round((Date.now() - b.startedAt) / 1000));
  return {
    turns: b.turnCount,
    damage: b.damageDealt,
    time: secs,
    standing: aliveHeroes(b).length,
  };
}
