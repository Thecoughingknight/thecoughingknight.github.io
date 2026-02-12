const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const world = new World(50, 20, 40);
const player = new Player(100, 100, 32);

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function loop() {
    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & Draw
    player.update(keys, world);
    world.draw(ctx);
    player.draw(ctx);

    requestAnimationFrame(loop);
}

loop();
