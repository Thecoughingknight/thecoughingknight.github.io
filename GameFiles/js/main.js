const App = {
    nodes: [],

    init() {
        console.log("App Initialized");
    },

    addNode(id, x = 100, y = 100) {
        const newNode = new Node(id, x, y);
        this.nodes.push(newNode);
    },

    clear() {
        this.nodes.forEach(n => n.element.remove());
        this.nodes = [];
    }
};

window.onload = () => App.init();
