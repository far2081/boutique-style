
// libaas_ai/engine.js - Virtual Try-On 3D Engine
// Final Production Version for GitHub/Vercel
// Optimized for Mobile Responsiveness & Touch Controls

let scene, camera, renderer, controls;
let avatarObject = null;
let profileHeight = 170;
let profileWeight = 65;

let gltfLoader = null;
const avatarPath = 'assets/models/avatar.glb'; // Path Verification
const avatarGroup = new THREE.Group();
let fallbackModel; 

function getResponsiveScale() {
  return window.innerWidth < 768 ? 0.5 : 1.0; // Scaled up per user request for full presence
}

function init() {
    console.log("3D Engine: Initializing Studio...");
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error("3D Engine Error: 'canvas-container' element not found!");
        return;
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0b); 

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
 camera.position.set(0, 1.0, 4.5);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.domElement.style.touchAction = 'none'; // Touch Control Optimization
    
    if(THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    container.innerHTML = ''; 
    container.appendChild(renderer.domElement);
    
    // Luxury High-Contrast Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(5, 12, 8);
    scene.add(keyLight);
    
    const backFill = new THREE.PointLight(0xffffff, 1.5);
    backFill.position.set(-5, 5, 5);
    scene.add(backFill);

    const rimLight = new THREE.DirectionalLight(0xD4AF37, 1.2);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    const studioFocus = new THREE.SpotLight(0xffffff, 2.0);
    studioFocus.position.set(0, 10, 2);
    studioFocus.target.position.set(0, 1.5, 0);
    scene.add(studioFocus);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.6, 0); 
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.enableZoom = true;

    
    
    // Studio Platform (More Visible)
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.7, 0.2, 64),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 })
    );
    platform.position.y = -0.1;
    scene.add(platform);

    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.5, 0.05, 16, 100),
        new THREE.MeshStandardMaterial({ color: 0xD4AF37, emissive: 0xD4AF37, emissiveIntensity: 0.5, metalness: 1, roughness: 0.1 })
    );
    rim.rotation.x = Math.PI/2;
    rim.position.y = 0.05;
    scene.add(rim);
    
    // Fallback Mockup (White Cylinder for verification)
    const mockGeo = new THREE.CylinderGeometry(0.5, 0.5, 3.5, 32);
    const mockMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    fallbackModel = new THREE.Mesh(mockGeo, mockMat);
    fallbackModel.position.set(0, 1.75, 0); 
    fallbackModel.visible = false;
    scene.add(fallbackModel);

    scene.add(avatarGroup);
    
    if (typeof THREE.GLTFLoader !== 'undefined') {
        gltfLoader = new THREE.GLTFLoader();
        loadBaseAvatar();
    } else {
        console.error("3D Engine CRITICAL ERROR: GLTFLoader MISSING IN HTML!");
        if (fallbackModel) fallbackModel.visible = true; // Show fallback if loader is gone
    }
    
    window.addEventListener('resize', onEngineResize);
    animate();
}

function loadBaseAvatar() {
    if (!gltfLoader) return;
    
    console.log("3D Engine: Attempting standard load from", avatarPath);
    
    gltfLoader.load(avatarPath, (gltf) => {
        avatarObject = gltf.scene;
   
  
// Force Center and Scale
avatarObject.traverse(child => {
    if (child.isMesh) {
        child.geometry.center(); 
        child.geometry.scale(0.015, 0.015, 0.015); // Thora aur chota kiya
    }
});
// Model ko Stage ke ooper aur seedha khara karein
avatarObject.position.set(0, 1.3, 0);
avatarObject.rotation.x = 0; 
if (fallbackModel) fallbackModel.visible = false;
avatarGroup.add(avatarObject);
        console.log("3D Engine SUCCESS: Avatar Model Object Injected.");
        
        if(window.onComplexionChange) window.onComplexionChange('fair');
      // updateBody(profileHeight, profileWeight);
    }, 
    (xhr) => {
        if(xhr.total > 0) console.log("Asset Progress: " + Math.round(xhr.loaded / xhr.total * 100) + "%");
    }, 
    (err) => {
        console.error("3D Engine LOADING ERROR: Path is likely incorrect or file missing.", err);
        console.warn("Target Path was: " + avatarPath);
        
        // Show Fallback Pillar to prove engine is ALIVE
        if (fallbackModel) {
            fallbackModel.visible = true;
            console.log("3D Engine: Standing by with White Fallback Cylinder.");
        }
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
                        if (m.map) m.map = null; // Ensure skin color applies over textures
                    });
                }
            }
        });
    }
};

// window.onComplexionChange re-definition removed to avoid infinite recursion/errors
// window.onEngineResize re-definition removed as it is handled below or by assignments

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
                        if (m.map) m.map = null; // High contrast for virtual fitting
                    });
                }
            }
        });
    }
}

function onEngineResize() {
    const container = document.getElementById('canvas-container');
    if(!container || !renderer) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return; // Prevent NaN errors
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    // Dynamic Rescale on Window Resize
    if (avatarObject) {
        const fitScale = getResponsiveScale();
        avatarObject.scale.set(fitScale, fitScale, fitScale);
    }
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

// Robust initialization sequence
function bootEngine() {
    console.log("3D Engine Booting...");
    init();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootEngine();
} else if (typeof $ !== 'undefined') {
    $(document).ready(bootEngine);
} else {
    document.addEventListener('DOMContentLoaded', bootEngine);
}
