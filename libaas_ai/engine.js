// libaas_ai/engine.js - FINAL GUARANTEED FIX v16

let scene, camera, renderer, controls, clock;
let avatarGroup = new THREE.Group();
let gltfLoader = null;
let mixer = null;
let isInitialized = false;

const modelSources = [
    "assets/models/avatar.glb",
    "assets/models/scene.gltf",
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
    scene.background = new THREE.Color(0x111111);
    
    let width = container.clientWidth || 400;
    let height = container.clientHeight || 500;

    // CAMERA TUNING: Zoomed out slightly to ensure the full stage fits
    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.5); 
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if(renderer.outputColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // LIGHTING: Extremely bright to ensure no model hides in the dark
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(0, 5, 5);
    scene.add(dirLight);

    // FIXED: Much smaller stage (radius 0.7 instead of 1.5) so it doesn't get cut off!
    const stage = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 0.05, 32),
        new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 })
    );
    stage.position.y = -0.025;
    scene.add(stage);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.7, 0.015, 16, 100),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    scene.add(avatarGroup);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0.9, 0); 
        controls.enableDamping = true;
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
    const path = "assets/models/avatar.glb";
    showStatus("Loading original model...");
    console.log("Loading model from:", path);
    
    gltfLoader.load(path, (gltf) => {
        clearStatus();
        const model = gltf.scene;
        console.log("SUCCESS: 3D Model Loaded from", path);
        
        // Ensure animations play if available which can fix bounds
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
        }

        // Base reset
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);
        model.updateMatrixWorld(true);

        // Fix for SkinnedMesh bounds
        model.traverse(function(child) {
            if (child.isSkinnedMesh) {
                child.computeBoundingBox();
                child.computeBoundingSphere();
            }
        });

        // Safe scaling calculation
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        console.log("Model initial size:", size);

        // Apply a reasonable default scale if bounds are broken
        if (size.y > 0.1 && size.y < 100) {
            const scaleFit = 1.6 / size.y;
            model.scale.set(scaleFit, scaleFit, scaleFit);
        } else {
            // Default scale for readyplayer.me or standard glb avatars
            model.scale.set(1, 1, 1); 
        }
        
        model.updateMatrixWorld(true);

        // Safe Center & Placing
        const newBox = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        newBox.getCenter(center);
        
        model.position.x = -center.x;
        model.position.y = -newBox.min.y; // Stand on stage
        model.position.z = -center.z;
        model.updateMatrixWorld(true);

        // Enhance rendering materials
        model.traverse((o) => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if (o.material) {
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    mats.forEach(m => { 
                        m.side = THREE.DoubleSide; 
                        m.depthWrite = true;
                        // Help prevent transparency sorting issues
                        if (m.transparent) {
                            m.alphaTest = 0.5;
                        }
                    });
                }
            }
        });

        // Add to scene
        avatarGroup.clear();
        avatarGroup.add(model);
        
        console.log("Model fully integrated and placed on stage.");

        // Apply default colors after a small delay
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

    }, 
    (xhr) => {
        // Progress callback
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100;
            showStatus("Loading model: " + Math.round(percentComplete) + "%");
        }
    }, 
    (e) => {
        console.error("Failed to load original model:", e);
        showStatus("ERROR: Failed to load assets/models/avatar.glb. Check file exists.");
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
        div.style.fontSize = '12px';
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


