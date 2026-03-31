
// libaas_ai/engine.js - Virtual Try-On 3D Engine
// Professional Mannequin & Sync Logic Version

let scene, camera, renderer, controls;
let avatarObject = null;
const avatarGroup = new THREE.Group();
let fallbackModel; 
let gltfLoader = null;

const avatarPath = "https://models.readyplayer.me/64f06834005c2104928e4e94.glb";

function init() {
    console.log("3D Engine: Initializing Professional Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); 

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.3, 4.5); 
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dLight.position.set(5, 10, 5);
    scene.add(dLight);
    
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableRotate = false; 
        controls.enableZoom = false;   
        controls.enablePan = false;    
        controls.target.set(0, 1.0, 0);
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
    
    // PROFESSIONAL MANNEQUIN (Detailed Silhouette)
    const humanoid = new THREE.Group();
    // Two materials for sync: Skin and Outfit (Fallback)
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3 });
    const outfitMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    
    // Head & Neck
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat);
    head.position.y = 1.72;
    head.name = "human_skin";
    humanoid.add(head);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), skinMat);
    neck.position.y = 1.6;
    neck.name = "human_skin";
    humanoid.add(neck);

    // Torso (Upper & Lower)
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.5, 12), outfitMat);
    chest.position.y = 1.35;
    chest.name = "human_outfit";
    humanoid.add(chest);

    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.3, 12), outfitMat);
    hips.position.y = 1.0;
    hips.name = "human_outfit";
    humanoid.add(hips);

    // Legs
    const createLeg = (side) => {
        const leg = new THREE.Group();
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.45, 8), skinMat);
        thigh.position.y = 0.75;
        thigh.name = "human_skin";
        const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.45, 8), skinMat);
        calf.position.y = 0.3;
        calf.name = "human_skin";
        leg.add(thigh); leg.add(calf);
        leg.position.x = 0.12 * side;
        return leg;
    };
    humanoid.add(createLeg(1));
    humanoid.add(createLeg(-1));

    // Arms
    const createArm = (side) => {
        const arm = new THREE.Group();
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4, 8), skinMat);
        upper.position.y = 1.35;
        upper.position.x = 0.32 * side;
        upper.rotation.z = 0.1 * side;
        upper.name = "human_skin";
        const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.4, 8), skinMat);
        lower.position.y = 1.0;
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

if (!gltfLoader) return;
    
    gltfLoader.load(avatarPath, (gltf) => {
        avatarObject = gltf.scene;

        avatarObject.traverse(child => {
            if (child.isMesh) {
                child.geometry.center(); 
                child.geometry.scale(1.1, 1.1, 1.1); 
            }
        });

        avatarObject.position.set(0, 1.4, 0); 
        avatarObject.rotation.y = 0; 

        if (fallbackModel) fallbackModel.visible = false;

        while(avatarGroup.children.length > 0) {
            avatarGroup.remove(avatarGroup.children[0]);
        }

        avatarGroup.add(avatarObject);
        
        if(window.onComplexionChange) window.onComplexionChange('fair');
        console.log("3D Engine SUCCESS: Real Human Avatar Injected.");

    }, undefined, (err) => {
        console.warn("Avatar load failed, showing fallback.", err);
        if (fallbackModel) fallbackModel.visible = true;
    });
window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    // Update main avatar if loaded
    if (avatarObject) {
        avatarObject.traverse(o => {
            if (o.isMesh && (o.name.includes('Skin') || o.name.includes('Body'))) {
                o.material.color.setHex(color);
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
            if (o.isMesh && !o.name.includes('Skin')) {
                o.material.color.setHex(color);
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
    if (fallbackModel && fallbackModel.visible) fallbackModel.rotation.y += 0.02;
    if (avatarGroup) avatarGroup.rotation.y += 0.02;
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
