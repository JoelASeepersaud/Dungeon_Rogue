export function characterControls(player, wallBoundingBoxes){    
    // key states
    let keys = {
    w: false, // forward
    s: false, // backwards
    a: false, // left
    d: false, // right
    q: false, // dash
    e: false, // interact
    space: false // attack
    };

    // keydown listener to update key states to true if pressed
    document.addEventListener('keydown', (event) => {
    let key = event.key.toLowerCase(); // convert key to lowercase
    if (key === ' ') key = 'space'
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
    });

    // keyup listener to update key states to false if released
    document.addEventListener('keyup', (event) => {
    let key = event.key.toLowerCase(); // convert key to lowercase
    if (key === ' ') key = 'space'
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
    });

    // camera movement based on key pressed
    function updateCharacterMovement() {
        if (keys.space) {
            player.isAttacking = true;
        } else player.isAttacking = false;

        if (Object.entries(keys).every(([key, value]) => key === 'space' || value === false)) {
            player.move('idle', wallBoundingBoxes)
        }

        if (keys.w) {
            player.move('up', wallBoundingBoxes); // Move up
        }
        if (keys.s) {
            player.move('down', wallBoundingBoxes); // Move down
        }
        if (keys.a) {
            player.move('left', wallBoundingBoxes); // Strafe left
        }
        if (keys.d) {
            player.move('right', wallBoundingBoxes); // Strafe right
        }

        if (keys.e) {
            player.isInteracting = true; // interacting
        } else player.isInteracting = false; // not interacting

        requestAnimationFrame(updateCharacterMovement);
    }
    updateCharacterMovement();
}