class World {
    constructor() {
        this.tileSize = 32;
        this.chunkSize = 16;
        this.renderDistance = 4; // How many chunks to see to the left/right
        this.chunks = {};
        
        // Block Registry
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
            
            // 1. Terrain Height (Sine Wave Math)
            // "15" is the average height. "sin * 5" makes hills go up/down by 5 blocks.
            let surfaceY = Math.floor(15 + Math.sin(worldX * 0.1) * 5);
            
            for (let y = 0; y < 60; y++) {
                let tile = 0;
                if (y < surfaceY) tile = 0; // Air
                else if (y === surfaceY) tile = 1; // Grass
                else if (y > surfaceY && y < surfaceY + 4) tile = 2; // Dirt
                else if (y >= surfaceY + 4) {
                    // 10% chance for Coal, otherwise Stone
                    tile = (Math.random() > 0.9) ? 6 : 3; 
                }
                chunkData[x][y] = tile;
            }

            // 2. Tree Spawning
            // Only spawn if not near the chunk edge (prevents cut-off trees)
            if (x > 2 && x < this.chunkSize - 2 && Math.random() > 0.90) {
                // Trunk (3 blocks high)
                for(let h=1; h<=3; h++) chunkData[x][surfaceY-h] = 4;
                
                // Leaves (Cluster)
                for(let lx=-1; lx<=1; lx++) {
                    chunkData[x+lx][surfaceY-4] = 5; // Lower leaves
                    chunkData[x+lx][surfaceY-5] = 5; // Upper leaves
                }
                chunkData[x][surfaceY-6] = 5; // Top tip
            }
        }
        return chunkData;
    }

    // Load/Unload chunks based on where the player is standing
    update(playerX) {
        let currentChunk = Math.floor((playerX / this.tileSize) / this.chunkSize);
        
        // Load nearby
        for (let i = currentChunk - this.renderDistance; i <= currentChunk + this.renderDistance; i++) {
            if (!this.chunks[i]) {
                this.chunks[i] = this.generateChunk(i);
            }
        }
        
        // Unload far away (Garbage Collection)
        for (let key in this.chunks) {
            if (Math.abs(key - currentChunk) > this.renderDistance + 2) {
                delete this.chunks[key];
            }
        }
        
        // Update the UI counter
        const chunkDisplay = document.getElementById('chunk-display');
        if(chunkDisplay) chunkDisplay.innerText = Object.keys(this.chunks).length;
    }

    draw(ctx, player) {
        // CENTER THE CAMERA:
        // We add half the screen width/height to the drawing position.
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let chunkIdx in this.chunks) {
            let chunk = this.chunks[chunkIdx];
            let chunkPixelX = chunkIdx * this.chunkSize * this.tileSize;

            for (let x = 0; x < this.chunkSize; x++) {
                for (let y = 0; y < chunk[x].length; y++) {
                    let type = chunk[x][y];
                    
                    if (type !== 0) {
                        ctx.fillStyle = this.blocks[type].color;
                        
                        // The Magic Camera Math:
                        // BlockPos - PlayerPos + ScreenCenter
                        let drawX = chunkPixelX + (x * this.tileSize) - player.x + centerX;
                        let drawY = (y * this.tileSize) - player.y + centerY;

                        // Optimization: Don't draw if it's off-screen
                        if (drawX > -50 && drawX < window.innerWidth && drawY > -50 && drawY < window.innerHeight) {
                            ctx.fillRect(drawX, drawY, this.tileSize + 0.5, this.tileSize + 0.5);
                            
                            // Extra Detail: Coal specs
                            if(type === 6) { 
                                ctx.fillStyle = "black"; 
                                ctx.fillRect(drawX+10, drawY+10, 5, 5); 
                                ctx.fillRect(drawX+20, drawY+5, 5, 5); 
                            }
                            // Extra Detail: Furnace
                            if(type === 8) {
                                ctx.fillStyle = "black";
                                ctx.fillRect(drawX+8, drawY+8, 16, 16);
                            }
                        }
                    }
                }
            }
        }
    }
}
