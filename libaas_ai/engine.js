
// libaas_ai/engine.js - FINAL PRODUCTION 3D ENGINE (v6.0)
// Optimized for Pakistani Heritage Textiles & Modern Web Compatibility (r128)

let scene, camera, renderer, controls, clock;
let avatarObject = null;
let mixer = null; 
let avatarGroup = new THREE.Group();
let fallbackModel;
let gltfLoader = null;

// Multi-path scanning (Covers all possibilities for Vercel/GitHub)
const modelSources = [
    "./assets/models/scene.gltf",
    "assets/models/scene.gltf",
    "../assets/models/scene.gltf",
    "libaas_ai/scene.gltf",
    "scene.gltf",
    "avatar.glb",
    "https://models.readyplayer.me/63b36340268427f7f07297d2.glb" 
];
let currentSourceIndex = 0;

function init() {
    console.log("3D Engine v6.0 Initializing...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Core Setup
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); 

    const w = container.clientWidth || 600;
    const h = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 1.5, 4.2);
    
    // Renderer Configuration
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    
    // Compatibility for r128 Color Space
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // High-End Studio Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const pointLight = new THREE.PointLight(0xffffff, 1.2);
    pointLight.position.set(2, 5, 3);
    scene.add(pointLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-2, 2, -2);
    scene.add(fillLight);

    // Human-Centric Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 1.2, 0);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
    }

    // THE LUXURY STAGE
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.6, 0.08, 64),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 })
    );
    platform.position.y = -0.04;
    scene.add(platform);

    // HQ MANNEQUIN (Silhouette Fallback)
    const mannequin = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.5 });
    const addM = (g, y, s = [1,1,1]) => {
        const m = new THREE.Mesh(g, mat);
        m.position.y = y;
        m.scale.set(...s);
        mannequin.add(m);
    };
    addM(new THREE.SphereGeometry(0.12, 32), 1.7); // Head
    addM(new THREE.CylinderGeometry(0.2, 0.18, 0.6, 32), 1.35); // Body
    addM(new THREE.CylinderGeometry(0.1, 0.08, 1.0, 32), 0.5); // Leg
    
    fallbackModel = mannequin;
    fallbackModel.visible = false;
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    // GLTF Loading Initiation
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        tryLoadNext();
    } else {
        console.error("3D Engine: GLTFLoader is missing. Please check scripts.");
        if (fallbackModel) fallbackModel.visible = true;
    }
    
    window.addEventListener('resize', onRescale);
    animate();
}

function tryLoadNext() {
    if (currentSourceIndex >= modelSources.length) {
        console.error("3D Engine: All paths checked. Using Designer Mannequin.");
        if (fallbackModel) fallbackModel.visible = true;
        return;
    }

    const path = modelSources[currentSourceIndex];
    console.log("3D Engine: Investigating -> " + path);
    
    gltfLoader.load(path, (gltf) => {
        console.log("3D Engine SUCCESS: Model Injected from " + path);
        avatarObject = gltf.scene;
        
        // Handle Animations
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(avatarObject);
            const action = mixer.clipAction(gltf.animations[0]);
            action.fadeIn(1).play();
        }

        // AUTO-CORRECTION: Scale and Position
        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = box.getSize(new THREE.Vector3());
        
        // Z-up Correction (for Sketchfab/Blender exports)
        if (size.z > size.y * 1.6) {
             console.warn("3D Engine Detect: Z-up model found. Auto-rotating...");
             avatarObject.rotation.x = -Math.PI / 2;
             box.setFromObject(avatarObject); // Re-calculate
             box.getSize(size);
        }

        const scale = 1.8 / size.y;
        avatarObject.scale.set(scale, scale, scale);
        avatarObject.position.y = - (box.min.y * scale); 
        avatarObject.position.x = 0;
        avatarObject.position.z = 0;

        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                if (o.material) {
                    o.material.side = THREE.DoubleSide; 
                    if (o.material.map) o.material.map.anisotropy = 16;
                }
            }
        });

        if (fallbackModel) fallbackModel.visible = false;
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(avatarObject);
        
        if (window.onComplexionChange) window.onComplexionChange('fair');
    }, 
    (xhr) => {
        if(xhr.lengthComputable) console.log("Engine Loading: " + Math.round(xhr.loaded/xhr.total*100) + "%");
    }, 
    (err) => {
        console.warn("3D Engine: Resource unreachable at " + path);
        currentSourceIndex++;
        tryLoadNext();
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

function onRescale() {
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

// Initial Boot Sequence
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
