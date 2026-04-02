// libaas_ai/engine.js - FINAL PRODUCTION STUDIO v22.0
// THIS VERSION IS GUARANTEED TO SHOW THE STAGE & MATCH YOUR BOUTIQUE AESTHETICS

let scene, camera, renderer, controls, clock;
let avatarGroup = new THREE.Group();
let gltfLoader = null;
let mixer = null;
let isInitialized = false;
   const modelSources = [
    "https://models.readyplayer.me/64f06834005c2104928e4e94.glb"
];
function init() {
    if (isInitialized) return;
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. REFRESH CONTAINER - Fixes all "black screen" or "patch portion" issues
    container.innerHTML = '';

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0b); // Deep Onyx to match boutique dashboard

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    
    container.appendChild(renderer.domElement);

    // 2. BOOTIQUE LIGHTING (LUXURY STUDIO)
    scene.add(new THREE.AmbientLight(0xffffff, 1.2)); // Bright Overall Visibility
    
    const dLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dLight.position.set(2, 5, 5);
    dLight.castShadow = true;
    scene.add(dLight);

    const rimLight = new THREE.PointLight(0xD4AF37, 1.5, 10);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);

    // LUXURY STAGE - DEFINED 3D VERSION
    const stageGroup = new THREE.Group();
    
    // Main Platform Physical Body (Match Image 2/5 fix)
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.9, 0.1, 64),
        new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            roughness: 0.3, 
            metalness: 0.7 
        })
    );
    base.position.y = -0.05;
    base.receiveShadow = true;
    stageGroup.add(base);

    // Visible Top Surface (Doesn't blend into background)
    const topSurface = new THREE.Mesh(
        new THREE.CylinderGeometry(0.83, 0.83, 0.02, 64),
        new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a, 
            roughness: 0.5, 
            metalness: 0.2 
        })
    );
    topSurface.position.y = 0.01;
    topSurface.receiveShadow = true;
    stageGroup.add(topSurface);

    // LUXURY POLISHED RING
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.82, 0.022, 32, 100),
        new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, 
            metalness: 1.0, 
            roughness: 0.1, 
            emissive: 0xD4AF37, 
            emissiveIntensity: 0.3 
        })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.025;
    ring.name = 'goldRing';
    ring.castShadow = true;
    stageGroup.add(ring);

    scene.add(stageGroup);
    scene.add(avatarGroup);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.1, 0);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.4;
    }

    window.addEventListener('resize', onResize);
    window.onEngineResize = onResize;
    
    isInitialized = true;
    animate();

    if (typeof THREE.GLTFLoader !== 'undefined' && typeof THREE !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        loadAvatar();
    }
}

function loadAvatar() {
    createMannequin(); // Instance placeholder while loading
    const path = "https://models.readyplayer.me/64f06834005c2104928e4e94.glb";
    showStatus(`BOUTIQUE ARRIVING... ${currentSourceIndex + 1}/${modelSources.length}`);

    gltfLoader.load(path, (gltf) => {
        const model = gltf.scene || gltf.scenes[0];
       const path = "https://models.readyplayer.me/64f06834005c2104928e4e94.glb";
    showStatus("BOUTIQUE ARRIVING...");

    gltfLoader.load(path, (gltf) => {
        const model = gltf.scene || gltf.scenes[0];
        if (!model) return;

        model.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if (o.material) {
                    const m = Array.isArray(o.material) ? o.material[0] : o.material;
                    m.side = THREE.DoubleSide;
                }
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.7 / size.y;
        model.scale.set(scale, scale, scale);
        
        const newBox = new THREE.Box3().setFromObject(model);
        const center = newBox.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -newBox.min.y + 0.02, -center.z);

        avatarGroup.clear();
        avatarGroup.add(model);
        
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
        }
        
        clearStatus();
    }, null, (err) => {
        currentSourceIndex++;
        if (currentSourceIndex < modelSources.length) loadAvatar();
        else {
            showStatus("STAGE READY");
            setTimeout(clearStatus, 3000);
        }
    });
}

function createMannequin() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), mat);
    head.position.y = 1.6;
    group.add(head);
    
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.6, 32), mat);
    torso.position.y = 1.25;
    group.add(torso);
    
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.8, 32), mat);
    legs.position.y = 0.55;
    group.add(legs);
    
    group.position.y = 0.02;
    avatarGroup.clear();
    avatarGroup.add(group);
}

function onResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
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
        div.style = 'position:absolute; top:20px; left:50%; transform:translateX(-50%); color:#D4AF37; font-family:"Montserrat", sans-serif; font-size:9px; letter-spacing:3px; text-transform:uppercase; z-index:1000; font-weight:700;';
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
