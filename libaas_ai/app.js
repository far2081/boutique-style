console.log("Initializing Libaas AI - Advanced 3D Draping Engine");

let isAutoRotate = false;

// 1. Scene & Environment Setup
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 1.2, 4.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.8, 0);

// Lighting suitable for Reflections
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
mainLight.position.set(3, 8, 5);
scene.add(mainLight);

// 2. Parent-Child Draping System
const avatarRoot = new THREE.Group(); // Master Container
scene.add(avatarRoot);

// Base Humanoid
const skinMat = new THREE.MeshStandardMaterial({ color: 0xE6B98D, roughness: 0.4 });
const bodyGeo = new THREE.CylinderGeometry(0.3, 0.25, 1.3, 32);
const headGeo = new THREE.SphereGeometry(0.2, 32, 32);

const baseBody = new THREE.Mesh(bodyGeo, skinMat);
baseBody.position.y = 0.65;
const baseHead = new THREE.Mesh(headGeo, skinMat);
baseHead.position.y = 1.5;

avatarRoot.add(baseBody, baseHead);

// Secondary Dress Overlay Mesh (Slightly thicker to avoid Z-Fighting/Clipping)
const dressGeo = new THREE.CylinderGeometry(0.32, 0.35, 1.23, 32); 
const dressMat = new THREE.MeshStandardMaterial({ 
    color: 0x121212, roughness: 0.5, transparent: true, opacity: 0 
});
const dressMesh = new THREE.Mesh(dressGeo, dressMat);
dressMesh.position.y = 0.65;
avatarRoot.add(dressMesh); // CRITICAL: Adding as a child guarantees it scales precisely with the body

// 3. Mathematical Proportion Engine
function scaleAvatar() {
    let h = parseFloat($('#height-val').val()) || 170;
    let w = parseFloat($('#weight-val').val()) || 65;
    
    // Normalize logic
    const scaleY = h / 170;
    const scaleXZ = w / 65;
    
    // Scale the entire group meaning the dress and body scale together flawlessly!
    avatarRoot.scale.set(scaleXZ, scaleY, scaleXZ);
    
    // Keep the head perfectly spherical despite group X/Z manipulation
    baseHead.scale.set(1/scaleXZ, 1/scaleY, 1/scaleXZ);
    baseHead.position.y = 1.5; 
}

$('#height-val, #weight-val').on('input', scaleAvatar);

// 4. Garment Selection
const customDresses = {
    'silk_emerald': { color: 0x50C878, rough: 0.1 }, // Shiny
    'chiffon_ruby': { color: 0xE0115F, rough: 0.9 }, // Matte
    'cotton_gold':  { color: 0xD4AF37, rough: 0.6 }
};

$('.color-item').on('click', function() {
    $('.color-item').removeClass('active');
    $(this).addClass('active');
    
    const style = customDresses[$(this).data('dress')];
    dressMat.opacity = 1; 
    dressMat.color.setHex(style.color);
    dressMat.roughness = style.rough;
});

// 5. Face-Swap Live Streaming Texture Matrix
let videoTexture = null;
$('#btn-live').on('click', async function() {
    $('.mode-btn').removeClass('active');
    $(this).addClass('active');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.getElementById('webcam-video');
        video.srcObject = stream;
        video.play();
        
        videoTexture = new THREE.VideoTexture(video);
        baseHead.material = new THREE.MeshBasicMaterial({ map: videoTexture });
        
        $('#cam-preview').html('<i class="fa-solid fa-video" style="color:#D4AF37"></i><span style="color:#D4AF37">Syncing Face Map...</span>');
    } catch(err) {
        alert("Camera permission is required for the Live AI Mirror layer.");
        $('#btn-standard').click();
    }
});

$('#btn-standard').on('click', function() {
    $('.mode-btn').removeClass('active');
    $(this).addClass('active');
    
    const video = document.getElementById('webcam-video');
    if(video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
    
    baseHead.material = skinMat;
    $('#cam-preview').html('<i class="fa-solid fa-camera"></i><span>Face Match Off</span>');
});

// 6. Controller Bindings
$('#reset-cam').click(() => { camera.position.set(0,1.2,4.5); controls.target.set(0,0.8,0); isAutoRotate=false; controls.autoRotate=false; $('#auto-rotate').css('color','#fff'); });
$('#zoom-in').click(() => { camera.position.z -= 0.5; });
$('#zoom-out').click(() => { camera.position.z += 0.5; });
$('#auto-rotate').click(function() {
    isAutoRotate = !isAutoRotate;
    controls.autoRotate = isAutoRotate;
    $(this).css('color', isAutoRotate ? '#D4AF37' : '#fff');
});

// 7. Base Render Engine
window.addEventListener('resize', () => {
    if(!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// 8. Backend Syncing Bridge Mock
$('#order-look, #ai-choose').click(function() {
    const btn = $(this);
    const origText = btn.text();
    btn.text('Securing Look...').css('opacity', 0.5);
    
    setTimeout(() => {
        btn.text('Processed!').css({'background': '#D4AF37', 'color': '#000', 'border-color': '#D4AF37', 'opacity': 1});
        setTimeout(() => btn.text(origText).css({'background':'','color':'','border-color':''}), 2500);
    }, 1200);
});
