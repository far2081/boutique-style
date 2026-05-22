const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function decodePNG(filePath) {
    const data = fs.readFileSync(filePath);
    let pos = 8;
    let width = 0, height = 0, colorType = 0;
    let idatBuffers = [];

    while (pos < data.length) {
        const length = data.readUInt32BE(pos);
        const type = data.toString('ascii', pos + 4, pos + 8);
        const chunkData = data.slice(pos + 8, pos + 8 + length);
        pos += 12 + length;

        if (type === 'IHDR') {
            width = chunkData.readUInt32BE(0);
            height = chunkData.readUInt32BE(4);
            colorType = chunkData[9];
        } else if (type === 'IDAT') {
            idatBuffers.push(chunkData);
        } else if (type === 'IEND') {
            break;
        }
    }

    const compressed = Buffer.concat(idatBuffers);
    const inflated = zlib.inflateSync(compressed);

    let bytesPerPixel = colorType === 2 ? 3 : 4;
    const scanlineLength = width * bytesPerPixel + 1;
    const pixels = Buffer.alloc(width * height * 4);

    let prevScanline = null;
    for (let y = 0; y < height; y++) {
        const lineStart = y * scanlineLength;
        const filterType = inflated[lineStart];
        const currentScanline = inflated.slice(lineStart + 1, lineStart + scanlineLength);
        const uncompressedLine = Buffer.alloc(width * bytesPerPixel);

        for (let x = 0; x < currentScanline.length; x++) {
            const val = currentScanline[x];
            const left = x >= bytesPerPixel ? uncompressedLine[x - bytesPerPixel] : 0;
            const up = prevScanline ? prevScanline[x] : 0;
            const corner = prevScanline && x >= bytesPerPixel ? prevScanline[x - bytesPerPixel] : 0;

            let recon = 0;
            if (filterType === 0) recon = val;
            else if (filterType === 1) recon = val + left;
            else if (filterType === 2) recon = val + up;
            else if (filterType === 3) recon = val + Math.floor((left + up) / 2);
            else if (filterType === 4) {
                const p = left + up - corner;
                const pa = Math.abs(p - left);
                const pb = Math.abs(p - up);
                const pc = Math.abs(p - corner);
                let nearest = left;
                if (pb < pa && pb < pc) nearest = up;
                else if (pc < pa) nearest = corner;
                recon = val + nearest;
            }
            uncompressedLine[x] = recon & 0xFF;
        }
        prevScanline = uncompressedLine;

        for (let x = 0; x < width; x++) {
            const srcIdx = x * bytesPerPixel;
            const destIdx = (y * width + x) * 4;
            pixels[destIdx] = uncompressedLine[srcIdx];
            pixels[destIdx + 1] = uncompressedLine[srcIdx + 1];
            pixels[destIdx + 2] = uncompressedLine[srcIdx + 2];
            pixels[destIdx + 3] = bytesPerPixel === 4 ? uncompressedLine[srcIdx + 3] : 255;
        }
    }
    return { width, height, pixels };
}

const targetFile = path.join('c:', 'Users', 'zuni', 'Desktop', 'engin', 'libaas_ai', 'extracted_img_3_image.png');
const img = decodePNG(targetFile);

let buckets = {};

for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    // Background Black
    if (r < 40 && g < 40 && b < 40) continue;

    // New tight clothing thresholds
    const isWhite = (r > 140 && g > 140 && b > 140) && (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15);
    const isGreen = (g > 50) && (g - r > 20) && (g - b > 15);
    const isPurple = (r > 50 && b > 50) && (r - g > 20) && (b - g > 20);
    const isClothing = isWhite || isGreen || isPurple;

    if (isClothing) continue;

    // Check if it matches skin:
    const isSkin = (r > 40 && g > 30 && b > 25) && (r > g) && (g > b - 20) && (r - b > 15);
    
    const key = isSkin ? 'Skin' : 'Non-Skin-Other';
    if (!buckets[key]) buckets[key] = { count: 0, rMin: 255, rMax: 0, gMin: 255, gMax: 0, bMin: 255, bMax: 0 };
    
    buckets[key].count++;
    if (r < buckets[key].rMin) buckets[key].rMin = r;
    if (r > buckets[key].rMax) buckets[key].rMax = r;
    if (g < buckets[key].gMin) buckets[key].gMin = g;
    if (g > buckets[key].gMax) buckets[key].gMax = g;
    if (b < buckets[key].bMin) buckets[key].bMin = b;
    if (b > buckets[key].bMax) buckets[key].bMax = b;
}

console.log(buckets);
