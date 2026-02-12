class World {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.grid = [];
        this.generate();
    }

    generate() {
        for (let x = 0; x < this.width; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.height; y++) {
                // Simple terrain: Sky (0), Grass (1), Dirt (2)
                let block = 0; 
                if (y > 10) block = 2; // Dirt
                if (y === 10) block = 1; // Grass
                this.grid[x][y] = block;
            }
        }
    }

    draw(ctx) {
        const colors = ["#87CEEB", "#2ecc71", "#795548"]; // Sky, Grass, Dirt
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let type = this.grid[x][y];
                if (type > 0) {
                    ctx.fillStyle = colors[type];
                    ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }
    }
}
