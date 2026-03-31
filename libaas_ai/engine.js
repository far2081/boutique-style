
// libaas_ai/engine.js - Professional 3D Virtual Try-On Engine (v5.0 Compatibility Version)
// Optimized for Pakistani Luxury Couture & THREE.js r128 Stability

let scene, camera, renderer, controls, clock;
let avatarObject = null;
let mixer = null; 
let avatarGroup = new THREE.Group();
let fallbackModel;
let gltfLoader = null;

// Multi-path scanning specifically for Pakistani Model
const modelSources = [
    "./assets/models/scene.gltf",
    "assets/models/scene.gltf",
    "scene.gltf",
    "https://models.readyplayer.me/63b36340268427f7f07297d2.glb" 
];
let currentSourceIndex = 0;

function init() {
    console.log("3D Engine v5: Initializing Stable Environment...");
    const container = document.getElementById('canvas-container');
    if (!container) return;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); 

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.4, 4.0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    
    // r128 Color Configuration
    if(THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // STAGE LIGHTS
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const kL = new THREE.DirectionalLight(0xffffff, 1.2);
    kL.position.set(2, 5, 2);
    scene.add(kL);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 1.1, 0);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.6;
    }

    // SIMPLE PLATFORM
    const floor = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.6, 0.05, 32),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 })
    );
    floor.position.y = -0.025;
    scene.add(floor);

    // LUXURY FALLBACK SILHOUETTE (If load fails)
    const silhouette = new THREE.Group();
    const sMat = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.5 });
    const addPart = (g, y, s = [1,1,1]) => {
        const m = new THREE.Mesh(g, sMat);
        m.position.y = y;
        m.scale.set(...s);
        silhouette.add(m);
    };
    addPart(new THREE.SphereGeometry(0.12, 16), 1.7);
    addPart(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16), 1.4);
    addPart(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 16), 0.5, [1,1,1]);
    
    fallbackModel = silhouette;
    fallbackModel.visible = false;
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined' || typeof GLTFLoader !== 'undefined') {
        gltfLoader = new (THREE.GLTFLoader || GLTFLoader)();
        tryLoad();
    } else {
        console.error("GLTFLoader NOT FOUND");
        fallbackModel.visible = true;
    }
    
    window.addEventListener('resize', onResize);
    animate();
}

function tryLoad() {
    if (currentSourceIndex >= modelSources.length) {
        if (fallbackModel) fallbackModel.visible = true;
        return;
    }

    const p = modelSources[currentSourceIndex];
    console.log("3D Engine v5: Loading -> " + p);
    
    gltfLoader.load(p, (gltf) => {
        console.log("3D Engine v5: SUCCESS.");
        avatarObject = gltf.scene;
        
        // ANIMATIONS
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(avatarObject);
            mixer.clipAction(gltf.animations[0]).play();
        }

        // SCALING & POSITIONING
        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = box.getSize(new THREE.Vector3());
        
        // Z-up Correction
        if (size.z > size.y * 1.5) {
             avatarObject.rotation.x = -Math.PI / 2;
             box.setFromObject(avatarObject);
             box.getSize(size);
        }

        const scale = 1.78 / size.y;
        avatarObject.scale.set(scale, scale, scale);
        avatarObject.position.y = - (box.min.y * scale);
        avatarObject.position.x = 0;
        avatarObject.position.z = 0;

        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                if (o.material) {
                    o.material.side = THREE.DoubleSide;
                    if (o.material.map) o.material.map.anisotropy = 16;
                }
            }
        });

        if (fallbackModel) fallbackModel.visible = false;
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(avatarObject);
        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, 
    undefined, 
    (err) => {
        console.warn("Load failed for path: " + p);
        currentSourceIndex++;
        tryLoad();
    });
}

window.onComplexionChange = function(tone) {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    if (avatarObject) {
        avatarObject.traverse(o => {
            const n = o.name.toLowerCase();
            if (o.isMesh && (n.includes('skin') || n.includes('body') || n.includes('head') || n.includes('arm') || n.includes('leg'))) {
                if(o.material) {
                    const m = Array.isArray(o.material) ? o.material[0] : o.material;
                    if(!m._cloned) { o.material = m.clone(); o.material._cloned = true; }
                    o.material.color.setHex(color);
                }
            }
        });
    }
};

window.onOutfitColorChange = function(colorName) {
    const palette = { 'ruby': 0x9B111E, 'emerald': 0x013220, 'gold': 0xD4AF37, 'navy': 0x000030, 'azure': 0x007FFF, 'rosegold': 0xB76E79 };
    const color = palette[colorName.toLowerCase()] || 0xD4AF37;
    if (avatarObject) {
        avatarObject.traverse(o => {
            const n = o.name.toLowerCase();
            const isClothing = n.includes('top') || n.includes('shirt') || n.includes('dress') || n.includes('pant') || n.includes('outfit') || n.includes('clothes');
            if (o.isMesh && isClothing) {
                if(o.material) {
                    const m = Array.isArray(o.material) ? o.material[0] : o.material;
                    if(!m._cloned) { o.material = m.clone(); o.material._cloned = true; }
                    o.material.color.setHex(color);
                }
            }
        });
    }
};

function onResize() {
    const container = document.getElementById('canvas-container');
    if(!container || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.01;
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

init();
