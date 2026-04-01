// libaas_ai/engine.js - BULLETPROOF BOUTIQUE ENGINE (v10.0)
// Resolves all black-screen, NaN projection matrix, and invisible sizing bugs.

let scene, camera, renderer, controls, clock;
let avatarObject = null;
let mixer = null; 
let avatarGroup = new THREE.Group();
let fallbackModel = null;
let gltfLoader = null;
let currentSourceIndex = 0;

const modelSources = [
    "assets/models/avatar.glb",        
    "assets/models/scene.gltf",       
    "assets/avatar.glb",              
    "libaas_ai/avatar.glb",           
    "avatar.glb",                      
    "https://models.readyplayer.me/63b36340268427f7f07297d2.glb" 
];

function init() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a); 
    scene.fog = new THREE.Fog(0x0a0a0a, 2, 10);

    let width = container.clientWidth || 300;
    let height = container.clientHeight || 400;
    if (width === 0) width = 300;
    if (height === 0) height = 400;

    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.5); 
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    if(renderer.outputColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if(THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 2, 2);
    scene.add(fillLight);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 0.9, 0); 
        controls.autoRotate = false; 
        controls.maxDistance = 6;
        controls.minDistance = 1.0;
        controls.maxPolarAngle = Math.PI / 2 + 0.1;
    }

    const stage = new THREE.Group();
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 0.05, 32),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 })
    );
    platform.position.y = -0.025;
    platform.receiveShadow = true;
    stage.add(platform);

    const goldTrim = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.02, 16, 64),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8, roughness: 0.2 })
    );
    goldTrim.rotation.x = Math.PI / 2;
    goldTrim.position.y = 0.01;
    stage.add(goldTrim);
    scene.add(stage);

    fallbackModel = createElegantMannequin();
    fallbackModel.visible = false;
    scene.add(fallbackModel);
    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined' || typeof GLTFLoader !== 'undefined') {
        const LoaderClass = typeof THREE.GLTFLoader !== 'undefined' ? THREE.GLTFLoader : GLTFLoader;
        gltfLoader = new LoaderClass();
        bootstrapModel();
    } else {
        reportState("Critical: Loader Missing");
    }
    
    if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(() => onEngineResize());
        resizeObserver.observe(container);
    }
    window.addEventListener('resize', onEngineResize);

    animate();
}

function createElegantMannequin() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.1, roughness: 0.6 });
    
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), mat);
    head.position.set(0, 1.6, 0);
    head.castShadow = true;
    group.add(head);
    
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 16), mat);
    neck.position.set(0, 1.45, 0);
    group.add(neck);

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.5, 32), mat);
    body.position.set(0, 1.15, 0);
    body.castShadow = true;
    group.add(body);

    const leg = new THREE.CylinderGeometry(0.06, 0.04, 0.9, 16);
    const legL = new THREE.Mesh(leg, mat);
    legL.position.set(-0.08, 0.45, 0);
    legL.castShadow = true;
    group.add(legL);

    const legR = new THREE.Mesh(leg, mat);
    legR.position.set(0.08, 0.45, 0);
    legR.castShadow = true;
    group.add(legR);
    
    return group;
}

function bootstrapModel() {
    if (currentSourceIndex >= modelSources.length) {
        if (fallbackModel) fallbackModel.visible = true;
        reportState("");
        return;
    }

    const path = modelSources[currentSourceIndex];
    reportState("Awaiting Fashion...");
    
    gltfLoader.load(path + "?v=" + Date.now(), (gltf) => {
        reportState(""); 
        if (avatarObject) {
            avatarGroup.remove(avatarObject);
        }
        
        avatarObject = gltf.scene;
        
        avatarObject.position.set(0,0,0);
        avatarObject.rotation.set(0,0,0);
        avatarObject.scale.set(1,1,1);
        avatarObject.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        if(size.y < 0.01 || size.y > 1000 || isNaN(size.y)) {
            size.set(1, 1.75, 1);
        }

        if (size.z > size.y * 1.5) {
             avatarObject.rotation.x = -Math.PI / 2;
             avatarObject.updateMatrixWorld(true);
             box.setFromObject(avatarObject);
             box.getSize(size);
             box.getCenter(center);
        }

        const targetHeight = 1.75;
        const scaleFactor = targetHeight / size.y;
        avatarObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
        avatarObject.updateMatrixWorld(true);
        
        const newBox = new THREE.Box3().setFromObject(avatarObject);
        const newCenter = new THREE.Vector3();
        newBox.getCenter(newCenter);
        
        avatarObject.position.x = -newCenter.x;
        avatarObject.position.z = -newCenter.z;
        avatarObject.position.y = -newBox.min.y; 

        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                o.receiveShadow = true;
                if (o.material) {
                    processMaterial(o.material);
                }
            }
        });

        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(avatarObject);
            const action = mixer.clipAction(gltf.animations[0]);
            action.setEffectiveWeight(1.0);
            action.play();
        }

        if (fallbackModel) fallbackModel.visible = false;
        
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(avatarObject);
        
        setTimeout(() => {
            if(window.onComplexionChange) {
                const activeTone = document.querySelector('.complexion-circle.active')?.dataset?.tone || 'fair';
                window.onComplexionChange(activeTone);
            }
            if(window.onOutfitColorChange) {
                const productModal = document.getElementById('product-modal');
                const currentColor = productModal?.getAttribute('data-color') || 'emerald';
                window.onOutfitColorChange(currentColor);
            }
        }, 100);

    }, undefined, () => {
        currentSourceIndex++;
        bootstrapModel();
    });
}

function processMaterial(mat) {
    if (Array.isArray(mat)) {
        mat.forEach(m => processMaterial(m));
        return;
    }
    mat.side = THREE.DoubleSide;
    mat.alphaTest = 0.5; 
    mat.transparent = true;
    mat.depthWrite = true;
    if (mat.map && renderer) mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
}

window.onComplexionChange = (tone) => {
    const skinColors = { 'fair': 0xFAD4B2, 'medium': 0xE6B98D, 'tan': 0xC68E5A, 'deep': 0x8D5524 };
    const color = skinColors[tone] || 0xFAD4B2;
    if(avatarObject) forceColorSync(avatarObject, color, (n) => n.includes('skin') || n.includes('body') || n.includes('head') || n.includes('face') || n.includes('arm') || n.includes('leg'));
    if(fallbackModel) forceColorSync(fallbackModel, color, () => true);
};

window.onOutfitColorChange = (colorName) => {
    const palette = { 'ruby': 0x9B111E, 'emerald': 0x006D5B, 'gold': 0xD4AF37, 'navy': 0x000080, 'azure': 0x007FFF, 'rosegold': 0xE0BFB8 };
    const color = palette[colorName.toLowerCase()] || 0x006D5B;
    if(avatarObject) forceColorSync(avatarObject, color, (n) => n.includes('top') || n.includes('shirt') || n.includes('dress') || n.includes('pant') || n.includes('outfit') || n.includes('cloth') || n.includes('fabric'));
};

function forceColorSync(root, color, filterFn) {
    root.traverse(o => {
        if(o.isMesh && o.material && filterFn(o.name.toLowerCase())) {
            let matArray = Array.isArray(o.material) ? o.material : [o.material];
            matArray.forEach((mat, idx) => {
                if(!mat._cloned) { 
                    matArray[idx] = mat.clone(); 
                    matArray[idx]._cloned = true; 
                }
                if(matArray[idx].color) matArray[idx].color.setHex(color);
            });
            if(Array.isArray(o.material)) o.material = matArray;
            else o.material = matArray[0];
        }
    });
}

function onEngineResize() {
    const container = document.getElementById('canvas-container');
    if(!container || !renderer || !camera) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    if(width === 0 || height === 0) return;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
window.onEngineResize = onEngineResize;

function reportState(txt) {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    let msg = document.getElementById('engine-status-msg');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'engine-status-msg';
        msg.style = "position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);color:#D4AF37;font-size:14px;z-index:999;background:rgba(0,0,0,0.8);padding:15px 30px;border-radius:10px;border:1px solid rgba(212,175,55,0.4);font-family:serif;pointer-events:none;letter-spacing:2px;text-transform:uppercase;";
        container.appendChild(msg);
    }
    if (!txt) { msg.style.display = 'none'; return; }
    msg.style.display = 'block';
    msg.innerText = txt;
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.01;
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    if (renderer && scene && camera) {
        if(renderer.getSize(new THREE.Vector2()).x > 0) renderer.render(scene, camera);
    }
}

if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}

