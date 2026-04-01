
// libaas_ai/engine.js - ULTIMATE PROFESSIONAL 3D BOUTIQUE ENGINE (v9.0)
// Designed for Pakistani Luxury Couture, Human Body Fitting & Animation
// This version is bulletproofed against invalid transforms and material crashes.

let scene, camera, renderer, controls, clock;
let avatarObject = null;
let mixer = null; 
let avatarGroup = new THREE.Group();
let fallbackModel = null;
let gltfLoader = null;
let currentSourceIndex = 0;

// The Scanning Matrix - Priority for local high-quality models
const modelSources = [
    "assets/models/avatar.glb",        // Primary Pakistani Model
    "assets/models/scene.gltf",       // Secondary Scene/Avatar
    "assets/avatar.glb",              // Backup folder
    "libaas_ai/avatar.glb",           // Engine folder backup
    "avatar.glb",                      // Root backup
    "https://models.readyplayer.me/63b36340268427f7f07297d2.glb" // Remote fallback
];

function init() {
    console.log("%c [3D Engine v9.0] Initializing Luxury Studio... ", "background: #D4AF37; color: #fff; font-weight: bold;");
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error("3D Engine: Container #canvas-container not found. Logic terminated.");
        return;
    }

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080808); 
    scene.fog = new THREE.Fog(0x080808, 1, 20);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 1000);
    camera.position.set(0, 1.4, 4.0); // Perfect portrait distance
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Modern Color Management
    if(renderer.outputColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if(THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // STUDIO LIGHTING (Cinematic Setup)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2, 5, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xffffff, 0.8);
    rimLight.position.set(-3, 2, -3);
    scene.add(rimLight);

    const fillLight = new THREE.RectAreaLight ? null : new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    if(fillLight) scene.add(fillLight);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.set(0, 1.0, 0); // Focus on mid-body
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.6;
        controls.maxDistance = 7;
        controls.minDistance = 1.5;
    }

    // THE LUXURY STAGE
    const stage = new THREE.Group();
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.7, 0.06, 64),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 })
    );
    platform.position.y = -0.03;
    platform.receiveShadow = true;
    stage.add(platform);

    const goldTrim = new THREE.Mesh(
        new THREE.TorusGeometry(1.6, 0.015, 16, 100),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 1.5 })
    );
    goldTrim.rotation.x = Math.PI / 2;
    goldTrim.position.y = 0.01;
    stage.add(goldTrim);
    scene.add(stage);

    // HUMAN MANNEQUIN FALLBACK
    fallbackModel = createDesignerMannequin();
    fallbackModel.visible = false;
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined' || typeof GLTFLoader !== 'undefined') {
        const LoaderClass = typeof THREE.GLTFLoader !== 'undefined' ? THREE.GLTFLoader : GLTFLoader;
        gltfLoader = new LoaderClass();
        bootstrapModel();
    } else {
        console.error("3D Engine Error: GLTFLoader is missing from the environment.");
        reportState("Critical: Loader Missing");
    }
    
    // Fix: Using the correct function name for listener
    window.addEventListener('resize', onEngineResize);
    animate();
}

function createDesignerMannequin() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, metalness: 0.5 });
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16), mat);
    head.position.y = 1.75;
    group.add(head);
    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.65, 16), mat);
    torso.position.y = 1.35;
    group.add(torso);
    // Legs
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.0, 16), mat);
    legs.position.y = 0.5;
    group.add(legs);
    return group;
}

function bootstrapModel() {
    if (currentSourceIndex >= modelSources.length) {
        console.warn("3D Engine: Failed to load any external model. Using Fallback Human Body.");
        if (fallbackModel) fallbackModel.visible = true;
        reportState("Offline Mode: Human Body Fallback");
        return;
    }

    const path = modelSources[currentSourceIndex] + "?v=" + Date.now();
    console.log("3D Engine v9.0: Investigating Path -> " + path);
    reportState("Summoning Digital Soul...");
    
    gltfLoader.load(path, (gltf) => {
        console.log("%c [3D Engine] SUCCESS! Model fully loaded. ", "background: #2e7d32; color: #fff;");
        reportState(""); // Clear status
        
        // Cleanup old objects
        if (avatarObject) {
            avatarGroup.remove(avatarObject);
        }
        
        avatarObject = gltf.scene;
        
        // Handle Orientation & Center of Gravity
        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // If the model is horizontal (Z is height), correct it
        if (size.z > size.y * 1.5) {
             console.log("3D Engine: Correcting horizontal model orientation...");
             avatarObject.rotation.x = -Math.PI / 2;
             box.setFromObject(avatarObject);
             box.getSize(size);
             box.getCenter(center);
        }

        // Perfect Scale: Target Human Height ~1.75m
        const targetHeight = 1.75;
        const scaleFactor = targetHeight / size.y;
        avatarObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        // Precise Positioning: Floor level and centered globally
        const newBox = new THREE.Box3().setFromObject(avatarObject);
        const newCenter = new THREE.Vector3();
        newBox.getCenter(newCenter);
        
        avatarObject.position.x = -newCenter.x;
        avatarObject.position.z = -newCenter.z;
        avatarObject.position.y = -newBox.min.y; // Sit on floor (Y=0)

        // Enhance Materials & Shadows
        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if (o.material) {
                    processMaterial(o.material);
                }
            }
        });

        // Setup Animations
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(avatarObject);
            const action = mixer.clipAction(gltf.animations[0]);
            action.setEffectiveWeight(1.0);
            action.play();
        }

        if (fallbackModel) fallbackModel.visible = false;
        
        // Sync to scene
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(avatarObject);
        
        // Force immediate update for UI consistency
        if(window.onComplexionChange) {
            const activeTone = document.querySelector('.complexion-circle.active')?.dataset?.tone || 'fair';
            window.onComplexionChange(activeTone);
        }
        if(window.onOutfitColorChange) {
            const productModal = document.getElementById('product-modal');
            const currentColor = productModal?.getAttribute('data-color') || 'gold';
            window.onOutfitColorChange(currentColor);
        }
        console.log("3D Engine: Model transformation complete.");
    }, 
    (xhr) => {
        if(xhr.lengthComputable) {
            const p = Math.round(xhr.loaded / xhr.total * 100);
            reportState("Awaiting Fashion: " + p + "%");
        }
    }, 
    (err) => {
        console.warn("3D Engine: Path Failed -> " + path, err);
        currentSourceIndex++;
        bootstrapModel();
    });
}

function processMaterial(mat) {
    if (Array.isArray(mat)) {
        mat.forEach(m => processMaterial(m));
        return;
    }
    mat.side = THREE.DoubleSide;
    if (mat.map) mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    // Prevent black artifacts on certain Pakistani textures
    mat.alphaTest = 0.1;
    mat.transparent = mat.opacity < 1;
}

// --- INTERACTIVE API (UI Synced) ---

window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    console.log("3D Engine: Applying skin tone -> " + tone);
    
    if (avatarObject) {
        avatarObject.traverse(o => {
            if (o.isMesh && o.material) {
                const n = o.name.toLowerCase();
                const isSkin = n.includes('skin') || n.includes('body') || n.includes('head') || n.includes('face') || n.includes('arm') || n.includes('leg') || n.includes('hand');
                if (isSkin) applyColorToMaterial(o.material, color);
            }
        });
    }
    if (fallbackModel) {
        fallbackModel.traverse(o => { if(o.isMesh && o.material) applyColorToMaterial(o.material, color); });
    }
};

window.onOutfitColorChange = function(colorName) {
    const palette = { 
        'ruby': 0x9B111E, 
        'emerald': 0x006D5B, 
        'gold': 0xD4AF37, 
        'navy': 0x000080, 
        'azure': 0x007FFF, 
        'rosegold': 0xE0BFB8 
    };
    const color = palette[colorName.toLowerCase()] || 0xD4AF37;
    console.log("3D Engine: Syncing fabric color -> " + colorName);
    
    if (avatarObject) {
        avatarObject.traverse(o => {
            if (o.isMesh && o.material) {
                const n = o.name.toLowerCase();
                const isClothing = n.includes('top') || n.includes('shirt') || n.includes('dress') || n.includes('pant') || n.includes('outfit') || n.includes('cloth') || n.includes('fabric') || n.includes('bottom') || n.includes('garment');
                if (isClothing) applyColorToMaterial(o.material, color);
            }
        });
    }
};

function applyColorToMaterial(mat, hex) {
    if (Array.isArray(mat)) {
        mat.forEach(m => applyColorToMaterial(m, hex));
        return;
    }
    // Deep clone to prevent affecting other meshes sharing same original material
    if (!mat._cloned) {
        const oldMat = mat;
        mat = oldMat.clone();
        mat._cloned = true;
        // Important: Re-assign to mesh or parent logic if possible, 
        // but for global traverse, we need to ensure the caller updates the mesh.
    }
    if (mat.color) mat.color.setHex(hex);
}

// Special helper to handle cloning correctly in traverse
function forceColorSync(root, color, filterFn) {
    root.traverse(o => {
        if(o.isMesh && o.material && filterFn(o.name.toLowerCase())) {
            if(!o.material._cloned) { o.material = o.material.clone(); o.material._cloned = true; }
            if(o.material.color) o.material.color.setHex(color);
        }
    });
}

// Re-defining the UI functions with the better helper
window.onComplexionChange = (tone) => {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    if(avatarObject) forceColorSync(avatarObject, color, (n) => n.includes('skin') || n.includes('body') || n.includes('head') || n.includes('face') || n.includes('arm') || n.includes('leg'));
    if(fallbackModel) forceColorSync(fallbackModel, color, () => true);
};

window.onOutfitColorChange = (colorName) => {
    const palette = { 'ruby': 0x9B111E, 'emerald': 0x006D5B, 'gold': 0xD4AF37, 'navy': 0x000080, 'azure': 0x007FFF, 'rosegold': 0xE0BFB8 };
    const color = palette[colorName.toLowerCase()] || 0xD4AF37;
    if(avatarObject) forceColorSync(avatarObject, color, (n) => n.includes('top') || n.includes('shirt') || n.includes('dress') || n.includes('pant') || n.includes('outfit') || n.includes('cloth') || n.includes('fabric'));
};

function onEngineResize() {
    const container = document.getElementById('canvas-container');
    if(!container || !renderer) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
window.onEngineResize = onEngineResize;

function reportState(txt) {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    let msg = document.getElementById('engine-status-msg');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'engine-status-msg';
        msg.style = "position:absolute;bottom:20px;left:50%;transform:translateX(-50%);color:#D4AF37;font-size:12px;z-index:999;background:rgba(0,0,0,0.8);padding:8px 20px;border-radius:20px;border:1px solid rgba(212,175,55,0.4);font-family:serif;pointer-events:none;letter-spacing:1px;text-transform:uppercase;";
        container.appendChild(msg);
    }
    if (!txt) { msg.style.display = 'none'; return; }
    msg.style.display = 'block';
    msg.innerText = txt;
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.01;
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

// Immediate Start
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}
