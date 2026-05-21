// libaas_ai/engine.js - INTERNAL AI FOLDER STUDIO v25.0
// fashion_girl.glb path: libaas_ai/fashion_girl.glb (relative to index.html)

let scene, camera, renderer, controls, clock;
let avatarGroup   = null;
let gltfLoader    = null;
let mixer         = null;
let isInitialized = false;
let initRetryTimer= null;
let allMeshes     = [];  // Every mesh in the model

const MODEL_PATH = "libaas_ai/fashion_girl.glb";

const COLOR_PALETTE = {
    ruby    : 0x9B111E,
    emerald : 0x006D5B,
    gold    : 0xD4AF37,
    navy    : 0x000080,
    azure   : 0x007FFF,
    rosegold: 0xE0BFB8
};

// ─────────────────────────────────────────────
//  INIT — called when tryon modal opens
// ─────────────────────────────────────────────
function init() {
    const container = document.getElementById('canvas-container');
    if (!container) { console.error('⛔ canvas-container not found'); return; }

    const w = container.clientWidth  || container.offsetWidth;
    const h = container.clientHeight || container.offsetHeight;

    if (w < 10 || h < 10) {
        console.warn('⏳ canvas zero-size, retry in 150ms...');
        clearTimeout(initRetryTimer);
        initRetryTimer = setTimeout(init, 150);
        return;
    }

    if (isInitialized) { onResize(); return; }

    console.log('🚀 Engine INIT', w, '×', h);
    isInitialized = true;
    container.innerHTML = '';

    clock    = new THREE.Clock();
    scene    = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    const dir = new THREE.DirectionalLight(0xffffff, 1.5);
    dir.position.set(2, 5, 5);
    dir.castShadow = true;
    scene.add(dir);
    const rim = new THREE.PointLight(0xD4AF37, 1.5, 10);
    rim.position.set(-2, 3, -2);
    scene.add(rim);

    buildStage();

    avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.1, 0);
        controls.enableDamping  = true;
        controls.dampingFactor  = 0.05;
        controls.autoRotate     = true;
        controls.autoRotateSpeed = 0.5;
        controls.enablePan    = false;
        controls.enableZoom   = false;
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
            emissive: 0xD4AF37, emissiveIntensity: 0.2
        })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.025;
    ring.name = 'goldRing';
    g.add(ring);

    scene.add(g);
}

// ─────────────────────────────────────────────
//  LOAD GLB
// ─────────────────────────────────────────────
function loadModel() {
    if (typeof THREE.GLTFLoader === 'undefined') {
        showStatus('GLTFLoader missing'); return;
    }
    gltfLoader = new THREE.GLTFLoader();
    allMeshes  = [];
    showStatus('BOUTIQUE ARRIVING...');

    gltfLoader.load(
        MODEL_PATH,
        function onLoad(gltf) {
            console.log('✅ fashion_girl.glb loaded!');
            clearStatus();

            const model = gltf.scene || gltf.scenes[0];
            if (!model) return;

            // Fix all materials + collect meshes
            model.traverse(function(o) {
                if (!o.isMesh) return;
                o.castShadow    = true;
                o.receiveShadow = true;
                allMeshes.push(o);

                const mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach(function(m) {
                    m.side        = THREE.DoubleSide;
                    m.transparent = false;
                    m.depthWrite  = true;
                    m.opacity     = 1.0;
                    m.needsUpdate = true;
                });
            });

            console.log('🧩 Total meshes in model:', allMeshes.length);
            allMeshes.forEach(function(o) {
                const mName = Array.isArray(o.material) ? o.material[0].name : o.material.name;
                console.log('   Mesh:', o.name, '| Mat:', mName);
            });

            // Auto-scale to ~1.75 units tall
            const box  = new THREE.Box3().setFromObject(model);
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
                console.log('🎬 Animation playing');
            }

            // ★ Apply selected dress right after load ★
            setTimeout(applyCurrentDress, 600);
        },
        function onProgress(xhr) {
            if (xhr.lengthComputable)
                showStatus('LOADING ' + Math.round(xhr.loaded / xhr.total * 100) + '%');
        },
        function onError(err) {
            console.error('❌ Model load error:', err);
            showStatus('MODEL ERROR');
            setTimeout(clearStatus, 4000);
        }
    );
}

// ─────────────────────────────────────────────
//  ★ APPLY CURRENT SELECTED DRESS ★
//  Reads dress info from the UI and applies to model
// ─────────────────────────────────────────────
function applyCurrentDress() {
    if (!avatarGroup || !avatarGroup.children.length) return;
    if (allMeshes.length === 0) {
        // Rebuild mesh list if empty
        avatarGroup.children[0].traverse(function(o) {
            if (o.isMesh) allMeshes.push(o);
        });
    }

    const card     = document.querySelector('.selected-dress-card');
    const colorName = card ? (card.getAttribute('data-color') || 'emerald') : 'emerald';
    const imgEl    = document.querySelector('.tryon-selected-img');
    const imgSrc   = imgEl ? imgEl.src : null;

    console.log('👗 Applying dress | color:', colorName, '| img:', imgSrc ? imgSrc.split('/').pop() : 'none');

    // Try texture first, fallback to color
    if (imgSrc && imgSrc.length > 10 && !imgSrc.endsWith('/')) {
        applyTextureToModel(imgSrc, colorName);
    } else {
        applyColorToModel(colorName);
    }
}

// Apply texture image to model's OUTER/CLOTHING meshes
// Strategy: apply to all non-tiny meshes — fashion model is mostly clothing
function applyTextureToModel(imgSrc, colorFallback) {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    loader.load(
        imgSrc,
        function(tex) {
            tex.flipY    = false;
            tex.encoding = THREE.sRGBEncoding;
            tex.needsUpdate = true;

            // Apply to CLOTHING meshes only (skip obvious skin by name)
            let applied = 0;
            allMeshes.forEach(function(o) {
                const n = (o.name + ' ' + getMaterialName(o)).toLowerCase();
                // Skip skin/face/hair meshes
                const isSkin = /\b(skin|face|head|hair|eye|teeth|tongue|lip|ear|brow|lash)\b/.test(n);
                if (isSkin) return;

                const mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach(function(m) {
                    m.map   = tex;
                    m.color.setHex(0xffffff);
                    m.needsUpdate = true;
                });
                applied++;
            });

            console.log('✅ Dress texture applied to', applied, 'meshes');

            // If nothing matched, try color instead
            if (applied === 0) {
                console.warn('⚠️ 0 meshes matched — applying color fallback');
                applyColorToModel(colorFallback);
            }
        },
        undefined,
        function(err) {
            console.warn('⚠️ Texture load failed, using color:', colorFallback);
            applyColorToModel(colorFallback);
        }
    );
}

// Apply solid color to all non-skin meshes
function applyColorToModel(colorName) {
    const hex = COLOR_PALETTE[(colorName || '').toLowerCase()] || COLOR_PALETTE.emerald;

    let applied = 0;
    allMeshes.forEach(function(o) {
        const n = (o.name + ' ' + getMaterialName(o)).toLowerCase();
        const isSkin = /\b(skin|face|head|hair|eye|teeth|tongue|lip|ear|brow|lash)\b/.test(n);
        if (isSkin) return;

        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function(m) {
            if (m.map) m.map = null; // Remove old texture
            m.color.setHex(hex);
            m.needsUpdate = true;
        });
        applied++;
    });

    // If STILL nothing (all mesh names are skin-like), apply to everything
    if (applied === 0) {
        console.warn('⚠️ No non-skin meshes found — applying color to ALL meshes');
        allMeshes.forEach(function(o) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(function(m) {
                m.color.setHex(hex);
                m.needsUpdate = true;
            });
        });
        applied = allMeshes.length;
    }

    console.log('🎨 Color', colorName, '(#'+hex.toString(16)+')', 'applied to', applied, 'meshes');
}

function getMaterialName(mesh) {
    if (!mesh.material) return '';
    if (Array.isArray(mesh.material)) return mesh.material.map(function(m){return m.name||'';}).join(' ');
    return mesh.material.name || '';
}

// ─────────────────────────────────────────────
//  ANIMATE
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
//  STATUS
// ─────────────────────────────────────────────
function showStatus(msg) {
    let el = document.getElementById('engine-status-msg');
    if (!el) {
        el = document.createElement('div');
        el.id = 'engine-status-msg';
        el.style.cssText = 'position:absolute;top:16px;left:50%;transform:translateX(-50%);color:#D4AF37;font-family:"Montserrat",sans-serif;font-size:9px;letter-spacing:3px;text-transform:uppercase;z-index:1000;font-weight:700;pointer-events:none;white-space:nowrap';
        const c = document.getElementById('canvas-container');
        if (c) c.appendChild(el);
    }
    el.textContent  = msg;
    el.style.display = 'block';
}
function clearStatus() {
    const el = document.getElementById('engine-status-msg');
    if (el) el.style.display = 'none';
}

// ─────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────

// Called when dress card / product is selected
window.applyBodyTexture = function(imageSrc) {
    const card = document.querySelector('.selected-dress-card');
    const colorName = card ? (card.getAttribute('data-color') || 'emerald') : 'emerald';
    if (allMeshes.length === 0) {
        // Model not loaded yet — queue it
        setTimeout(function() { window.applyBodyTexture(imageSrc); }, 500);
        return;
    }
    applyTextureToModel(imageSrc, colorName);
};

// Called when color name changes (advisor/arrows)
window.onOutfitColorChange = function(colorName) {
    if (allMeshes.length === 0) {
        setTimeout(function() { window.onOutfitColorChange(colorName); }, 500);
        return;
    }
    applyColorToModel(colorName);
};

// Called when complexion circle clicked
window.onComplexionChange = function(tone) {
    const tones = { fair: 0xFAD4B2, medium: 0xE6B98D, tan: 0xC68E5A, deep: 0x8D5524 };
    const hex   = tones[tone] || tones.fair;
    allMeshes.forEach(function(o) {
        const n = (o.name + ' ' + getMaterialName(o)).toLowerCase();
        const isSkin = /\b(skin|face|head|arm|leg|hand|neck|foot|body|eye)\b/.test(n);
        if (!isSkin) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function(m) { if (m.color) m.color.setHex(hex); });
    });
};

// Called when webcam face captured
window.applyFaceTexture = function(canvas) {
    if (!allMeshes.length) return;
    const tex = new THREE.CanvasTexture(canvas);
    tex.flipY    = false;
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 16;
    allMeshes.forEach(function(o) {
        const n = (o.name + ' ' + getMaterialName(o)).toLowerCase();
        if (!n.includes('face') && !n.includes('head') && !n.includes('skin')) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach(function(m) { m.map = tex; m.color.setHex(0xffffff); m.needsUpdate = true; });
    });
};

// ★ Main entry — called by script.js when modal opens
window.initTryOnEngine = function() { init(); };

// ★ Re-apply current dress (called externally if needed)
window.applySelectedDress = applyCurrentDress;
