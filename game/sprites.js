// sprites.js — all art is drawn procedurally from pixel maps defined here.
// No image files, no copied art: every hero and monster is original pixel art
// built from small character grids, rendered as crisp rectangles on canvas.

const SPRITES = {
  kael: {
    pal: { R: '#c0392b', r: '#e74c3c', O: '#e67e22', Y: '#f1c40f', S: '#dfe6e9', s: '#95a5a6', K: '#f5c99b', H: '#7b2d26', B: '#2c3e50' },
    map: [
      '......RRRR......',
      '.....RRRRRR.....',
      '.....RYYYYR.....',
      '......RRRR......',
      '.......KK.......',
      '......KKKK......',
      '....RRRRRRRR....',
      '...RRRRRRRRRR...',
      '..RRRRRRRRRRRR..',
      '..RROORRRROORR..',
      '...RRRRRRRRRR...',
      '....RRRRRRRR....',
      '.....RR..RR.....',
      '.....RR..RR.....',
      '....HHH..HHH....',
      '....HHH..HHH....',
      '...SS......SS...',
      '...SS......SS...',
    ],
    sword: true,
  },
  lyra: {
    pal: { G: '#27ae60', g: '#2ecc71', L: '#8e44ad', K: '#f5c99b', H: '#145a32', B: '#6b4a2b', Y: '#f1c40f', S: '#dfe6e9' },
    map: [
      '......GGGG......',
      '.....GGGGGG.....',
      '....GGGGGGGG....',
      '....GGKKKKGG....',
      '.....GKKKKG.....',
      '......KKKK......',
      '.......KK.......',
      '....GGGGGGGG....',
      '...GGGGGGGGGG...',
      '..GGGGGGGGGGGG..',
      '..GGKGGGGGGKGG..',
      '...GGGGGGGGGG...',
      '....GGGGGGGG....',
      '.....GG..GG.....',
      '.....GG..GG.....',
      '....HHH..HHH....',
      '....HHH..HHH....',
      '...SS......SS...',
    ],
    bow: true,
  },
  mira: {
    pal: { P: '#8e44ad', p: '#9b59b6', V: '#5b2c6f', K: '#f5c99b', Y: '#f1c40f', B: '#2c3e50', W: '#ffffff', S: '#dfe6e9' },
    map: [
      '.......YY.......',
      '......YYYY......',
      '.....PPPPPP.....',
      '....PPPPPPPP....',
      '....PPKKKKPP....',
      '.....PKKKKP.....',
      '......KKKK......',
      '.....PPPPPP.....',
      '....PPPPPPPP....',
      '...PPPPPPPPPP...',
      '..PPPPPPPPPPPP..',
      '..PPPPPPPPPPPP..',
      '..PPPVVVVPPPP...',
      '..PPPPPPPPPPPP..',
      '..PPPPPPPPPPPP..',
      '.PPPPPPPPPPPPPP.',
      '.PPPPPPPPPPPPPP.',
      '...............',
    ],
    staff: true,
  },
  bram: {
    pal: { W: '#fdfefe', w: '#d6dbdf', G: '#f1c40f', K: '#f5c99b', B: '#2c3e50', Y: '#f39c12', S: '#dfe6e9' },
    map: [
      '......WWWW......',
      '.....WWWWWW.....',
      '....WWWWWWWW....',
      '....WWKKKKWW....',
      '.....WKKKKW.....',
      '......KKKK......',
      '.....WWWWWW.....',
      '....WWWWWWWW....',
      '...WWWWWWWWWW...',
      '..WWWWWWWWWWWW..',
      '..WWWGWWWWGWWW..',
      '..WWWWWWWWWWWW..',
      '..WWWWWWWWWWWW..',
      '..WWWWWWWWWWWW..',
      '.WWWWWWWWWWWWWW.',
      '.WWWWWWWWWWWWWW.',
      '.WWWWWWWWWWWWWW.',
      '...............',
    ],
    orb: true,
  },
  bat: {
    pal: { D: '#5b2c6f', d: '#7d3c98', E: '#ff5252', K: '#2c2a4a', W: '#ffffff' },
    map: [
      'DD................DD',
      'DDDD............DDDD',
      'DDDDDD........DDDDDD',
      '.DDDDDD......DDDDDD.',
      '..DDDdd......ddDDD..',
      '...DDdddKddKdddDD...',
      '.....DKKKKKKKKD.....',
      '.....DKWE..EWKD.....',
      '......DKKKKKKD......',
      '.......DDDDDD.......',
      '.......DD..DD.......',
      '......DD....DD......',
    ],
  },
  wolf: {
    pal: { G: '#5d6d7e', g: '#85929e', D: '#2c3e50', E: '#e74c3c', W: '#ffffff', N: '#1a1a2e' },
    map: [
      '........................',
      '.................G..G...',
      '.g...............GG.GG..',
      'ggg..GDDDDDDDDDGGGGGGGG.',
      '..gGGGGGGGGGGGGGGGGWEGG.',
      '..GGGGGGGGGGGGGGGGGGGGGN',
      '..GGGGGGGGGGGGGGGgggGGG.',
      '...GGGGGGGGGGGGGGgg.....',
      '..GGgggggggggggg........',
      '.....GG..GG..GG.GG......',
      '.....GG..GG..GG.GG......',
      '.....GG..GG..GG.GG......',
      '.....DD..DD..DD.DD......',
      '........................',
    ],
  },
  boss: {
    pal: { G: '#2e4053', g: '#566573', D: '#1a1a2e', E: '#ff1744', W: '#ffffff', P: '#7d3c98', N: '#0d0d1a' },
    map: [
      '..............................',
      '.....................G....G...',
      '.g............P......GG...GG..',
      'gggg.GGDDDDDDDDPDDDGGGGGGGGG..',
      '..gGGGGGGGGGGGGGGGGGGGGWEEGG..',
      '..GGGGGGGGGGGGGGGGGGGGGGGGGGGN',
      '..GGGGGGGGGGGGGGGGGGGgggWGGG..',
      '...GGGGGGGGGGGGGGGGGGgg.......',
      '..GGgggggggggggggggg..........',
      '......GG...GG...GG...GG.......',
      '......GG...GG...GG...GG.......',
      '......GG...GG...GG...GG.......',
      '......GG...GG...GG...GG.......',
      '......GG...GG...GG...GG.......',
      '......DD...DD...DD...DD.......',
      '..............................',
    ],
  },
};

function drawPixelMap(ctx, spr, x, y, scale) {
  const rows = spr.map;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
      const col = spr.pal[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x + c * scale), Math.round(y + r * scale), Math.ceil(scale), Math.ceil(scale));
    }
  }
}

// Draw one sprite by key. (x, y) is the top-left of the pixel grid.
// flip mirrors horizontally (enemies face the party). bob adds a vertical hover offset.
export function drawSprite(ctx, key, x, y, scale, opts = {}) {
  const spr = SPRITES[key];
  if (!spr) return;
  const w = spr.map[0].length * scale;
  const h = spr.map.length * scale;
  const bobY = opts.bob ? Math.sin((opts.time || 0) / 300 + (opts.phase || 0)) * 3 : 0;
  ctx.save();
  if (opts.flash) {
    ctx.globalAlpha = 0.55;
    ctx.globalCompositeOperation = 'lighter';
  }
  if (opts.flip) {
    ctx.translate(x + w, y + bobY);
    ctx.scale(-1, 1);
    drawPixelMap(ctx, spr, 0, 0, scale);
  } else {
    drawPixelMap(ctx, spr, x, y + bobY, scale);
  }
  ctx.restore();
  // Glowing eyes for beasts.
  if (spr.eye) {
    const ex = x + (opts.flip ? (spr.map[0].length - spr.eye.x - 1) * scale : spr.eye.x * scale);
    const ey = y + bobY + spr.eye.y * scale;
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(ex, ey, scale * 1.4, scale * 1.4);
    ctx.fillRect(ex + scale * 3, ey, scale * 1.4, scale * 1.4);
  }
  // Hero gear drawn as simple shapes beside the pixel body.
  if (spr.sword) {
    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(x + w + 2, y + h * 0.15, 4, h * 0.55);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x + w - 2, y + h * 0.62, 12, 4);
  }
  if (spr.bow) {
    ctx.strokeStyle = '#6b4a2b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w + 4, y + h * 0.45, h * 0.32, -Math.PI / 2.2, Math.PI / 2.2);
    ctx.stroke();
  }
  if (spr.staff) {
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(x - 8, y + h * 0.1, 4, h * 0.7);
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(x - 6, y + h * 0.08, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  if (spr.orb) {
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(x + w + 2, y + h * 0.3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8d6';
    ctx.beginPath();
    ctx.arc(x + w + 2, y + h * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function spriteSize(key, scale) {
  const spr = SPRITES[key];
  if (!spr) return { w: 0, h: 0 };
  return { w: spr.map[0].length * scale, h: spr.map.length * scale };
}

export const SPRITE_KEYS = Object.keys(SPRITES);
