const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const player = new Player();
const keys = {};

// Listen for keys
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Prevent scrolling with space/arrows
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) {
        e.preventDefault();
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

function gameLoop() {
    // 1. Clear the screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Update Player
    player.update(keys);

    // 3. Draw World (Placeholder for your world drawing logic)
    // When drawing blocks, remember to use: 
    // x - player.x, y - player.y
    
    // 4. Update Chunk Count UI
    // document.getElementById('chunk-display').innerText = ...

    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
