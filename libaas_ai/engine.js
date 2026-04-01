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
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 2, 10);

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(2, 5, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    // LUXURY STAGE RESTORED
    const stageGroup = new THREE.Group();
    const baseStage = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.9, 0.08, 64),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 })
    );
    baseStage.position.y = -0.04;
    stageGroup.add(baseStage);

    const topStage = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.02, 64),
        new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1, metalness: 0.5 })
    );
    topStage.position.y = 0.01;
    stageGroup.add(topStage);

    const goldRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.81, 0.02, 16, 100),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 1, roughness: 0.1, emissive: 0xD4AF37, emissiveIntensity: 0.2 })
    );
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 0.02;
    goldRing.name = 'goldRing';
    stageGroup.add(goldRing);

    scene.add(stageGroup);
    scene.add(avatarGroup);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.0, 0);
        controls.enableDamping = true;
        controls.autoRotate = true;
    }

    window.addEventListener('resize', onResize);
    isInitialized = true;
    
    // 1. START RENDERING IMMEDIATELY (Fixes "Stage Ghayab" issue)
    animate();

    // 2. TRIGGER ASYNC LOADING AFTER RENDERER STARTS
    if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        loadAvatar();
    }
}

function createMannequin() {
    console.log("Creating elegant mannequin fallback...");
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x222222, 
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0x111111 
    });
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), mat);
    head.position.y = 1.6;
    head.castShadow = true;
    group.add(head);
    
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.6, 16), mat);
    torso.position.y = 1.25;
    torso.castShadow = true;
    group.add(torso);
    
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.8, 16), mat);
    leg1.position.set(-0.1, 0.45, 0);
    leg1.castShadow = true;
    group.add(leg1);
    
    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.8, 16), mat);
    leg2.position.set(0.1, 0.45, 0);
    leg2.castShadow = true;
    group.add(leg2);
    
    group.position.y = 0.02;
    
    while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
    avatarGroup.add(group);
}

function loadAvatar() {
    // Elegant Placeholder instead of red box
    createMannequin();
    
    const path = modelSources[currentSourceIndex];
    showStatus(`BOUTIQUE ARRIVING... ${currentSourceIndex + 1}/${modelSources.length}`);

    gltfLoader.load(path, (gltf) => {
        const model = gltf.scene || gltf.scenes[0];
        if (!model) return;

        console.log("Processing character scene...");

        model.traverse(o => {
            if (o.isMesh) {
                o.visible = true;
                o.castShadow = true;
                o.receiveShadow = true;
                // Force base material to ensure visibility
                if (o.material) {
                    const m = Array.isArray(o.material) ? o.material[0] : o.material;
                    m.side = THREE.DoubleSide;
                    m.opacity = 1.0;
                    m.transparent = false;
                    // Boost lighting reactivity
                    if (m.isMeshStandardMaterial) {
                        m.roughness = 0.5;
                        m.metalness = 0.1;
                    }
                }
            }
        });

        // Robust Height-Based Scaling
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        
        let scale = 1.0;
        if (size.y > 0.01) {
            scale = 1.7 / size.y;
        } else {
            scale = 100.0; // Assume Blender cm -> meter scale fail
        }
        model.scale.set(scale, scale, scale);
        model.updateMatrixWorld(true);

        // Grounding on Gold Ring
        const newBox = new THREE.Box3().setFromObject(model);
        const center = newBox.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.z = -center.z;
        model.position.y = -newBox.min.y + 0.02;

        // SWAP AND SHOW
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(model);
        
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
        }
        
        clearStatus();
        console.log("SUCCESS: Final model placed on luxury stage.");

    }, null, (err) => {
        console.error("Load failed for path", path);
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

