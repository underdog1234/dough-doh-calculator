// Generates the PWA icon set as plain PNGs, using only Node's built-in zlib —
// no image library needed. Draws a simple dough-ball glyph on the bakery
// palette. Run with: node scripts/generate-icons.cjs
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    let c = (crc ^ buf[i]) & 0xff;
    for (let j = 0; j < 8; j += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePng(size, draw) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y += 1) {
    raw[offset] = 0; // filter: none
    offset += 1;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = draw(x, y);
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
      offset += 4;
    }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  return Buffer.concat([sig, chunk('IHDR', ihdrData), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// Bakery palette (src/styles/theme.css).
const BG = [0x14, 0x10, 0x0d]; // espresso
const DOUGH = [0xfc, 0xd3, 0x4d]; // accent-soft
const SHADOW = [0xf5, 0x9e, 0x0b]; // accent

function drawDoughBall(size, { maskable = false } = {}) {
  const r = size / 2;
  // Maskable icons get cropped to a circle by the OS, so keep art inside a safe zone.
  const ballRadius = maskable ? r * 0.62 : r * 0.72;
  const cx = r;
  const cy = r;

  return (x, y) => {
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!maskable && dist > r) return [0, 0, 0, 0]; // transparent corners on a circular icon

    if (dist > ballRadius + 1.5) return [...BG, 255];

    const shade = Math.max(0, Math.min(1, 0.5 - (dx + dy) / (ballRadius * 2)));
    const col = DOUGH.map((c, i) => Math.round(c + (SHADOW[i] - c) * shade));

    if (dist > ballRadius - 1.5) {
      const t = (ballRadius + 1.5 - dist) / 3;
      return [...col.map((c, i) => Math.round(c * t + BG[i] * (1 - t))), 255];
    }

    return [...col, 255];
  };
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const write = (name, size, opts) => fs.writeFileSync(path.join(outDir, name), makePng(size, drawDoughBall(size, opts)));

write('icon-192.png', 192);
write('icon-512.png', 512);
write('maskable-icon-512.png', 512, { maskable: true });
write('apple-touch-icon.png', 180, { maskable: true });

console.log('Icons written to', outDir);
