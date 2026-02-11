/**
 * MAIN.JS
 * The Controller: Connects the Old UI to the New Engine.
 */

const app = {
    // --- State Management ---
    nodes: [],
    wires: [],
    
    // Interaction State
    activeWire: null,      // The wire currently being dragged
    draggingNode: null,    // The node currently being moved
    hoveredNode: null,     // The node under the mouse (for deletion)
    dragOffset: { x: 0, y: 0 },
    
    // Modal State
    labelingNode: null,
    editingTimerNode: null,

    // DOM Caching
    container: null,
    svg: null,

    // --- Initialization ---
    init() {
        console.log("LogicSim Pro: Initializing...");
        
        this.container = document.getElementById('canvas-container');
        this.svg = document.getElementById('wire-layer');

        // 1. Setup Global Inputs
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // 2. Close menus when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.menu-popup').forEach(m => m.style.display = 'none');
        });

        // 3. Load Saved Chips
        if (window.storage) storage.refreshLibrary();

        // 4. Default Scene (Demo)
        setTimeout(() => {
            this.addNode('gate', 0, 'timer').setPosition(100, 200).setLabel("CLK");
            this.addNode('gate', 1, 'delay').setPosition(250, 200);
            this.addNode('output', 1).setPosition(400, 200).setLabel("LED");
        }, 100);
    },

    // --- Interaction Handlers ---

    handleMouseMove(e) {
        // Dragging a Node
        if (this.draggingNode) {
            const rect = this.container.getBoundingClientRect();
            const x = e.clientX - rect.left - this.dragOffset.x;
            const y = e.clientY - rect.top - this.dragOffset.y;
            this.draggingNode.setPosition(x, y);
        }

        // Dragging a Wire
        if (this.activeWire) {
            const rect = this.container.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            
            // Draw straight line to mouse cursor
            this.activeWire.element.setAttribute("d", 
                `M ${this.activeWire.startPos.x} ${this.activeWire.startPos.y} L ${mx} ${my}`
            );
        }
    },

    handleMouseUp(e) {
        this.draggingNode = null;
        
        // If we let go of a wire in empty space, destroy it
        if (this.activeWire) {
            this.activeWire.element.remove();
            this.activeWire = null;
        }
    },

    handleKeyDown(e) {
        // Ignore shortcuts if typing in a text box
        if (e.target.tagName === 'INPUT') return;

        const ctrl = e.ctrlKey || e.metaKey;

        // Ctrl + S : Save
        if (ctrl && e.key === 's') {
            e.preventDefault();
            this.showSaveModal();
        }

        // Ctrl + N : New / Clear
        if (ctrl && e.key === 'n') {
            e.preventDefault();
            if (confirm("Clear workspace?")) this.clearCanvas();
        }

        // Ctrl + F : Find / Library
        if (ctrl && e.key === 'f') {
            e.preventDefault();
            const menu = document.getElementById('library-menu');
            // Toggle logic manually since we aren't clicking the button
            menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
        }

        // Delete / Backspace : Remove Hovered Node
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.hoveredNode) {
                this.hoveredNode.destroy();
                this.runLogic(); // Re-calculate circuit
                this.hoveredNode = null;
            }
        }

        // Escape : Close Modals
        if (e.key === 'Escape') {
            this.closeModals();
        }
    },

    // --- Engine Passthroughs (Called by HTML Buttons) ---
    
    addNode(type, pins, gateType, savedData) {
        // Delegate to the global Node class (defined in engine.js)
        const n = new Node(type, pins, gateType, 150, 150, savedData);
        this.nodes.push(n);
        this.runLogic();
        return n;
    },

    clearCanvas() {
        // Iterate backwards to safely remove
        [...this.nodes].forEach(n => n.destroy());
        this.nodes = [];
        this.wires = [];
        this.svg.innerHTML = ''; // Clear all wire SVGs
    },

    runLogic() {
        // Delegate to engine's logic processor if it exists separate, 
        // or iterate nodes here if using the simple model.
        // Assuming engine.js attaches logic to Node prototypes or a global runner.
        // For this setup, we'll trigger the update cycle:
        
        let stable = false;
        let limit = 0;
        
        // 1. Reset inputs
        this.nodes.forEach(n => n.inputStates.fill(false));

        // 2. Propagate signals (Iterative to settle loops)
        while (!stable && limit < 10) {
            stable = true;
            this.wires.forEach(w => {
                const val = w.fromNode.outputStates[w.fromIdx];
                if (w.toNode.inputStates[w.toIdx] !== val) {
                    w.toNode.inputStates[w.toIdx] = val;
                    stable = false;
                }
            });
            this.nodes.forEach(n => {
                if (n.evaluate()) stable = false;
            });
            limit++;
        }

        // 3. Visual Updates
        this.updateWireVisuals();
        this.nodes.forEach(n => n.updateVisuals());
    },

    updateWireVisuals() {
        this.wires.forEach(w => {
            const p1 = w.fromNode.getPortPos(false, w.fromIdx);
            const p2 = w.toNode.getPortPos(true, w.toIdx);
            
            // Bezier Curve Logic
            const dist = Math.abs(p1.x - p2.x) * 0.5;
            const d = `M ${p1.x} ${p1.y} C ${p1.x + dist} ${p1.y} ${p2.x - dist} ${p2.y} ${p2.x} ${p2.y}`;
            
            w.element.setAttribute("d", d);
            
            // Color update
            const isActive = w.fromNode.outputStates[w.fromIdx];
            if (w.isActive !== isActive) {
                w.element.classList.toggle('active', isActive);
                w.isActive = isActive;
            }
        });
    },

    // --- UI / Menu Management ---

    toggleMenu(e, id) {
        e.stopPropagation(); // Stop click from hitting document (which closes menus)
        const el = document.getElementById(id);
        
        // Close others
        document.querySelectorAll('.menu-popup').forEach(m => {
            if (m.id !== id) m.style.display = 'none';
        });

        // Toggle current
        const isVisible = el.style.display === 'flex';
        el.style.display = isVisible ? 'none' : 'flex';
    },

    // --- Modal: Save Chip ---
    showSaveModal() {
        document.getElementById('save-modal').style.display = 'flex';
        document.getElementById('chip-name').focus();
    },

    saveCurrentChip() {
        const nameInput = document.getElementById('chip-name');
        const name = nameInput.value.trim().toUpperCase();
        
        if (!name) return alert("Please enter a chip name.");
        
        // Delegate to storage.js
        if (window.storage) {
            storage.saveChip(name);
            nameInput.value = "";
            this.closeModals();
        } else {
            console.error("Storage module not loaded.");
        }
    },

    // --- Modal: Timer Settings ---
    openTimerModal(node) {
        this.editingTimerNode = node;
        const input = document.getElementById('timer-interval-input');
        input.value = node.timerInterval || 1000;
        document.getElementById('timer-modal').style.display = 'flex';
        input.focus();
    },

    saveTimerSettings() {
        if (this.editingTimerNode) {
            let val = parseInt(document.getElementById('timer-interval-input').value);
            if (val < 50) val = 50; // Safety floor
            this.editingTimerNode.timerInterval = val;
            this.editingTimerNode.startTimer(); // Restart with new interval
        }
        this.closeModals();
    },

    // --- Modal: Labeling ---
    openLabelModal(node) {
        this.labelingNode = node;
        const input = document.getElementById('node-label-input');
        input.value = node.label || "";
        document.getElementById('label-modal').style.display = 'flex';
        input.focus();
    },

    confirmLabel() {
        if (this.labelingNode) {
            const val = document.getElementById('node-label-input').value.trim();
            this.labelingNode.setLabel(val);
        }
        this.closeModals();
    },

    closeModals() {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        this.labelingNode = null;
        this.editingTimerNode = null;
    }
};

// Initialize on load
window.onload = () => app.init();
