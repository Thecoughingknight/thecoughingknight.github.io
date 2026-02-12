class World {
    constructor(tileSize) {
        this.tileSize = tileSize;
        this.chunkSize = 16;
        this.renderDistance = 3;
        this.chunks = {};
        
        // Block Types
        this.blocks = {
            0: { name: "Air", color: "transparent" },
            1: { name: "Grass", color: "#5da130" },
            2: { name: "Dirt", color: "#79553a" },
            3: { name: "Stone", color: "#616161" },
            4: { name: "Wood", color: "#4d3319" },
            5: { name: "Leaves", color: "#2d5a27" },
            6: { name: "Coal Ore", color: "#333333" },
            7: { name: "Crafting Table", color: "#ab7d4b" },
            8: { name: "Furnace", color: "#444444" }
        };
    }

    generateChunk(chunkX) {
        let chunkData = Array.from({ length: this.chunkSize }, () => []);
        
        for (let x = 0; x < this.chunkSize; x++) {
            let worldX = (chunkX * this.chunkSize) + x;
            // Simple terrain math
            let surfaceY = Math.floor(18 + Math.sin(worldX * 0.15) * 4);
            
            for (let y = 0; y < 50; y++) {
                let tile = 0;
                if (y === surfaceY) tile = 1; // Grass
                else if (y > surfaceY && y < surfaceY + 4) tile = 2; // Dirt
                else if (y >= surfaceY + 4) {
                    tile = (Math.random() > 0.9) ? 6 : 3; // Coal or Stone
                }
                chunkData[x][y] = tile;
            }

            // Simple Tree Spawning
            if (x > 2 && x < this.chunkSize - 2 && Math.random() > 0.9) {
                for(let h=1; h<=3; h++) chunkData[x][surfaceY-h] = 4; // Trunk
                for(let lx=-1; lx<=1; lx++) {
                    chunkData[x+lx][surfaceY-4] = 5;
                    chunkData[x+lx][surfaceY-5] = 5;
                }
                chunkData[x][surfaceY-6] = 5;
            }
        }
        return chunkData;
    }

    update(playerX) {
        let currentChunkIndex = Math.floor((playerX / this.tileSize) / this.chunkSize);
        
        // Load new chunks
        for (let i = currentChunkIndex - this.renderDistance; i <= currentChunkIndex + this.renderDistance; i++) {
            if (!this.chunks[i]) this.chunks[i] = this.generateChunk(i);
        }
        
        // Unload far chunks
        for (let key in this.chunks) {
            if (Math.abs(key - currentChunkIndex) > this.renderDistance + 1) {
                delete this.chunks[key];
            }
        }
        document.getElementById('chunk-display').innerText = Object.keys(this.chunks).length;
    }

    draw(ctx, player) {
        for (let chunkIdx in this.chunks) {
            let chunkOffsetX = chunkIdx * this.chunkSize * this.tileSize;
            for (let x = 0; x < this.chunkSize; x++) {
                for (let y = 0; y < this.chunks[chunkIdx][x].length; y++) {
                    let type = this.chunks[chunkIdx][x][y];
                    if (type !== 0) {
                        ctx.fillStyle = this.blocks[type].color;
                        // The "Camera" math: World Pos - Player Pos
                        ctx.fillRect(
                            chunkOffsetX + (x * this.tileSize) - player.x, 
                            (y * this.tileSize) - player.y, 
                            this.tileSize + 0.5, 
                            this.tileSize + 0.5
                        );
                    }
                }
            }
        }
    }
}
