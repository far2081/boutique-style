// libaas_ai/engine.js - PROFESSIONAL COUTURE ENGINE (v12.0)
// Designed for High-Performance Pakistani Virtual Fit Studio

let scene, camera, renderer, controls, clock;
let avatarObject = null;
let stageObject = null;
let mixer = null; 
let avatarGroup = new THREE.Group();
let gltfLoader = null;
let isInitialized = false;

// THE SOURCES - PROVIDED ASsets
const STAGE_PATH = "assets/models/scene.gltf";
const AVATAR_PATH = "assets/models/avatar.glb";

function init() {
    if (isInitialized) return;
    
    const container = document.getElementById('canvas-container');
    if (!container) return;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); 
    scene.fog = new THREE.Fog(0x0a0a0a, 2, 20);

    let width = container.clientWidth || 300;
    let height = container.clientHeight || 400;

    camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 2000);
    camera.position.set(0, 1.3, 4.5); 
    
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true, 
        preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    if(renderer.outputColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // LIGHTING: Neutral Studio Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);

    scene.add(avatarGroup);

    // CONTROLS
    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 1.0, 0); 
        controls.maxDistance = 10;
        controls.minDistance = 2;
    }

    // LOADER
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        bootstrapStudio();
    } else {
        showError("3D LOADER MISSING");
    }
    
    window.addEventListener('resize', onResize);
    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(onResize);
        ro.observe(container);
    }

    isInitialized = true;
    animate();
}

async function bootstrapStudio() {
    showStatus("PREPARING LUXURY STUDIO...");
    
    try {
        // 1. Load Premium Stage (scene.gltf)
        await new Promise((resolve, reject) => {
            gltfLoader.load(STAGE_PATH, (gltf) => {
                stageObject = gltf.scene;
                // Move stage down slightly to ensure (0,0,0) is floor level
                const box = new THREE.Box3().setFromObject(stageObject);
                stageObject.position.y = -box.min.y;
                stageObject.traverse(n => { if(n.isMesh) n.receiveShadow = true; });
                scene.add(stageObject);
                resolve();
            }, undefined, (e) => {
                 console.warn("Stage Load Issue, using fallback:", e);
                 createFallbackStage();
                 resolve(); // Proceed with avatar anyway
            });
        });

        // 2. Load Avatar (avatar.glb) High Priority
        showStatus("DRAFTING ENSEMBLE...");
        gltfLoader.load(AVATAR_PATH + "?t=" + Date.now(), (gltf) => {
            clearStatus();
            avatarGroup.clear();
            avatarObject = gltf.scene;
            
            // CENTERING & SCALING
            const box = new THREE.Box3().setFromObject(avatarObject);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);

            const targetH = 1.75;
            const currentH = size.y || 1;
            const scale = targetH / currentH;
            avatarObject.scale.set(scale, scale, scale);
            
            box.setFromObject(avatarObject);
            box.getCenter(center);
            
            avatarObject.position.x = -center.x;
            avatarObject.position.z = -center.z;
            avatarObject.position.y = -box.min.y + 0.01; // slightly above floor

            // ANIMATION
            if (gltf.animations && gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(avatarObject);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
            }

            avatarObject.traverse(node => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    if (node.material) {
                        node.material.side = THREE.DoubleSide;
                        node.material.alphaTest = 0.5;
                        node.material.depthWrite = true;
                    }
                }
            });

            avatarGroup.add(avatarObject);
            syncInitialStates();

        }, undefined, (e) => showError("UNABLE TO LOAD AVATAR"));

    } catch (err) {
        showError("STUDIO INITIALIZATION FAILED");
    }
}

function createFallbackStage() {
    const floor = new THREE.Mesh(
        new THREE.CircleGeometry(5, 32),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
}

function syncInitialStates() {
    setTimeout(() => {
        const activeTone = document.querySelector('.complexion-circle.active')?.dataset?.tone || 'fair';
        updateComplexion(activeTone);
        const productModal = document.getElementById('product-modal');
        const currentColor = productModal?.getAttribute('data-color') || 'emerald';
        updateOutfitColor(currentColor);
        onResize();
    }, 200);
}

function updateComplexion(tone) {
    const tones = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = tones[tone] || 0xFAD4B2;
    if (avatarObject) syncColor(avatarObject, color, ['skin', 'body', 'face', 'head', 'arm', 'leg', 'hand']);
}

function updateOutfitColor(colorName) {
    const palette = { 'ruby': 0x9B111E, 'emerald': 0x006D5B, 'gold': 0xD4AF37, 'navy': 0x000080, 'azure': 0x007FFF, 'rosegold': 0xE0BFB8 };
    const color = palette[colorName.toLowerCase()] || 0x006D5B;
    if (avatarObject) syncColor(avatarObject, color, ['top', 'shirt', 'dress', 'pant', 'fabric', 'cloth', 'outfit', 'ensemble']);
}

function syncColor(root, color, keywords) {
    root.traverse(o => {
        if (o.isMesh && o.material) {
            const name = o.name.toLowerCase();
            const matches = keywords.some(k => name.includes(k));
            if (matches) {
                let mats = Array.isArray(o.material) ? o.material : [o.material];
                mats.forEach(m => { if (m.color) m.color.setHex(color); });
            }
        }
    });
}

function onResize() {
    const container = document.getElementById('canvas-container');
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function showStatus(msg) {
    let div = document.getElementById('engine-loader-notice');
    if (!div) {
        div = document.createElement('div');
        div.id = 'engine-loader-notice';
        div.style = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#D4AF37;background:rgba(0,0,0,0.85);padding:30px;border:1px solid #D4AF37;border-radius:15px;font-family:'Playfair Display',serif;letter-spacing:3px;z-index:2000;text-transform:uppercase;font-size:12px;text-align:center;box-shadow:0 0 30px rgba(0,0,0,0.5);";
        document.getElementById('canvas-container').appendChild(div);
    }
    div.innerText = msg;
    div.style.display = 'block';
}

function clearStatus() {
    const div = document.getElementById('engine-loader-notice');
    if (div) div.style.display = 'none';
}

function showError(msg) {
    showStatus("ERROR: " + msg);
}

window.onComplexionChange = updateComplexion;
window.onOutfitColorChange = updateOutfitColor;
window.onEngineResize = onResize;

if (document.readyState === 'complete') init();
else window.addEventListener('load', init);

