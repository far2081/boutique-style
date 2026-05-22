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
    
    let pos = 12; // Skip header (magic, version, length)
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

    console.log('--- MESHES IN GLB ---');
    gltf.meshes.forEach((mesh, index) => {
        console.log(`Mesh [${index}]: name="${mesh.name}"`);
    });

    console.log('\n--- NODES IN GLB ---');
    gltf.nodes.forEach((node, index) => {
        if (node.mesh !== undefined) {
            console.log(`Node [${index}]: name="${node.name}" | meshIndex=${node.mesh} (Mesh: "${gltf.meshes[node.mesh].name}")`);
        } else {
            console.log(`Node [${index}]: name="${node.name}" (No mesh)`);
        }
    });

} catch (e) {
    console.error('Error reading GLB:', e);
}
