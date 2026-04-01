
// libaas_ai/engine.js - FINAL PROFESSIONAL 3D ENGINE (v8.0)
// Optimized for Pakistani Luxury Couture, Animation & Dynamic Fitting
// This version implements onComplexionChange and onOutfitColorChange

let scene, camera, renderer, controls, clock;
let avatarObject = null;
let mixer = null; 
let avatarGroup = new THREE.Group();
let fallbackModel;
let gltfLoader = null;

// The Scanning Matrix - Priority for local Pakistani model
const modelSources = [
    "assets/models/scene.gltf",
    "libaas_ai/scene.gltf",
    "scene.gltf",
    "avatar.glb",
    "https://models.readyplayer.me/63b36340268427f7f07297d2.glb"
];
let currentSourceIndex = 0;

function init() {
    console.log("3D Engine v8.0: Initializing Boutique Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error("3D Engine: #canvas-container NOT FOUND. Engine aborted.");
        return;
    }

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); 
    scene.fog = new THREE.Fog(0x0a0a0a, 1, 15);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.4, 3.8);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    if(THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // BOUTIQUE LIGHTING
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(2, 5, 2);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0xffffff, 1.5);
    rimLight.position.set(-2, 2, -2);
    scene.add(rimLight);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, 1.1, 0);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.maxDistance = 6;
        controls.minDistance = 2;
    }

    // LUXURY STAGE
    const stage = new THREE.Group();
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.6, 0.05, 32),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 })
    );
    platform.position.y = -0.025;
    platform.receiveShadow = true;
    stage.add(platform);

    const glow = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.01, 16, 128),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 2 })
    );
    glow.rotation.x = Math.PI / 2;
    glow.position.y = 0.01;
    stage.add(glow);
    scene.add(stage);

    // HUMAN SILUETTE FALLBACK
    const mannequin = new THREE.Group();
    const mMat = new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.4 });
    const addP = (g, y) => { const m = new THREE.Mesh(g, mMat); m.position.y = y; mannequin.add(m); };
    addP(new THREE.SphereGeometry(0.12, 16), 1.7);
    addP(new THREE.CylinderGeometry(0.2, 0.15, 0.6, 16), 1.4);
    addP(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 16), 0.5);
    
    fallbackModel = mannequin;
    fallbackModel.visible = false;
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    if (typeof (THREE.GLTFLoader || window.GLTFLoader) !== 'undefined') {
        gltfLoader = new (THREE.GLTFLoader || window.GLTFLoader)();
        bootstrapModel();
    } else {
        console.error("3D Engine: GLTFLoader MISSING!");
        reportState("Script Error: GLTFLoader not found.");
    }
    
    window.addEventListener('resize', onResize);
    animate();
}

function bootstrapModel() {
    if (currentSourceIndex >= modelSources.length) {
        console.warn("3D Engine: All sources failed. Using Designer Mannequin.");
        if (fallbackModel) fallbackModel.visible = true;
        reportState("Offline Mode: Using Placeholder");
        return;
    }

    // Cache buster to force the browser to load the NEWEST file version from disk
    const path = modelSources[currentSourceIndex] + "?v=" + Date.now();
    console.log("3D Engine v8.1: Investigating Path -> " + path);
    reportState("Loading Pakistani Model...");
    
    gltfLoader.load(path, (gltf) => {
        console.log("3D Engine: SUCCESS! Model loaded from -> " + path);
        reportState(""); // Success! Hide loading status
        avatarObject = gltf.scene;
        
        // Animations
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(avatarObject);
            mixer.clipAction(gltf.animations[0]).play();
        }

        // Fit to Stage
        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = box.getSize(new THREE.Vector3());
        
        // Orientation Check
        if (size.z > size.y * 1.5) {
             avatarObject.rotation.x = -Math.PI / 2;
             box.setFromObject(avatarObject);
             box.getSize(size);
        }

        const targetHeight = 1.8;
        const scale = targetHeight / size.y;
        avatarObject.scale.set(scale, scale, scale);
        avatarObject.position.y = - (box.min.y * scale);
        avatarObject.position.x = 0; 
        avatarObject.position.z = 0;

        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if (o.material) {
                    o.material.side = THREE.DoubleSide;
                    // Optimization for large textures
                    if(o.material.map) o.material.map.anisotropy = 8;
                }
            }
        });

        if (fallbackModel) fallbackModel.visible = false;
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(avatarObject);
        
        // Apply default looks
        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, 
    (xhr) => {
        if(xhr.lengthComputable) {
            const p = Math.round(xhr.loaded/xhr.total*100);
            reportState("Entering Studio: " + p + "%");
        }
    }, 
    (err) => {
        console.warn("3D Engine: Path Failed -> " + path);
        currentSourceIndex++;
        bootstrapModel();
    });
}

// --- INTERACTIVE API FOR UI ---

window.onComplexionChange = function(tone) {
    console.log("3D Engine: Changing skin to " + tone);
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    if (avatarObject) {
        avatarObject.traverse(o => {
            const n = o.name.toLowerCase();
            const isSkin = n.includes('skin') || n.includes('body') || n.includes('head') || n.includes('face') || n.includes('arm') || n.includes('leg');
            if (o.isMesh && isSkin) {
                if(o.material) {
                    if(!o.material._cloned) { o.material = o.material.clone(); o.material._cloned = true; }
                    o.material.color.setHex(color);
                }
            }
        });
    }
    if (fallbackModel) {
        fallbackModel.traverse(o => { if(o.isMesh && o.material) o.material.color.setHex(color); });
    }
};

window.onOutfitColorChange = function(colorName) {
    console.log("3D Engine: Changing outfit to " + colorName);
    const palette = { 
        'ruby': 0x9B111E, 
        'emerald': 0x006D5B, 
        'gold': 0xD4AF37, 
        'navy': 0x000080, 
        'azure': 0x007FFF, 
        'rosegold': 0xE0BFB8 
    };
    const color = palette[colorName.toLowerCase()] || 0xD4AF37;
    if (avatarObject) {
        avatarObject.traverse(o => {
            const n = o.name.toLowerCase();
            const isClothing = n.includes('top') || n.includes('shirt') || n.includes('dress') || n.includes('pant') || n.includes('outfit') || n.includes('cloth') || n.includes('fabric');
            if (o.isMesh && isClothing) {
                if(o.material) {
                    if(!o.material._cloned) { o.material = o.material.clone(); o.material._cloned = true; }
                    o.material.color.setHex(color);
                }
            }
        });
    }
};

function reportState(txt) {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    let msg = document.getElementById('engine-status-msg');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'engine-status-msg';
        msg.style = "position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:#D4AF37;font-size:12px;z-index:999;background:rgba(0,0,0,0.7);padding:5px 15px;border-radius:20px;border:1px solid rgba(212,175,55,0.3);font-family:sans-serif;pointer-events:none;";
        container.appendChild(msg);
    }
    if (!txt) { msg.style.display = 'none'; return; }
    msg.style.display = 'block';
    msg.innerText = txt;
}

function onEngineResize() {
    const container = document.getElementById('canvas-container');
    if(!container || !renderer) return;
    
    // Get actual dimensions
    const width = container.clientWidth || window.innerWidth * 0.5;
    const height = container.clientHeight || 500;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

window.onEngineResize = onEngineResize;

function animate() {
    requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.01;
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

// Entry Point
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}
