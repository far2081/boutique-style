
// libaas_ai/engine.js - The Ultimate Luxury 3D Boutique Engine
// Bulletproof Model Loading & Designer Mannequin Version

let scene, camera, renderer, controls;
let avatarObject = null;
const avatarGroup = new THREE.Group();
let fallbackModel; 
let gltfLoader = null;

// Multiple fallback sources to ensure a real human appears
const modelSources = [
    "scene.gltf",
    "avatar.glb", 
    "https://models.readyplayer.me/638515f4972c1952a2a08892.glb",
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/Soldier.glb", 
];
let currentSourceIndex = 0;

function init() {
    console.log("3D Engine: Initializing Luxury Boutique...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); 
    scene.fog = new THREE.Fog(0x050505, 1, 10);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.4, 3.5);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // DRAMATIC BOUTIQUE LIGHTING
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    
    const topLight = new THREE.SpotLight(0xffffff, 2);
    topLight.position.set(1, 5, 2);
    topLight.castShadow = true;
    scene.add(topLight);
    
    const rimLight = new THREE.PointLight(0xffffff, 1.2);
    rimLight.position.set(-2, 2, -2);
    scene.add(rimLight);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.8;
        controls.target.set(0, 1.1, 0);
    }

    // LUXURY MIRRORED STAGE
    const stage = new THREE.Group();
    const floor = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.6, 0.05, 64),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 1.0, roughness: 0.1 })
    );
    floor.position.y = -0.025;
    floor.receiveShadow = true;
    stage.add(floor);

    const glowRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.01, 16, 128),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 1 })
    );
    glowRing.rotation.x = Math.PI / 2;
    glowRing.position.y = 0.01;
    stage.add(glowRing);
    
    scene.add(stage);

    // DESIGNER MANNEQUIN (The ultimate fallback human silhouette)
    const designerMannequin = new THREE.Group();
    const glossyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.1 });
    
    const addMesh = (geom, pos, scale = [1,1,1]) => {
        const m = new THREE.Mesh(geom, glossyMat);
        m.position.copy(pos);
        m.scale.set(...scale);
        designerMannequin.add(m);
    };

    // Realistic Proportions System
    addMesh(new THREE.SphereGeometry(0.12, 32, 32), new THREE.Vector3(0, 1.72, 0)); // Head
    addMesh(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 32), new THREE.Vector3(0, 1.62, 0)); // Neck
    addMesh(new THREE.CylinderGeometry(0.24, 0.18, 0.45, 32), new THREE.Vector3(0, 1.4, 0)); // Chest
    addMesh(new THREE.CylinderGeometry(0.18, 0.22, 0.35, 32), new THREE.Vector3(0, 1.0, 0)); // Hips
    
    const createLimb = (side, y, rot) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.7, 32), glossyMat);
        arm.position.set(0.25 * side, y, 0);
        arm.rotation.z = rot * side;
        designerMannequin.add(arm);
    };
    createLimb(1, 1.35, 0.1); createLimb(-1, 1.35, 0.1); // Arms
    
    const createLeg = (side) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.85, 32), glossyMat);
        leg.position.set(0.12 * side, 0.45, 0);
        designerMannequin.add(leg);
    };
    createLeg(1); createLeg(-1);

    fallbackModel = designerMannequin;
    scene.add(fallbackModel);
    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        tryLoadNextModel();
    }
    
    window.addEventListener('resize', onEngineResize);
    animate();
}

function tryLoadNextModel() {
    if (currentSourceIndex >= modelSources.length) {
        console.error("All model sources failed. Staying with designer mannequin.");
        return;
    }

    const path = modelSources[currentSourceIndex];
    console.log("3D Engine: Attempting to load: " + path);
    
    gltfLoader.load(path, (gltf) => {
        console.log("3D Engine: SUCCESS! Model Loaded from: " + path);
        avatarObject = gltf.scene;
        
        // Auto-Scale logic - ensuring it fits the luxury stage perfectly
        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = box.getSize(new THREE.Vector3());
        console.log("3D Engine: Model Height: " + size.y);

        const scale = 1.78 / size.y;
        avatarObject.scale.set(scale, scale, scale);
        avatarObject.position.y = 0;
        
        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if(o.material && o.material.map) o.material.map.anisotropy = 16;
                // Ensure material visibility
                if (o.material) o.material.side = THREE.DoubleSide;
            }
        });

        if (fallbackModel) fallbackModel.visible = false;
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(avatarObject);
        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, 
    (xhr) => {
        if (xhr.lengthComputable) {
            const percentComplete = xhr.loaded / xhr.total * 100;
            console.log("3D Engine: Loading: " + Math.round(percentComplete) + "%");
        }
    }, 
    (err) => {
        console.error("3D Engine: ERROR loading: " + path, err);
        currentSourceIndex++;
        tryLoadNextModel();
    });
}

window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    if (avatarObject) {
        avatarObject.traverse(o => {
            if (o.isMesh && (o.name.toLowerCase().includes('skin') || o.name.toLowerCase().includes('body') || o.name.toLowerCase().includes('head'))) {
                if(o.material) {
                    if(!o.material._cloned) { o.material = o.material.clone(); o.material._cloned = true; }
                    o.material.color.setHex(color);
                }
            }
        });
    }
    if (fallbackModel) {
        fallbackModel.traverse(o => { if (o.isMesh && o.material) o.material.color.setHex(color); });
    }
};

window.onOutfitColorChange = function(colorName) {
    const palette = { 'ruby': 0x9B111E, 'emerald': 0x006D5B, 'gold': 0xD4AF37, 'navy': 0x000080, 'azure': 0x007FFF, 'rosegold': 0xE0BFB8 };
    const color = palette[colorName.toLowerCase()] || 0xD4AF37;
    if (avatarObject) {
        avatarObject.traverse(o => {
            const n = o.name.toLowerCase();
            if (o.isMesh && (n.includes('top') || n.includes('shirt') || n.includes('bottom') || n.includes('outfit') || n.includes('pant'))) {
                if(o.material) {
                    if(!o.material._cloned) { o.material = o.material.clone(); o.material._cloned = true; }
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

init();
