// libaas_ai/engine.js - ULTIMATE DEBUG & FIX v17
window.onerror = function(msg, url, line) {
    alert("STAGE ERROR: " + msg + " (at " + line + ")");
};

let scene, camera, renderer, controls, clock;
let avatarGroup = new THREE.Group();
let gltfLoader = null;
let mixer = null;
let isInitialized = false;

const modelSources = [
    "assets/models/scene.gltf",
    "assets/models/avatar.glb",
    "avatar.glb",
    "https://models.readyplayer.me/63b36340268427f7f07297d2.glb"
];
let currentSourceIndex = 0;

function init() {
    if (isInitialized) return;
    const container = document.getElementById('canvas-container');
    if (!container) return;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // EXTREME LIGHTING: Rule out darkness
    scene.add(new THREE.AmbientLight(0xffffff, 2.0)); // Super bright
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(2, 5, 5);
    scene.add(sun);

    // LUXURY STAGE
    const stage = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.9, 0.05, 64),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 })
    );
    stage.position.y = -0.025;
    scene.add(stage);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.81, 0.02, 16, 100),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 0.5 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    ring.name = 'goldRing';
    scene.add(ring);

    scene.add(avatarGroup);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.0, 0);
        controls.enableDamping = true;
        controls.autoRotate = true;
    }

    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        loadAvatar();
    } else {
        showStatus("ERROR: GLTF Loader Missing");
    }

    window.addEventListener('resize', onResize);
    isInitialized = true;
    animate();
}

function loadAvatar() {
    // PROOF OF LIFE: Show a Red Cube immediately
    // If the user sees this cube, the engine is WORKING.
    const proofCube = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 1.0, 0.5),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    proofCube.position.y = 0.52; // Stand on stage
    while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
    avatarGroup.add(proofCube);
    
    const path = modelSources[currentSourceIndex];
    showStatus(`BOUTIQUE ARRIVING... ${currentSourceIndex + 1}/${modelSources.length}`);

    gltfLoader.load(path, (gltf) => {
        const model = gltf.scene || gltf.scenes[0];
        if (!model) return;

        // Force visibility
        model.traverse(o => {
            if (o.isMesh) {
                o.visible = true;
                if (o.material) {
                    const m = Array.isArray(o.material) ? o.material[0] : o.material;
                    m.side = THREE.DoubleSide;
                    m.transparent = false;
                    m.opacity = 1.0;
                    if (m.emissive) m.emissive.setHex(0x333333);
                }
            }
        });

        // Simple Scaling
        model.scale.set(1, 1, 1);
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        
        const s = size.y > 0 ? 1.7 / size.y : 1.0;
        model.scale.multiplyScalar(s);
        model.updateMatrixWorld(true);

        const newBox = new THREE.Box3().setFromObject(model);
        const center = newBox.getCenter(new THREE.Vector3());
        
        model.position.x = -center.x;
        model.position.z = -center.z;
        model.position.y = -newBox.min.y + 0.02;

        // SWAP CUBE WITH MODEL
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(model);
        
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
        }
        
        clearStatus();
        console.log("FINAL SUCCESS: Model on stage.");

    }, null, (err) => {
        console.error("Load failed for:", path);
        tryNextSource();
    });
}

function tryNextSource() {
    currentSourceIndex++;
    if (currentSourceIndex < modelSources.length) {
        loadAvatar();
    } else {
        showStatus("ERROR: Use local server for 3D GLB/GLTF.");
    }
}

function onResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !renderer || !camera) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.01;
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    const ring = scene ? scene.getObjectByName('goldRing') : null;
    if (ring) ring.rotation.z += 0.005;
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function showStatus(msg) {
    let div = document.getElementById('engine-status-msg');
    if (!div) {
        div = document.createElement('div');
        div.id = 'engine-status-msg';
        div.style = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#D4AF37; font-family:"Montserrat", sans-serif; font-size:12px; letter-spacing:3px; text-transform:uppercase; z-index:1000; text-shadow:0 0 10px rgba(212,175,55,0.5); font-weight:700;';
        document.getElementById('canvas-container').appendChild(div);
    }
    div.innerText = msg;
    div.style.display = 'block';
}

function clearStatus() {
    const div = document.getElementById('engine-status-msg');
    if (div) div.style.display = 'none';
}

function safeChangeColor(model, keywords, hexColor) {
    if (!model) return;
    model.traverse((o) => {
        if (o.isMesh && o.material) {
            const name = (o.name || "").toLowerCase();
            const match = keywords.some(k => name.includes(k));
            if (match) {
                const materials = Array.isArray(o.material) ? o.material : [o.material];
                materials.forEach(m => { if (m && m.color) m.color.setHex(hexColor); });
            }
        }
    });
}

window.onComplexionChange = (tone) => {
    const tones = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = tones[tone] || 0xFAD4B2;
    if (avatarGroup.children.length > 0) {
        safeChangeColor(avatarGroup.children[0], ['skin', 'face', 'body', 'head', 'arm', 'leg'], color);
    }
};

window.onOutfitColorChange = (colorName) => {
    const palette = { 'ruby': 0x9B111E, 'emerald': 0x006D5B, 'gold': 0xD4AF37, 'navy': 0x000080, 'azure': 0x007FFF, 'rosegold': 0xE0BFB8 };
    const color = palette[(colorName || "").toLowerCase()] || 0x006D5B;
    if (avatarGroup.children.length > 0) {
        safeChangeColor(avatarGroup.children[0], ['cloth', 'dress', 'shirt', 'top', 'pant', 'outfit', 'fabric'], color);
    }
};

if (document.readyState === 'complete') init();
else window.addEventListener('load', init);

