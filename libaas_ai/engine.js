// libaas_ai/engine.js - INTERNAL AI FOLDER STUDIO v24.0
// fashion_girl.glb is at: libaas_ai/fashion_girl.glb (relative to index.html root)

let scene, camera, renderer, controls, clock;
let avatarGroup = null;
let gltfLoader = null;
let mixer = null;
let isInitialized = false;
let initRetryTimer = null;

// Track all mesh materials for smart dress application
let clothingMeshes = [];   // meshes that are clothing/outfit
let skinMeshes    = [];    // meshes that are skin/face/body

const MODEL_PATH = "libaas_ai/fashion_girl.glb";

// ─────────────────────────────────────────────
//  SKIN vs CLOTHING keyword classifier
// ─────────────────────────────────────────────
const SKIN_KEYWORDS    = ['skin','face','head','arm','leg','hand','neck','foot','body','eye','teeth','mouth','hair','lash','brow','lip','tongue','ear'];
const CLOTH_KEYWORDS   = ['cloth','dress','shirt','top','pant','skirt','outfit','fabric','coat','jacket','sleeve','collar','cuff','hem','belt','shoe','boot','heel','bag','jewelry','jewel','necklace','bangle','dupatta','chunni','kameez','shalwar','lehenga','saree','gharara','frills','lace','embroidery','zari'];

function classifyMesh(name, matName) {
    const n = (name + ' ' + matName).toLowerCase();
    // If clearly skin — don't touch
    if (SKIN_KEYWORDS.some(k => n.includes(k))) return 'skin';
    // If clearly clothing — apply dress
    if (CLOTH_KEYWORDS.some(k => n.includes(k))) return 'cloth';
    // Unknown — treat as clothing (safe default for fashion model)
    return 'cloth';
}

// ─────────────────────────────────────────────
//  MAIN INIT
// ─────────────────────────────────────────────
function init() {
    const container = document.getElementById('canvas-container');
    if (!container) { console.error('⛔ canvas-container not found'); return; }

    const w = container.clientWidth  || container.offsetWidth;
    const h = container.clientHeight || container.offsetHeight;
    if (w < 10 || h < 10) {
        console.warn('⏳ canvas size zero, retrying in 150ms...');
        clearTimeout(initRetryTimer);
        initRetryTimer = setTimeout(init, 150);
        return;
    }

    if (isInitialized) { onResize(); return; }

    console.log('🚀 Engine INIT —', w, '×', h);
    isInitialized = true;

    container.innerHTML = '';

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 5, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const rimLight = new THREE.PointLight(0xD4AF37, 1.5, 10);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);

    buildStage();

    avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

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

    animate();
    loadModel();
}

// ─────────────────────────────────────────────
//  STAGE
// ─────────────────────────────────────────────
function buildStage() {
    const g = new THREE.Group();

    g.add(Object.assign(new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.9, 0.1, 64),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.5 })
    ), { position: { x: 0, y: -0.05, z: 0 }, receiveShadow: true }));

    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.9, 0.1, 64),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.4, metalness: 0.5 })
    );
    base.position.y = -0.05;
    base.receiveShadow = true;
    g.add(base);

    const top = new THREE.Mesh(
        new THREE.CylinderGeometry(0.83, 0.83, 0.02, 64),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.2 })
    );
    top.position.y = 0.01;
    top.receiveShadow = true;
    g.add(top);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.82, 0.022, 32, 100),
        new THREE.MeshStandardMaterial({
            color: 0xC5A017, metalness: 0.9, roughness: 0.15,
            emissive: 0xD4AF37, emissiveIntensity: 0.15
        })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.025;
    ring.name = 'goldRing';
    g.add(ring);

    scene.add(g);
}

// ─────────────────────────────────────────────
//  LOAD fashion_girl.glb
// ─────────────────────────────────────────────
function loadModel() {
    if (typeof THREE.GLTFLoader === 'undefined') {
        showStatus('GLTFLoader missing'); return;
    }

    gltfLoader = new THREE.GLTFLoader();
    showStatus('BOUTIQUE ARRIVING...');
    clothingMeshes = [];
    skinMeshes     = [];

    gltfLoader.load(
        MODEL_PATH,
        function onLoad(gltf) {
            console.log('✅ fashion_girl.glb loaded!');
            clearStatus();

            const model = gltf.scene || gltf.scenes[0];
            if (!model) { console.error('No scene in GLB'); return; }

            // Classify every mesh and fix materials
            model.traverse(function(o) {
                if (!o.isMesh) return;
                o.castShadow = true;
                o.receiveShadow = true;

                const mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach(function(m) {
                    m.side = THREE.DoubleSide;
                    m.transparent = false;
                    m.depthWrite  = true;
                    m.opacity     = 1.0;
                    m.needsUpdate = true;
                });

                const matName = mats.length > 0 ? (mats[0].name || '') : '';
                const type = classifyMesh(o.name, matName);
                console.log('🔍 Mesh:', o.name, '| Mat:', matName, '| Class:', type);

                if (type === 'cloth') {
                    clothingMeshes.push(o);
                } else {
                    skinMeshes.push(o);
                }
            });

            console.log('👗 Clothing meshes:', clothingMeshes.length, '| Skin meshes:', skinMeshes.length);

            // Auto-scale
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const scale = size.y > 0.01 ? 1.75 / size.y : 1.0;
            model.scale.set(scale, scale, scale);

            // Center on stage
            const newBox = new THREE.Box3().setFromObject(model);
            const center = newBox.getCenter(new THREE.Vector3());
            model.position.set(-center.x, -newBox.min.y + 0.02, -center.z);

            avatarGroup.clear();
            avatarGroup.add(model);
            renderer.render(scene, camera);

            // Animation
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(model);
                mixer.clipAction(gltf.animations[0]).play();
            }

            // ★ AUTO-APPLY selected dress as soon as model loads ★
            setTimeout(applySelectedDress, 500);
        },
        function onProgress(xhr) {
            if (xhr.lengthComputable) {
                showStatus('LOADING ' + Math.round(xhr.loaded / xhr.total * 100) + '%');
            }
        },
        function onError(err) {
            console.error('❌ Failed to load:', MODEL_PATH, err);
            showStatus('MODEL ERROR — check console');
            setTimeout(clearStatus, 4000);
        }
    );
}

// ─────────────────────────────────────────────
//  ★ APPLY SELECTED DRESS TO MODEL ★
//  Reads the currently selected dress image from
//  .tryon-selected-img and applies it as a texture
//  to all clothing meshes on the 3D model.
// ─────────────────────────────────────────────
function applySelectedDress() {
    if (!avatarGroup || avatarGroup.children.length === 0) return;

    // Get the selected dress image
    const selectedImg = document.querySelector('.tryon-selected-img');
    const imgSrc = selectedImg ? selectedImg.src : null;

    // Get the selected color
    const card = document.querySelector('.selected-dress-card');
    const colorName = card ? (card.getAttribute('data-color') || 'emerald') : 'emerald';

    console.log('👗 Applying dress — img:', imgSrc, '| color:', colorName);

    if (imgSrc && !imgSrc.includes('undefined') && !imgSrc.includes('null')) {
        // Apply dress IMAGE as texture
        applyDressTexture(imgSrc, colorName);
    } else {
        // Fallback: apply color only
        applyDressColor(colorName);
    }
}

// Apply dress image as texture to all clothing meshes
function applyDressTexture(imgSrc, colorNameFallback) {
    const loader = new THREE.TextureLoader();
    loader.load(
        imgSrc,
        function(texture) {
            texture.flipY = false;
            texture.encoding = THREE.sRGBEncoding;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            texture.needsUpdate = true;

            // If we have classified clothing meshes, use them
            const targets = clothingMeshes.length > 0
                ? clothingMeshes
                : getAllClothMeshes();

            if (targets.length === 0) {
                console.warn('⚠️ No clothing meshes found — applying color fallback');
                applyDressColor(colorNameFallback);
                return;
            }

            targets.forEach(function(o) {
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach(function(m) {
                    m.map = texture;
                    m.color.setHex(0xffffff); // Let texture show true colors
                    m.transparent = false;
                    m.needsUpdate = true;
                });
            });

            console.log('✅ Dress texture applied to', targets.length, 'meshes');
        },
        undefined,
        function(err) {
            console.warn('⚠️ Dress texture load failed, using color:', colorNameFallback, err);
            applyDressColor(colorNameFallback);
        }
    );
}

// Color-only fallback for clothing meshes
function applyDressColor(colorName) {
    const palette = {
        ruby: 0x9B111E, emerald: 0x006D5B, gold: 0xD4AF37,
        navy: 0x000080, azure: 0x007FFF, rosegold: 0xE0BFB8
    };
    const hex = palette[(colorName || '').toLowerCase()] || 0x006D5B;

    const targets = clothingMeshes.length > 0
        ? clothingMeshes
        : getAllClothMeshes();

    targets.forEach(function(o) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function(m) {
            if (m.map) { m.map = null; } // Remove any old texture
            m.color.setHex(hex);
            m.needsUpdate = true;
        });
    });

    console.log('🎨 Dress color applied:', colorName, 'to', targets.length, 'meshes');
}

// Fallback: search all meshes in model by keywords
function getAllClothMeshes() {
    const result = [];
    if (!avatarGroup || !avatarGroup.children.length) return result;
    avatarGroup.children[0].traverse(function(o) {
        if (!o.isMesh) return;
        const type = classifyMesh(o.name, o.material ? (Array.isArray(o.material) ? o.material[0].name : o.material.name) : '');
        if (type === 'cloth') result.push(o);
    });
    return result;
}

// ─────────────────────────────────────────────
//  ANIMATE LOOP
// ─────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.016;
    if (mixer)    mixer.update(delta);
    if (controls) controls.update();
    if (scene) {
        const ring = scene.getObjectByName('goldRing');
        if (ring) ring.rotation.z += 0.004;
    }
    if (renderer && scene && camera) renderer.render(scene, camera);
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
            'position:absolute','top:20px','left:50%',
            'transform:translateX(-50%)',
            'color:#D4AF37',
            'font-family:"Montserrat",sans-serif',
            'font-size:9px','letter-spacing:3px',
            'text-transform:uppercase','z-index:1000',
            'font-weight:700','pointer-events:none'
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
//  PUBLIC API — called from script.js / index.html
// ─────────────────────────────────────────────

// Called when complexion circle is clicked
window.onComplexionChange = function(tone) {
    const tones = { fair: 0xFAD4B2, medium: 0xE6B98D, tan: 0xC68E5A, deep: 0x8D5524 };
    const color = tones[tone] || 0xFAD4B2;
    const targets = skinMeshes.length > 0 ? skinMeshes : getAllSkinMeshes();
    targets.forEach(function(o) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function(m) { if (m.color) m.color.setHex(color); });
    });
};

function getAllSkinMeshes() {
    const result = [];
    if (!avatarGroup || !avatarGroup.children.length) return result;
    avatarGroup.children[0].traverse(function(o) {
        if (!o.isMesh) return;
        const type = classifyMesh(o.name, o.material ? (Array.isArray(o.material) ? o.material[0].name : o.material.name) : '');
        if (type === 'skin') result.push(o);
    });
    return result;
}

// Called when outfit color / dress changes — applies dress image + color
window.onOutfitColorChange = function(colorName) {
    applyDressColor(colorName);
};

// ★ MAIN: Called when a new dress is selected (from script.js syncGlobalProduct / applyBtn)
window.applySelectedDress = applySelectedDress;

// Called with dress image URL directly
window.applyBodyTexture = function(imageSource) {
    const card = document.querySelector('.selected-dress-card');
    const colorName = card ? (card.getAttribute('data-color') || 'emerald') : 'emerald';
    applyDressTexture(imageSource, colorName);
};

// Face texture (webcam capture)
window.applyFaceTexture = function(canvas) {
    if (!avatarGroup || !avatarGroup.children.length) return;
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.encoding = THREE.sRGBEncoding;
    texture.anisotropy = 16;
    const targets = skinMeshes.length > 0 ? skinMeshes : getAllSkinMeshes();
    targets.forEach(function(o) {
        const name = (o.name || '').toLowerCase();
        if (name.includes('face') || name.includes('head')) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(function(m) {
                m.map = texture;
                if (m.color) m.color.setHex(0xffffff);
                m.needsUpdate = true;
            });
        }
    });
};

// ─────────────────────────────────────────────
//  ENTRY POINT — called by script.js when modal opens
// ─────────────────────────────────────────────
window.initTryOnEngine = function() {
    init();
};
