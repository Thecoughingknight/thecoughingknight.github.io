/**
 * STORAGE.JS
 * Handles saving, loading, and local persistence of custom chips.
 */

const storage = {
    SAVE_KEY: "logic_sim_custom_chips",

    /**
     * Converts the current workspace into a data object.
     */
    workspaceToJSON(chipName) {
        const inputs = app.nodes.filter(n => n.type === 'input').sort((a, b) => a.y - b.y);
        const outputs = app.nodes.filter(n => n.type === 'output').sort((a, b) => a.y - b.y);

        if (inputs.length === 0 || outputs.length === 0) {
            alert("Error: You need at least one Input and one Output to save a chip.");
            return null;
        }

        const chipData = {
            name: chipName.toUpperCase(),
            numIn: inputs.length,
            numOut: outputs.length,
            // Capture labels for the pins
            inputLabels: inputs.map(n => n.label || 'IN'),
            outputLabels: outputs.map(n => n.label || 'OUT'),
            // Save all internal components
            nodes: app.nodes.map(n => ({
                id: n.id,
                type: n.type,
                gateType: n.gateType,
                pins: n.pins,
                x: n.x,
                y: n.y,
                label: n.label,
                timerInterval: n.timerInterval
            })),
            // Save all internal connections
            wires: app.wires.map(w => ({
                fromId: w.fromNode.id,
                fromIdx: w.fromIdx,
                toId: w.toNode.id,
                toIdx: w.toIdx
            }))
        };

        return chipData;
    },

    /**
     * Saves a chip to LocalStorage so it persists after refresh.
     */
    saveChip(chipName) {
        const chipData = this.workspaceToJSON(chipName);
        if (!chipData) return;

        // Get existing library
        let library = this.loadLibrary();
        
        // Overwrite if name exists, otherwise add
        const index = library.findIndex(c => c.name === chipData.name);
        if (index !== -1) {
            library[index] = chipData;
        } else {
            library.push(chipData);
        }

        localStorage.setItem(this.SAVE_KEY, JSON.stringify(library));
        console.log(`Saved chip: ${chipData.name}`);
        
        // Update the UI
        if (typeof app.refreshLibrary === 'function') app.refreshLibrary();
    },

    /**
     * Retrieves all saved chips.
     */
    loadLibrary() {
        const data = localStorage.getItem(this.SAVE_KEY);
        return data ? JSON.parse(data) : [];
    },

    /**
     * Deletes a chip from the library.
     */
    deleteChip(name) {
        let library = this.loadLibrary();
        library = library.filter(c => c.name !== name);
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(library));
        app.refreshLibrary();
    },

    /**
     * Exports library to a file (optional but "cool" feature).
     */
    exportToFile() {
        const data = localStorage.getItem(this.SAVE_KEY);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "my_logic_chips.json";
        a.click();
    }
};
