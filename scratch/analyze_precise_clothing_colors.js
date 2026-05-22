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

// Let's sample pixels and print statistics for green and purple clothing.
// Green vest should have g > r and g > b by a solid margin.
// Purple corset should have r > g and b > g by a solid margin.
let greenSample = [];
let purpleSample = [];

for (let i = 0; i < img.pixels.length; i += 4) {
    const r = img.pixels[i];
    const g = img.pixels[i + 1];
    const b = img.pixels[i + 2];

    // Background Black
    if (r < 40 && g < 40 && b < 40) continue;

    // Green test: G must be significantly higher than R and B.
    // E.g. g - r > 15, g - b > 15
    const isSaturatedGreen = (g - r > 15) && (g - b > 10);
    if (isSaturatedGreen) {
        greenSample.push({r, g, b});
    }

    // Purple test: R and B must be significantly higher than G.
    const isSaturatedPurple = (r - g > 15) && (b - g > 15);
    if (isSaturatedPurple) {
        purpleSample.push({r, g, b});
    }
}

console.log('Saturated Green pixels found:', greenSample.length);
if (greenSample.length > 0) {
    let avg = greenSample.reduce((acc, p) => ({r: acc.r+p.r, g: acc.g+p.g, b: acc.b+p.b}), {r:0,g:0,b:0});
    console.log('Avg Green:', avg.r/greenSample.length, avg.g/greenSample.length, avg.b/greenSample.length);
}

console.log('Saturated Purple pixels found:', purpleSample.length);
if (purpleSample.length > 0) {
    let avg = purpleSample.reduce((acc, p) => ({r: acc.r+p.r, g: acc.g+p.g, b: acc.b+p.b}), {r:0,g:0,b:0});
    console.log('Avg Purple:', avg.r/purpleSample.length, avg.g/purpleSample.length, avg.b/purpleSample.length);
}
