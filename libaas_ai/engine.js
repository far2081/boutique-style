// libaas_ai/engine.js - INTERNAL AI FOLDER STUDIO v25.0
// fashion_girl.glb path: libaas_ai/fashion_girl.glb (relative to index.html)

let scene, camera, renderer, controls, clock;
let avatarGroup   = null;
let gltfLoader    = null;
let mixer         = null;
let isInitialized = false;
let initRetryTimer= null;
let allMeshes     = [];  // Every mesh in the model
let aiBillboardMesh = null;
let targetBone = null;
let originalMeshesState = [];
let model         = null;

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

    window.renderer = renderer;
    window.scene    = scene;
    window.camera   = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 2.0);
    dir.position.set(3, 6, 5);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.bias = -0.0001;
    scene.add(dir);
    const rim = new THREE.PointLight(0xffeedd, 0.6, 10);
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

            model = gltf.scene || gltf.scenes[0];
            if (!model) return;
            window.model = model; // Expose model globally for integration

            // Fix all materials + collect meshes
            model.traverse(function(o) {
                if (!o.isMesh) return;
                o.castShadow    = true;
                o.receiveShadow = true;
                allMeshes.push(o);

                // Initialize hand meshes as matte skin
                if (o.name.toLowerCase().includes('hand')) {
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    mats.forEach(function(m) {
                        if (m.name === 'fashion_girl_details') {
                            if (!o.isMaterialCloned) {
                                o.material = m.clone();
                                o.isMaterialCloned = true;
                            }
                            const tones = { fair: 0xFAD4B2, medium: 0xE6B98D, tan: 0xC68E5A, deep: 0x8D5524 };
                            const hex   = tones[currentComplexion] || tones.fair;
                            o.material.color.setHex(hex);
                            o.material.map = null;
                            o.material.roughness = 0.9;
                            o.material.metalness = 0.0;
                            o.material.metalnessMap = null;
                            o.material.roughnessMap = null;
                            o.material.needsUpdate = true;
                        }
                    });
                }

                const mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach(function(m) {
                    m.side        = THREE.DoubleSide;
                    m.transparent = false;
                    m.depthWrite  = true;
                    m.opacity     = 1.0;
                    if (m.name === 'fashion_girl_main') {
                        m.roughness = 0.9;
                        m.metalness = 0.0;
                        m.metalnessMap = null;
                        m.roughnessMap = null;
                        if (m.normalScale) {
                            m.normalScale.set(1.8, 1.8);
                        }
                    }
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
//  ★ COMPOSITE TEXTURE AND DRESS COMPONENT ★
// ─────────────────────────────────────────────

let baseSkinImage = new Image();
baseSkinImage.crossOrigin = "anonymous";
baseSkinImage.src = "libaas_ai/extracted_img_3_image.png";
baseSkinImage.onload = function() {
    console.log("✅ baseSkinImage loaded successfully");
    if (avatarGroup && avatarGroup.children.length > 0) {
        updateCompositeTexture();
    }
};

let currentDressTexture = null;
let currentDressColor = null;
let currentComplexion = "fair";

async function updateCompositeTexture(basePath, outfitPath) {
    if (basePath && outfitPath) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        try {
            const baseImg = await loadImageSafe(basePath);
            const outfitImg = await loadImageSafe(outfitPath);

            canvas.width = baseImg.width;
            canvas.height = baseImg.height;

            ctx.drawImage(baseImg, 0, 0);
            ctx.drawImage(outfitImg, 0, 0);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            applyTextureToModel(texture);

        } catch (err) {
            console.warn("⚠️ Texture update skipped (image missing)", err);
        }
        return;
    }

    if (!baseSkinImage.complete) {
        console.warn("⏳ baseSkinImage not loaded yet, deferring composition");
        return;
    }

    let mainMaterial = null;
    allMeshes.forEach(function(o) {
        const mat = o.material;
        if (mat) {
            const mats = Array.isArray(mat) ? mat : [mat];
            mats.forEach(function(m) {
                if (m.name === 'fashion_girl_main') {
                    mainMaterial = m;
                }
            });
        }
    });

    if (!mainMaterial) {
        console.warn("⚠️ fashion_girl_main material not found in model yet");
        return;
    }

    let canvas = document.getElementById('composite-texture-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'composite-texture-canvas';
        canvas.width = 1024;
        canvas.height = 1024;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    ctx.drawImage(baseSkinImage, 0, 0, 1024, 1024);

    const imgData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imgData.data;

    const tones = {
        fair: [250, 212, 178],
        medium: [230, 185, 141],
        tan: [198, 142, 90],
        deep: [141, 85, 36]
    };
    const compColor = tones[currentComplexion] || tones.fair;

    let dressData = null;
    if (currentDressTexture && currentDressTexture.image) {
        const dressImg = currentDressTexture.image;
        if (dressImg.complete && dressImg.width > 0) {
            const dressCanvas = document.createElement('canvas');
            dressCanvas.width = 1024;
            dressCanvas.height = 1024;
            const dressCtx = dressCanvas.getContext('2d');
            const pattern = dressCtx.createPattern(dressImg, 'repeat');
            dressCtx.fillStyle = pattern;
            dressCtx.fillRect(0, 0, 1024, 1024);
            dressData = dressCtx.getImageData(0, 0, 1024, 1024).data;
        }
    }

    let fallbackR = 0, fallbackG = 109, fallbackB = 91;
    if (currentDressColor) {
        const hex = COLOR_PALETTE[currentDressColor.toLowerCase()] || COLOR_PALETTE.emerald;
        fallbackR = (hex >> 16) & 0xff;
        fallbackG = (hex >> 8) & 0xff;
        fallbackB = hex & 0xff;
    }

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];

        if (r < 40 && g < 40 && b < 40) {
            continue;
        }

        const isWhite = (r > 140 && g > 140 && b > 140) && (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15);
        const isGreen = (g > 50) && (g - r > 20) && (g - b > 15);
        const isPurple = (r > 50 && b > 50) && (r - g > 20) && (b - g > 20);

        // Exclude warm skin highlights from white clothing classification
        const isSkinHighlight = (r > g) && (g > b - 15) && (r - b > 10) && (r > 130);
        const isClothing = (isWhite && !isSkinHighlight) || isGreen || isPurple;

        const isSkin = ((r > 40 && g > 30 && b > 25) && (r > g) && (g > b - 20) && (r - b > 15)) || isSkinHighlight;

        if (isClothing) {
            let S = 1.0;
            if (isWhite) {
                S = r / 240;
            } else if (isGreen) {
                S = g / 170;
            } else if (isPurple) {
                S = (r + b) / 250;
            }
            S = Math.max(0.0, Math.min(1.2, S));

            if (dressData) {
                data[i]   = Math.min(255, dressData[i] * S);
                data[i+1] = Math.min(255, dressData[i+1] * S);
                data[i+2] = Math.min(255, dressData[i+2] * S);
            } else {
                data[i]   = Math.min(255, fallbackR * S);
                data[i+1] = Math.min(255, fallbackG * S);
                data[i+2] = Math.min(255, fallbackB * S);
            }
        } else if (isSkin) {
            const L = 0.299 * r + 0.587 * g + 0.114 * b;
            const ratio = L / 175;
            data[i]   = Math.min(255, ratio * compColor[0]);
            data[i+1] = Math.min(255, ratio * compColor[1]);
            data[i+2] = Math.min(255, ratio * compColor[2]);
        } else {
            // Preserves eye glare, eye details, eyebrows, makeup, hair shadows, boots
        }
    }

    ctx.putImageData(imgData, 0, 0);

    // Overlay captured face if available
    if (window.capturedFaceCanvas) {
        try {
            // Create a feathered oval mask offscreen
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = 256;
            maskCanvas.height = 256;
            const mCtx = maskCanvas.getContext('2d');
            
            // Draw a radial gradient centered at (128, 128)
            const grad = mCtx.createRadialGradient(128, 128, 55, 128, 128, 115);
            grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
            grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.85)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            mCtx.fillStyle = grad;
            mCtx.save();
            mCtx.translate(128, 128);
            // Oval: slightly narrower horizontally (0.7) to match face shape
            mCtx.scale(0.7, 0.95);
            mCtx.beginPath();
            mCtx.arc(0, 0, 128, 0, Math.PI * 2);
            mCtx.fill();
            mCtx.restore();

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 256;
            tempCanvas.height = 256;
            const tCtx = tempCanvas.getContext('2d');
            
            // Draw face image
            tCtx.drawImage(window.capturedFaceCanvas, 0, 0, 256, 256);
            
            // Mask it with the feathered oval
            tCtx.globalCompositeOperation = 'destination-in';
            tCtx.drawImage(maskCanvas, 0, 0);
            tCtx.globalCompositeOperation = 'source-over';

            // Now draw onto composite-texture-canvas
            ctx.save();
            // Center of face in atlas UV space: (860, 488)
            ctx.translate(860, 488);
            // Rotate 90 degrees CCW to match face UV orientation in fashion_girl.glb
            ctx.rotate(-Math.PI / 2);
            
            // Draw the masked face centered
            // The actual face region is approx 124x198. With padding, we scale to 160x230.
            ctx.drawImage(tempCanvas, -230 / 2, -160 / 2, 230, 160);
            ctx.restore();
            console.log("👤 Captured face overlay applied to composite texture!");
        } catch (faceErr) {
            console.error("❌ Error drawing captured face onto composite texture:", faceErr);
        }
    }

    if (!mainMaterial.map || !(mainMaterial.map instanceof THREE.CanvasTexture)) {
        const canvasTex = new THREE.CanvasTexture(canvas);
        canvasTex.flipY = false;
        canvasTex.encoding = THREE.sRGBEncoding;
        mainMaterial.map = canvasTex;
    }
    mainMaterial.map.needsUpdate = true;
    mainMaterial.color.setHex(0xffffff);
    mainMaterial.roughness = 0.9;
    mainMaterial.metalness = 0.0;
    mainMaterial.metalnessMap = null;
    mainMaterial.roughnessMap = null;
    mainMaterial.needsUpdate = true;
    console.log("✅ Dress dynamic compositing applied successfully!");
}

function applyCurrentDress() {
    if (!avatarGroup || !avatarGroup.children.length) return;
    if (allMeshes.length === 0) {
        avatarGroup.children[0].traverse(function(o) {
            if (o.isMesh) allMeshes.push(o);
        });
    }

    const card     = document.querySelector('.selected-dress-card');
    const colorName = card ? (card.getAttribute('data-color') || 'emerald') : 'emerald';
    const imgEl    = document.querySelector('.tryon-selected-img');
    const imgSrc   = imgEl ? imgEl.src : null;

    console.log('👗 Applying dress | color:', colorName, '| img:', imgSrc ? imgSrc.split('/').pop() : 'none');

    if (imgSrc && imgSrc.length > 10 && !imgSrc.endsWith('/')) {
        applyTextureToModel(imgSrc, colorName);
    } else {
        applyColorToModel(colorName);
    }
}

function applyTextureToModel(texture) {
    if (!model) return;
    
    model.traverse((child) => {
        if (child.isMesh) {
            // Safe array check to prevent silent crashes
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => {
                if (m && m.name && m.name.includes("fashion_girl_main")) {
                    m.map = texture;
                    m.needsUpdate = true;
                    m.side = THREE.DoubleSide;
                }
            });
        }
    });

    console.log("🎨 Full texture applied to avatar");
}

function applyColorToModel(colorName) {
    currentDressTexture = null;
    currentDressColor = colorName;
    updateCompositeTexture();
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
    
    // Update AI Try-On billboard position and rotation if active
    if (aiBillboardMesh) {
        if (targetBone) {
            const pos = new THREE.Vector3();
            targetBone.getWorldPosition(pos);
            // Calibrate position based on bone (pelvis/spine) world coordinates
            aiBillboardMesh.position.set(pos.x, pos.y - 0.12, pos.z);
        } else if (avatarGroup && avatarGroup.children.length > 0) {
            // Fallback: track the root of the avatar model
            const pos = new THREE.Vector3();
            avatarGroup.children[0].getWorldPosition(pos);
            aiBillboardMesh.position.set(pos.x, pos.y + 0.92, pos.z);
        }
        
        // Orient billboard to face camera (billboarding)
        if (camera) {
            aiBillboardMesh.lookAt(camera.position);
        }
    }
    
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

window.applyBodyTexture = function(imageSrc) {
    if (allMeshes.length === 0) {
        setTimeout(function() { window.applyBodyTexture(imageSrc); }, 500);
        return;
    }
    const card = document.querySelector('.selected-dress-card');
    const colorName = card ? (card.getAttribute('data-color') || 'emerald') : 'emerald';
    applyTextureToModel(imageSrc, colorName);
};

async function applyFaceToTexture(baseTexturePath, faceImagePath, outfitPath) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    try {
        const baseImg = await loadImageSafe(baseTexturePath);
        const faceImg = await loadImageSafe(faceImagePath);
        const outfitImg = await loadImageSafe(outfitPath);

        canvas.width = baseImg.width;
        canvas.height = baseImg.height;

        // 🧍 base body
        ctx.drawImage(baseImg, 0, 0);

        // 👤 FACE OVERLAY (adjust position حسب model)
        ctx.globalAlpha = 0.95;
        ctx.drawImage(faceImg, 180, 40, 120, 120);
        ctx.globalAlpha = 1.0;

        // 👗 clothes
        ctx.drawImage(outfitImg, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.flipY = false;
        texture.needsUpdate = true;

        applyTextureToModel(texture);

        console.log("🔥 Face + Outfit applied!");

    } catch (err) {
        console.error("❌ Face pipeline failed:", err);
    }
}

window.applyFullLook = async function(color) {
    const base = "/assets/base.png";
    // 👇 AI generated یا uploaded face
    const face = "/assets/face.png";
    const outfit = `/assets/outfits/${color}_casual.png`;

    await applyFaceToTexture(base, face, outfit);
};

window.onOutfitColorChange = async function(colorName) {
    if (allMeshes.length === 0) {
        setTimeout(function() { window.onOutfitColorChange(colorName); }, 500);
        return;
    }
    await window.applyFullLook(colorName);
};

window.onComplexionChange = function(tone) {
    currentComplexion = tone;
    if (avatarGroup && avatarGroup.children.length > 0) {
        updateCompositeTexture();
    }

    const tones = { fair: 0xFAD4B2, medium: 0xE6B98D, tan: 0xC68E5A, deep: 0x8D5524 };
    const hex   = tones[tone] || tones.fair;
    allMeshes.forEach(function(o) {
        if (o.name.toLowerCase().includes('hand')) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach(function(m) {
                if (m.name === 'fashion_girl_details') {
                    if (!o.isMaterialCloned) {
                        o.material = m.clone();
                        o.isMaterialCloned = true;
                    }
                    o.material.color.setHex(hex);
                    o.material.map = null;
                    o.material.roughness = 0.9;
                    o.material.metalness = 0.0;
                    o.material.metalnessMap = null;
                    o.material.roughnessMap = null;
                    o.material.needsUpdate = true;
                }
            });
        }
    });
};

window.applyFaceTexture = function(canvas) {
    window.capturedFaceCanvas = canvas;
    if (avatarGroup && avatarGroup.children.length > 0) {
        updateCompositeTexture();
    }
};

// Queue-based flood fill background keyer with smooth alpha feathering
function loadImageSafe(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            console.log("✅ Image loaded:", src);
            resolve(img);
        };

        img.onerror = (err) => {
            console.error("❌ Image failed:", src, err);
            reject(err);
        };

        // cache busting (410/404 fix)
        img.src = src.includes('?') ? (src + "&v=" + Date.now()) : (src + "?v=" + Date.now());
    });
}
window.loadImageSafe = loadImageSafe;

// Queue-based flood fill background keyer with smooth alpha feathering
function removeBackground(imageUrl, callback) {
    loadImageSafe(imageUrl).then(function(img) {
        const w = img.width;
        const h = img.height;
        
        // 1. Draw image to canvas
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        
        // 2. Perform queue-based flood-fill to find background pixels
        // Target background color is the top-left corner color
        const targetR = data[0];
        const targetG = data[1];
        const targetB = data[2];
        
        const visited = new Uint8Array(w * h);
        const queue = [];
        
        // Helper to push to queue and mark visited
        function enqueue(x, y) {
            const idx = y * w + x;
            if (!visited[idx]) {
                visited[idx] = 1;
                queue.push(idx);
            }
        }
        
        // Seed queue from the borders (top, bottom, left, right edges)
        for (let x = 0; x < w; x++) {
            enqueue(x, 0);
            enqueue(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
            enqueue(0, y);
            enqueue(w - 1, y);
        }
        
        const colorTolerance = 35; // Euclidean distance threshold
        
        let qHead = 0;
        while (qHead < queue.length) {
            const idx = queue[qHead++];
            const x = idx % w;
            const y = Math.floor(idx / w);
            
            // Check neighbors (4-connectivity)
            const neighbors = [
                {x: x + 1, y: y},
                {x: x - 1, y: y},
                {x: x, y: y + 1},
                {x: x, y: y - 1}
            ];
            
            for (let i = 0; i < neighbors.length; i++) {
                const nx = neighbors[i].x;
                const ny = neighbors[i].y;
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const nIdx = ny * w + nx;
                    if (!visited[nIdx]) {
                        const nr = data[nIdx * 4];
                        const ng = data[nIdx * 4 + 1];
                        const nb = data[nIdx * 4 + 2];
                        
                        const dist = Math.sqrt(
                            (nr - targetR) * (nr - targetR) +
                            (ng - targetG) * (ng - targetG) +
                            (nb - targetB) * (nb - targetB)
                        );
                        
                        if (dist < colorTolerance) {
                            visited[nIdx] = 1;
                            queue.push(nIdx);
                        }
                    }
                }
            }
        }
        
        // 3. Create the binary mask canvas
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = w;
        maskCanvas.height = h;
        const maskCtx = maskCanvas.getContext('2d');
        const maskImgData = maskCtx.createImageData(w, h);
        const maskData = maskImgData.data;
        
        for (let i = 0; i < visited.length; i++) {
            if (visited[i]) {
                maskData[i * 4]     = 0;
                maskData[i * 4 + 1] = 0;
                maskData[i * 4 + 2] = 0;
                maskData[i * 4 + 3] = 0;
            } else {
                maskData[i * 4]     = 0;
                maskData[i * 4 + 1] = 0;
                maskData[i * 4 + 2] = 0;
                maskData[i * 4 + 3] = 255;
            }
        }
        maskCtx.putImageData(maskImgData, 0, 0);
        
        // 4. Create final canvas and composite with blurred mask to feather the edges
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = w;
        finalCanvas.height = h;
        const finalCtx = finalCanvas.getContext('2d');
        
        finalCtx.filter = 'blur(4px)';
        finalCtx.drawImage(maskCanvas, 0, 0);
        finalCtx.filter = 'none';
        
        finalCtx.globalCompositeOperation = 'source-in';
        finalCtx.drawImage(img, 0, 0);
        finalCtx.globalCompositeOperation = 'source-over';
        
        callback(finalCanvas);
    }).catch(function(err) {
        console.error("❌ Failed to load AI Try-On image for background removal:", err);
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 768;
        fallbackCanvas.height = 1024;
        callback(fallbackCanvas);
    });
}

window.applyAIVirtualTryOnResult = function(resultUrl) {
    console.log("⚡ Applying AI try-on billboard overlay for:", resultUrl);
    window.removeAIVirtualTryOn();
    
    removeBackground(resultUrl, function(transparentCanvas) {
        if (!isInitialized || !scene) {
            console.error("⛔ Engine is not initialized, cannot apply billboard.");
            return;
        }
        
        const texture = new THREE.CanvasTexture(transparentCanvas);
        texture.encoding = THREE.sRGBEncoding;
        
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.1,
            alphaTest: 0.05
        });
        
        const geometry = new THREE.PlaneGeometry(0.95, 1.85);
        aiBillboardMesh = new THREE.Mesh(geometry, material);
        aiBillboardMesh.name = "aiBillboardOverlay";
        aiBillboardMesh.castShadow = true;
        aiBillboardMesh.receiveShadow = true;
        
        targetBone = null;
        if (avatarGroup && avatarGroup.children.length > 0) {
            avatarGroup.children[0].traverse(function(node) {
                if (node.isBone && (node.name.toLowerCase().includes('spine') || node.name.toLowerCase().includes('hips') || node.name.toLowerCase().includes('pelvis'))) {
                    if (!targetBone || node.name.toLowerCase().includes('spine')) {
                        targetBone = node;
                    }
                }
            });
        }
        
        if (targetBone) {
            console.log("🎯 Found skeleton bone to track:", targetBone.name);
        }
        
        scene.add(aiBillboardMesh);
        
        originalMeshesState = [];
        avatarGroup.traverse(function(node) {
            if (node.isMesh) {
                originalMeshesState.push({
                    mesh: node,
                    visible: node.visible
                });
                node.visible = false;
            }
        });
        
        console.log(`🙈 Hiding ${originalMeshesState.length} body meshes for billboard try-on.`);
    });
};

window.removeAIVirtualTryOn = function() {
    if (aiBillboardMesh) {
        scene.remove(aiBillboardMesh);
        if (aiBillboardMesh.geometry) aiBillboardMesh.geometry.dispose();
        if (aiBillboardMesh.material) {
            if (aiBillboardMesh.material.map) aiBillboardMesh.material.map.dispose();
            aiBillboardMesh.material.dispose();
        }
        aiBillboardMesh = null;
    }
    
    targetBone = null;
    
    if (originalMeshesState.length > 0) {
        originalMeshesState.forEach(function(state) {
            state.mesh.visible = state.visible;
        });
        originalMeshesState = [];
        console.log("👀 Restored 3D model meshes visibility.");
    }
};

function applyAIDressToModel(imageUrl) {
  if (typeof window.removeAIVirtualTryOn === 'function') {
    window.removeAIVirtualTryOn();
  }
  const textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = 'anonymous';
  textureLoader.load(imageUrl, (texture) => {
    texture.encoding = THREE.sRGBEncoding;
    if (!model) {
      console.error("Model not loaded yet!");
      return;
    }
    model.traverse((child) => {
      if (child.isMesh) {
        // 🔥 first remove old map
        if (child.material && child.material.map) {
          child.material.map.dispose();
        }

        child.material = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide
        });

        child.material.needsUpdate = true;
      }
    });

    console.log("✅ AI Dress Applied on FULL MODEL");
  });
}
window.applyAIDressToModel = applyAIDressToModel;
window.updateCompositeTexture = updateCompositeTexture;
window.applyTextureToModel = applyTextureToModel;

window.initTryOnEngine = function() { init(); };
window.applySelectedDress = applyCurrentDress;

window.captureFace = function(videoElement) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 256;
    canvas.height = 256;

    ctx.drawImage(videoElement, 0, 0, 256, 256);

    return canvas.toDataURL("image/png");
};

window.startCamera = async function(video) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
};

window.startLiveTryOn = async function() {
    const video = document.getElementById("video");
    await window.startCamera(video);
    if (typeof runFaceTracking === "function") {
        runFaceTracking(video);
    } else if (typeof window.runFaceTracking === "function") {
        window.runFaceTracking(video);
    } else {
        console.warn("runFaceTracking is not defined yet!");
    }
};

const faceMesh = new FaceMesh({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

faceMesh.onResults((results) => {
    if (!results.multiFaceLandmarks || !results.multiFaceLandmarks.length) return;

    const landmarks = results.multiFaceLandmarks[0];

    // 👇 nose + forehead points
    const nose = landmarks[1];
    const left = landmarks[234];
    const right = landmarks[454];

    const x = nose.x * 512;
    const y = nose.y * 512;

    const width = Math.abs(right.x - left.x) * 512;

    if (typeof applyLiveFace === "function") {
        applyLiveFace(x, y, width);
    } else if (typeof window.applyLiveFace === "function") {
        window.applyLiveFace(x, y, width);
    } else {
        console.warn("applyLiveFace is not defined yet!");
    }
});

window.runFaceTracking = async function(video) {
    async function process() {
        await faceMesh.send({ image: video });
        requestAnimationFrame(process);
    }
    process();
};
