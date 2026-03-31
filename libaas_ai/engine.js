
// libaas_ai/engine.js - Virtual Try-On 3D Engine
// Final Premium Version: Professional Mannequin & High-End Visuals

let scene, camera, renderer, controls;
let avatarObject = null;
let profileHeight = 170;
let profileWeight = 65;

let gltfLoader = null;
const avatarPath = "https://models.readyplayer.me/64f06834005c2104928e4e94.glb";
const avatarGroup = new THREE.Group();
let fallbackModel; 

function init() {
    console.log("3D Engine: Initializing Professional Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); 

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.4, 4.0); 
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    if(THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // Luxury Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const spot = new THREE.SpotLight(0xffffff, 2.0);
    spot.position.set(2, 8, 5);
    scene.add(spot);
    
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 1.1, 0); 
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2.5;
    }

    // High-End Platform
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.5, 0.1, 48),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 })
    );
    platform.position.y = -0.05;
    scene.add(platform);

    const goldRim = new THREE.Mesh(
        new THREE.TorusGeometry(1.42, 0.03, 16, 100),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 0.5, metalness: 1 })
    );
    goldRim.rotation.x = Math.PI/2;
    goldRim.position.y = 0.05;
    scene.add(goldRim);
    
    // PROFESSIONAL MANNEQUIN (Detailed Human Form)
    const mannequin = new THREE.Group();
    const mMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
    
    // 1. Chest & Torso (V-Shape)
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.18, 0.5, 12), mMat);
    chest.position.y = 1.35;
    mannequin.add(chest);

    // 2. Hips
    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.25, 12), mMat);
    hips.position.y = 1.1;
    mannequin.add(hips);

    // 3. Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), mMat);
    head.position.y = 1.68;
    mannequin.add(head);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 8), mMat);
    neck.position.y = 1.58;
    mannequin.add(neck);

    // 4. Legs (Thighs & Lower Legs)
    const createLeg = (side) => {
        const leg = new THREE.Group();
        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.5, 8), mMat);
        thigh.position.y = 0.8;
        const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.5, 8), mMat);
        calf.position.y = 0.3;
        leg.add(thigh); leg.add(calf);
        leg.position.x = 0.12 * side;
        return leg;
    };
    mannequin.add(createLeg(1));
    mannequin.add(createLeg(-1));

    // 5. Arms
    const createArm = (side) => {
        const arm = new THREE.Group();
        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.4, 8), mMat);
        upper.position.y = 1.35;
        upper.position.x = 0.32 * side;
        upper.rotation.z = 0.1 * side;
        const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.4, 8), mMat);
        lower.position.y = 1.0;
        lower.position.x = 0.35 * side;
        arm.add(upper); arm.add(lower);
        return arm;
    };
    mannequin.add(createArm(1));
    mannequin.add(createArm(-1));

    fallbackModel = mannequin;
    fallbackModel.visible = false; 
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        loadBaseAvatar();
    } else {
        fallbackModel.visible = true;
    }
    
    window.addEventListener('resize', onEngineResize);
    animate();
}

function loadBaseAvatar() {
    if (!gltfLoader) return;
    gltfLoader.load(avatarPath, (gltf) => {
        avatarObject = gltf.scene;
        avatarObject.scale.set(1, 1, 1);
        avatarObject.position.set(0, 0, 0);

        if (fallbackModel) fallbackModel.visible = false;
        avatarGroup.clear();
        avatarGroup.add(avatarObject);

        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, undefined, (err) => {
        console.error("3D Engine: Model load failed, using high-end mannequin fallback.");
        fallbackModel.visible = true;
    });
}

function updateBody(h, w) {
    profileHeight = h; profileWeight = w;
    const sH = h / 170;
    const sW = Math.sqrt(w / 65);
    avatarGroup.scale.set(sW, sH, sW);
}

window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    if (avatarObject) {
        avatarObject.traverse(c => {
            const n = c.name.toLowerCase();
            if (c.isMesh && (n.includes('skin') || n.includes('body') || n.includes('head') || n.includes('hand') || n.includes('leg'))) {
                if (c.material) {
                    const mats = Array.isArray(c.material) ? c.material : [c.material];
                    mats.forEach(m => {
                        m.color.setHex(color);
                        if (m.map) m.map = null;
                    });
                }
            }
        });
    }
};

window.onOutfitColorChange = function(colorName) {
    const palette = {
        'ruby': 0x9B111E, 'emerald': 0x006D5B, 'gold': 0xD4AF37,
        'navy': 0x000080, 'azure': 0x007FFF, 'rosegold': 0xE0BFB8
    };
    const cHex = palette[colorName.toLowerCase()] || 0xD4AF37;
    if (avatarObject) {
        avatarObject.traverse(c => {
            const n = c.name.toLowerCase();
            const isSkin = n.includes('skin') || n.includes('body') || n.includes('head') || n.includes('eye');
            if (c.isMesh && !isSkin) {
                if (c.material) {
                    const mats = Array.isArray(c.material) ? c.material : [c.material];
                    mats.forEach(m => {
                        m.color.setHex(cHex);
                        m.roughness = 0.3;
                        if (m.map) m.map = null;
                    });
                }
            }
        });
    }
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

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else if (typeof $ !== 'undefined') {
    $(document).ready(init);
} else {
    document.addEventListener('DOMContentLoaded', init);
}
