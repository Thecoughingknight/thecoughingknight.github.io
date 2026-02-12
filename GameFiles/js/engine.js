/**
 * ENGINE.JS
 * The Core: Handles Nodes, Wires, and Logic Simulation.
 * Revised to allow full-body dragging of Inputs/Outputs.
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
        
        // Track drag start position to distinguish Click vs Drag
        this.startDragX = 0;
        this.startDragY = 0;

        // Initialize based on Type
        if (type === 'gate') {
            if (gateType === 'timer') {
                this.startTimer();
            } else if (gateType === 'not' || gateType === 'nand') {
                this.outputStates[0] = true; 
            }
        } else if (type === 'input') {
            this.inputStates = [];
            this.outputStates = [false];
        } else if (type === 'output') {
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

        // 1. Node Content
        if (this.type === 'gate') {
            div.innerText = (this.internalData ? this.gateType : (this.gateType || "GATE")).toUpperCase();
            const height = Math.max(30, this.pins * 15 + 10);
            div.style.height = height + 'px';
        } else {
            // Input/Output Circle
            const circle = document.createElement('div');
            circle.className = 'io-circle';
            // NOTE: We do NOT add a mousedown listener here anymore.
            // We let the event bubble up to the main div so dragging works everywhere.
            div.appendChild(circle);
        }

        // 2. Ports (Inputs)
        if (this.type !== 'input') {
            const count = this.pins;
            for (let i = 0; i < count; i++) {
                div.appendChild(this.createPort('in', i));
            }
        }

        // 3. Ports (Outputs)
        if (this.type !== 'output') {
            const count = (this.internalData) ? this.internalData.numOut : 1;
            for (let i = 0; i < count; i++) {
                div.appendChild(this.createPort('out', i));
            }
        }

        // 4. Interaction: Mouse Down (Start Drag)
        div.addEventListener('mousedown', (e) => {
            // If clicking a port, let the port handle wiring
            if (e.target.classList.contains('port')) return;

            // Shift+Click: Edit/Label
            if (e.shiftKey) {
                e.stopPropagation();
                if (this.gateType === 'timer') app.openTimerModal(this);
                else app.openLabelModal(this);
                return;
            }

            // Start Dragging (Works on circle and body)
            app.draggingNode = this;
            
            // Record position to detect "Click" vs "Drag" later
            this.startDragX = this.x;
            this.startDragY = this.y;

            const r = div.getBoundingClientRect();
            app.dragOffset = { x: e.clientX - r.left, y: e.clientY - r.top };
            
            // Bring to front
            div.style.zIndex = 100;
        });

        // 5. Interaction: Mouse Up (Reset Z-Index)
        div.addEventListener('mouseup', () => {
             div.style.zIndex = 10;
        });

        // 6. Interaction: Click (Toggle Input)
        // This fires after MouseDown -> MouseUp
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('port')) return;

            // Calculate distance moved
            const dist = Math.abs(this.x - this.startDragX) + Math.abs(this.y - this.startDragY);

            // If moved more than 2 pixels, it was a drag, not a click. Ignore toggle.
            if (dist > 2) return;

            // If it's an Input node, Toggle it
            if (this.type === 'input') {
                this.outputStates[0] = !this.outputStates[0];
                app.runLogic();
                this.updateVisuals();
            }
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
        
        const isInput = type === 'in';
        const total = isInput ? this.inputStates.length : this.outputStates.length;
        
        if (total > 1) {
            const step = 15; 
            p.style.top = (10 + index * step) + 'px';
        } else {
            p.style.top = '50%';
            p.style.transform = 'translateY(-50%)';
        }
        
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
            // Custom Chip logic placeholder
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
                    if (a !== this.lastDelayInput) {
                        if (this.delayTimeoutId) clearTimeout(this.delayTimeoutId);
                        this.delayTimeoutId = setTimeout(() => {
                            this.outputStates[0] = a;
                            this.lastDelayInput = a;
                            app.runLogic();
                        }, 500);
                    }
                    break;
                
                case 'timer': break; // Handled by setInterval
            }
        } else if (this.type === 'output') {
            // Output nodes purely visual
        }

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

        if (fromNode === this) {
            app.activeWire.element.remove();
            app.activeWire = null;
            return;
        }

        app.activeWire.element.remove();
        app.activeWire = null;

        const exists = app.wires.some(w => 
            w.fromNode === fromNode && w.fromIdx === fromIdx && 
            w.toNode === this && w.toIdx === toIndex
        );

        if (exists) return;

        const existingInputWireIdx = app.wires.findIndex(w => w.toNode === this && w.toIdx === toIndex);
        if (existingInputWireIdx !== -1) {
            app.wires[existingInputWireIdx].element.remove();
            app.wires.splice(existingInputWireIdx, 1);
        }

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
        const rect = this.element.getBoundingClientRect();
        const containerRect = document.getElementById('canvas-container').getBoundingClientRect();
        
        const selector = `.port-${isInput ? 'in' : 'out'}`;
        const ports = this.element.querySelectorAll(selector);
        
        if (!ports[index]) return { x: this.x, y: this.y };

        const portRect = ports[index].getBoundingClientRect();

        return {
            x: portRect.left - containerRect.left + (portRect.width / 2),
            y: portRect.top - containerRect.top + (portRect.height / 2)
        };
    }

    // --- Features ---

    startTimer() {
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = setInterval(() => {
            this.outputStates[0] = !this.outputStates[0];
            app.runLogic();
        }, this.timerInterval);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
        app.updateWireVisuals();
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
        if (this.type === 'input') {
            const circle = this.element.querySelector('.io-circle');
            if (this.outputStates[0]) circle.classList.add('active');
            else circle.classList.remove('active');
        } else if (this.type === 'output') {
            const circle = this.element.querySelector('.io-circle');
            if (this.inputStates[0]) circle.classList.add('active');
            else circle.classList.remove('active');
        } else if (this.gateType === 'timer') {
             this.element.style.borderColor = this.outputStates[0] ? '#ff5555' : '#000';
        }
    }

    destroy() {
        if (this.timerId) clearInterval(this.timerId);
        if (this.delayTimeoutId) clearTimeout(this.delayTimeoutId);
        this.element.remove();
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
