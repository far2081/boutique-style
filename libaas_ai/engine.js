
// libaas_ai/engine.js - Virtual Try-On 3D Engine
// Max Stability Version: Safe Geometries & Original Initialization

let scene, camera, renderer, controls;
let avatarObject = null;
let profileHeight = 170;
let profileWeight = 65;

let gltfLoader = null;
const avatarPath = "https://models.readyplayer.me/64f06834005c2104928e4e94.glb";
const avatarGroup = new THREE.Group();
let fallbackModel; 

function getResponsiveScale() {
  return window.innerWidth < 768 ? 0.8 : 1.0; 
}

function init() {
    console.log("3D Engine: Initializing Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0b); 

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // Camera Framing
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 4.5); 
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    if(THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dLight.position.set(5, 10, 5);
    scene.add(dLight);
    
    // Orbit Controls Safety check
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 1.0, 0);
        controls.autoRotate = true;
    }

    // Stable Stage (radius 1.4)
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
    
    // SAFE HUMAN FALLBACK (Using oldest stable geometries)
    const dummy = new THREE.Group();
    const dMat = new THREE.MeshStandardMaterial({ color: 0x444444, wireframe: true });
    
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.7, 8), dMat);
    body.position.y = 1.0; 
    dummy.add(body);
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), dMat);
    head.position.y = 1.5; 
    dummy.add(head);

    fallbackModel = dummy;
    fallbackModel.visible = false; 
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        loadBaseAvatar();
    } else {
        console.warn("GLTFLoader not found, showing body fallback.");
        fallbackModel.visible = true;
    }
    
    window.addEventListener('resize', onEngineResize);
    animate();
}

function loadBaseAvatar() {
    if (!gltfLoader) return;
    gltfLoader.load(avatarPath, (gltf) => {
        avatarObject = gltf.scene;
        
        // Use normal scaling/positioning
        avatarObject.scale.set(1, 1, 1);
        avatarObject.position.set(0, 0, 0);

        if (fallbackModel) fallbackModel.visible = false;
        avatarGroup.clear();
        avatarGroup.add(avatarObject);

        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, undefined, (err) => {
        console.error("Model load error:", err);
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

function bootEngine() {
    init();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootEngine();
} else if (typeof $ !== 'undefined') {
    $(document).ready(bootEngine);
} else {
    document.addEventListener('DOMContentLoaded', bootEngine);
}
