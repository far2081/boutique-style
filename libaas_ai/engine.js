// libaas_ai/engine.js - INTERNAL AI FOLDER STUDIO v23.0
// Loaded from index.html via: <script src="libaas_ai/engine.js">
// fashion_girl.glb is at: libaas_ai/fashion_girl.glb (relative to index.html root)

let scene, camera, renderer, controls, clock;
let avatarGroup = null;
let gltfLoader = null;
let mixer = null;
let isInitialized = false;
let initRetryTimer = null;

// GLB path relative to the HTML page (index.html is at engin/ root)
const MODEL_PATH = "libaas_ai/fashion_girl.glb";

// ─────────────────────────────────────────────
//  MAIN INIT — called when try-on modal opens
// ─────────────────────────────────────────────
function init() {
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error("⛔ canvas-container not found");
        return;
    }

    // If container has no size yet (modal still animating), retry in 100ms
    const w = container.clientWidth  || container.offsetWidth;
    const h = container.clientHeight || container.offsetHeight;
    if (w < 10 || h < 10) {
        console.warn("⏳ canvas-container size is zero, retrying in 150ms...");
        clearTimeout(initRetryTimer);
        initRetryTimer = setTimeout(init, 150);
        return;
    }

    if (isInitialized) {
        // Already running — just fix size
        onResize();
        return;
    }

    console.log("🚀 Engine INIT — canvas size:", w, "×", h);
    isInitialized = true;

    // Clear any previous canvas
    container.innerHTML = '';

    // ── Clock & Scene ──
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // ── Camera ──
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);

    // ── Renderer ──
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const rimLight = new THREE.PointLight(0xD4AF37, 1.5, 10);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);

    // ── Luxury Stage ──
    buildStage();

    // ── Avatar Group ──
    avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // ── Controls ──
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.1, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableRotate = false;
    }

    window.addEventListener('resize', onResize);
    window.onEngineResize = onResize;

    // ── Start render loop ──
    animate();

    // ── Load the GLB model ──
    loadModel();
}

// ─────────────────────────────────────────────
//  STAGE
// ─────────────────────────────────────────────
function buildStage() {
    const stageGroup = new THREE.Group();

    // Base disc
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.9, 0.1, 64),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.5 })
    );
    base.position.y = -0.05;
    base.receiveShadow = true;
    stageGroup.add(base);

    // Top surface
    const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.83, 0.83, 0.02, 64),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.2 })
    );
    top.position.y = 0.01;
    top.receiveShadow = true;
    stageGroup.add(top);

    // Gold ring
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.82, 0.022, 32, 100),
        new THREE.MeshStandardMaterial({
            color: 0xC5A017,
            metalness: 0.9,
            roughness: 0.15,
            emissive: 0xD4AF37,
            emissiveIntensity: 0.15
        })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.025;
    ring.name = 'goldRing';
    stageGroup.add(ring);

    scene.add(stageGroup);
}

// ─────────────────────────────────────────────
//  LOAD fashion_girl.glb
// ─────────────────────────────────────────────
function loadModel() {
    if (typeof THREE.GLTFLoader === 'undefined') {
        console.error("⛔ GLTFLoader not available");
        showStatus("GLTFLoader missing");
        return;
    }

    gltfLoader = new THREE.GLTFLoader();
    showStatus("BOUTIQUE ARRIVING...");

    gltfLoader.load(
        MODEL_PATH,
        function onLoad(gltf) {
            console.log("✅ fashion_girl.glb loaded!");
            clearStatus();

            const model = gltf.scene || gltf.scenes[0];
            if (!model) { console.error("No scene in GLB"); return; }

            // Fix materials
            model.traverse(function(o) {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    mats.forEach(function(m) {
                        m.side = THREE.DoubleSide;
                        m.transparent = false;
                        m.depthWrite = true;
                        m.opacity = 1.0;
                        m.needsUpdate = true;
                    });
                }
            });

            // Auto-scale to ~1.75 units tall
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            console.log("📏 Model size:", size);

            let scale = 1.0;
            if (size.y > 0.01) {
                scale = 1.75 / size.y;
            }
            model.scale.set(scale, scale, scale);

            // Center on stage
            const newBox = new THREE.Box3().setFromObject(model);
            const center = newBox.getCenter(new THREE.Vector3());
            model.position.set(-center.x, -newBox.min.y + 0.02, -center.z);

            console.log("📍 Model pos:", model.position, "scale:", scale);

            avatarGroup.clear();
            avatarGroup.add(model);

            // Force one render
            renderer.render(scene, camera);

            // Play first animation if any
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(model);
                mixer.clipAction(gltf.animations[0]).play();
                console.log("🎬 Animation started");
            }

            // Apply initial outfit color
            setTimeout(function() {
                if (window.onOutfitColorChange) {
                    const card = document.querySelector('.selected-dress-card');
                    const color = card ? card.getAttribute('data-color') : 'emerald';
                    window.onOutfitColorChange(color);
                }
            }, 400);
        },
        function onProgress(xhr) {
            if (xhr.lengthComputable) {
                const pct = Math.round(xhr.loaded / xhr.total * 100);
                showStatus("LOADING " + pct + "%");
            }
        },
        function onError(err) {
            console.error("❌ Failed to load:", MODEL_PATH, err);
            showStatus("MODEL ERROR — check console");
            setTimeout(clearStatus, 4000);
        }
    );
}

// ─────────────────────────────────────────────
//  ANIMATE LOOP
// ─────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.016;
    if (mixer) mixer.update(delta);
    if (controls) controls.update();

    // Rotate gold ring
    if (scene) {
        const ring = scene.getObjectByName('goldRing');
        if (ring) ring.rotation.z += 0.004;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ─────────────────────────────────────────────
//  RESIZE
// ─────────────────────────────────────────────
function onResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth  || container.offsetWidth;
    const h = container.clientHeight || container.offsetHeight;
    if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    }
}

// ─────────────────────────────────────────────
//  STATUS OVERLAY
// ─────────────────────────────────────────────
function showStatus(msg) {
    let el = document.getElementById('engine-status-msg');
    if (!el) {
        el = document.createElement('div');
        el.id = 'engine-status-msg';
        el.style.cssText = [
            'position:absolute', 'top:20px', 'left:50%',
            'transform:translateX(-50%)',
            'color:#D4AF37',
            'font-family:"Montserrat",sans-serif',
            'font-size:9px',
            'letter-spacing:3px',
            'text-transform:uppercase',
            'z-index:1000',
            'font-weight:700',
            'pointer-events:none'
        ].join(';');
        const c = document.getElementById('canvas-container');
        if (c) c.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
}

function clearStatus() {
    const el = document.getElementById('engine-status-msg');
    if (el) el.style.display = 'none';
}

// ─────────────────────────────────────────────
//  MATERIAL HELPERS (called from script.js)
// ─────────────────────────────────────────────
function safeChangeColor(model, keywords, hexColor) {
    if (!model) return;
    model.traverse(function(o) {
        if (!o.isMesh || !o.material) return;
        const mName = (o.name || '').toLowerCase();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function(m) {
            const matName = (m.name || '').toLowerCase();
            const hit = keywords.some(function(k) {
                return mName.includes(k) || matName.includes(k);
            });
            if (hit && m.color) m.color.setHex(hexColor);
        });
    });
}

window.onComplexionChange = function(tone) {
    const tones = { fair: 0xFAD4B2, medium: 0xE6B98D, tan: 0xC68E5A, deep: 0x8D5524 };
    const color = tones[tone] || 0xFAD4B2;
    if (avatarGroup && avatarGroup.children.length > 0) {
        safeChangeColor(avatarGroup.children[0],
            ['skin','face','body','head','arm','leg','hand','neck','foot'], color);
    }
};

window.onOutfitColorChange = function(colorName) {
    const palette = {
        ruby: 0x9B111E, emerald: 0x006D5B, gold: 0xD4AF37,
        navy: 0x000080, azure: 0x007FFF, rosegold: 0xE0BFB8
    };
    const color = palette[(colorName || '').toLowerCase()] || 0x006D5B;
    if (avatarGroup && avatarGroup.children.length > 0) {
        safeChangeColor(avatarGroup.children[0],
            ['cloth','dress','shirt','top','pant','outfit','fabric'], color);
    }
};

window.applyFaceTexture = function(canvas) {
    if (!avatarGroup || !avatarGroup.children.length) return;
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 16;
    avatarGroup.children[0].traverse(function(o) {
        if (!o.isMesh || !o.material) return;
        const name = (o.name || '').toLowerCase();
        const matName = (o.material.name || '').toLowerCase();
        if (name.includes('face') || matName.includes('head') || matName.includes('skin_face')) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(function(m) {
                m.map = texture;
                if (m.color) m.color.setHex(0xffffff);
                m.needsUpdate = true;
            });
        }
    });
};

window.applyBodyTexture = function(imageSource) {
    if (!avatarGroup || !avatarGroup.children.length) return;
    const loader = new THREE.TextureLoader();
    loader.load(imageSource, function(texture) {
        texture.flipY = false;
        texture.encoding = THREE.sRGBEncoding;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        avatarGroup.children[0].traverse(function(o) {
            if (!o.isMesh || !o.material) return;
            const name = (o.name || '').toLowerCase();
            const matName = (o.material.name || '').toLowerCase();
            const keywords = ['cloth','dress','shirt','top','pant','outfit','fabric','body','legs','torso'];
            if (keywords.some(function(k) { return name.includes(k) || matName.includes(k); })) {
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach(function(m) {
                    m.map = texture;
                    if (m.color) m.color.setHex(0xffffff);
                    m.needsUpdate = true;
                });
            }
        });
    });
};

// ─────────────────────────────────────────────
//  GLOBAL ENTRY POINT
//  Called by script.js when tryon-modal opens
// ─────────────────────────────────────────────
window.initTryOnEngine = function() {
    init();
};
