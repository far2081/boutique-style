// libaas_ai/engine.js - ULTRA SIMPLE & ROBUST ENGINE v15

let scene, camera, renderer, controls, clock;
let avatarGroup = new THREE.Group();
let gltfLoader = null;
let mixer = null;
let isInitialized = false;

// ONLY load the model you specified
const AVATAR_PATH = "assets/models/avatar.glb";

function init() {
    if (isInitialized) return;
    
    const container = document.getElementById('canvas-container');
    if (!container) return;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    
    // Very simple and clean background
    scene.background = new THREE.Color(0x111111);
    
    let width = container.clientWidth || 400;
    let height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Camera is placed far enough to see the whole model
    camera.position.set(0, 1.5, 4); 
    
    // Simple robust renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if(renderer.outputColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // Simple Lighting - Impossible to break
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(2, 5, 5);
    scene.add(dirLight);

    // Simple Stage - Just a basic floor with gold ring (Will not mess up)
    const stage = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.05, 32),
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
    );
    stage.position.y = -0.025;
    scene.add(stage);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.02, 16, 100),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    scene.add(avatarGroup);

    // Basic controls
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1, 0);
        controls.enableDamping = true;
    }

    // Safely load the GLTF Loader
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
    showStatus("Loading Your 3D Model...");
    
    gltfLoader.load(AVATAR_PATH + "?t=" + Date.now(), (gltf) => {
        clearStatus();
        const model = gltf.scene;
        
        // Basic Setup
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        
        // Force Update Matrix
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // Safe scaling calculation
        if (!isNaN(size.y) && size.y > 0.01) {
            const scale = 1.7 / size.y;
            model.scale.set(scale, scale, scale);
            
            box.setFromObject(model);
            box.getCenter(center);
            
            model.position.x = -center.x;
            model.position.z = -center.z;
            model.position.y = -box.min.y;
        } else {
            // fallback generic scale
            model.scale.set(0.5, 0.5, 0.5);
            model.position.y = 0;
        }

        avatarGroup.clear();
        avatarGroup.add(model);
        
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
        }

        // Apply initial colors cleanly
        setTimeout(() => {
            if (window.onComplexionChange) {
                const tone = document.querySelector('.complexion-circle.active')?.dataset?.tone || 'fair';
                window.onComplexionChange(tone);
            }
            if (window.onOutfitColorChange) {
                const colorName = document.getElementById('product-modal')?.getAttribute('data-color') || 'emerald';
                window.onOutfitColorChange(colorName);
            }
        }, 300);

    }, undefined, (e) => {
        console.error(e);
        showStatus("Failed to load model. Please ensure the file is valid.");
    });
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
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function showStatus(msg) {
    let div = document.getElementById('engine-status-msg');
    if (!div) {
        div = document.createElement('div');
        div.id = 'engine-status-msg';
        div.style.position = 'absolute';
        div.style.top = '50%';
        div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.color = '#D4AF37';
        div.style.fontFamily = 'Montserrat, sans-serif';
        div.style.fontSize = '14px';
        div.style.zIndex = '1000';
        document.getElementById('canvas-container').appendChild(div);
    }
    div.innerText = msg;
    div.style.display = 'block';
}

function clearStatus() {
    const div = document.getElementById('engine-status-msg');
    if (div) div.style.display = 'none';
}

// Very safe color changing logic (handles arrays natively to prevent crashing)
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


