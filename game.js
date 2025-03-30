// Game state
let scene, camera, renderer, player, island, water, sky;
let clouds = []; // Array to store cloud objects
let splashParticles = []; // Array to store splash particles
let isGameOver = false;
let playerVelocity = new THREE.Vector3();
let isFloating = false;
let floatTime = 0;
const playerRadius = 1;
const islandRadius = playerRadius * 10;
const gravity = 0.05; // Reduced from 0.1 to 0.05 for slower falling
const maxSpeed = 0.3;
const acceleration = 0.02;
const deceleration = 0.98; // Higher value means slower deceleration
const friction = 0.99; // Higher value means less friction
const rotationSpeed = 1.0; // Increased from 0.1 to 1.0 for more obvious rotation
const ballHeight = playerRadius * 1.1; // Slightly higher than radius to prevent sinking
const cloudSpeed = 0.1; // Increased speed
const numberOfClouds = 3; // Reduced from 6 to 3
const numberOfSplashParticles = 30; // Number of particles in splash
const floatDuration = 3.0; // Duration of floating in seconds
const floatAmplitude = 0.15; // Increased from 0.1 to 0.15 for more noticeable bobbing
const floatFrequency = 3.0; // Increased from 2.0 to 3.0 for faster bobbing
const waterFriction = 0.95; // Friction while floating in water

// Create grass texture for the island
function createGrassTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base light green color
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle grass blades
    ctx.strokeStyle = '#45a049';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const length = 3 + Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.cos(angle) * length,
            y + Math.sin(angle) * length
        );
        ctx.stroke();
    }

    // Add very subtle highlights
    ctx.fillStyle = '#66bb6a';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = 1 + Math.random() * 2;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Repeat the texture 4x4 times
    return texture;
}

// Create dotted texture for the ball
function createDottedTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Fill background with red
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw white dots
    ctx.fillStyle = '#ffffff';
    const dotSize = 8;
    const spacing = 32;
    
    for (let x = spacing; x < canvas.width; x += spacing) {
        for (let y = spacing; y < canvas.height; y += spacing) {
            ctx.beginPath();
            ctx.arc(x, y, dotSize/2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

// Create a single cloud using multiple spheres
function createCloud() {
    const cloudGroup = new THREE.Group();
    const cloudMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x555555, // Add some self-illumination
        shininess: 0,
        opacity: 0.95,
        transparent: true
    });

    // Create main cloud body (much larger)
    const mainSphere = new THREE.Mesh(
        new THREE.SphereGeometry(15, 16, 16), // Much larger main body
        cloudMaterial
    );
    cloudGroup.add(mainSphere);

    // Add additional larger spheres to create puffy appearance
    const numPuffs = 10; // More puffs
    for (let i = 0; i < numPuffs; i++) {
        const puffSize = 8 + Math.random() * 8; // Much larger puffs
        const puff = new THREE.Mesh(
            new THREE.SphereGeometry(puffSize, 16, 16),
            cloudMaterial
        );
        
        // Position puffs around main sphere
        const angle = (i / numPuffs) * Math.PI * 2;
        const radius = 12; // Larger radius
        puff.position.x = Math.cos(angle) * radius;
        puff.position.y = Math.random() * 6 - 3; // More vertical variation
        puff.position.z = Math.sin(angle) * radius;
        
        cloudGroup.add(puff);
    }

    // Add top puffs
    const topPuffs = 5; // More top puffs
    for (let i = 0; i < topPuffs; i++) {
        const puff = new THREE.Mesh(
            new THREE.SphereGeometry(10, 16, 16), // Much larger top puffs
            cloudMaterial
        );
        puff.position.x = (i - 2) * 8;
        puff.position.y = 8;
        cloudGroup.add(puff);
    }

    return cloudGroup;
}

// Initialize clouds
function initClouds() {
    for (let i = 0; i < numberOfClouds; i++) {
        const cloud = createCloud();
        
        // Position clouds with more spacing between them
        cloud.position.x = -200 + (i * 200); // Even spacing across the scene
        cloud.position.y = 30 + Math.random() * 10;
        cloud.position.z = -100 - Math.random() * 50;
        
        // Randomize rotation slightly for variety
        cloud.rotation.y = Math.random() * Math.PI;
        
        // Scale clouds randomly but keep them large
        const scale = 1.5 + Math.random() * 0.5;
        cloud.scale.set(scale, scale * 0.6, scale);
        
        clouds.push(cloud);
        scene.add(cloud);
    }
}

// Update cloud positions
function updateClouds() {
    clouds.forEach(cloud => {
        cloud.position.x += cloudSpeed;
        
        // If cloud moves off screen, reset to start with more spacing
        if (cloud.position.x > 250) {
            cloud.position.x = -300; // Start further back
            cloud.position.z = -100 - Math.random() * 50;
            cloud.position.y = 30 + Math.random() * 10;
            cloud.rotation.y = Math.random() * Math.PI;
        }
    });
}

// Create a splash particle
function createSplashParticle() {
    // Random size between 0.1 and 0.3
    const size = 0.1 + Math.random() * 0.2;
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    
    // Array of different blue colors
    const blueColors = [
        0x87CEEB, // Sky blue
        0x1E90FF, // Dodger blue
        0x4169E1  // Royal blue
    ];
    
    const material = new THREE.MeshPhongMaterial({
        color: blueColors[Math.floor(Math.random() * blueColors.length)],
        transparent: true,
        opacity: 1.0 // Start fully opaque
    });
    return new THREE.Mesh(geometry, material);
}

// Create splash effect at position
function createSplashEffect(position) {
    console.log('Creating splash effect at position:', position);
    // Create new splash particles
    for (let i = 0; i < numberOfSplashParticles; i++) {
        const particle = createSplashParticle();
        
        // Set initial position to impact point
        particle.position.copy(position);
        
        // Random velocity in a circular upward pattern
        const angle = (i / numberOfSplashParticles) * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.4; // Increased speed
        particle.userData.velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            0.5 + Math.random() * 0.3, // Increased upward velocity
            Math.sin(angle) * speed
        );
        
        // Add to scene and array
        splashParticles.push(particle);
        scene.add(particle);
    }
    console.log('Created', numberOfSplashParticles, 'splash particles');
}

// Update splash particles
function updateSplashParticles() {
    if (splashParticles.length > 0) {
        console.log('Updating', splashParticles.length, 'splash particles');
    }
    for (let i = splashParticles.length - 1; i >= 0; i--) {
        const particle = splashParticles[i];
        
        // Update position
        particle.position.add(particle.userData.velocity);
        
        // Apply gravity
        particle.userData.velocity.y -= gravity * 0.3; // Reduced gravity effect
        
        // Fade out
        particle.material.opacity -= 0.01; // Slower fade out
        
        // Remove if invisible or below water
        if (particle.material.opacity <= 0 || particle.position.y < -0.1) {
            scene.remove(particle);
            splashParticles.splice(i, 1);
        }
    }
}

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create player (ball)
    const playerGeometry = new THREE.SphereGeometry(playerRadius, 32, 32);
    const playerMaterial = new THREE.MeshPhongMaterial({ 
        map: createDottedTexture(),
        shininess: 30
    });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.castShadow = true;
    player.position.y = ballHeight;
    scene.add(player);

    // Load grass texture and create island
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/grass_texture.png', function(texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
        
        const islandGeometry = new THREE.CylinderGeometry(islandRadius, islandRadius, 1, 32);
        const islandMaterial = new THREE.MeshPhongMaterial({ 
            map: texture,
            shininess: 5,
            specular: 0x444444
        });
        island = new THREE.Mesh(islandGeometry, islandMaterial);
        island.receiveShadow = true;
        island.position.y = 0;
        scene.add(island);
    });

    // Create water
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
    const waterMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x0000ff,
        transparent: true,
        opacity: 0.6
    });
    water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.1;
    water.receiveShadow = true;
    scene.add(water);

    // Create sky
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x87CEEB,
        side: THREE.BackSide
    });
    sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    // Initialize clouds
    initClouds();

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    
    // Configure shadow camera
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    
    scene.add(directionalLight);

    // Position camera
    camera.position.set(0, 10, 20);
    camera.lookAt(player.position);

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', onWindowResize, false);

    // Start game loop
    animate();
}

// Handle keyboard input
function handleKeyDown(event) {
    // Don't handle input if the ball is floating in water
    if (isFloating) return;

    switch(event.key) {
        case 'ArrowLeft':
            playerVelocity.x -= acceleration;
            break;
        case 'ArrowRight':
            playerVelocity.x += acceleration;
            break;
        case 'ArrowUp':
            playerVelocity.z -= acceleration;
            break;
        case 'ArrowDown':
            playerVelocity.z += acceleration;
            break;
    }
}

function handleKeyUp(event) {
    // We don't need to handle key up anymore as we're using acceleration/deceleration
}

// Update game state
function update() {
    // Apply gravity
    playerVelocity.y -= gravity;

    // Store previous Y position to detect water contact
    const previousY = player.position.y;

    // Only update player movement if game is not over
    if (!isGameOver) {
        // Apply friction and deceleration
        playerVelocity.x *= friction;
        playerVelocity.z *= friction;

        // Limit maximum speed
        const horizontalSpeed = Math.sqrt(playerVelocity.x * playerVelocity.x + playerVelocity.z * playerVelocity.z);
        if (horizontalSpeed > maxSpeed) {
            const ratio = maxSpeed / horizontalSpeed;
            playerVelocity.x *= ratio;
            playerVelocity.z *= ratio;
        }

        // Update player position
        player.position.x += playerVelocity.x;
        player.position.y += playerVelocity.y;
        player.position.z += playerVelocity.z;

        // Update ball rotation based on movement
        if (horizontalSpeed > 0.01) { // Only rotate if moving
            // Calculate rotation axis (perpendicular to movement direction)
            const rotationAxis = new THREE.Vector3(-playerVelocity.z, 0, playerVelocity.x).normalize();
            // Calculate rotation amount based on speed
            const rotationAmount = horizontalSpeed * rotationSpeed;
            // Apply rotation
            player.rotateOnAxis(rotationAxis, rotationAmount);
        }

        // Check if player is on the island
        const distanceFromCenter = Math.sqrt(
            Math.pow(player.position.x, 2) + 
            Math.pow(player.position.z, 2)
        );

        // Only keep player on island surface if they're actually on the island
        if (distanceFromCenter <= islandRadius && player.position.y < ballHeight) {
            player.position.y = ballHeight;
            playerVelocity.y = 0;
        }

        // Only trigger game over if the ball is below -5 units (deep in the water)
        // or if it's fallen off the island AND is below the water surface
        if (player.position.y < -5 || (distanceFromCenter > islandRadius && player.position.y < -0.1)) {
            console.log('Water contact detected! Previous Y:', previousY, 'Current Y:', player.position.y);
            // Create splash at the exact point where the ball hits the water
            const splashPosition = new THREE.Vector3(
                player.position.x,
                -0.1,
                player.position.z
            );
            createSplashEffect(splashPosition);
            isFloating = true;
            floatTime = 0;
            gameOver();
        }
    }

    // Handle floating behavior
    if (isFloating) {
        floatTime += 0.016; // Assuming 60fps, this is approximately 1/60 second

        // Apply water friction to horizontal movement
        playerVelocity.x *= waterFriction;
        playerVelocity.z *= waterFriction;

        // Continue horizontal movement
        player.position.x += playerVelocity.x;
        player.position.z += playerVelocity.z;

        // Calculate floating motion
        const floatOffset = Math.sin(floatTime * floatFrequency) * floatAmplitude;
        player.position.y = -0.1 + floatOffset;

        // Check if floating duration is complete
        if (floatTime >= floatDuration) {
            isFloating = false;
            resetGame();
        }
    }

    // Update splash particles (always update, even after game over)
    updateSplashParticles();
}

// Game over handler
function gameOver() {
    isGameOver = true;
    // No need for setTimeout here anymore as we handle the delay in the floating behavior
}

// Reset game
function resetGame() {
    // Clear any remaining splash particles
    splashParticles.forEach(particle => {
        scene.remove(particle);
    });
    splashParticles = [];
    
    player.position.set(0, playerRadius, 0);
    playerVelocity.set(0, 0, 0);
    player.rotation.set(0, 0, 0); // Reset rotation
    isGameOver = false;
    isFloating = false;
    floatTime = 0;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    update();
    updateClouds(); // Update cloud positions
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start game when button is clicked
document.getElementById('playButton').addEventListener('click', () => {
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    init();
}); 