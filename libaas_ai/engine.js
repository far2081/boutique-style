
// libaas_ai/engine.js - Professional Boutique 3D Engine
// Realistic Podium & High-Fidelity Humanoid Version

let scene, camera, renderer, controls;
let avatarObject = null;
const avatarGroup = new THREE.Group();
let fallbackModel; 
let gltfLoader = null;

// Realistic online model URL
const avatarPath = "https://models.readyplayer.me/65853d266aa7376c6d2fe2b6.glb"; 

function init() {
    console.log("3D Engine: Initializing Professional Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a111a); // Dark midnight blue for premium depth

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
    
    // STUDIO LIGHTING
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(0, 5, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(0, 5, -5);
    scene.add(backLight);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;
        controls.target.set(0, 1.2, 0);
    }

    // PREMIUM CIRCULAR PODIUM (Stage)
    const podiumGroup = new THREE.Group();
    
    // Main Body
    const podium = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.3, 0.15, 64),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 })
    );
    podium.position.y = -0.075;
    podium.receiveShadow = true;
    podiumGroup.add(podium);

    // Gold Trim Ring
    const goldTrim = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.02, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 1, roughness: 0.2, emissive: 0xD4AF37, emissiveIntensity: 0.3 })
    );
    goldTrim.rotation.x = Math.PI/2;
    goldTrim.position.y = 0.01;
    podiumGroup.add(goldTrim);
    
    scene.add(podiumGroup);

    // HIGH-FIDELITY HUMANOID FALLBACK (Jointed Mannequin Style)
    const humanoid = new THREE.Group();
    const mannequinMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.4, roughness: 0.3 });
    
    // Function to create realistic parts
    const addPart = (geom, pos, orient = 0) => {
        const mesh = new THREE.Mesh(geom, mannequinMat);
        mesh.position.copy(pos);
        mesh.rotation.z = orient;
        humanoid.add(mesh);
        return mesh;
    };

    // Head & Neck
    addPart(new THREE.SphereGeometry(0.1, 32, 32), new THREE.Vector3(0, 1.7, 0));
    addPart(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 16), new THREE.Vector3(0, 1.6, 0));

    // Torso (V-shape)
    const chest = addPart(new THREE.CylinderGeometry(0.22, 0.18, 0.35, 16), new THREE.Vector3(0, 1.4, 0));
    const waist = addPart(new THREE.CylinderGeometry(0.18, 0.2, 0.25, 16), new THREE.Vector3(0, 1.12, 0));
    
    // Arms (Shoulders, Biceps, Forearms)
    const createArm = (side) => {
        const shoulder = addPart(new THREE.SphereGeometry(0.05, 16, 16), new THREE.Vector3(0.24 * side, 1.5, 0));
        const upper = addPart(new THREE.CylinderGeometry(0.04, 0.045, 0.3, 16), new THREE.Vector3(0.28 * side, 1.32, 0), 0.1 * -side);
        const lower = addPart(new THREE.CylinderGeometry(0.04, 0.03, 0.3, 16), new THREE.Vector3(0.32 * side, 1.05, 0), 0.05 * -side);
    };
    createArm(1); createArm(-1);

    // Legs (Hips, Thighs, Calves)
    const createLeg = (side) => {
        const thigh = addPart(new THREE.CylinderGeometry(0.1, 0.07, 0.45, 16), new THREE.Vector3(0.1 * side, 0.8, 0));
        const calf = addPart(new THREE.CylinderGeometry(0.07, 0.05, 0.45, 16), new THREE.Vector3(0.1 * side, 0.37, 0));
        const foot = addPart(new THREE.BoxGeometry(0.08, 0.05, 0.15), new THREE.Vector3(0.1 * side, 0.1, 0.04));
    };
    createLeg(1); createLeg(-1);

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
        
        // Proper scaling for realistic height
        const box = new THREE.Box3().setFromObject(avatarObject);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        avatarObject.position.y = 0;
        avatarObject.position.x = 0;
        avatarObject.position.z = 0;
        
        const scale = 1.75 / size.y;
        avatarObject.scale.set(scale, scale, scale);

        if (fallbackModel) fallbackModel.visible = false;
        while(avatarGroup.children.length > 0) {
            avatarGroup.remove(avatarGroup.children[0]);
        }
        avatarGroup.add(avatarObject);
        console.log("3D Engine: Success. Main Avatar Mounted.");
        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, undefined, (err) => {
        console.warn("Retrying model load or staying with high-fidelity mannequin.");
    });
}

window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    if (avatarObject) {
        avatarObject.traverse(o => {
            if (o.isMesh && (o.name.toLowerCase().includes('skin') || o.name.toLowerCase().includes('body'))) {
                if(o.material) {
                    if(!o.material._cloned) { o.material = o.material.clone(); o.material._cloned = true; }
                    o.material.color.setHex(color);
                }
            }
        });
    }
    if (fallbackModel && fallbackModel.visible) {
        fallbackModel.traverse(o => { if (o.isMesh && o.material) o.material.color.setHex(color); });
    }
};

window.onOutfitColorChange = function(colorName) {
    const palette = { 'ruby': 0x9B111E, 'emerald': 0x006D5B, 'gold': 0xD4AF37, 'navy': 0x000080, 'azure': 0x007FFF, 'rosegold': 0xE0BFB8 };
    const color = palette[colorName.toLowerCase()] || 0xD4AF37;
    if (avatarObject) {
        avatarObject.traverse(o => {
            if (o.isMesh && (o.name.toLowerCase().includes('top') || o.name.toLowerCase().includes('bottom') || o.name.toLowerCase().includes('outfit'))) {
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
