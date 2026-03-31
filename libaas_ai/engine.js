
// libaas_ai/engine.js - Professional 3D Virtual Try-On Engine (Animation Enhanced)
// Optimized for Pakistani Luxury Apparel & Realistic Human Movement

let scene, camera, renderer, controls, clock;
let avatarObject = null;
let mixer = null; // Animation Mixer
let avatarGroup = new THREE.Group();
let fallbackModel;
let gltfLoader = null;

// Priorities: Pakistani Model (scene.gltf) > Local Avatar > HQ Fallbacks
const modelSources = [
    "scene.gltf",
    "https://models.readyplayer.me/638515f4972c1952a2a08892.glb"
];
let currentSourceIndex = 0;

function init() {
    console.log("3D Engine v3: Initializing Luxury Pakistani Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); 
    scene.fog = new THREE.Fog(0x050505, 1, 15);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.6, 4.0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // DRAMATIC BOUTIQUE LIGHTING (Tailored for Fabrics)
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    
    const keyLight = new THREE.SpotLight(0xffffff, 2.5);
    keyLight.position.set(2, 5, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);
    
    const fillLight = new THREE.PointLight(0xffffff, 1.2);
    fillLight.position.set(-2, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    rimLight.position.set(0, 2, -3);
    scene.add(rimLight);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.target.set(0, 1.2, 0);
        controls.maxDistance = 6;
        controls.minDistance = 2;
    }

    // LUXURY MIRRORED STAGE
    const stage = new THREE.Group();
    const floor = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.6, 0.05, 64),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 })
    );
    floor.position.y = -0.025;
    floor.receiveShadow = true;
    stage.add(floor);

    const glowRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.015, 16, 128),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 2 })
    );
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.01;
    stage.add(glowRing);
    scene.add(stage);

    // HQ FALLBACK MANNEQUIN (Visible only if all loads fail)
    const mockGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.8, 32);
    const mockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    fallbackModel = new THREE.Mesh(mockGeo, mockMat);
    fallbackModel.position.set(0, 0.9, 0);
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
        console.error("All model sources failed. Showing fallback.");
        if (fallbackModel) fallbackModel.visible = true;
        return;
    }

    const path = modelSources[currentSourceIndex];
    console.log("3D Engine: Attempting Load -> " + path);
    
    gltfLoader.load(path, (gltf) => {
        console.log("3D Engine: SUCCESS! Model Loaded: " + path);
        avatarObject = gltf.scene;
        
        // --- ANIMATION SYSTEM ---
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(avatarObject);
            // Play the first animation (usually Idle or Walk)
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
            console.log("3D Engine: Animation Started.");
        }

        // --- INTELLIGENT AUTO-SCALE ---
        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = box.getSize(new THREE.Vector3());
        console.log("3D Engine: Raw Model Height: " + size.y);
        
        // Target an elegant human height of ~1.8 units
        const targetHeight = 1.8;
        const scale = targetHeight / size.y;
        avatarObject.scale.set(scale, scale, scale);
        
        // Center the model on the stage floor
        avatarObject.position.y = - (box.min.y * scale); 
        avatarObject.position.x = 0;
        avatarObject.position.z = 0;

        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if (o.material) {
                    o.material.side = THREE.DoubleSide; // Fix for clothing transparency
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
        if (xhr.lengthComputable) console.log("3D Engine: " + Math.round(xhr.loaded / xhr.total * 100) + "% Loaded");
    }, 
    (err) => {
        console.warn("3D Engine: Load FAILED for " + path + ". Trying next...");
        currentSourceIndex++;
        tryLoadNextModel();
    });
}

window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    if (avatarObject) {
        avatarObject.traverse(o => {
            const n = o.name.toLowerCase();
            if (o.isMesh && (n.includes('skin') || n.includes('body') || n.includes('head') || n.includes('arm') || n.includes('leg'))) {
                if(o.material) {
                    const m = Array.isArray(o.material) ? o.material[0] : o.material;
                    if(!m._cloned) { o.material = m.clone(); o.material._cloned = true; }
                    o.material.color.setHex(color);
                    // If it has a texture, let's keep it but tint it
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
                    const m = Array.isArray(o.material) ? o.material[0] : o.material;
                    if(!m._cloned) { o.material = m.clone(); o.material._cloned = true; }
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

// Initial Boot
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
