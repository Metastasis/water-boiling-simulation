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
const potMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.2,
  roughness: 0.1,
  metalness: 0.1,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  // refractionRatio: 0.98, // Removed this line
  side: THREE.DoubleSide,
});
const pot = new THREE.Mesh(potGeometry, potMaterial);
pot.position.y = 2.5;
scene.add(pot);

// Water Surface
const waterGeometry = new THREE.CircleGeometry(2.9, 32);
const waterMaterial = new THREE.MeshPhongMaterial({
  color: 0x0077be,
  transparent: true,
  opacity: 0.8,
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = 0.1;
scene.add(water);

// Boiling Effect - Particle System
let bubbleCount = 200;
const bubbleGeometry = new THREE.BufferGeometry();
const bubblePositions = new Float32Array(bubbleCount * 3);
let bubbleSpeeds = [];

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

let bubbles = new THREE.Points(bubbleGeometry, bubbleMaterial);
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

// Physics Parameters
let temperature = 25; // Initial temperature in Celsius
let mass = 5; // Initial mass in kilograms

// Constants
const BOILING_POINT = 100; // Boiling point of water in Celsius
const HEAT_ADDITION_RATE = 0.1; // Degrees Celsius per frame
const COOLING_RATE = 0.05; // Degrees Celsius per frame
const MASS_LOSS_RATE = 0.001; // Kilograms per frame when boiling

// Create HTML elements to display physics data
const infoDiv = document.createElement('div');
infoDiv.style.position = 'absolute';
infoDiv.style.top = '10px';
infoDiv.style.left = '10px';
infoDiv.style.color = '#000';
infoDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
infoDiv.style.padding = '10px';
infoDiv.style.borderRadius = '4px';
infoDiv.style.fontFamily = 'Arial, sans-serif';
infoDiv.innerHTML = `<strong>Temperature:</strong> ${temperature.toFixed(1)} °C<br><strong>Mass:</strong> ${mass.toFixed(2)} kg`;
document.body.appendChild(infoDiv);

// Function to update physics state
function updatePhysics() {
  // Simulate heating
  if (temperature < BOILING_POINT) {
    temperature += HEAT_ADDITION_RATE;
  } else {
    // At boiling point, simulate mass loss due to evaporation
    mass -= MASS_LOSS_RATE;
    if (mass < 0) mass = 0;
  }

  // Simulate cooling when temperature is above ambient
  if (temperature > 25 && mass > 0) {
    temperature -= COOLING_RATE;
  }

  // Update Water Level based on mass
  const maxMass = 5; // Define the maximum mass corresponding to full water level
  const minMass = 0; // Minimum mass corresponds to no water
  const normalizedMass = (mass - minMass) / (maxMass - minMass); // Normalize mass between 0 and 1
  const minScale = 0.1; // Minimum scale to ensure water plane is visible when nearly empty
  const newScaleY = THREE.MathUtils.lerp(minScale, 1, normalizedMass);
  water.scale.setScalar(newScaleY);

  // Adjust water position based on mass
  const maxHeight = 4.9; // Just below the top of the pot
  const minHeight = 0.1; // Bottom of the pot
  const newPositionY = THREE.MathUtils.lerp(minHeight, maxHeight, normalizedMass);
  water.position.y = newPositionY;
}

// Adjust particle systems based on temperature
function adjustParticleSystems() {
  // Example: Scale bubble count with temperature
  const maxBubbles = 500;
  const currentBubbles = Math.max(
    1, // Ensure at least one bubble
    Math.min(Math.floor((temperature / BOILING_POINT) * maxBubbles), maxBubbles)
  );
  
  // Update bubble system
  updateBubbleCount(currentBubbles);

  // Scale steam opacity with temperature
  const steamOpacity = Math.min(temperature / BOILING_POINT, 1.0);
  steam.material.opacity = 0.5 + 0.5 * steamOpacity;
}

// Function to update bubble count
function updateBubbleCount(newCount) {
  if (newCount === bubbleCount) return; // No change needed

  // Dispose of existing bubble geometry and material
  bubbles.geometry.dispose();
  bubbles.material.dispose();
  scene.remove(bubbles);

  // Reinitialize bubbleSpeeds
  bubbleSpeeds = [];

  // Create new bubble system with updated count
  const bubbleGeometry = new THREE.BufferGeometry();
  const bubblePositions = new Float32Array(newCount * 3);

  for (let i = 0; i < newCount; i++) {
    bubblePositions[i * 3] = (Math.random() - 0.5) * 5;
    bubblePositions[i * 3 + 1] = Math.random() * 0.1;
    bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 5;

    // Populate the global bubbleSpeeds array
    bubbleSpeeds.push(0.02 + Math.random() * 0.02);
  }

  bubbleGeometry.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));

  const bubbleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8,
  });

  bubbles = new THREE.Points(bubbleGeometry, bubbleMaterial);
  scene.add(bubbles);
  bubbleCount = newCount;
}

function animate() {
  requestAnimationFrame(animate);

  // Update Physics
  updatePhysics();

  // Adjust visual effects based on physics
  adjustParticleSystems();

  // Update infoDiv content
  infoDiv.innerHTML = `<strong>Temperature:</strong> ${temperature.toFixed(1)} °C<br><strong>Mass:</strong> ${mass.toFixed(2)} kg`;

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
    // Safety check to prevent NaN
    if (typeof bubbleSpeeds[i] === 'number' && !isNaN(bubbleSpeeds[i])) {
      positions[i * 3 + 1] += bubbleSpeeds[i];
    } else {
      // Assign a default speed if undefined
      bubbleSpeeds[i] = 0.02;
      positions[i * 3 + 1] += bubbleSpeeds[i];
    }

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
