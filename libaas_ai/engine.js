
// libaas_ai/engine.js - EMERGENCY DIAGNOSTIC ENGINE (v7.0)
// Designed to pinpoint why the model is not loading & display errors on screen

let scene, camera, renderer, controls, clock;
let avatarObject = null;
let mixer = null; 
let avatarGroup = new THREE.Group();
let fallbackModel;
let gltfLoader = null;

// The scanning matrix (All possible ways to find your Pakistani model)
const modelSources = [
    "assets/models/scene.gltf",
    "./assets/models/scene.gltf",
    "/assets/models/scene.gltf",
    "libaas_ai/scene.gltf",
    "scene.gltf",
    "avatar.glb",
    "https://models.readyplayer.me/63b36340268427f7f07297d2.glb"
];
let currentSourceIndex = 0;

function init() {
    console.log("3D Engine v7.0: Starting Diagnostic Boot...");
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
    
    if(THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // LIGHTS
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const l = new THREE.DirectionalLight(0xffffff, 1.2);
    l.position.set(2, 5, 2);
    scene.add(l);

    if (typeof THREE.OrbitControls !== 'undefined') {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.target.set(0, 1.1, 0);
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
    }

    // LUXURY STAGE
    const stage = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.6, 0.05, 32),
        new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 })
    );
    stage.position.y = -0.025;
    scene.add(stage);

    // HQ MANNEQUIN FALLBACK
    const mannequin = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
    const addM = (g, y) => {
        const m = new THREE.Mesh(g, mat); m.position.y = y; mannequin.add(m);
    };
    addM(new THREE.SphereGeometry(0.12, 16), 1.7);
    addM(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16), 1.4);
    addM(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 16), 0.5);
    
    fallbackModel = mannequin;
    fallbackModel.visible = false;
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined' || typeof GLTFLoader !== 'undefined') {
        gltfLoader = new (THREE.GLTFLoader || GLTFLoader)();
        bootstrapModelAsync();
    } else {
        reportError("CRITICAL: GLTFLoader Script MISSING in HTML!");
    }
    
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
    animate();
}

function bootstrapModelAsync() {
    if (currentSourceIndex >= modelSources.length) {
        reportError("FAIL: All files missing. Model NOT found in repository.");
        if (fallbackModel) fallbackModel.visible = true;
        return;
    }

    const path = modelSources[currentSourceIndex];
    console.log("Investigating Path: " + path);
    
    // On-screen feedback for the user
    showStatus("Checking: " + path + "...");
    
    gltfLoader.load(path, (gltf) => {
        hideStatus();
        console.log("SUCCESS: " + path);
        avatarObject = gltf.scene;
        
        // Animations
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(avatarObject);
            mixer.clipAction(gltf.animations[0]).play();
        }

        // Correction Logic
        const box = new THREE.Box3().setFromObject(avatarObject);
        const size = box.getSize(new THREE.Vector3());
        
        if (size.z > size.y * 1.5) {
             avatarObject.rotation.x = -Math.PI / 2;
             box.setFromObject(avatarObject);
             box.getSize(size);
        }

        const scale = 1.8 / size.y;
        avatarObject.scale.set(scale, scale, scale);
        avatarObject.position.y = - (box.min.y * scale);
        avatarObject.position.x = 0; avatarObject.position.z = 0;

        avatarObject.traverse(o => {
            if (o.isMesh) {
                o.castShadow = true;
                if (o.material) o.material.side = THREE.DoubleSide;
            }
        });

        if (fallbackModel) fallbackModel.visible = false;
        while(avatarGroup.children.length > 0) avatarGroup.remove(avatarGroup.children[0]);
        avatarGroup.add(avatarObject);
        if(window.onComplexionChange) window.onComplexionChange('fair');
    }, 
    (xhr) => {
        if(xhr.lengthComputable) showStatus("Loading: " + Math.round(xhr.loaded/xhr.total*100) + "%");
    }, 
    (err) => {
        console.warn("Missing: " + path);
        currentSourceIndex++;
        bootstrapModelAsync();
    });
}

function showStatus(txt) {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    let msg = document.getElementById('engine-status-msg');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'engine-status-msg';
        msg.style = "position:absolute;bottom:10px;left:10px;color:#D4AF37;font-size:11px;z-index:999;background:rgba(0,0,0,0.5);padding:2px 5px;";
        container.appendChild(msg);
    }
    msg.innerText = txt;
}

function hideStatus() {
    const msg = document.getElementById('engine-status-msg');
    if (msg) msg.remove();
}

function reportError(txt) {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    const err = document.createElement('div');
    err.style = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:red;font-weight:bold;font-size:12px;text-align:center;width:80%;";
    err.innerHTML = txt + "<br><small style='color:white;font-weight:normal;'>Push files to GitHub & Press Ctrl+F5</small>";
    container.appendChild(err);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock ? clock.getDelta() : 0.01;
    if (mixer) mixer.update(delta);
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

init();
