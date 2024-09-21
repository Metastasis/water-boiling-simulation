import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';


// Scene, Camera, Renderer Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

const camera = new THREE.PerspectiveCamera(
  45, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 2.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Water Container (Pot)
const potGeometry = new THREE.CylinderGeometry(3, 3, 5, 32, 1, true);
const potMaterial = new THREE.MeshPhongMaterial({
  color: 0xaaaaaa,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.5,
});
const pot = new THREE.Mesh(potGeometry, potMaterial);
pot.position.y = 2.5;
scene.add(pot);

// Water Surface
const waterGeometry = new THREE.CircleGeometry(3, 32);
const waterMaterial = new THREE.MeshPhongMaterial({
  color: 0x1e90ff,
  transparent: true,
  opacity: 0.8,
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = 0.1;
scene.add(water);

// Boiling Effect - Particle System
const bubbleCount = 200;
const bubbleGeometry = new THREE.BufferGeometry();
const bubblePositions = new Float32Array(bubbleCount * 3);
const bubbleSpeeds = [];

for (let i = 0; i < bubbleCount; i++) {
  bubblePositions[i * 3] = (Math.random() - 0.5) * 5;
  bubblePositions[i * 3 + 1] = Math.random() * 0.1;
  bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 5;

  bubbleSpeeds.push(0.02 + Math.random() * 0.02);
}

bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));

const bubbleMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.1,
  transparent: true,
  opacity: 0.8,
});

const bubbles = new THREE.Points(bubbleGeometry, bubbleMaterial);
scene.add(bubbles);

// Steam Particle System
const steamCount = 100;
const steamGeometry = new THREE.BufferGeometry();
const steamPositions = new Float32Array(steamCount * 3);
const steamSpeeds = [];

for (let i = 0; i < steamCount; i++) {
  steamPositions[i * 3] = (Math.random() - 0.5) * 2;
  steamPositions[i * 3 + 1] = 5 + Math.random() * 0.5;
  steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 2;

  steamSpeeds.push(0.01 + Math.random() * 0.01);
}

steamGeometry.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));

const steamMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.2,
  transparent: true,
  opacity: 0.5,
});

const steam = new THREE.Points(steamGeometry, steamMaterial);
scene.add(steam);

// Update Steam in Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Update Steam
  const steamPos = steam.geometry.attributes.position.array;
  for (let i = 0; i < steamCount; i++) {
    steamPos[i * 3 + 1] += steamSpeeds[i];

    if (steamPos[i * 3 + 1] > 10) {
      steamPos[i * 3] = (Math.random() - 0.5) * 2;
      steamPos[i * 3 + 1] = 5;
      steamPos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
  }
  steam.geometry.attributes.position.needsUpdate = true;

  // Update Bubbles
  const positions = bubbles.geometry.attributes.position.array;
  for (let i = 0; i < bubbleCount; i++) {
    positions[i * 3 + 1] += bubbleSpeeds[i];

    if (positions[i * 3 + 1] > 4.9) {
      positions[i * 3] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 1] = 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
  }
  bubbles.geometry.attributes.position.needsUpdate = true;

  controls.update();
  renderer.render(scene, camera);
}

animate();

// Handle Window Resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
