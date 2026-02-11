/**
 * ENGINE.JS
 * The Core: Handles Nodes, Wires, and Logic Simulation.
 */

class Node {
    constructor(type, pins = 1, gateType = null, x = 0, y = 0, internalData = null) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = type;           // 'gate', 'input', 'output'
        this.gateType = gateType;   // 'and', 'or', 'nand', 'timer', etc.
        this.pins = pins;           // Number of input pins
        this.x = x;
        this.y = y;
        this.label = "";
        
        // Logic State
        this.inputStates = new Array(pins).fill(false);
        this.outputStates = [false]; // Most gates have 1 output
        this.internalData = internalData; // For custom chips

        // Timing State
        this.timerInterval = 1000;
        this.timerId = null;
        this.lastDelayInput = false;
        this.delayTimeoutId = null;

        // Initialize based on Type
        if (type === 'gate') {
            if (gateType === 'timer') {
                this.startTimer();
            } else if (gateType === 'not' || gateType === 'nand') {
                // Initialize active (logic 1) if input is 0
                this.outputStates[0] = true; 
            }
        } else if (type === 'input') {
            // Inputs have 0 "inputs" but 1 user-controlled state
            this.inputStates = [];
            this.outputStates = [false];
        } else if (type === 'output') {
            // Outputs accept 1 input to display
            this.inputStates = [false];
            this.outputStates = [];
        }

        // Create DOM
        this.element = this.createDOM();
        document.getElementById('canvas-container').appendChild(this.element);
        
        // Initial Visual Update
        this.updateVisuals();
    }

    // --- DOM Creation ---
    createDOM() {
        const div = document.createElement('div');
        div.className = `node node-${this.type === 'gate' ? 'gate' : 'io'}`;
        div.id = this.id;
        
        // Special Styles
        if (this.gateType === 'timer' || this.gateType === 'delay') {
            div.classList.add('node-special');
        }

        // Content
        if (this.type === 'gate') {
            div.innerText = (this.internalData ? this.gateType : (this.gateType || "GATE")).toUpperCase();
            // Adjust height based on pins
            const height = Math.max(30, this.pins * 15 + 10);
            div.style.height = height + 'px';
        } else {
            // Input/Output Circle
            const circle = document.createElement('div');
            circle.className = 'io-circle';
            // Click handler for Input nodes to toggle state
            if (this.type === 'input') {
                circle.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    this.outputStates[0] = !this.outputStates[0];
                    app.runLogic();
                });
            }
            div.appendChild(circle);
        }

        // Ports (Inputs)
        if (this.type !== 'input') {
            const count = this.pins;
            for (let i = 0; i < count; i++) {
                const p = this.createPort('in', i);
                div.appendChild(p);
            }
        }

        // Ports (Outputs)
        if (this.type !== 'output') {
            const count = (this.internalData) ? this.internalData.numOut : 1;
            for (let i = 0; i < count; i++) {
                const p = this.createPort('out', i);
                div.appendChild(p);
            }
        }

        // Dragging & Interaction
        div.addEventListener('mousedown', (e) => {
            // Shift+Click: Edit/Label
            if (e.shiftKey) {
                e.stopPropagation();
                if (this.gateType === 'timer') app.openTimerModal(this);
                else app.openLabelModal(this);
                return;
            }

            // Normal Drag (only if not clicking a port/circle)
            if (!e.target.classList.contains('port') && !e.target.classList.contains('io-circle')) {
                app.draggingNode = this;
                const r = div.getBoundingClientRect();
                app.dragOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
                
                // Bring to front
                div.style.zIndex = 100;
            }
        });
        
        div.addEventListener('mouseup', () => {
             div.style.zIndex = 10;
        });

        // Context Menu (Right Click) -> Delete
        div.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.destroy();
            app.runLogic();
        });

        // Hover Effect for deletion shortcut
        div.addEventListener('mouseenter', () => app.hoveredNode = this);
        div.addEventListener('mouseleave', () => app.hoveredNode = null);

        // Label Element
        const label = document.createElement('div');
        label.className = 'node-label';
        label.style.display = 'none';
        div.appendChild(label);

        return div;
    }

    createPort(type, index) {
        const p = document.createElement('div');
        p.className = `port port-${type}`;
        p.dataset.index = index;
        
        // Position calculation
        const isInput = type === 'in';
        const total = isInput ? this.inputStates.length : this.outputStates.length;
        
        // Spread ports evenly vertically
        if (total > 1) {
            const step = 15; // app.ROW_HEIGHT
            p.style.top = (10 + index * step) + 'px';
        } else {
            p.style.top = '50%';
            p.style.transform = 'translateY(-50%)';
        }
        
        // Wiring Events
        if (type === 'out') {
            p.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startWire(index);
            });
        } else {
            p.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                this.completeWire(index);
            });
        }

        return p;
    }

    // --- Logic Execution ---

    evaluate() {
        const oldOut = [...this.outputStates];

        if (this.internalData) {
            // Placeholder for Custom Chip Logic
            // In v0.8 this is a "Black Box" (inputs don't propagate yet)
            // or requires recursive evaluation. 
        } else if (this.type === 'gate') {
            const a = this.inputStates[0];
            const b = this.inputStates[1];

            switch (this.gateType) {
                case 'and':  this.outputStates[0] = a && b; break;
                case 'or':   this.outputStates[0] = a || b; break;
                case 'nand': this.outputStates[0] = !(a && b); break;
                case 'not':  this.outputStates[0] = !a; break;
                case 'xor':  this.outputStates[0] = (a ? !b : b); break;
                
                case 'delay':
                    // Delay Logic: Simple "Sample and Hold"
                    if (a !== this.lastDelayInput) {
                        if (this.delayTimeoutId) clearTimeout(this.delayTimeoutId);
                        this.delayTimeoutId = setTimeout(() => {
                            this.outputStates[0] = a;
                            this.lastDelayInput = a;
                            app.runLogic(); // Trigger update
                        }, 500); // Fixed 500ms delay
                    }
                    break;
                
                case 'timer':
                    // Logic handled by setInterval, not here.
                    break;
            }
        } else if (this.type === 'output') {
            // Output nodes just hold state for visuals
        }

        // Return true if state changed (to trigger re-eval loop)
        return JSON.stringify(oldOut) !== JSON.stringify(this.outputStates);
    }

    // --- Wiring ---

    startWire(portIndex) {
        const pos = this.getPortPos(false, portIndex);
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "wire wire-drag");
        path.setAttribute("d", `M ${pos.x} ${pos.y} L ${pos.x} ${pos.y}`);
        
        document.getElementById('wire-layer').appendChild(path);

        app.activeWire = {
            fromNode: this,
            fromIdx: portIndex,
            startPos: pos,
            element: path
        };
    }

    completeWire(toIndex) {
        if (!app.activeWire) return;
        
        const fromNode = app.activeWire.fromNode;
        const fromIdx = app.activeWire.fromIdx;

        // Prevent self-connection (basic check)
        if (fromNode === this) {
            app.activeWire.element.remove();
            app.activeWire = null;
            return;
        }

        // Remove the "dragging" wire
        app.activeWire.element.remove();
        app.activeWire = null;

        // Check if wire already exists (to avoid duplicates)
        const exists = app.wires.some(w => 
            w.fromNode === fromNode && w.fromIdx === fromIdx && 
            w.toNode === this && w.toIdx === toIndex
        );

        if (exists) return;

        // Remove any existing wire connected to this *Input* pin
        // (Inputs can only have 1 wire)
        const existingInputWireIdx = app.wires.findIndex(w => w.toNode === this && w.toIdx === toIndex);
        if (existingInputWireIdx !== -1) {
            app.wires[existingInputWireIdx].element.remove();
            app.wires.splice(existingInputWireIdx, 1);
        }

        // Create permanent wire
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "wire");
        document.getElementById('wire-layer').appendChild(path);

        const newWire = {
            fromNode: fromNode,
            fromIdx: fromIdx,
            toNode: this,
            toIdx: toIndex,
            element: path,
            isActive: false
        };

        app.wires.push(newWire);
        app.runLogic();
    }

    getPortPos(isInput, index) {
        // Calculate absolute position of the pin center
        const rect = this.element.getBoundingClientRect();
        const containerRect = document.getElementById('canvas-container').getBoundingClientRect();
        
        // Find the specific port element within the node
        const selector = `.port-${isInput ? 'in' : 'out'}`;
        const ports = this.element.querySelectorAll(selector);
        
        // Fallback safety
        if (!ports[index]) return { x: this.x, y: this.y };

        const portRect = ports[index].getBoundingClientRect();

        return {
            x: portRect.left - containerRect.left + (portRect.width / 2),
            y: portRect.top - containerRect.top + (portRect.height / 2)
        };
    }

    // --- Features: Timer ---

    startTimer() {
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = setInterval(() => {
            this.outputStates[0] = !this.outputStates[0];
            app.runLogic();
        }, this.timerInterval);
    }

    // --- Utilities ---

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
        app.updateWireVisuals(); // Update connected wires
        return this;
    }

    setLabel(text) {
        this.label = text;
        const lbl = this.element.querySelector('.node-label');
        if (text) {
            lbl.innerText = text;
            lbl.style.display = 'block';
        } else {
            lbl.style.display = 'none';
        }
        return this;
    }

    updateVisuals() {
        // Toggle 'active' class on IO circles
        if (this.type === 'input') {
            const circle = this.element.querySelector('.io-circle');
            if (this.outputStates[0]) circle.classList.add('active');
            else circle.classList.remove('active');
        } else if (this.type === 'output') {
            const circle = this.element.querySelector('.io-circle');
            if (this.inputStates[0]) circle.classList.add('active');
            else circle.classList.remove('active');
        } else if (this.gateType === 'timer') {
             // Blink border for timer
             this.element.style.borderColor = this.outputStates[0] ? '#ff5555' : '#000';
        }
    }

    destroy() {
        if (this.timerId) clearInterval(this.timerId);
        if (this.delayTimeoutId) clearTimeout(this.delayTimeoutId);
        
        this.element.remove();
        
        // Cleanup global lists
        app.nodes = app.nodes.filter(n => n !== this);
        app.wires = app.wires.filter(w => {
            if (w.fromNode === this || w.toNode === this) {
                w.element.remove();
                return false;
            }
            return true;
        });
    }
}
