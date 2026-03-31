
// libaas_ai/engine.js - Ultra-Premium Boutique 3D Engine
// Realistic Mirror Studio & Organic Humanoid Version

let scene, camera, renderer, controls;
let avatarObject = null;
const avatarGroup = new THREE.Group();
let fallbackModel; 
let gltfLoader = null;

// High-quality realistic human avatar URL (Optimized for web)
const avatarPath = "https://models.readyplayer.me/638515f4972c1952a2a08892.glb?quality=low"; 

function init() {
    console.log("3D Engine: Initializing Luxury Human Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05080c); 

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.4, 3.2);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // LUXURY STUDIO LIGHTING
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    
    const spotlight = new THREE.SpotLight(0xffffff, 1.5);
    spotlight.position.set(1, 5, 3);
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    scene.add(spotlight);
    
    const fillLight = new THREE.PointLight(0xffffff, 0.8);
    fillLight.position.set(-1, 2, 2);
    scene.add(fillLight);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;
        controls.target.set(0, 1.1, 0);
    }

    // REFLECTIVE MIRROR FLOOR
    const floorGroup = new THREE.Group();
    const floorGeom = new THREE.CircleGeometry(2, 64);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        metalness: 0.9, 
        roughness: 0.1,
        envMapIntensity: 1
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floorGroup.add(floor);

    // Glowing Podium Edge
    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.015, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 1.5 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.01;
    floorGroup.add(rim);
    
    scene.add(floorGroup);

    // ORGANIC HUMAN FALLBACK (Smooth Mannequin)
    const organicMannequin = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ 
        color: 0xdddddd, 
        roughness: 0.2, 
        metalness: 0.1 
    });
    
    // High-segment parts for smoothness
    const createPart = (geom, pos) => {
        const mesh = new THREE.Mesh(geom, skinMat);
        mesh.position.copy(pos);
        organicMannequin.add(mesh);
    };

    // Organic Head
    createPart(new THREE.SphereGeometry(0.12, 32, 32), new THREE.Vector3(0, 1.68, 0));
    
    // Smooth Torso (Capsule-like)
    createPart(new THREE.CylinderGeometry(0.18, 0.15, 0.6, 32), new THREE.Vector3(0, 1.35, 0));
    
    // Smooth Limbs
    const createLimb = (side, y, rot) => {
        const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.7, 32), skinMat);
        limb.position.set(0.2 * side, y, 0);
        limb.rotation.z = rot * side;
        organicMannequin.add(limb);
    };
    createLimb(1, 1.25, 0.1); // Arm R
    createLimb(-1, 1.25, 0.1); // Arm L
    createLimb(0.5, 0.65, 0); // Leg R
    createLimb(-0.5, 0.65, 0); // Leg L

    fallbackModel = organicMannequin;
    scene.add(fallbackModel);
    scene.add(avatarGroup);
    
    // MODEL LOADER
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
        
        // Accurate Scaling
        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.75 / size.y;
        avatarObject.scale.set(scale, scale, scale);
        avatarObject.position.y = 0;
        
        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
            }
        });

        if (fallbackModel) fallbackModel.visible = false;
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(avatarObject);
        console.log("3D Engine: SUCCESS. Realistic Human Mounted.");
        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, undefined, (err) => {
        console.warn("Avatar Load Error. Staying with smooth fallback.");
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
    if (fallbackModel) {
        fallbackModel.traverse(o => { if (o.isMesh && o.material) o.material.color.setHex(color); });
    }
};

window.onOutfitColorChange = function(colorName) {
    const palette = { 'ruby': 0x9B111E, 'emerald': 0x006D5B, 'gold': 0xD4AF37, 'navy': 0x000080, 'azure': 0x007FFF, 'rosegold': 0xE0BFB8 };
    const color = palette[colorName.toLowerCase()] || 0xD4AF37;
    if (avatarObject) {
        avatarObject.traverse(o => {
            if (o.isMesh && (o.name.toLowerCase().includes('top') || o.name.toLowerCase().includes('shirt') || o.name.toLowerCase().includes('bottom') || o.name.toLowerCase().includes('outfit'))) {
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
