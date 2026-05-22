// ROOT engine.js - MAIN FASHION STUDIO v22.0 (Location: Root Directory)
// THIS VERSION IS LOADED FROM THE MAIN HOME PAGE

let scene, camera, renderer, controls, clock;
let avatarGroup = new THREE.Group();
let gltfLoader = null;
let mixer = null;
let isInitialized = false;
let aiBillboardMesh = null;
let targetBone = null;
let originalMeshesState = [];
let model = null;

const modelSources = [
    "libaas_ai/fashion_girl.glb", // Primary Root
    "./libaas_ai/fashion_girl.glb",
    "fashion_girl.glb",            // Subfolder sibling
    "/libaas_ai/fashion_girl.glb"  // Root Absolute
];
let currentSourceIndex = 0;
function init() {
    console.log("🚀 MAIN ROOT Engine Initializing...");
    if (isInitialized) return;
    const container = document.getElementById('canvas-container');
    if (!container) { console.error("⛔ Canvas Container NOT FOUND"); return; }
    
    // FORCE VISIBILITY FOR DEBUGGING
    container.style.border = "2px solid #D4AF37";
    container.style.zIndex = "1000";
    console.log("📍 Container Found (Root) & Forced to front");

    // 1. REFRESH CONTAINER - Fixes all "black screen" or "patch portion" issues
    container.innerHTML = '';

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // Lighter Onyx to contrast with stage

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;

    container.appendChild(renderer.domElement);

    window.renderer = renderer;
    window.scene    = scene;
    window.camera   = camera;

    // 2. BOOTIQUE LIGHTING (LUXURY STUDIO)
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const dLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dLight.position.set(3, 6, 5);
    dLight.castShadow = true;
    dLight.shadow.mapSize.width = 2048;
    dLight.shadow.mapSize.height = 2048;
    dLight.shadow.bias = -0.0001;
    scene.add(dLight);

    const rimLight = new THREE.PointLight(0xffeedd, 0.6, 10);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);

    // LUXURY STAGE - DEFINED 3D VERSION
    const stageGroup = new THREE.Group();

    // Main Platform Physical Body (Match Image 2/5 fix)
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.9, 0.1, 64),
        new THREE.MeshStandardMaterial({
            color: 0x333333, // Lighter grey base
            roughness: 0.4,
            metalness: 0.5
        })
    );
    base.position.y = -0.05;
    base.receiveShadow = true;
    stageGroup.add(base);

    // Visible Top Surface (Doesn't blend into background)
    const topSurface = new THREE.Mesh(
        new THREE.CylinderGeometry(0.83, 0.83, 0.02, 64),
        new THREE.MeshStandardMaterial({
            color: 0x4a4a4a, // Lighter grey top for visibility
            roughness: 0.6,
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
            color: 0xC5A017, // Subtler gold to match but not overwhelm
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xD4AF37,
            emissiveIntensity: 0.05 // Drastically reduced glow
        })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.025;
    ring.name = 'goldRing';
    ring.castShadow = true;
    stageGroup.add(ring);

    scene.add(stageGroup);
    scene.add(avatarGroup);

    // DEBUG REFERENCE SPHERE
    const debugSphere = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    debugSphere.position.set(0, 1.1, 0); 
    scene.add(debugSphere);

    // DEBUG GRID
    const grid = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    grid.position.y = 0.01;
    scene.add(grid);

    console.log("🌎 Scene Objects Total (Root):", scene.children.length);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.1, 0);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.4;

        // Prevent mouse from freely moving the stage
        controls.enablePan = false;
        controls.enableRotate = false; // Stops mouse rotation (autoRotate will still work)
        controls.enableZoom = false; // Mouse wheel zooming locked
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
    const path = modelSources[currentSourceIndex];
    showStatus(`BOUTIQUE ARRIVING... ${currentSourceIndex + 1}/${modelSources.length}`);

    gltfLoader.load(path, (gltf) => {
        console.log(`✅ Model Loaded Successfully (Root): ${path}`);
        model = gltf.scene || gltf.scenes[0];
        if (!model) return;
        window.model = model; // Expose model globally for integration

        const box = new THREE.Box3();
        model.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                box.expandByObject(o);

                // Initialize hand meshes as matte skin
                if (o.name.toLowerCase().includes('hand')) {
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    mats.forEach(m => {
                        if (m.name === 'fashion_girl_details') {
                            if (!o.isMaterialCloned) {
                                o.material = m.clone();
                                o.isMaterialCloned = true;
                            }
                             o.material.map = null;
                             o.material.roughness = 0.9;
                             o.material.metalness = 0.0;
                             o.material.metalnessMap = null;
                             o.material.roughnessMap = null;
                             o.material.needsUpdate = true;
                         }
                     });
                 }

                if (o.material) {
                    const materials = Array.isArray(o.material) ? o.material : [o.material];
                    materials.forEach(m => {
                        m.side = THREE.DoubleSide;
                        m.transparent = false; // Fix invisible/transparent models
                        m.depthWrite = true;
                        m.opacity = 1;
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
                }
            }
        });

        const size = box.getSize(new THREE.Vector3());
        console.log(`📏 Model Original Size (Root):`, size);
        
        let scale = 0.7; 
        if (size.y > 0.01 && size.y !== Infinity) {
            scale = (1.75 / size.y) * 0.7; 
        }
        model.scale.set(scale, scale, scale);
        
        const newBox = new THREE.Box3().setFromObject(model);
        const center = newBox.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -newBox.min.y + 0.02, -center.z);

        console.log(`📍 Model Final Position (Root):`, model.position, "Scale:", scale);

        avatarGroup.clear();
        avatarGroup.add(model);
        
        // Force rendering one frame
        renderer.render(scene, camera);

        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
        }

        clearStatus();
    }, undefined, (err) => {
        console.error(`❌ Load Attempt Failed: ${path}`, err);
        currentSourceIndex++;
        if (currentSourceIndex < modelSources.length) {
            console.log(`⚠️ Trying fallback path: ${modelSources[currentSourceIndex]}`);
            loadAvatar();
        } else {
            console.error("⛔ ALL model paths failed. Please verify 'fashion_girl.glb' exists in 'libaas_ai/' folder.");
            showStatus("ENGINE ERROR (404)");
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
    
    const ring = scene ? scene.getObjectByName('goldRing') : null;
    if (ring) ring.rotation.z += 0.005;
    if (renderer && scene && camera) renderer.render(scene, camera);
}

window.applyFaceTexture = (canvas) => {
    window.capturedFaceCanvas = canvas;
    if (typeof updateCompositeTexture === 'function') {
        updateCompositeTexture();
    } else if (avatarGroup && avatarGroup.children.length > 0) {
        const texture = new THREE.CanvasTexture(canvas);
        texture.flipY = false; // Video frames often need flip adjustment
        const model = avatarGroup.children[0];
        model.traverse((o) => {
            if (o.isMesh && o.material) {
                const name = (o.name || "").toLowerCase();
                const matName = (o.material.name || "").toLowerCase();

                // Specifically target the face
                if (name.includes('face') || matName.includes('face') || name.includes('head')) {
                    const materials = Array.isArray(o.material) ? o.material : [o.material];
                    materials.forEach(m => {
                        m.map = texture;
                        m.needsUpdate = true;
                    });
                }
            }
        });
    }
};

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

async function updateCompositeTexture(basePath, outfitPath) {
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
}
window.updateCompositeTexture = updateCompositeTexture;

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
window.applyTextureToModel = applyTextureToModel;


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
            const meshName = (o.name || "").toLowerCase();
            const materials = Array.isArray(o.material) ? o.material : [o.material];

            materials.forEach(m => {
                const matName = (m.name || "").toLowerCase();
                // Check if either mesh name or material name contains any of the target keywords
                const match = keywords.some(k => meshName.includes(k) || matName.includes(k));
                if (match && m.color) {
                    m.color.setHex(hexColor);
                }
            });
        }
    });
}

// ==========================================
// 🛡️ NOORSTYLE AI: FINAL REPAIR (LINE 287+)
// ==========================================

// 1. DRESS & SKIN ENGINE (Connecting Buttons)
const myPalette = ['ruby', 'emerald', 'gold', 'navy', 'azure', 'black'];
let myColorIdx = 0;

window.nextDress = function () {
    myColorIdx = (myColorIdx + 1) % myPalette.length;
    window.onOutfitColorChange(myPalette[myColorIdx]);
};

window.prevDress = function () {
    myColorIdx = (myColorIdx - 1 + myPalette.length) % myPalette.length;
    window.onOutfitColorChange(myPalette[myColorIdx]);
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

window.onOutfitColorChange = async function(color) {
    console.log("👗 Applying dress via FullLook:", color);
    await window.applyFullLook(color);
};

window.onComplexionChange = (tone) => {
    const tones = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = tones[tone] || 0xFAD4B2;
    if (typeof avatarGroup !== 'undefined' && avatarGroup.children.length > 0) {
        const model = avatarGroup.children[0];
        if (typeof safeChangeColor === 'function') {
            safeChangeColor(model, ['skin', 'face', 'body', 'head'], color);
        }
        // Also update hands specifically
        model.traverse(o => {
            if (o.isMesh && o.name.toLowerCase().includes('hand')) {
                const mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach(m => {
                    if (m.name === 'fashion_girl_details') {
                        if (!o.isMaterialCloned) {
                            o.material = m.clone();
                            o.isMaterialCloned = true;
                        }
                        o.material.color.setHex(color);
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
    }
};

// 2. 🛡️ PRIVACY: STOP ALL DOWNLOADS (Strict Protection - Handled in script.js by disabling the download trigger)

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

// 3. START ENGINE
if (document.readyState === 'complete') {
    if (typeof init === 'function') init();
} else {
    window.addEventListener('load', () => {
        if (typeof init === 'function') init();
    });
}
if (document.readyState === 'complete') init();
else window.addEventListener('load', init);

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

    const card = document.querySelector('.selected-dress-card');
    const color = card ? (card.getAttribute('data-color') || 'emerald') : 'emerald';

    if (typeof applyFullLiveLook === "function") {
        applyFullLiveLook(color, x, y, width);
    } else if (typeof window.applyFullLiveLook === "function") {
        window.applyFullLiveLook(color, x, y, width);
    } else {
        console.warn("applyFullLiveLook is not defined yet!");
    }
});

window.runFaceTracking = async function(video) {
    async function process() {
        await faceMesh.send({ image: video });
        requestAnimationFrame(process);
    }
    process();
};

window.applyFullLiveLook = function(color, x, y, size) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = 512;
    canvas.height = 512;

    const base = new Image();
    const outfit = new Image();
    const video = document.getElementById("video");

    base.src = "/assets/base.png";
    outfit.src = `/assets/outfits/${color}_casual.png`;

    base.onload = () => {
        outfit.onload = () => {
            ctx.drawImage(base, 0, 0);

            // 👤 face
            ctx.drawImage(video, x - size/2, y - size/2, size, size);

            // 👗 clothes
            ctx.drawImage(outfit, 0, 0);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            applyTextureToModel(texture);
        };
    };
};
