// Simple PNG icon generator using pure Node.js (no dependencies)
// Creates minimal valid PNG files for the Chrome extension

const fs = require('fs');
const path = require('path');

// Minimal PNG encoder - creates a solid colored circle icon
function createPNG(size) {
  const pixels = [];

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 1;

  for (let y = 0; y < size; y++) {
    pixels.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= r) {
        // Gradient from pink to purple
        const t = (x + y) / (size * 2);
        const red = Math.round(255 * (1 - t) + 196 * t);
        const green = Math.round(107 * (1 - t) + 77 * t);
        const blue = Math.round(157 * (1 - t) + 255 * t);
        pixels.push(red, green, blue, 255);

        // Draw cat face features for larger icons
        if (size >= 48) {
          const sx = x / size;
          const sy = y / size;

          // Cat ears (triangles)
          const inLeftEar = sx > 0.25 && sx < 0.42 && sy < 0.4 && sy > 0.12 &&
            (sx - 0.25) / 0.17 > (sy - 0.12) / 0.28 * 0.5;
          const inRightEar = sx > 0.58 && sx < 0.75 && sy < 0.4 && sy > 0.12 &&
            (0.75 - sx) / 0.17 > (sy - 0.12) / 0.28 * 0.5;

          // Cat face circle
          const faceDx = sx - 0.5;
          const faceDy = sy - 0.55;
          const faceDist = Math.sqrt(faceDx * faceDx + faceDy * faceDy);
          const inFace = faceDist < 0.24;

          // Eyes
          const leftEyeDx = sx - 0.42;
          const leftEyeDy = sy - 0.52;
          const inLeftEye = Math.sqrt(leftEyeDx * leftEyeDx + leftEyeDy * leftEyeDy) < 0.04;

          const rightEyeDx = sx - 0.58;
          const rightEyeDy = sy - 0.52;
          const inRightEye = Math.sqrt(rightEyeDx * rightEyeDx + rightEyeDy * rightEyeDy) < 0.04;

          // Nose
          const noseDx = sx - 0.5;
          const noseDy = sy - 0.58;
          const inNose = Math.sqrt(noseDx * noseDx + noseDy * noseDy) < 0.025;

          if (inFace || inLeftEar || inRightEar) {
            // Orange cat face
            pixels[pixels.length - 4] = 255;
            pixels[pixels.length - 3] = 155;
            pixels[pixels.length - 2] = 80;
          }
          if (inLeftEye || inRightEye) {
            pixels[pixels.length - 4] = 51;
            pixels[pixels.length - 3] = 51;
            pixels[pixels.length - 2] = 51;
          }
          if (inNose) {
            pixels[pixels.length - 4] = 255;
            pixels[pixels.length - 3] = 184;
            pixels[pixels.length - 2] = 208;
          }
        }
      } else {
        pixels.push(0, 0, 0, 0); // transparent
      }
    }
  }

  // Create raw pixel data buffer
  const rawData = Buffer.from(pixels);

  // Deflate using zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);

  // Build PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function createChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);

    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));

    return Buffer.concat([length, typeBuffer, data, crc]);
  }

  // CRC32 implementation
  function crc32(buf) {
    let crc = 0xffffffff;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr.writeUInt8(8, 8);        // bit depth
  ihdr.writeUInt8(6, 9);        // color type (RGBA)
  ihdr.writeUInt8(0, 10);       // compression
  ihdr.writeUInt8(0, 11);       // filter
  ihdr.writeUInt8(0, 12);       // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icons
const iconsDir = path.join(__dirname, 'icons');
[16, 48, 128].forEach(size => {
  const png = createPNG(size);
  const filepath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(filepath, png);
  console.log(`Created ${filepath} (${png.length} bytes)`);
});

console.log('Done! Icons generated.');
