class Player {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.speed = 10;
        this.selectedSlot = 0; // 0 to 6
        this.inventory = [1, 2, 3, 6, 4, 7, 8]; // IDs for the hotbar
    }

    update(keys) {
        // Movement
        if (keys['KeyW']) this.y -= this.speed;
        if (keys['KeyS']) this.y += this.speed;
        if (keys['KeyA']) this.x -= this.speed;
        if (keys['KeyD']) this.x += this.speed;

        // Hotbar Selection (Number Keys 1-7)
        for (let i = 1; i <= 7; i++) {
            if (keys['Digit' + i]) {
                this.selectedSlot = i - 1;
                this.updateUI();
            }
        }
    }

    updateUI() {
        // Remove 'active' class from all slots
        const slots = document.querySelectorAll('.slot');
        slots.forEach(slot => slot.classList.remove('active'));
        
        // Add to the current one
        if(slots[this.selectedSlot]) {
            slots[this.selectedSlot].classList.add('active');
        }

        // Update Coordinates in UI
        document.getElementById('pos-display').innerText = 
            `${Math.floor(this.x)}, ${Math.floor(this.y)}`;
    }
}
