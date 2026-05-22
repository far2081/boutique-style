const fs = require('fs');
const path = require('path');

const glbPath = path.join('c:', 'Users', 'zuni', 'Desktop', 'engin', 'libaas_ai', 'fashion_girl.glb');

try {
    const data = fs.readFileSync(glbPath);
    const magic = data.toString('utf8', 0, 4);
    if (magic !== 'glTF') {
        console.error('Not a valid GLB file');
        process.exit(1);
    }
    
    let pos = 12;
    let jsonStr = '';

    while (pos < data.length) {
        const chunkLengthLE = data.readUInt32LE(pos);
        const chunkType = data.toString('ascii', pos + 4, pos + 8);
        
        if (chunkType === 'JSON') {
            jsonStr = data.toString('utf8', pos + 8, pos + 8 + chunkLengthLE);
            break;
        }
        pos += 8 + chunkLengthLE;
    }

    if (!jsonStr) {
        console.error('No JSON chunk found');
        process.exit(1);
    }

    const gltf = JSON.parse(jsonStr.trim());

    console.log('--- MESHES ---');
    gltf.meshes.forEach((mesh, index) => {
        console.log(`Mesh [${index}]: name="${mesh.name}"`);
        mesh.primitives.forEach((prim, pIndex) => {
            console.log(`  Primitive [${pIndex}]: Material Index: ${prim.material}`);
        });
    });

    console.log('\n--- MATERIALS ---');
    gltf.materials.forEach((mat, index) => {
        console.log(`Material [${index}]: name="${mat.name}"`);
        console.log('  pbrMetallicRoughness:', JSON.stringify(mat.pbrMetallicRoughness));
        if (mat.normalTexture) console.log('  normalTexture:', JSON.stringify(mat.normalTexture));
        if (mat.occlusionTexture) console.log('  occlusionTexture:', JSON.stringify(mat.occlusionTexture));
        if (mat.emissiveTexture) console.log('  emissiveTexture:', JSON.stringify(mat.emissiveTexture));
    });

    console.log('\n--- TEXTURES ---');
    if (gltf.textures) {
        gltf.textures.forEach((tex, index) => {
            console.log(`Texture [${index}]: sourceIndex=${tex.source}, samplerIndex=${tex.sampler}`);
        });
    }

    console.log('\n--- IMAGES ---');
    if (gltf.images) {
        gltf.images.forEach((img, index) => {
            console.log(`Image [${index}]: name="${img.name}", mimeType="${img.mimeType}"`);
        });
    }

} catch (e) {
    console.error('Error reading GLB:', e);
}
