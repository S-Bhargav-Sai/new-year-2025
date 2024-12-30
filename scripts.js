import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('fireworksCanvas'), antialias: true });

// Setup
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
camera.position.z = 50;

// Rocket class
class Rocket {
    constructor(startPosition) {
        const geometry = new THREE.ConeGeometry(0.5, 2, 32);
        const colors = [0xffff00, 0xff4400, 0x00ff44, 0x4400ff, 0xff0088];
        const rocketColor = colors[Math.floor(Math.random() * colors.length)];
        
        const material = new THREE.MeshPhongMaterial({ 
            color: rocketColor,
            emissive: rocketColor,
            shininess: 100 
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(startPosition);
        
        // Add random velocity variations
        const angle = (Math.random() - 0.5) * 0.3; // Slight angle variation
        this.velocity = new THREE.Vector3(
            Math.sin(angle) * 2,
            2 + Math.random(), // Random speed variation
            0
        );
        this.particles = [];
        this.trailParticles = [];
        scene.add(this.mesh);
    }

    update() {
        this.mesh.position.add(this.velocity);
        this.addTrailParticle();
        this.updateTrail();
        return this.mesh.position.y < 40; // Return false when rocket should explode
    }

    addTrailParticle() {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({ 
                color: 0xff4400,
                transparent: true,
                opacity: 1 
            })
        );
        particle.position.copy(this.mesh.position);
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        particle.userData.age = 0;
        this.trailParticles.push(particle);
        scene.add(particle);
    }

    updateTrail() {
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const particle = this.trailParticles[i];
            particle.userData.age += 0.016;
            particle.position.add(particle.userData.velocity);
            particle.material.opacity = 1 - particle.userData.age;

            if (particle.userData.age >= 1) {
                scene.remove(particle);
                this.trailParticles.splice(i, 1);
            }
        }
    }

    explode() {
        const particleCount = 100;
        const colors = [0xff4444, 0xffd700, 0x44ff44, 0x44ffff, 0xff69b4];
        const color = colors[Math.floor(Math.random() * colors.length)];

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 8, 8),
                new THREE.MeshPhongMaterial({ 
                    color: color,
                    emissive: color,
                    transparent: true,
                    opacity: 1 
                })
            );
            
            particle.position.copy(this.mesh.position);
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            particle.userData.velocity = velocity;
            particle.userData.age = 0;
            this.particles.push(particle);
            scene.add(particle);
        }

        scene.remove(this.mesh);
        return this.particles;
    }
}

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(ambientLight);
scene.add(pointLight);

// State
let rockets = [];
let fireworkParticles = [];
const warmWishElement = document.querySelector('.warm-wish');
let hasLaunched = false;

// Add these functions after your existing state variables

function createTapHint() {
    const hint = document.createElement('div');
    hint.className = 'tap-hint';
    hint.textContent = 'TAP';
    document.body.appendChild(hint);
    return hint;
}

function updateTapHintPosition(hint) {
    // Keep message within safe margins (10% from edges)
    const marginX = window.innerWidth * 0.1;
    const marginY = window.innerHeight * 0.1;
    
    const x = marginX + Math.random() * (window.innerWidth - 2 * marginX);
    const y = marginY + Math.random() * (window.innerHeight - 2 * marginY);
    
    hint.style.left = `${x}px`;
    hint.style.top = `${y}px`;
}

// Add this to your initialization code (after state variables)
const tapHint = createTapHint();
let lastHintUpdate = 0;

// Event Listeners
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.addEventListener('click', (event) => {
    const baseX = (event.clientX / window.innerWidth) * 2 - 1;
    const baseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Launch 5-8 rockets in a burst pattern
    const numRockets = Math.floor(Math.random() * 4) + 5;
    
    for (let i = 0; i < numRockets; i++) {
        // Add slight random variation to the click position
        const offsetX = baseX + (Math.random() - 0.5) * 0.4;
        const offsetY = baseY + (Math.random() - 0.5) * 0.4;
        
        const startPosition = new THREE.Vector3(
            offsetX * 40,
            -20,
            (Math.random() - 0.5) * 10 // Random depth
        );
        
        // Add slight delay between rocket launches
        setTimeout(() => {
            rockets.push(new Rocket(startPosition));
        }, i * 100); // 100ms delay between each rocket
    }

    // Hide tap hint immediately on first click
    if (!hasLaunched) {
        tapHint.style.display = 'none';
        
        // Show warm wish after first click
        hasLaunched = true;
        setTimeout(() => {
            warmWishElement.classList.add('visible');
        }, 1000);
    }
});

// Helper function to create random fireworks
function createRandomFireworks(count) {
    for (let i = 0; i < count; i++) {
        const randomX = (Math.random() * 2 - 1) * 40; // Random x position between -40 and 40
        const randomY = 20 + Math.random() * 20; // Random y position between 20 and 40
        const randomZ = (Math.random() - 0.5) * 20; // Random z position for depth
        
        const position = new THREE.Vector3(randomX, randomY, randomZ);
        const rocket = new Rocket(position);
        const newParticles = rocket.explode();
        fireworkParticles.push(...newParticles);
    }
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Update tap hint position every 3 seconds
    const currentTime = Date.now();
    if (currentTime - lastHintUpdate > 3000) {
        updateTapHintPosition(tapHint);
        lastHintUpdate = currentTime;
    }

    // Update rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        const shouldContinue = rocket.update();
        
        if (!shouldContinue) {
            const newParticles = rocket.explode();
            fireworkParticles.push(...newParticles);
            rockets.splice(i, 1);
            
            // Create additional random fireworks when rocket explodes
            createRandomFireworks(3); // Create 3 additional fireworks
        }
    }

    // Update firework particles
    for (let i = fireworkParticles.length - 1; i >= 0; i--) {
        const particle = fireworkParticles[i];
        particle.position.add(particle.userData.velocity);
        particle.userData.velocity.y -= 0.03; // gravity
        particle.userData.age += 0.016;
        particle.material.opacity = 1 - particle.userData.age;

        if (particle.userData.age >= 1) {
            scene.remove(particle);
            fireworkParticles.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
}

animate();