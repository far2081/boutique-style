// libaas_ai/engine.js - FINAL GUARANTEED FIX v16

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

    // Check for local file protocol (CORS issue indicator)
    if (window.location.protocol === 'file:') {
        showStatus("Note: Local file protocol (file://) detected. Use a local server if models fail.");
    }

    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error("Canvas container not found!");
        return;
    }

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    // Premium dark gradient feel
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 2, 10);

    let width = container.clientWidth || 400;
    let height = container.clientHeight || 500;

    // CAMERA TUNING: Elegant perspective
    camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 4.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // PREMIUM: Enable Shadows
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    if (renderer.outputColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // LIGHTING: Dramatic studio lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    // Key Light
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(2, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 15;
    scene.add(mainLight);

    // Fill Light
    const fillLight = new THREE.PointLight(0xD4AF37, 0.8);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    // Rim Light (Backlight for silhouette)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // THE STAGE: Elegant, tiered luxury platform
    const stageGroup = new THREE.Group();
    
    // Bottom Base
    const baseStage = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.9, 0.08, 64),
        new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            roughness: 0.2, 
            metalness: 0.8 
        })
    );
    baseStage.position.y = -0.04;
    baseStage.receiveShadow = true;
    stageGroup.add(baseStage);

    // Top Glossy Surface
    const topStage = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.02, 64),
        new THREE.MeshStandardMaterial({ 
            color: 0x050505, 
            roughness: 0.1, 
            metalness: 0.5,
            emissive: 0x111111,
            emissiveIntensity: 0.1
        })
    );
    topStage.position.y = 0.01;
    topStage.receiveShadow = true;
    stageGroup.add(topStage);

    // Radiant Gold Ring
    const goldRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.81, 0.02, 16, 100),
        new THREE.MeshStandardMaterial({ 
            color: 0xD4AF37, 
            metalness: 1, 
            roughness: 0.1,
            emissive: 0xD4AF37,
            emissiveIntensity: 0.2
        })
    );
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 0.02;
    goldRing.name = 'goldRing';
    stageGroup.add(goldRing);
    
    // Add a circular glow underneath
    const glowGeo = new THREE.CircleGeometry(1.2, 32);
    const glowMat = new THREE.MeshBasicMaterial({ 
        color: 0xD4AF37, 
        transparent: true, 
        opacity: 0.1,
        side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = Math.PI / 2;
    glow.position.y = -0.07;
    stageGroup.add(glow);

    scene.add(stageGroup);
    scene.add(avatarGroup);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1.0, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 6;
        controls.minDistance = 1.5;
        controls.maxPolarAngle = Math.PI / 1.7; // Prevent looking under the floor
        
        // Premium behavior
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.8;
    }

    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        loadAvatar();
    } else {
        showStatus("ERROR: THREE.GLTFLoader missing context");
    }

    window.addEventListener('resize', onResize);
    isInitialized = true;
    animate();
}

function loadAvatar() {
    const path = modelSources[currentSourceIndex];
    showStatus(`Loading Boutique... ${currentSourceIndex + 1}/${modelSources.length}`);
    console.log("Attempting load:", path);

    gltfLoader.load(path, (gltf) => {
        clearStatus();
        let model = gltf.scene || gltf.scenes[0];
        if (!model) {
            console.error("Empty GLTF");
            tryNextSource();
            return;
        }

        console.log("Model loaded. Ensuring visibility...");

        // Ensure all meshes are visible and hide grounds
        let meshesFound = false;
        model.traverse((o) => {
            if (o.isMesh) {
                meshesFound = true;
                const name = (o.name || "").toLowerCase();
                
                // Hide common world/environment objects
                if (name.includes("floor") || name.includes("ground") || name.includes("plane") || name.includes("stage") || name.includes("background")) {
                    o.visible = false;
                } else {
                    o.visible = true;
                    o.castShadow = true;
                    o.receiveShadow = true;
                    
                    if (o.material) {
                        const mats = Array.isArray(o.material) ? o.material : [o.material];
                        mats.forEach(m => {
                            m.side = THREE.DoubleSide;
                            m.depthWrite = true;
                            if (m.transparent) {
                                m.alphaTest = 0.5;
                                m.opacity = 1.0;
                            }
                        });
                    }
                }
                
                if (o.isSkinnedMesh) {
                    o.frustumCulled = false;
                }
            }
        });

        if (!meshesFound) {
            console.warn("No visible meshes found in GLTF");
            tryNextSource();
            return;
        }

        // SCALING: Set to reliable human height
        model.updateMatrixWorld(true);
        const box = new THREE.Box3();
        model.traverse(o => {
            if (o.isMesh && o.visible) {
                 if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
                 const b = o.geometry.boundingBox.clone();
                 b.applyMatrix4(o.matrixWorld);
                 box.union(b);
            }
        });
        
        const size = box.getSize(new THREE.Vector3());
        if (size.y > 0.001) {
            const scaleFactor = 1.7 / size.y;
            model.scale.multiplyScalar(scaleFactor);
        } else {
            model.scale.set(1.5, 1.5, 1.5);
        }
        model.updateMatrixWorld(true);

        // POSITIONING: Re-center and ground
        const finalBox = new THREE.Box3();
        model.traverse(o => {
            if (o.isMesh && o.visible) {
                 const b = o.geometry.boundingBox.clone();
                 b.applyMatrix4(o.matrixWorld);
                 finalBox.union(b);
            }
        });
        
        const center = finalBox.getCenter(new THREE.Vector3());
        model.position.x -= center.x;
        model.position.z -= center.z;
        model.position.y -= finalBox.min.y; // Feet to zero
        model.position.y += 0.02; // Elevated on platform gold ring
        model.updateMatrixWorld(true);

        avatarGroup.clear();
        avatarGroup.add(model);
        
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
        }

        console.log("Model successfully integrated at scale.");

        setTimeout(() => {
            if (window.onComplexionChange) {
                const tone = document.querySelector('.complexion-circle.active')?.dataset?.tone || 'fair';
                window.onComplexionChange(tone);
            }
            if (window.onOutfitColorChange) {
                const colorName = document.getElementById('product-modal')?.getAttribute('data-color') || 'emerald';
                window.onOutfitColorChange(colorName);
            }
        }, 100);

    }, 
    (xhr) => {
        if (xhr.lengthComputable) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            showStatus(`Preparing Boutique: ${percent}%`);
        }
    }, 
    (e) => {
        console.error("GLTF load failed", e);
        tryNextSource();
    });
}

function tryNextSource() {
    currentSourceIndex++;
    if (currentSourceIndex < modelSources.length) {
        loadAvatar();
    } else {
        showStatus("ERROR: Use a local server to view 3D models.");
        createMannequin();
    }
}

function createMannequin() {
    console.log("Creating abstract mannequin fallback...");
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), mat);
    head.position.y = 1.6;
    group.add(head);
    
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.6, 16), mat);
    torso.position.y = 1.25;
    group.add(torso);
    
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.8, 16), mat);
    leg1.position.set(-0.1, 0.45, 0);
    group.add(leg1);
    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.8, 16), mat);
    leg2.position.set(0.1, 0.45, 0);
    group.add(leg2);
    
    group.position.y = 0.02;
    avatarGroup.clear();
    avatarGroup.add(group);
}

function onResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
window.onEngineResize = onResize;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.01;
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    
    // Subtle luxury stage rotation
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
                materials.forEach(m => {
                    if (m && m.color) {
                        m.color.setHex(hexColor);
                    }
                });
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


