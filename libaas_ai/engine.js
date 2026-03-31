
// libaas_ai/engine.js - Virtual Try-On 3D Engine
// Optimized for Professional Visuals & High-Performance Rendering

let scene, camera, renderer, controls;
let avatarObject = null;
const avatarGroup = new THREE.Group();
let gltfLoader = null;

// High-Definition Studio Config
const STUDIO_CONFIG = {
    platformColor: 0x111111,
    accentColor: 0xD4AF37,
    ambientColor: 0xffffff,
    stageRadius: 2.0,
    avatarScale: 3.5, // Significant scale up per user request
    initialY: 0.0,
};

function init() {
    console.log("3D Engine: Initializing Premium Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error("3D Engine Error: 'canvas-container' not found!");
        return;
    }

    // 1. Scene & Environment
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.FogExp2(0x0a0a0a, 0.05);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    // 2. Camera Setup (Positioned for human body presence)
    camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 2.5, 8); // Start further back for a grand view

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true, 
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting System (WOW Factor)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 10, 7);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-5, 5, 2);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(STUDIO_CONFIG.accentColor, 1.5);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    const spotlight = new THREE.SpotLight(0xffffff, 3.0);
    spotlight.position.set(0, 15, 5);
    spotlight.angle = Math.PI / 6;
    spotlight.penumbra = 0.5;
    spotlight.decay = 2;
    spotlight.distance = 50;
    scene.add(spotlight);

    // 5. Advanced Stage/Platform (The "Stage Look")
    createPremiumStage();

    // 6. Interaction Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2.2, 0); // Focused on chest/face area
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 1.8; // Prevent bottom viewing
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    scene.add(avatarGroup);

    // 7. Load Assets
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        loadBaseAvatar();
    } else {
        console.error("3D Engine ERROR: GLTFLoader is missing from the page.");
        createHumanSilhouette(); // Show a better fallback than a pillar
    }

    window.addEventListener('resize', onEngineResize);
    animate();
}

function createPremiumStage() {
    // Main Disc
    const stageGeo = new THREE.CylinderGeometry(2, 2.2, 0.3, 64);
    const stageMat = new THREE.MeshStandardMaterial({ 
        color: 0x151515, 
        metalness: 0.9, 
        roughness: 0.1 
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.y = -0.15;
    scene.add(stage);

    // Glowing Rim
    const rimGeo = new THREE.TorusGeometry(2.05, 0.04, 16, 100);
    const rimMat = new THREE.MeshBasicMaterial({ color: STUDIO_CONFIG.accentColor });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.05;
    scene.add(rim);

    // Ground Reflection Plane
    const floorGeo = new THREE.CircleGeometry(10, 64);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x050505, 
        metalness: 0.5, 
        roughness: 0.5 
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    scene.add(floor);
}

function createHumanSilhouette() {
    // Improved dummy representaton instead of a pillar
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x333333, wireframe: true });
    
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.5, 4, 8), mat);
    body.position.y = 1.25;
    group.add(body);
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mat);
    head.position.y = 2.4;
    group.add(head);

    group.name = "fallback_silhouette";
    avatarGroup.add(group);
}

function loadBaseAvatar() {
    const url = "https://models.readyplayer.me/64f06834005c2104928e4e94.glb";
    console.log("3D Engine: Loading Avatar FROM:", url);

    gltfLoader.load(url, (gltf) => {
        // Remove fallback if exists
        const fallback = avatarGroup.getObjectByName("fallback_silhouette");
        if (fallback) avatarGroup.remove(fallback);

        avatarObject = gltf.scene;
        
        // IMPORTANT: No geometry.center() - it breaks rigged character meshes!
        // Instead, we position the scene object itself.
        
        avatarObject.scale.set(STUDIO_CONFIG.avatarScale, STUDIO_CONFIG.avatarScale, STUDIO_CONFIG.avatarScale);
        avatarObject.position.set(0, 0, 0); 
        
        avatarGroup.add(avatarObject);
        console.log("3D Engine SUCCESS: Avatar Loaded & Scaled.");
        
        // Initial color apply
        if(window.onComplexionChange) window.onComplexionChange('fair');

    }, (xhr) => {
        // Progress log
    }, (error) => {
        console.error("3D Engine: Failed to load GLB model.", error);
        createHumanSilhouette();
    });
}

function onEngineResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !renderer) return;

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

// User-facing event handlers
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

// Start the engine
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
