
// libaas_ai/engine.js - Premium Virtual Try-On 3D Engine
// Realistic Human Avatar & 3D Interactive Studio Version

let scene, camera, renderer, controls;
let avatarObject = null;
const avatarGroup = new THREE.Group();
let fallbackModel; 
let gltfLoader = null;

// High-quality realistic human avatar URL (Ready Player Me)
const avatarPath = "https://models.readyplayer.me/65853d266aa7376c6d2fe2b6.glb"; 

function init() {
    console.log("3D Engine: Initializing Premium Human Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // SCENE SETUP
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); // Deeper black for premium look
    scene.fog = new THREE.Fog(0x050505, 5, 15);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.3, 3.2); // Golden ratio for human viewport
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // PREMIUM STUDIO LIGHTING
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 2, 2);
    scene.add(fillLight);
    
    const rimLight = new THREE.SpotLight(0xffffff, 2);
    rimLight.position.set(0, 5, -3);
    scene.add(rimLight);

    // ORBIT CONTROLS
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableRotate = true; 
        controls.autoRotate = true; // Auto-rotate as requested
        controls.autoRotateSpeed = 1.5;
        controls.enableZoom = true;   
        controls.maxDistance = 6;
        controls.minDistance = 1.5;
        controls.target.set(0, 1.0, 0);
    }

    // PREMIUM STUDIO STAGE
    const stageGroup = new THREE.Group();
    
    // Main Reflective Platform
    const platformGeom = new THREE.CylinderGeometry(1.5, 1.6, 0.05, 64);
    const platformMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        metalness: 0.9, 
        roughness: 0.1,
        emissive: 0x000000
    });
    const platform = new THREE.Mesh(platformGeom, platformMat);
    platform.position.y = -0.025;
    platform.receiveShadow = true;
    stageGroup.add(platform);

    // Glowing Rim
    const rimGeom = new THREE.TorusGeometry(1.5, 0.015, 16, 128);
    const rimMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFA500, // Matching the orange branding
        emissive: 0xFFA500, 
        emissiveIntensity: 2 
    });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.01;
    stageGroup.add(rim);

    // Ground Reflection Plane
    const groundGeom = new THREE.CircleGeometry(4, 64);
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: 0x050505, 
        metalness: 0.8, 
        roughness: 0.2,
        transparent: true,
        opacity: 0.8
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    stageGroup.add(ground);

    scene.add(stageGroup);
    
    // IMPROVED MANNEQUIN FALLBACK (Sleek Aesthetic)
    const mannequin = new THREE.Group();
    const mannequinMat = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        metalness: 0.5, 
        roughness: 0.2,
        transparent: false
    });
    
    // Simplified but clean mannequin parts
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), mannequinMat);
    head.position.y = 1.7;
    mannequin.add(head);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.6, 32), mannequinMat);
    torso.position.y = 1.35;
    mannequin.add(torso);

    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.8, 32), mannequinMat);
    legs.position.y = 0.65;
    mannequin.add(legs);

    fallbackModel = mannequin;
    fallbackModel.visible = true; // Show until real model loads
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    // MODELLOADER
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        loadBaseAvatar();
    }
    
    window.addEventListener('resize', onEngineResize);
    animate();
}

function loadBaseAvatar() {
    if (!gltfLoader) return;
    console.log("3D Engine: Loading high-quality avatar from URL...");
    
    gltfLoader.load(avatarPath, (gltf) => {
        avatarObject = gltf.scene;
        
        // Auto-center and scale for standardized RPM model
        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        avatarObject.position.x += (avatarObject.position.x - center.x);
        avatarObject.position.z += (avatarObject.position.z - center.z);
        avatarObject.position.y = 0; // Ground the model
        
        // Standardize height to approx 1.7m
        const targetHeight = 1.75;
        const scale = targetHeight / size.y;
        avatarObject.scale.set(scale, scale, scale);
        
        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                // Optimize materials for real-time rendering
                if(o.material) {
                    o.material.frustumCulled = false;
                    if(o.material.map) o.material.map.anisotropy = 16;
                }
            }
        });

        if (fallbackModel) fallbackModel.visible = false;
        while(avatarGroup.children.length > 0) {
            avatarGroup.remove(avatarGroup.children[0]);
        }
        avatarGroup.add(avatarObject);
        console.log("3D Engine: SUCCESS! Realistic Human loaded.");
        
        // Initial color pulse (Optional visual cue)
        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, 
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, 
    (err) => {
        console.error("3D Engine Error: URL Load failed. Path: " + avatarPath);
        // Fallback already visible
    });
}

window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    
    if (avatarObject) {
        avatarObject.traverse(o => {
            if (o.isMesh && (
                o.name.toLowerCase().includes('skin') || 
                o.name.toLowerCase().includes('body') ||
                o.name.toLowerCase().includes('head') ||
                o.name.toLowerCase().includes('arm') ||
                o.name.toLowerCase().includes('leg')
            )) {
                if(o.material) {
                    // clone material if shared to avoid side effects
                    if(!o.material._cloned) {
                        o.material = o.material.clone();
                        o.material._cloned = true;
                    }
                    o.material.color.setHex(color);
                }
            }
        });
    }
    
    // Mannequin fallback update
    if (fallbackModel && fallbackModel.visible) {
        fallbackModel.traverse(o => {
            if (o.isMesh && o.material) {
                o.material.color.setHex(color);
            }
        });
    }
};

window.onOutfitColorChange = function(colorName) {
    const palette = {
        'ruby': 0x9B111E, 'emerald': 0x006D5B, 'gold': 0xD4AF37,
        'navy': 0x000080, 'azure': 0x007FFF, 'rosegold': 0xE0BFB8
    };
    const color = palette[colorName.toLowerCase()] || 0xD4AF37;
    
    if (avatarObject) {
        avatarObject.traverse(o => {
            const n = o.name.toLowerCase();
            // Target specific RPM clothing meshes (Top, Bottom, Outfit, Footwear)
            if (o.isMesh && (
                n.includes('top') || 
                n.includes('bottom') || 
                n.includes('outfit') || 
                n.includes('shirt') || 
                n.includes('pant') || 
                n.includes('shoe') ||
                n.includes('clothing')
            )) {
                if(o.material) {
                    if(!o.material._cloned) {
                        o.material = o.material.clone();
                        o.material._cloned = true;
                    }
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
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

// Global exposure for debugging
window.engineReset = function() {
    init();
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
