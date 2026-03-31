
// libaas_ai/engine.js - Virtual Try-On 3D Engine
// Studio Version: Humanoid Presence & Full 3D Rotation

let scene, camera, renderer, controls;
let avatarObject = null;
let profileHeight = 170;
let profileWeight = 65;

let gltfLoader = null;
const avatarPath = "https://models.readyplayer.me/64f06834005c2104928e4e94.glb";
const avatarGroup = new THREE.Group();
let fallbackModel; 

function init() {
    console.log("3D Engine: Initializing Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0b); 

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.3, 4.5); 
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    if(THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dLight.position.set(5, 10, 5);
    scene.add(dLight);
    
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 1.0, 0);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 3.0; // Noticeable 360 rotation
    }

    // Platform (1.4 radius)
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
    
    // ENHANCED HUMANOID FALLBACK
    const hGroup = new THREE.Group();
    const hMat = new THREE.MeshStandardMaterial({ color: 0x555555, wireframe: true });
    
    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.7, 8), hMat);
    torso.position.y = 1.05;
    hGroup.add(torso);
    
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), hMat);
    head.position.y = 1.5;
    hGroup.add(head);

    // Legs
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.7, 8), hMat);
    leg1.position.set(-0.12, 0.35, 0);
    hGroup.add(leg1);

    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.7, 8), hMat);
    leg2.position.set(0.12, 0.35, 0);
    hGroup.add(leg2);

    // Arms
    const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.6, 8), hMat);
    arm1.position.set(-0.25, 1.0, 0);
    arm1.rotation.z = 0.2;
    hGroup.add(arm1);

    const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.6, 8), hMat);
    arm2.position.set(0.25, 1.0, 0);
    arm2.rotation.z = -0.2;
    hGroup.add(arm2);

    fallbackModel = hGroup;
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
        avatarObject.scale.set(1.05, 1.05, 1.05);
        avatarObject.position.set(0, 0, 0);

        if (fallbackModel) fallbackModel.visible = false;
        avatarGroup.clear();
        avatarGroup.add(avatarObject);

        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, undefined, (err) => {
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
