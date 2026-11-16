// render.js — draws every screen of Emberfall Saga on the 1280x720 canvas:
// the lush field, pixel heroes and monsters, turn-order chips, HP/MP bars,
// the action menu, floating damage, particles and the small start/end cards.
// It also rebuilds the clickable zone list each frame for input.js.

import { drawSprite, spriteSize } from './sprites.js';
import { ENEMY_SLOTS, HERO_SLOTS, aliveEnemies, aliveHeroes, currentUnit, effSpd } from './battle.js';

function bar(ctx, x, y, w, h, frac, fill, bg) {
  ctx.fillStyle = bg || '#1c2438';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(ctx, time) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, 420);
  sky.addColorStop(0, '#7ec8f7');
  sky.addColorStop(0.55, '#a8dcf5');
  sky.addColorStop(1, '#d8f0c8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 430);
  // Sun
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(1120, 90, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,243,176,0.35)';
  ctx.beginPath();
  ctx.arc(1120, 90, 62, 0, Math.PI * 2);
  ctx.fill();
  // Drifting clouds
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 4; i++) {
    const cx = ((time * 0.012 + i * 340) % 1500) - 120;
    const cy = 60 + i * 42;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 70, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 45, cy + 6, 50, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Distant hills
  ctx.fillStyle = '#7fb069';
  ctx.beginPath();
  ctx.moveTo(0, 380);
  ctx.quadraticCurveTo(220, 260, 480, 370);
  ctx.quadraticCurveTo(760, 250, 1020, 360);
  ctx.quadraticCurveTo(1180, 300, 1280, 370);
  ctx.lineTo(1280, 430);
  ctx.lineTo(0, 430);
  ctx.fill();
  ctx.fillStyle = '#5d9b4a';
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.quadraticCurveTo(320, 320, 640, 395);
  ctx.quadraticCurveTo(960, 320, 1280, 400);
  ctx.lineTo(1280, 430);
  ctx.lineTo(0, 430);
  ctx.fill();
  // Trees (right side, like a forest edge)
  drawTree(ctx, 1215, 330, 1.15);
  drawTree(ctx, 1140, 360, 0.9);
  drawTree(ctx, 60, 350, 0.95);
  drawTree(ctx, 1240, 420, 0.8);
  // Grass field
  const grass = ctx.createLinearGradient(0, 420, 0, 720);
  grass.addColorStop(0, '#69b455');
  grass.addColorStop(1, '#3f8f3a');
  ctx.fillStyle = grass;
  ctx.fillRect(0, 420, 1280, 300);
  // Dirt path
  ctx.fillStyle = '#c9a86a';
  ctx.beginPath();
  ctx.moveTo(0, 560);
  ctx.quadraticCurveTo(420, 500, 760, 560);
  ctx.quadraticCurveTo(1020, 600, 1280, 540);
  ctx.lineTo(1280, 660);
  ctx.quadraticCurveTo(900, 700, 560, 660);
  ctx.quadraticCurveTo(260, 630, 0, 680);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b8935a';
  ctx.beginPath();
  ctx.ellipse(640, 600, 420, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // Grass tufts
  ctx.strokeStyle = '#2f7a2e';
  ctx.lineWidth = 2;
  for (let i = 0; i < 40; i++) {
    const gx = (i * 173) % 1280;
    const gy = 440 + ((i * 97) % 240);
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx - 3, gy - 9);
    ctx.moveTo(gx + 4, gy);
    ctx.lineTo(gx + 7, gy - 10);
    ctx.stroke();
  }
  // Embers drifting
  ctx.fillStyle = 'rgba(255,180,80,0.7)';
  for (let i = 0; i < 12; i++) {
    const ex = (i * 211 + time * 0.02) % 1280;
    const ey = 430 + ((i * 131 + time * 0.03) % 240);
    ctx.fillRect(ex, ey, 3, 3);
  }
}

function drawTree(ctx, x, y, s) {
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(x - 5 * s, y, 10 * s, 46 * s);
  ctx.fillStyle = '#2f7a2e';
  ctx.beginPath();
  ctx.arc(x, y - 14 * s, 42 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f9b3a';
  ctx.beginPath();
  ctx.arc(x - 22 * s, y + 2 * s, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 24 * s, y + 2 * s, 26 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawUnit(ctx, b, u, time, isCurrent) {
  const slot = u.kind === 'hero'
    ? HERO_SLOTS[u.id === 'kael' ? 0 : u.id === 'lyra' ? 1 : u.id === 'mira' ? 2 : 3]
    : { x: u.x, y: u.y };
  let lx = slot.x, ly = slot.y;
  // Lunge toward the target during an attack animation.
  if (b.anim && b.anim.actor === u) {
    const a = b.anim;
    const from = { x: slot.x, y: slot.y };
    const to = a.target ? (a.target.kind === 'hero'
      ? HERO_SLOTS[a.target.id === 'kael' ? 0 : a.target.id === 'lyra' ? 1 : a.target.id === 'mira' ? 2 : 3]
      : { x: a.target.x, y: a.target.y }) : from;
    const k = Math.sin(Math.min(1, a.t / a.dur) * Math.PI) * 0.35;
    lx = from.x + (to.x - from.x) * k;
    ly = from.y + (to.y - from.y) * k;
  }
  const scale = u.kind === 'enemy' ? (u.isBoss ? 6 : 5) : 5;
  const size = spriteSize(u.sprite, scale);
  // Shadow ellipse
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(lx + size.w / 2, ly + size.h + 4, size.w * 0.45, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Current-turn marker
  if (isCurrent) {
    ctx.fillStyle = '#ffd54a';
    ctx.beginPath();
    ctx.moveTo(lx + size.w / 2, ly - 26);
    ctx.lineTo(lx + size.w / 2 - 9, ly - 40);
    ctx.lineTo(lx + size.w / 2 + 9, ly - 40);
    ctx.closePath();
    ctx.fill();
  }
  drawSprite(ctx, u.sprite, lx, ly, scale, {
    time, flip: u.kind === 'enemy', flash: u.flash > 0, bob: u.kind === 'enemy',
    phase: u.kind === 'enemy' ? (u.x % 7) : 0,
  });
  // Shield ring
  if (u.shield > 0) {
    ctx.strokeStyle = 'rgba(128,216,255,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(lx + size.w / 2, ly + size.h / 2, size.w * 0.62, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (u.defending) {
    ctx.fillStyle = '#80d8ff';
    ctx.font = 'bold 12px Verdana';
    ctx.textAlign = 'center';
    ctx.fillText('DEFEND', lx + size.w / 2, ly + size.h + 20);
  }
  return { x: lx, y: ly, w: size.w, h: size.h };
}

function drawEnemyBars(ctx, b, enemies) {
  enemies.forEach((e) => {
    if (e.dead) return;
    const size = spriteSize(e.sprite, e.isBoss ? 6 : 5);
    const bw = e.isBoss ? 128 : 92;
    const bx = e.x + size.w / 2 - bw / 2;
    const by = e.y - 58;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx - 4, by - 16, bw + 8, 52);
    // Telegraph label
    ctx.fillStyle = e.nextBig ? '#ff5252' : '#ffd54a';
    ctx.font = 'bold 11px Verdana';
    ctx.textAlign = 'center';
    ctx.fillText(e.telegraph, bx + bw / 2, by - 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Verdana';
    ctx.fillText(e.name + (e.isBoss ? '  ★ BOSS' : ''), bx + bw / 2, by + 10);
    bar(ctx, bx, by + 16, bw, 7, e.hp / e.maxHp, e.isBoss ? '#ff5252' : '#e74c3c');
  });
}

function drawTurnChips(ctx, b) {
  const order = b.queue.filter((u) => !u.dead);
  const chipW = 46, gap = 6;
  const total = order.length * (chipW + gap) - gap;
  let x = (1280 - total) / 2;
  ctx.font = 'bold 13px Verdana';
  ctx.textAlign = 'center';
  order.forEach((u, i) => {
    const isCur = b.queue[b.qi] === u;
    ctx.fillStyle = isCur ? '#ffd54a' : 'rgba(20,24,48,0.85)';
    roundRect(ctx, x, 12, chipW, 30, 8);
    ctx.fill();
    ctx.strokeStyle = u.color || (u.isBoss ? '#ff1744' : '#9b59b6');
    ctx.lineWidth = 2;
    roundRect(ctx, x, 12, chipW, 30, 8);
    ctx.stroke();
    ctx.fillStyle = isCur ? '#1a1a2e' : '#ffffff';
    ctx.fillText((u.name || '?')[0], x + chipW / 2, 32);
    if (i < order.length - 1) {
      ctx.fillStyle = '#ffd54a';
      ctx.font = 'bold 12px Verdana';
      ctx.fillText('›', x + chipW + 3, 32);
      ctx.font = 'bold 13px Verdana';
    }
    x += chipW + gap;
  });
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Verdana';
  ctx.textAlign = 'left';
  ctx.fillText('Wave ' + (b.wave + 1) + '/3', 16, 32);
  ctx.textAlign = 'right';
  ctx.fillText('Potions: ' + b.potions, 1264, 32);
}

function drawPartyPanel(ctx, b) {
  const px = 690, py = 556, cw = 142, ch = 150;
  b.heroes.forEach((h, i) => {
    const x = px + i * (cw + 6);
    const cur = currentUnit(b) === h && b.phase === 'heroWait';
    ctx.fillStyle = h.dead ? 'rgba(20,24,48,0.55)' : cur ? 'rgba(60,50,10,0.92)' : 'rgba(20,24,48,0.88)';
    roundRect(ctx, x, py, cw, ch, 10);
    ctx.fill();
    ctx.strokeStyle = cur ? '#ffd54a' : h.color;
    ctx.lineWidth = cur ? 3 : 2;
    roundRect(ctx, x, py, cw, ch, 10);
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = h.dead ? '#888888' : '#ffffff';
    ctx.font = 'bold 14px Verdana';
    ctx.fillText(h.name, x + 10, py + 22);
    ctx.fillStyle = '#bbbbbb';
    ctx.font = '11px Verdana';
    ctx.fillText(h.role, x + 10, py + 38);
    ctx.fillStyle = '#7CFC9A';
    ctx.font = 'bold 11px Verdana';
    ctx.fillText('HP', x + 10, py + 58);
    bar(ctx, x + 34, py + 48, 96, 10, h.hp / h.maxHp, h.hp / h.maxHp > 0.3 ? '#4caf50' : '#e74c3c');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Verdana';
    ctx.fillText(h.hp + ' / ' + h.maxHp, x + 10, py + 78);
    ctx.fillStyle = '#64b5f6';
    ctx.font = 'bold 11px Verdana';
    ctx.fillText('MP', x + 10, py + 98);
    bar(ctx, x + 34, py + 88, 96, 10, h.mp / h.maxMp, '#2196f3');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Verdana';
    ctx.fillText(h.mp + ' / ' + h.maxMp, x + 10, py + 118);
    if (h.shield > 0) {
      ctx.fillStyle = '#80d8ff';
      ctx.font = 'bold 11px Verdana';
      ctx.fillText('Shield ' + h.shield, x + 10, py + 138);
    }
    if (h.slowed) {
      ctx.fillStyle = '#80d8ff';
      ctx.font = 'bold 11px Verdana';
      ctx.fillText('Slowed', x + 80, py + 138);
    }
  });
}

function drawMenu(ctx, g) {
  const b = g.battle;
  const hero = currentUnit(b);
  if (b.phase !== 'heroWait' || !hero || hero.kind !== 'hero') return;
  const mx = 30, my = 556, mw = 330, mh = 150;
  ctx.fillStyle = 'rgba(20,24,48,0.92)';
  roundRect(ctx, mx, my, mw, mh, 10);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  roundRect(ctx, mx, my, mw, mh, 10);
  ctx.stroke();
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 14px Verdana';
  ctx.textAlign = 'left';
  ctx.fillText(hero.name + ' — choose an action', mx + 14, my + 24);

  const menu = g.menu;
  const btn = (id, label, x, y, w, h, enabled, sub) => {
    ctx.fillStyle = enabled ? (g.hover === id ? '#c9a227' : '#3a4a6b') : '#2a2a3a';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = enabled ? '#ffd54a' : '#555566';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();
    ctx.fillStyle = enabled ? '#ffffff' : '#777788';
    ctx.font = 'bold 13px Verdana';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + (sub ? 20 : 26));
    if (sub) {
      ctx.fillStyle = enabled ? '#bbbbbb' : '#666677';
      ctx.font = '11px Verdana';
      ctx.fillText(sub, x + w / 2, y + 36);
    }
    if (enabled) g.zones.push({ id, x, y, w, h });
  };

  if (menu.mode === 'main') {
    btn('act-attack', 'Attack', mx + 12, my + 36, 148, 48, true, '1 · basic strike');
    btn('act-skills', 'Skills', mx + 170, my + 36, 148, 48, true, '2 · spend MP');
    btn('act-item', 'Item', mx + 12, my + 94, 148, 48, b.potions > 0, '3 · Potion x' + b.potions);
    btn('act-defend', 'Defend', mx + 170, my + 94, 148, 48, true, '4 · halve damage');
  } else if (menu.mode === 'skills') {
    hero.skills.forEach((s, i) => {
      const ok = hero.mp >= s.cost;
      btn('skill-' + i, s.name, mx + 12, my + 36 + i * 38, 240, 32, ok, s.desc + ' · ' + s.cost + ' MP');
    });
    btn('back', 'Back', mx + 262, my + 36, 56, 32, true, 'Esc');
  } else if (menu.mode === 'item') {
    btn('use-potion', 'Ember Potion', mx + 12, my + 36, 240, 32, b.potions > 0, 'Heal 35% HP · x' + b.potions);
    btn('back', 'Back', mx + 262, my + 36, 56, 32, true, 'Esc');
  }
  if (menu.mode === 'target') {
    ctx.fillStyle = '#ffd54a';
    ctx.font = 'bold 13px Verdana';
    ctx.textAlign = 'left';
    ctx.fillText('Tap an enemy to strike — Esc to cancel', mx + 14, my + 60);
    btn('back', 'Back', mx + 12, my + 94, 148, 48, true, 'Esc');
  }
}

function drawFloaters(ctx, b) {
  ctx.textAlign = 'center';
  b.floaters.forEach((f) => {
    const k = f.t / f.dur;
    ctx.globalAlpha = 1 - k;
    ctx.font = 'bold 20px Verdana';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - k * 46);
  });
  ctx.globalAlpha = 1;
}

function drawParticles(ctx, b) {
  b.particles.forEach((p) => {
    const k = 1 - p.t / p.dur;
    ctx.globalAlpha = Math.max(0, k);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

function drawSkillFlash(ctx, b) {
  if (!b.skillFlash) return;
  const s = b.skillFlash;
  const k = s.t / s.dur;
  const a = k < 0.2 ? k / 0.2 : k > 0.7 ? (1 - k) / 0.3 : 1;
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  ctx.fillStyle = 'rgba(20,24,48,0.9)';
  roundRect(ctx, 440, 56, 400, 36, 10);
  ctx.fill();
  ctx.strokeStyle = '#ffd54a';
  ctx.lineWidth = 2;
  roundRect(ctx, 440, 56, 400, 36, 10);
  ctx.stroke();
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 17px Verdana';
  ctx.textAlign = 'center';
  ctx.fillText(s.hero + ' — ' + s.name, 640, 80);
  ctx.globalAlpha = 1;
}

function drawNote(ctx, b) {
  if (b.noteT <= 0 || !b.note) return;
  ctx.globalAlpha = Math.min(1, b.noteT);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Verdana';
  ctx.textAlign = 'left';
  ctx.fillText(b.note, 16, 64);
  ctx.globalAlpha = 1;
}

function drawStart(ctx, g, time) {
  drawBackground(ctx, time);
  // Heroes on parade (left) + a wolf silhouette for flavor (right).
  drawSprite(ctx, 'mira', 170, 490, 5, { time });
  drawSprite(ctx, 'kael', 280, 470, 5, { time });
  drawSprite(ctx, 'lyra', 400, 490, 5, { time });
  drawSprite(ctx, 'bram', 530, 470, 5, { time });
  drawSprite(ctx, 'wolf', 950, 480, 5, { time, flip: true, bob: true, phase: 1 });
  ctx.fillStyle = 'rgba(10,12,28,0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd54a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('EMBERFALL SAGA', 640, 150);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('Four heroes stand against the Nightpack', 640, 192);
  ctx.font = '15px Verdana';
  ctx.fillStyle = '#e8e8e8';
  ctx.fillText('A turn-based party battle in three waves. Defeat Gloomfang, Alpha of the Nightpack, to win.', 640, 240);
  ctx.fillText('Click an action, then click a target. Keys: 1-4 actions, arrows + Enter, Esc to go back.', 640, 266);
  ctx.fillText('Enemies telegraph their next move — watch the labels above them.', 640, 292);
  // START button
  const bx = 490, by = 340, bw = 300, bh = 70;
  ctx.fillStyle = g.hover === 'start' ? '#e6b800' : '#c9a227';
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fill();
  ctx.strokeStyle = '#fff3b0';
  ctx.lineWidth = 3;
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.stroke();
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 30px Verdana';
  ctx.fillText('START', 640, 386);
  ctx.fillStyle = '#bbbbbb';
  ctx.font = '13px Verdana';
  ctx.fillText('Kael · Lyra · Mira · Bram', 640, 436);
  ctx.fillText('Sound: press M or use the Sound button', 640, 462);
  g.zones.length = 0;
  g.zones.push({ id: 'start', x: bx, y: by, w: bw, h: bh });
}

function drawEnd(ctx, g) {
  const b = g.battle;
  const won = g.screen === 'win';
  ctx.fillStyle = 'rgba(8,10,24,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  const cw = 460, ch = 300;
  const cx = (1280 - cw) / 2, cy = (720 - ch) / 2;
  ctx.fillStyle = 'rgba(20,24,48,0.96)';
  roundRect(ctx, cx, cy, cw, ch, 14);
  ctx.fill();
  ctx.strokeStyle = won ? '#ffd54a' : '#ff5252';
  ctx.lineWidth = 3;
  roundRect(ctx, cx, cy, cw, ch, 14);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd54a' : '#ff5252';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', 640, cy + 56);
  ctx.fillStyle = '#ffffff';
  ctx.font = '15px Verdana';
  ctx.fillText(won ? 'Gloomfang falls. The Nightpack scatters.' : 'The party has fallen. The night endures.', 640, cy + 88);
  const st = g.endStats || { turns: 0, damage: 0, time: 0, standing: 0 };
  ctx.font = '14px Verdana';
  ctx.fillStyle = '#dddddd';
  ctx.fillText('Turns: ' + st.turns + '    Damage dealt: ' + st.damage, 640, cy + 128);
  ctx.fillText('Time: ' + st.time + 's    Heroes standing: ' + st.standing + ' / 4', 640, cy + 154);
  ctx.fillText('Waves cleared: ' + (won ? '3 / 3' : b.wave + ' / 3'), 640, cy + 180);
  // Buttons
  const bw = 180, bh = 52, by = cy + 216;
  ctx.fillStyle = g.hover === 'again' ? '#e6b800' : '#c9a227';
  roundRect(ctx, cx + 30, by, bw, bh, 10);
  ctx.fill();
  ctx.fillStyle = g.hover === 'menu' ? '#4a5a7b' : '#3a4a6b';
  roundRect(ctx, cx + 250, by, bw, bh, 10);
  ctx.fill();
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 17px Verdana';
  ctx.fillText('Play Again', cx + 120, by + 34);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Menu', cx + 340, by + 34);
  g.zones.length = 0;
  g.zones.push({ id: 'again', x: cx + 30, y: by, w: bw, h: bh });
  g.zones.push({ id: 'menu', x: cx + 250, y: by, w: bw, h: bh });
}

export function renderGame(ctx, g, time) {
  const b = g.battle;
  g.zones.length = 0; // rebuilt every frame: menu buttons, then target zones
  if (g.screen === 'start') {
    drawStart(ctx, g, time);
    return;
  }
  drawBackground(ctx, time);
  const cur = currentUnit(b);
  // Enemies (with click zones when targeting)
  aliveEnemies(b).forEach((e) => {
    const box = drawUnit(ctx, b, e, time, cur === e);
    const skillTarget = g.menu.skill ? g.menu.skill.target : null;
    const enemyPickable = g.menu.mode === 'target'
      || (g.menu.mode === 'skills-target' && skillTarget === 'enemy');
    if (enemyPickable) {
      g.zones.push({ id: 'enemy-' + b.enemies.indexOf(e), x: box.x - 10, y: box.y - 10, w: box.w + 20, h: box.h + 20 });
    }
  });
  // Heroes
  aliveHeroes(b).forEach((h) => {
    const box = drawUnit(ctx, b, h, time, cur === h);
    const skillTarget = g.menu.skill ? g.menu.skill.target : null;
    const allyPickable = g.menu.mode === 'item-target'
      || (g.menu.mode === 'skills-target' && skillTarget === 'ally');
    if (allyPickable) {
      g.zones.push({ id: 'ally-' + b.heroes.indexOf(h), x: box.x - 10, y: box.y - 10, w: box.w + 20, h: box.h + 20 });
    }
  });
  drawEnemyBars(ctx, b, b.enemies);
  drawTurnChips(ctx, b);
  drawPartyPanel(ctx, b);
  drawSkillFlash(ctx, b);
  drawNote(ctx, b);
  drawParticles(ctx, b);
  drawFloaters(ctx, b);
  if (g.screen === 'battle') {
    drawMenu(ctx, g);
  }
  if (g.screen === 'win' || g.screen === 'lose') {
    drawEnd(ctx, g);
  }
}
