// libaas_ai/engine.js - FINAL PRODUCTION STUDIO v22.0
// THIS VERSION IS GUARANTEED TO SHOW THE STAGE & MATCH YOUR BOUTIQUE AESTHETICS

let scene, camera, renderer, controls, clock;
let avatarGroup = new THREE.Group();
let gltfLoader = null;
let mixer = null;
let isInitialized = false;

const modelSources = [
    "assets/models/fashion_girl.glb", 
    "./assets/models/fashion_girl.glb"
];
let currentSourceIndex = 0;
function init() {
    if (isInitialized) return;
    const container = document.getElementById('canvas-container');
    if (!container) return;

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

    // 2. BOOTIQUE LIGHTING (LUXURY STUDIO)
    scene.add(new THREE.AmbientLight(0xffffff, 1.8)); // Brighter Overall Visibility
    
    const dLight = new THREE.DirectionalLight(0xffffff, 1.5); // Stronger directional light
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
        const model = gltf.scene || gltf.scenes[0];
        if (!model) return;

        const box = new THREE.Box3();
        model.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                box.expandByObject(o);
                if (o.material) {
                    const materials = Array.isArray(o.material) ? o.material : [o.material];
                    materials.forEach(m => {
                        m.side = THREE.DoubleSide;
                        m.transparent = false; // Fix invisible/transparent models
                        m.depthWrite = true;
                        m.opacity = 1;
                        m.needsUpdate = true;
                    });
                }
            }
        });

       // 1. FIXED SIZE (Is se sir frame ke andar rahega)
        model.scale.set(0.7, 0.7, 0.7); 

        // 2. POSITION FIX (Is se paon stage par tik jayenge)
        const finalBox = new THREE.Box3().setFromObject(model);
        const finalCenter = finalBox.getCenter(new THREE.Vector3());
        model.position.set(-finalCenter.x, -finalBox.min.y + 0.01, -finalCenter.z);

        avatarGroup.clear();
        avatarGroup.add(model);
        
       if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
        }
        
        clearStatus();
    }, undefined, (err) => {
        console.error("Error loading model:", err);
        currentSourceIndex++;
        if (currentSourceIndex < modelSources.length) {
            loadAvatar();
        } else {
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

window.applyFaceTexture = (canvas) => {
    if (!avatarGroup.children.length) return;
    
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

window.onComplexionChange = (tone) => {
    const tones = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = tones[tone] || 0xFAD4B2;
    if (avatarGroup.children.length > 0) {
        safeChangeColor(avatarGroup.children[0], ['skin', 'face', 'body', 'head', 'arm', 'leg', 'hand', 'neck', 'foot'], color);
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
