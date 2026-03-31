
// libaas_ai/engine.js - Virtual Try-On 3D Engine
// Emergency Stability Version: 100% Compatible Human Body

let scene, camera, renderer, controls;
let avatarObject = null;
const avatarGroup = new THREE.Group();
let fallbackModel; 
let gltfLoader = null;

const avatarPath = "https://models.readyplayer.me/64f06834005c2104928e4e94.glb";

function init() {
    console.log("3D Engine: Initializing Stable Human Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 1. Scene & Background
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); 

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 2. Camera: Framing the Human Body
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.3, 4.5); 
    
    // 3. Renderer: High Compatibility Settings
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // 4. Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const dLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dLight.position.set(5, 10, 5);
    scene.add(dLight);
    
    // 5. Controls Security Check
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 1.0, 0);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 2.0;
    }

    // 6. Platform
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
    
    // 7. REALISTIC HUMAN MANNEQUIN (Using Rock-Solid Geometries)
    const humanoid = new THREE.Group();
    const mMat = new THREE.MeshStandardMaterial({ color: 0x333333, wireframe: true });
    
    // Torso & Chest
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.25), mMat);
    torso.position.y = 1.35;
    humanoid.add(torso);
    
    // Hips
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.22), mMat);
    hips.position.y = 0.95;
    humanoid.add(hips);
    
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mMat);
    head.position.y = 1.75;
    humanoid.add(head);

    // Legs
    const l1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.8, 8), mMat);
    l1.position.set(-0.15, 0.4, 0);
    humanoid.add(l1);
    const l2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.8, 8), mMat);
    l2.position.set(0.15, 0.4, 0);
    humanoid.add(l2);

    fallbackModel = humanoid;
    fallbackModel.visible = true; // Always show while loading
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    // 8. Model Loading Logic
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
        avatarObject.scale.set(1.1, 1.1, 1.1);
        avatarObject.position.set(0, 0, 0);

        if (fallbackModel) fallbackModel.visible = false;
        
        // Safety cross-version clear
        while(avatarGroup.children.length > 0) {
            avatarGroup.remove(avatarGroup.children[0]);
        }
        avatarGroup.add(avatarObject);

        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, undefined, (err) => {
        console.error("3D Engine Support: Falling back to mannequin.");
    });
}

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

// Full compatibility boot
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}
