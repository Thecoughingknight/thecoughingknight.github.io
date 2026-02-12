const canvas = document.getElementById('worldCanvas');
const ctx = canvas.getContext('2d');

// Settings
const blockSize = 8; 
const worldWidth = 100; // Total blocks wide
const worldHeight = 60; // Total blocks high
const groundLevel = 40; // Base height

canvas.width = worldWidth * blockSize;
canvas.height = worldHeight * blockSize;

// Color Presets
const colors = {
    grass: '#4db33d',
    dirt: '#8b5a2b',
    cobblestone: '#7a7a7a',
    air: '#87CEEB'
};

// Simple 1D Noise Function for smooth terrain
function getNoise(x, amplitude, frequency) {
    return Math.sin(x * frequency) * amplitude;
}

function generateWorld() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Seed for randomness
    const seed = Math.random() * 100;

    for (let x = 0; x < worldWidth; x++) {
        // Combine multiple waves to create "mountains" and "valleys"
        let noise = getNoise(x + seed, 12, 0.1) +  // Big mountains
                    getNoise(x + seed, 5, 0.3) +   // Medium hills
                    getNoise(x + seed, 2, 0.8);    // Small bumps
        
        let terrainHeight = Math.floor(groundLevel + noise);

        for (let y = 0; y < worldHeight; y++) {
            let blockType = null;

            if (y > terrainHeight) {
                // Determine block type based on depth
                if (y === terrainHeight + 1) {
                    blockType = colors.grass;
                } else if (y > terrainHeight + 5) {
                    blockType = colors.cobblestone;
                } else {
                    blockType = colors.dirt;
                }
            }

            if (blockType) {
                ctx.fillStyle = blockType;
                ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
                
                // Add a tiny bit of "shading" to the edges of blocks
                ctx.strokeStyle = 'rgba(0,0,0,0.05)';
                ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
            }
        }
    }
}

// Initial generation
generateWorld();

// R to refresh
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') generateWorld();
});
