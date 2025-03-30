// Game state
let scene, camera, renderer, player, island, water, sky;
let isGameOver = false;
let playerVelocity = new THREE.Vector3();
const playerRadius = 1;
const islandRadius = playerRadius * 10;
const gravity = 0.1;
const moveSpeed = 0.2;
const jumpForce = 0.5;

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Create player (ball)
    const playerGeometry = new THREE.SphereGeometry(playerRadius, 32, 32);
    const playerMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.castShadow = true;
    player.position.y = playerRadius;
    scene.add(player);

    // Create island
    const islandGeometry = new THREE.CylinderGeometry(islandRadius, islandRadius, 1, 32);
    const islandMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.receiveShadow = true;
    island.position.y = 0;
    scene.add(island);

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

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
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
    switch(event.key) {
        case 'ArrowLeft':
            playerVelocity.x = -moveSpeed;
            break;
        case 'ArrowRight':
            playerVelocity.x = moveSpeed;
            break;
        case 'ArrowUp':
            playerVelocity.z = -moveSpeed;
            break;
        case 'ArrowDown':
            playerVelocity.z = moveSpeed;
            break;
        case ' ':
            if (player.position.y <= playerRadius) {
                playerVelocity.y = jumpForce;
            }
            break;
    }
}

function handleKeyUp(event) {
    switch(event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
            playerVelocity.x = 0;
            break;
        case 'ArrowUp':
        case 'ArrowDown':
            playerVelocity.z = 0;
            break;
    }
}

// Update game state
function update() {
    if (isGameOver) return;

    // Apply gravity
    playerVelocity.y -= gravity;

    // Update player position
    player.position.x += playerVelocity.x;
    player.position.y += playerVelocity.y;
    player.position.z += playerVelocity.z;

    // Check if player is on the island
    const distanceFromCenter = Math.sqrt(
        Math.pow(player.position.x, 2) + 
        Math.pow(player.position.z, 2)
    );

    if (distanceFromCenter > islandRadius) {
        gameOver();
    }

    if (player.position.y < -5) {
        gameOver();
    }

    // Keep player on island surface
    if (player.position.y < playerRadius) {
        player.position.y = playerRadius;
        playerVelocity.y = 0;
    }
}

// Game over handler
function gameOver() {
    isGameOver = true;
    setTimeout(() => {
        resetGame();
    }, 1000);
}

// Reset game
function resetGame() {
    player.position.set(0, playerRadius, 0);
    playerVelocity.set(0, 0, 0);
    isGameOver = false;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    update();
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