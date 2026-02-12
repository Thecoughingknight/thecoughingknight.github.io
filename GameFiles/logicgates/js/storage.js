/**
 * STORAGE.JS
 * Handles Saving/Loading Chips and Populating the UI Library.
 */

const storage = {
    customChips: [],

    // --- Initialization ---
    init() {
        console.log("Storage: Loading saved chips...");
        const saved = localStorage.getItem('logicsim_chips_v0.8');
        if (saved) {
            try {
                this.customChips = JSON.parse(saved);
            } catch (e) {
                console.error("Failed to load chips:", e);
                this.customChips = [];
            }
        }
        this.refreshLibrary();
    },

    // --- Saving ---
    saveChip(name) {
        // 1. Identify Inputs & Outputs (to define pins)
        const inputs = app.nodes.filter(n => n.type === 'input').sort((a, b) => a.y - b.y);
        const outputs = app.nodes.filter(n => n.type === 'output').sort((a, b) => a.y - b.y);

        if (inputs.length === 0 || outputs.length === 0) {
            alert("Cannot save: Chip must have at least 1 Input and 1 Output.");
            return;
        }

        // 2. Serialize Internal Logic
        // We only save what is necessary to reconstruct the logic inside
        const chipData = {
            id: Date.now().toString(),
            name: name,
            numIn: inputs.length,
            numOut: outputs.length,
            created: new Date().toISOString(),
            
            // Labels for the pins (optional feature)
            inputLabels: inputs.map(n => n.label || "IN"),
            outputLabels: outputs.map(n => n.label || "OUT"),

            // The internal circuit structure
            nodes: app.nodes.map(n => ({
                id: n.id,
                type: n.type,
                gateType: n.gateType,
                // We don't save x/y for internal logic, just connectivity matters
                // (Unless we want to open it for editing later)
                internalData: n.internalData || null 
            })),
            
            wires: app.wires.map(w => ({
                fromId: w.fromNode.id,
                fromIdx: w.fromIdx,
                toId: w.toNode.id,
                toIdx: w.toIdx
            }))
        };

        // 3. Save to Storage
        // Check if overwriting
        const existingIdx = this.customChips.findIndex(c => c.name === name);
        if (existingIdx >= 0) {
            if (!confirm(`Overwrite existing chip "${name}"?`)) return;
            this.customChips[existingIdx] = chipData;
        } else {
            this.customChips.push(chipData);
        }

        this.persist();
        this.refreshLibrary();
        alert(`Chip "${name}" saved!`);
    },

    persist() {
        localStorage.setItem('logicsim_chips_v0.8', JSON.stringify(this.customChips));
    },

    // --- UI Updates ---
    refreshLibrary() {
        const listContainer = document.getElementById('custom-chips-list');
        const quickAccess = document.getElementById('quick-access');

        // Clear current lists
        listContainer.innerHTML = '';
        quickAccess.innerHTML = '';

        if (this.customChips.length === 0) {
            listContainer.innerHTML = '<div class="menu-item" style="color:#666; font-style:italic;">No custom chips</div>';
            return;
        }

        // Populate Lists
        this.customChips.forEach(chip => {
            // 1. Add to Main Menu (Find Chip)
            const item = document.createElement('div');
            item.className = 'menu-item';
            item.innerHTML = `${chip.name} <span class="menu-shortcut">${chip.numIn}IN/${chip.numOut}OUT</span>`;
            
            item.onclick = () => {
                // When clicked, add this chip as a 'gate' to the board
                app.addNode('gate', chip.numIn, chip.name, chip);
                // Hide menu
                document.getElementById('library-menu').style.display = 'none';
            };

            // Add delete option (Right click in menu)
            item.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm(`Delete chip "${chip.name}"?`)) {
                    this.deleteChip(chip.name);
                }
            };

            listContainer.appendChild(item);

            // 2. Add to Quick Access Toolbar
            const btn = document.createElement('div');
            btn.className = 'tool-btn';
            // Shorten name to 4 chars for toolbar
            btn.innerText = chip.name.substring(0, 4).toUpperCase();
            btn.title = chip.name; // Tooltip
            
            btn.onclick = () => {
                app.addNode('gate', chip.numIn, chip.name, chip);
            };

            quickAccess.appendChild(btn);
        });
    },

    deleteChip(name) {
        this.customChips = this.customChips.filter(c => c.name !== name);
        this.persist();
        this.refreshLibrary();
    }
};

// Initialize immediately so data is ready when main.js runs
storage.init();
