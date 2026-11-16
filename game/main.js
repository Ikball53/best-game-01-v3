// main.js — wires Emberfall Saga together: the game loop, the action menu state,
// click/zone dispatch, keyboard shortcuts, sound, and the harmless URL hooks
// used only for screenshots and automated playtests (?shot=, ?autoplay=, ?debuglose=).
// Normal play never needs a URL parameter.

import { createBattle, startBattle, startWave, heroAttack, heroSkill, heroDefend, heroItem, updateBattle, currentUnit, aliveEnemies, aliveHeroes, battleStats, advanceTurn } from './battle.js';
import { renderGame } from './render.js';
import { attachInput } from './input.js';
import { SoundFX } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sfx = new SoundFX();

const g = {
  screen: 'start', // start | battle | win | lose
  battle: createBattle(),
  menu: { mode: 'main', skill: null, selIdx: 0 },
  hover: null,
  zones: [],
  endStats: null,
  muted: false,
  time: 0,
};

function resetMenu() {
  g.menu = { mode: 'main', skill: null, selIdx: 0 };
}

function startGame() {
  startBattle(g.battle);
  g.screen = 'battle';
  resetMenu();
  g.endStats = null;
  sfx.ensure();
  sfx.startAmbient();
  sfx.click();
}

function endGame(won) {
  g.screen = won ? 'win' : 'lose';
  g.endStats = battleStats(g.battle);
  resetMenu();
}

function currentHero() {
  const u = currentUnit(g.battle);
  return u && u.kind === 'hero' && g.battle.phase === 'heroWait' ? u : null;
}

function doAttack(target) {
  const hero = currentHero();
  if (!hero) return;
  if (heroAttack(g.battle, hero, target)) resetMenu();
}

function doSkill(target) {
  const hero = currentHero();
  const skill = g.menu.skill;
  if (!hero || !skill) return;
  if (heroSkill(g.battle, hero, skill, target)) resetMenu();
}

function doItem(target) {
  const hero = currentHero();
  if (!hero) return;
  if (heroItem(g.battle, hero, target)) resetMenu();
}

function handleZone(id) {
  const b = g.battle;
  if (g.screen === 'start') {
    if (id === 'start') startGame();
    return;
  }
  if (g.screen === 'win' || g.screen === 'lose') {
    if (id === 'again') startGame();
    if (id === 'menu') { g.screen = 'start'; resetMenu(); }
    return;
  }
  // Battle screen.
  const hero = currentHero();
  if (!hero) return;
  if (id === 'act-attack') {
    g.menu.mode = 'target';
    g.menu.selIdx = 0;
    sfx.click();
  } else if (id === 'act-skills') {
    g.menu.mode = 'skills';
    g.menu.selIdx = 0;
    sfx.click();
  } else if (id === 'act-item') {
    g.menu.mode = 'item';
    sfx.click();
  } else if (id === 'act-defend') {
    heroDefend(b, hero);
    resetMenu();
  } else if (id === 'back') {
    resetMenu();
    sfx.click();
  } else if (id.startsWith('skill-')) {
    const skill = hero.skills[Number(id.slice(6))];
    if (!skill || hero.mp < skill.cost) return;
    if (skill.target === 'self') {
      if (heroSkill(b, hero, skill, hero)) resetMenu();
    } else {
      g.menu.skill = skill;
      g.menu.mode = 'skills-target';
      g.menu.selIdx = 0;
      sfx.click();
    }
  } else if (id === 'use-potion') {
    g.menu.mode = 'item-target';
    g.menu.selIdx = 0;
    sfx.click();
  } else if (id.startsWith('enemy-')) {
    const e = b.enemies[Number(id.slice(6))];
    if (!e || e.dead) return;
    if (g.menu.mode === 'target') doAttack(e);
    else if (g.menu.mode === 'skills-target' && g.menu.skill && g.menu.skill.target === 'enemy') doSkill(e);
  } else if (id.startsWith('ally-')) {
    const h = b.heroes[Number(id.slice(5))];
    if (!h || h.dead) return;
    if (g.menu.mode === 'item-target') doItem(h);
    else if (g.menu.mode === 'skills-target' && g.menu.skill && g.menu.skill.target === 'ally') doSkill(h);
  }
}

function zoneAt(p) {
  for (let i = g.zones.length - 1; i >= 0; i--) {
    const z = g.zones[i];
    if (p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h) return z;
  }
  return null;
}

function toggleMute() {
  g.muted = !g.muted;
  sfx.setMuted(g.muted);
  const btn = document.getElementById('btn-mute');
  if (btn) btn.textContent = g.muted ? 'Sound: Off' : 'Sound: On';
}

attachInput(canvas, {
  onTap(p) {
    const z = zoneAt(p);
    if (z) { handleZone(z.id); return; }
    // Tapping a hero sprite while an ally-target is pending selects them.
    if (g.menu.mode === 'item-target' || g.menu.mode === 'skills-target') {
      const b = g.battle;
      for (let i = 0; i < b.heroes.length; i++) {
        const h = b.heroes[i];
        if (h.dead) continue;
        const slot = [{ x: 150, y: 300 }, { x: 300, y: 380 }, { x: 170, y: 430 }, { x: 380, y: 300 }][i];
        if (p.x >= slot.x - 10 && p.x <= slot.x + 110 && p.y >= slot.y - 10 && p.y <= slot.y + 110) {
          handleZone('ally-' + i);
          return;
        }
      }
    }
  },
  onHover(p) {
    const z = zoneAt(p);
    g.hover = z ? z.id : null;
  },
  onActionKey(n) {
    if (g.screen === 'start' && n === 1) { startGame(); return; }
    if (g.screen !== 'battle') return;
    const hero = currentHero();
    if (!hero) return;
    if (g.menu.mode === 'main') {
      if (n === 1) handleZone('act-attack');
      else if (n === 2) handleZone('act-skills');
      else if (n === 3) handleZone('act-item');
      else if (n === 4) handleZone('act-defend');
    } else if (g.menu.mode === 'skills' && n >= 1 && n <= 3) {
      handleZone('skill-' + (n - 1));
    } else if (g.menu.mode === 'item' && n === 1) {
      handleZone('use-potion');
    }
  },
  onConfirm() {
    if (g.screen === 'start') { startGame(); return; }
    if (g.screen === 'win' || g.screen === 'lose') { startGame(); return; }
    // Enter in a target mode picks the currently cycled enemy.
    if (g.menu.mode === 'target' || g.menu.mode === 'skills-target') {
      const foes = aliveEnemies(g.battle);
      if (foes.length) {
        const e = foes[g.menu.selIdx % foes.length];
        handleZone('enemy-' + g.battle.enemies.indexOf(e));
      }
    } else if (g.menu.mode === 'item-target') {
      const allies = aliveHeroes(g.battle);
      if (allies.length) {
        const h = allies[g.menu.selIdx % allies.length];
        handleZone('ally-' + g.battle.heroes.indexOf(h));
      }
    }
  },
  onBack() {
    if (g.screen === 'battle') {
      if (g.menu.mode !== 'main') resetMenu();
    }
  },
  onArrow(key) {
    if (g.screen !== 'battle') return;
    const dir = (key === 'ArrowDown' || key === 'ArrowRight') ? 1 : -1;
    g.menu.selIdx = Math.max(0, g.menu.selIdx + dir);
  },
  onMute() { toggleMute(); },
});

function drainSfx() {
  const q = g.battle.sfxQueue;
  while (q.length) {
    const name = q.shift();
    if (typeof sfx[name] === 'function') sfx[name]();
  }
}

function autoPlayStep() {
  if (g.screen === 'start') { startGame(); return; }
  if (g.screen === 'win' || g.screen === 'lose') return;
  const hero = currentHero();
  if (!hero) return;
  const foes = aliveEnemies(g.battle);
  if (!foes.length) return;
  const target = foes[Math.floor(Math.random() * foes.length)];
  const r = Math.random();
  const affordable = hero.skills.filter((s) => hero.mp >= s.cost && s.target === 'enemy');
  if (r < 0.45 && affordable.length) {
    const skill = affordable[Math.floor(Math.random() * affordable.length)];
    heroSkill(g.battle, hero, skill, target);
    resetMenu();
  } else if (r < 0.55) {
    heroDefend(g.battle, hero);
    resetMenu();
  } else {
    heroAttack(g.battle, hero, target);
    resetMenu();
  }
}

// --- URL hooks (screenshots / self-play only; normal play ignores them) ---
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const autoplay = params.get('autoplay') === '1';
const debugLose = params.get('debuglose') === '1';

function applyShotScene() {
  if (shot === 'start') {
    g.screen = 'start';
  } else if (shot === 'battle') {
    startGame();
    // Show a mid-fight moment: one bat already hurt, menu open for the first hero.
    g.battle.enemies[0].hp = 45;
    g.battle.heroes[1].hp = 180;
    advanceTurn(g.battle);
  } else if (shot === 'boss') {
    startGame();
    startWave(g.battle, 2);
    g.battle.enemies[0].hp = 430;
    advanceTurn(g.battle);
  } else if (shot === 'win') {
    startGame();
    g.endStats = { turns: 23, damage: 2840, time: 187, standing: 3 };
    g.screen = 'win';
  }
}

let last = performance.now();
let frames = 0;
let autoTimer = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  g.time = now;
  if (g.screen === 'battle') {
    updateBattle(g.battle, dt);
    if (g.battle.phase === 'won') endGame(true);
    else if (g.battle.phase === 'lost') endGame(false);
    drainSfx();
    if (autoplay) {
      autoTimer += dt;
      if (autoTimer > 0.45) { autoTimer = 0; autoPlayStep(); }
    }
    // debuglose: heroes just defend so the enemies can finish them off.
    if (debugLose) {
      const u = currentUnit(g.battle);
      if (g.battle.phase === 'heroWait' && u && u.kind === 'hero') {
        heroDefend(g.battle, u);
        resetMenu();
      }
    }
  }
  renderGame(ctx, g, now);
  frames++;
  if (frames === 3) {
    window.__shotReady = true;
  }
  requestAnimationFrame(loop);
}

applyShotScene();
if (debugLose) {
  startGame();
  g.battle.heroes.forEach((h) => { h.hp = 6; });
  advanceTurn(g.battle);
}
if (autoplay) {
  setTimeout(() => { if (g.screen === 'start') startGame(); }, 400);
}
window.__game = g;
requestAnimationFrame(loop);
