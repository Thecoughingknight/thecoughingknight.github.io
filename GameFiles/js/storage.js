const StorageManager = {
    saveCanvas() {
        const data = App.nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
        localStorage.setItem('logic_sim_data', JSON.stringify(data));
        alert("Saved!");
    },

    loadCanvas() {
        const data = JSON.parse(localStorage.getItem('logic_sim_data'));
        if (data) {
            App.clear();
            data.forEach(d => App.addNode(d.id, d.x, d.y));
        }
    }
};
