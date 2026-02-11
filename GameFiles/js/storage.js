/**
 * STORAGE.JS - Persistence & Chip Serialization
 */

const storage = {
    KEY: "logic_sim_data",

    saveChip(name) {
        const library = this.getLibrary();
        const chipData = {
            name: name.toUpperCase(),
            nodes: app.nodes.map(n => ({
                id: n.id, type: n.type, gateType: n.gateType, 
                pins: n.pins, x: n.x, y: n.y, label: n.label,
                timerInterval: n.timerInterval
            })),
            wires: app.wires.map(w => ({
                fromId: w.fromNode.id, fromIdx: w.fromIdx,
                toId: w.toNode.id, toIdx: w.toIdx
            }))
        };

        const idx = library.findIndex(c => c.name === chipData.name);
        idx !== -1 ? library[idx] = chipData : library.push(chipData);
        
        localStorage.setItem(this.KEY, JSON.stringify(library));
        app.refreshLibrary();
    },

    getLibrary() {
        return JSON.parse(localStorage.getItem(this.KEY) || "[]");
    },

    deleteChip(name) {
        const library = this.getLibrary().filter(c => c.name !== name);
        localStorage.setItem(this.KEY, JSON.stringify(library));
        app.refreshLibrary();
    }
};
