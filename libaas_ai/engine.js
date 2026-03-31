
// libaas_ai/engine.js - Virtual Try-On 3D Engine
// Luxury Version: Smooth Human Silhouette & Stable 3D Presence

let scene, camera, renderer, controls;
let avatarObject = null;
const avatarGroup = new THREE.Group();
let fallbackModel; 
let gltfLoader = null;

const MODELS = [
    "https://readyplayer.me/api/models/64f06834005c2104928e4e94.glb",
    "https://threejs.org/examples/models/gltf/Soldier.glb"
];

function init() {
    console.log("3D Engine: Initializing Luxury Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0b); 

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.4, 4.0); 
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    if(THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dLight.position.set(2, 5, 5);
    scene.add(dLight);
    
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 1.1, 0);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 3.0; // Optimized rotation
    }

    // Platform (1.4 radius)
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.4, 1.5, 0.1, 48),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.1 })
    );
    platform.position.y = -0.05;
    scene.add(platform);

    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.42, 0.03, 16, 100),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 0.5 })
    );
    rim.rotation.x = Math.PI/2;
    rim.position.y = 0.05;
    scene.add(rim);
    
    // HIGH-QUALITY MANNEQUIN (Curved Professional Silhouette)
    const humanoid = createSmoothMannequin();
    fallbackModel = humanoid;
    fallbackModel.visible = true; 
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        tryLoadModel(0);
    }
    
    window.addEventListener('resize', onEngineResize);
    animate();
}

function createSmoothMannequin() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7, roughness: 0.2 });

    // Torso (Smooth Lathe)
    const torsoPoints = [];
    for (let i = 0; i < 10; i++) {
        const x = Math.sin(i * 0.4) * 0.15 + 0.12;
        torsoPoints.push(new THREE.Vector2(x, i * 0.1));
    }
    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 24);
    const torso = new THREE.Mesh(torsoGeo, mat);
    torso.position.y = 0.75;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), mat);
    head.position.y = 1.7;
    group.add(head);

    // Shoulders
    const shoulderGeo = new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.1, 0.4, 4, 8) : new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
    const shoulders = new THREE.Mesh(shoulderGeo, mat);
    shoulders.rotation.z = Math.PI / 2;
    shoulders.position.y = 1.5;
    group.add(shoulders);

    // Legs (Tapered)
    const legGeo = new THREE.CylinderGeometry(0.1, 0.05, 0.8, 12);
    const leg1 = new THREE.Mesh(legGeo, mat);
    leg1.position.set(-0.15, 0.4, 0);
    group.add(leg1);
    const leg2 = new THREE.Mesh(legGeo, mat);
    leg2.position.set(0.15, 0.4, 0);
    group.add(leg2);

    return group;
}

function tryLoadModel(index) {
    if (index >= MODELS.length) {
        console.warn("3D Engine: Failed to load all models. Using premium mannequin.");
        return;
    }

    gltfLoader.load(MODELS[index], (gltf) => {
        avatarObject = gltf.scene;
        avatarObject.scale.set(1.1, 1.1, 1.1);
        avatarObject.position.set(0, 0.05, 0);

        if (fallbackModel) fallbackModel.visible = false;
        avatarGroup.clear();
        avatarGroup.add(avatarObject);

        console.log("3D Engine: Success loading primary human model.");
        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, undefined, (err) => {
        console.error("3D Engine: Error loading model from", MODELS[index], "- trying next URL.");
        tryLoadModel(index + 1);
    });
}

function updateBody(h, w) {
    const sH = h / 170;
    const sW = Math.sqrt(w / 65);
    avatarGroup.scale.set(sW, sH, sW);
}

window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    if (avatarObject) {
        avatarObject.traverse(c => {
            if (c.isMesh && (c.name.includes('Skin') || c.name.includes('Body') || c.name.includes('Head'))) {
                if (c.material) {
                    const m = Array.isArray(c.material) ? c.material[0] : c.material;
                    m.color.setHex(color);
                }
            }
        });
    }
};

window.onOutfitColorChange = function(colorName) {
    const palette = { 'ruby': 0x9B111E, 'emerald': 0x006D5B, 'gold': 0xD4AF37, 'navy': 0x000080, 'azure': 0x007FFF, 'rosegold': 0xE0BFB8 };
    const cHex = palette[colorName.toLowerCase()] || 0xD4AF37;
    if (avatarObject) {
        avatarObject.traverse(c => {
            if (c.isMesh && !c.name.includes('Skin')) {
                if (c.material) {
                    const m = Array.isArray(c.material) ? c.material[0] : c.material;
                    m.color.setHex(cHex);
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

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
