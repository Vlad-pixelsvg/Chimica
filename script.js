// =========================================================================
// CONFIGURAZIONE SCENA, TELECAMERA E RENDERIZZATORE
// =========================================================================
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10; 

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Gruppo principale per l'interazione con il mouse
const atomGroup = new THREE.Group();
scene.add(atomGroup);

// =========================================================================
// 1. ILLUMINAZIONE (Per il nucleo centrale)
// =========================================================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00f2fe, 2, 5);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// =========================================================================
// 2. IL NUCLEO QUANTISTICO (Compatto al centro)
// =========================================================================
const nucleusGroup = new THREE.Group();
atomGroup.add(nucleusGroup);

const sphereGeo = new THREE.SphereGeometry(0.15, 16, 16);
const protonMat = new THREE.MeshPhongMaterial({ color: 0xff007f, shininess: 80 });
const neutronMat = new THREE.MeshPhongMaterial({ color: 0x3a0ca3, shininess: 80 });

// Un piccolo cluster compatto di 8 particelle
for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(sphereGeo, i % 2 === 0 ? protonMat : neutronMat);
    mesh.position.set(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
    );
    nucleusGroup.add(mesh);
}

// =========================================================================
// 3. NUvOLA DI PROBABILITÀ DI SCHRÖDINGER (Sistema di Particelle)
// =========================================================================
const particleCount = 4000; // Numero di punti nella nuvola elettronico
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const colorCore = new THREE.Color(0x00f2fe); // Cyan brillante al centro
const colorEdge = new THREE.Color(0x7209b7); // Viola scuro all'esterno

for (let i = 0; i < particleCount; i++) {
    // Generazione della nuvola basata su probabilità (Distribuzione sferica / Gaussiana)
    // Usiamo una combinazione trigonometrica casuale tridimensionale
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    
    // Il raggio varia: accumulo probabilistico vicino al centro, ma con sfumature esterne
    // Simula l'equazione d'onda dell'orbitale 1s/2p
    const r = (Math.pow(Math.random(), 2) * 3.5) + (Math.random() * 1.5); 

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Sfumatura di colore: i nodi interni sono più caldi/luminosi, quelli esterni freddi
    const mixRatio = r / 5.0;
    const finalColor = colorCore.clone().lerp(colorEdge, mixRatio);

    colors[i * 3] = finalColor.r;
    colors[i * 3 + 1] = finalColor.g;
    colors[i * 3 + 2] = finalColor.b;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// Materiale per le particelle (Punti sfocati e trasparenti per effetto "nuvola gas")
const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending, // Effetto bagliore quando i punti si sovrappongono
    depthWrite: false
});

const electronCloud = new THREE.Points(geometry, material);
atomGroup.add(electronCloud);

// Sfera di energia sfocata interna per dare densità centrale (Orbitale 1s)
const coreGeo = new THREE.SphereGeometry(1.2, 32, 32);
const coreMat = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
});
const coreCloud = new THREE.Mesh(coreGeo, coreMat);
atomGroup.add(coreCloud);

// =========================================================================
// 4. INTERATTIVITÀ MOUSE (Effetto Parallasse fluida)
// =========================================================================
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// =========================================================================
// 5. LOOP DI ANIMAZIONE (Fluttuazione Quantistica)
// =========================================================================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // 1. Vibrazione infinitesima del nucleo
    nucleusGroup.rotation.x = Math.sin(elapsedTime * 2) * 0.05;
    nucleusGroup.rotation.y = Math.cos(elapsedTime * 1.5) * 0.05;

    // 2. Animazione della nuvola (Simulazione della natura ondulatoria dell'elettrone)
    // Facciamo ruotare i punti su assi diversi a velocità minime per dare vita alla nuvola
    electronCloud.rotation.y = elapsedTime * 0.05;
    electronCloud.rotation.z = Math.sin(elapsedTime * 0.1) * 0.2;

    // Pulsazione energetica della densità centrale (Onda stazionaria)
    const pulse = 1.0 + Math.sin(elapsedTime * 3.0) * 0.04;
    coreCloud.scale.set(pulse, pulse, pulse);

    // 3. Rotazione guidata dal movimento del mouse
    targetX = mouseX * 0.4;
    targetY = mouseY * 0.4;

    atomGroup.rotation.y += (targetX - atomGroup.rotation.y) * 0.05;
    atomGroup.rotation.x += (targetY - atomGroup.rotation.x) * 0.05;

    // Rotazione orbitale di fondo automatica
    atomGroup.rotation.y += 0.001;

    renderer.render(scene, camera);
}

animate();

// =========================================================================
// 6. GESTIONE RESPONSIVE
// =========================================================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

