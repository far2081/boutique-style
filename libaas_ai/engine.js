
// libaas_ai/engine.js - Virtual Try-On 3D Engine
// Realistic Human Avatar & 3D Rotate Version

let scene, camera, renderer, controls;
let avatarObject = null;
const avatarGroup = new THREE.Group();
let fallbackModel; 
let gltfLoader = null;

// Using the locally downloaded realistic human model
const avatarPath = "avatar.glb"; 

function init() {
    console.log("3D Engine: Initializing Realistic Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); 

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.4, 3.5); // Closer and better height for realistic model
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // Improved studio lighting for realism
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const frontLight = new THREE.DirectionalLight(0xffffff, 1.5);
    frontLight.position.set(0, 5, 5);
    scene.add(frontLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 5, -5);
    scene.add(backLight);
    
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableRotate = true; // Enabled as requested
        controls.enableZoom = true;   // Enabled for detailed inspection
        controls.enablePan = false;    
        controls.target.set(0, 1.2, 0);
        controls.minDistance = 2;
        controls.maxDistance = 10;
    }

    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.5, 0.1, 32),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 })
    );
    platform.position.y = -0.05;
    scene.add(platform);

    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.03, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 0.5 })
    );
    rim.rotation.x = Math.PI/2;
    rim.position.y = 0.05;
    scene.add(rim);
    
    // IMPROVED HUMAN FALLBACK (Better silhouette)
    const humanoid = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3 });
    const outfitMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    
    // Head (More oval)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), skinMat);
    head.scale.y = 1.3;
    head.position.y = 1.65;
    head.name = "human_skin";
    humanoid.add(head);

    // Torso (Trapezoidal for better silhouette)
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.5, 16), outfitMat);
    chest.position.y = 1.3;
    chest.name = "human_outfit";
    humanoid.add(chest);

    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.3, 16), outfitMat);
    hips.position.y = 0.95;
    hips.name = "human_outfit";
    humanoid.add(hips);

    // Legs (Tapered)
    const createLeg = (side) => {
        const leg = new THREE.Group();
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.5, 8), skinMat);
        thigh.position.y = 0.7;
        thigh.name = "human_skin";
        const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.45, 8), skinMat);
        calf.position.y = 0.23;
        calf.name = "human_skin";
        leg.add(thigh); leg.add(calf);
        leg.position.x = 0.11 * side;
        return leg;
    };
    humanoid.add(createLeg(1));
    humanoid.add(createLeg(-1));

    // Arms
    const createArm = (side) => {
        const arm = new THREE.Group();
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.45, 8), skinMat);
        upper.position.y = 1.3;
        upper.position.x = 0.3 * side;
        upper.rotation.z = 0.15 * side;
        upper.name = "human_skin";
        const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.4, 8), skinMat);
        lower.position.y = 0.9;
        lower.position.x = 0.35 * side;
        lower.name = "human_skin";
        arm.add(upper); arm.add(lower);
        return arm;
    };
    humanoid.add(createArm(1));
    humanoid.add(createArm(-1));

    fallbackModel = humanoid;
    scene.add(fallbackModel);
    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        loadBaseAvatar();
    }
    
    window.addEventListener('resize', onEngineResize);
    animate();
}

function loadBaseAvatar() {
    if (!gltfLoader) return;
    gltfLoader.load(avatarPath, (gltf) => {
        avatarObject = gltf.scene;
        // Adjust scale for the specific realistic model
        avatarObject.scale.set(1.0, 1.0, 1.0); 
        avatarObject.position.set(0, 0, 0);
        
        if (fallbackModel) fallbackModel.visible = false;
        while(avatarGroup.children.length > 0) {
            avatarGroup.remove(avatarGroup.children[0]);
        }
        avatarGroup.add(avatarObject);
        console.log("3D Engine: Realistic Avatar Loaded.");
        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, undefined, (err) => {
        console.warn("Avatar load failed (path: " + avatarPath + "), using improved fallback.");
    });
}

window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    // Update main avatar if loaded
    if (avatarObject) {
        avatarObject.traverse(o => {
            // General detection for skin meshes
            if (o.isMesh && (
                o.name.toLowerCase().includes('skin') || 
                o.name.toLowerCase().includes('body') ||
                o.name.toLowerCase().includes('surface')
            )) {
                if(o.material) o.material.color.setHex(color);
            }
        });
    }
    // Update fallback mannequin
    if (fallbackModel) {
        fallbackModel.traverse(o => {
            if (o.name === "human_skin" && o.material) {
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
            // Assume anything NOT skin/body/hair/eye is outfit/clothing
            const n = o.name.toLowerCase();
            if (o.isMesh && 
                !n.includes('skin') && 
                !n.includes('body') && 
                !n.includes('eye') && 
                !n.includes('hair')) {
                if(o.material) o.material.color.setHex(color);
            }
        });
    }
    if (fallbackModel) {
        fallbackModel.traverse(o => {
            if (o.name === "human_outfit" && o.material) {
                o.material.color.setHex(color);
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
    // Slow auto-rotate, but manual controls take over when interacting
    if (!controls || !controls.activeLook) {
        if (fallbackModel && fallbackModel.visible) fallbackModel.rotation.y += 0.005;
        if (avatarGroup) avatarGroup.rotation.y += 0.005;
    }
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
