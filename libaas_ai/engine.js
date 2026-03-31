
// libaas_ai/engine.js - ULTIMATE ROBUST 3D VIRTUAL TRY-ON (v4.0)
// Designed for Pakistani Luxury Couture | Optimized for Vercel/Local/Global

let scene, camera, renderer, controls, clock;
let avatarObject = null;
let mixer = null; 
let avatarGroup = new THREE.Group();
let fallbackModel;
let gltfLoader = null;

// SUPER ROBUST PATH SCANNING (Ensures the model is found regardless of hosting setup)
const modelSources = [
    "assets/models/scene.gltf",
    "./assets/models/scene.gltf",
    "../assets/models/scene.gltf",
    "libaas_ai/scene.gltf",
    "scene.gltf",
    "https://models.readyplayer.me/63b36340268427f7f07297d2.glb" // Real Human Backup (Female)
];
let currentSourceIndex = 0;

function init() {
    console.log("3D Engine v4: Deploying Intelligent Loading System...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); 
    scene.fog = new THREE.Fog(0x050505, 1, 20);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 3.8);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // LUXURY STUDIO LIGHTS (4-Point Setup)
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    
    const kLight = new THREE.SpotLight(0xffffff, 2.0);
    kLight.position.set(2, 5, 4);
    kLight.castShadow = true;
    scene.add(kLight);
    
    const fLight = new THREE.PointLight(0xffffff, 1.5);
    fLight.position.set(-3, 3, 3);
    scene.add(fLight);

    const bLight = new THREE.DirectionalLight(0xffffff, 0.8);
    bLight.position.set(0, 2, -5);
    scene.add(bLight);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.4;
        controls.target.set(0, 1.2, 0);
        controls.maxDistance = 5;
        controls.minDistance = 1.5;
    }

    // THE LUXURY STAGE
    const stage = new THREE.Group();
    const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.5, 0.1, 64),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 1.0, roughness: 0.15 })
    );
    pedestal.position.y = -0.05;
    pedestal.receiveShadow = true;
    stage.add(pedestal);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.02, 16, 128),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 3 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    stage.add(ring);
    scene.add(stage);

    // LUXURY DESIGNER MANNEQUIN (Human Outline fallback instead of a column)
    const mannequin = new THREE.Group();
    const mMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.2, metalness: 0.5, transparent: true, opacity: 0.7 });
    
    const addP = (g, y, s = [1,1,1]) => {
        const m = new THREE.Mesh(g, mMat);
        m.position.y = y; 
        m.scale.set(...s);
        mannequin.add(m);
    };

    addP(new THREE.SphereGeometry(0.12, 32), 1.7); // Head
    addP(new THREE.CylinderGeometry(0.25, 0.2, 0.5, 32), 1.4); // Torso
    addP(new THREE.CylinderGeometry(0.2, 0.22, 0.4, 32), 1.0); // Hips
    addP(new THREE.CylinderGeometry(0.08, 0.06, 0.8, 32), 0.4, [1, 1, 1]); // Legs
    
    fallbackModel = mannequin;
    fallbackModel.visible = false;
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        tryLoadNextModel();
    }
    
    window.addEventListener('resize', onEngineResize);
    animate();
}

function tryLoadNextModel() {
    if (currentSourceIndex >= modelSources.length) {
        console.error("All model paths FAILED. Showing Designer Mannequin.");
        if (fallbackModel) fallbackModel.visible = true;
        return;
    }

    const path = modelSources[currentSourceIndex];
    console.log("3D Engine v4: SCANNING PATH -> " + path);
    
    gltfLoader.load(path, (gltf) => {
        console.log("3D Engine v4: SUCCESS! MODEL MOUNTED: " + path);
        avatarObject = gltf.scene;
        
        // --- LUXURY ANIMATIONS ---
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(avatarObject);
            const a = mixer.clipAction(gltf.animations[0]);
            a.fadeIn(0.5).play();
        }

        // --- INTELLIGENT POSITIONING & SCALING ---
        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = box.getSize(new THREE.Vector3());
        
        // Auto-orient Sketchfab/Z-up models
        if (size.z > size.y * 2) {
             console.warn("3D Engine: Z-up detected. Self-correcting rotation...");
             avatarObject.rotation.x = -Math.PI / 2;
             box.setFromObject(avatarObject);
             box.getSize(size);
        }

        const scale = 1.78 / size.y;
        avatarObject.scale.set(scale, scale, scale);
        avatarObject.position.y = - (box.min.y * scale); // Feet Locked To Floor
        avatarObject.position.x = 0;
        avatarObject.position.z = 0;

        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if (o.material) {
                    o.material.side = THREE.DoubleSide; 
                    if (o.material.map) o.material.map.anisotropy = 16;
                }
            }
        });

        if (fallbackModel) fallbackModel.visible = false;
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(avatarObject);
        
        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, 
    (xhr) => {
        if (xhr.lengthComputable) {
            const perc = Math.round(xhr.loaded / xhr.total * 100);
            updateLoadingUI(perc);
        }
    }, 
    (err) => {
        console.warn("3D Engine v4: Resource NOT found at: " + path);
        currentSourceIndex++;
        tryLoadNextModel();
    });
}

function updateLoadingUI(p) {
    console.log("3D Engine v4: Loading: " + p + "%");
    const container = document.getElementById('canvas-container');
    if (container) {
        let overlay = document.getElementById('engine-loader-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'engine-loader-overlay';
            overlay.style = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#D4AF37;font-family:serif;z-index:999;";
            overlay.innerHTML = `<h3>Elevating Couture...</h3><p id='perc-txt'>0%</p>`;
            container.appendChild(overlay);
        }
        const txt = document.getElementById('perc-txt');
        if (txt) txt.innerText = p + "%";
        if (p >= 100) setTimeout(() => overlay.remove(), 1000);
    }
}

window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    if (avatarObject) {
        avatarObject.traverse(o => {
            const n = o.name.toLowerCase();
            if (o.isMesh && (n.includes('skin') || n.includes('body') || n.includes('head') || n.includes('arm') || n.includes('leg'))) {
                if(o.material) {
                    if(!o.material._cloned) { o.material = o.material.clone(); o.material._cloned = true; }
                    o.material.color.setHex(color);
                }
            }
        });
    }
};

window.onOutfitColorChange = function(colorName) {
    const palette = { 'ruby': 0x9B111E, 'emerald': 0x013220, 'gold': 0xD4AF37, 'navy': 0x000030, 'azure': 0x007FFF, 'rosegold': 0xB76E79 };
    const color = palette[colorName.toLowerCase()] || 0xD4AF37;
    if (avatarObject) {
        avatarObject.traverse(o => {
            const n = o.name.toLowerCase();
            const isClothing = n.includes('top') || n.includes('shirt') || n.includes('dress') || n.includes('pant') || n.includes('outfit') || n.includes('clothes');
            if (o.isMesh && isClothing) {
                if(o.material) {
                    if(!o.material._cloned) { o.material = o.material.clone(); o.material._cloned = true; }
                    o.material.color.setHex(color);
                }
            }
        });
    }
};

function onEngineResize() {
    const container = document.getElementById('canvas-container');
    if(!container || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.01;
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

// Global initialization
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
