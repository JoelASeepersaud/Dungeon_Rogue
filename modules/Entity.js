import * as THREE from 'three';

export class Entity {
    constructor(scene, texturePath, position = new THREE.Vector3(0, 0, 0.5), columns = 8, rows = 15) {
        this.scene = scene;

        // Entity stats and states
        this.health = 100;
        this.moveSpeed = 0.05;
        this.attackSpeed = 1000;
        this.atkCooldown = Date.now();
        this.attackRange = 1;
        this.score = 0;
        this.isAlive = true;
        this.isAttacking = false;
        this.isInteracting = false;
        this.stopUpdate = false;

        // Load spritesheet
        const loader = new THREE.TextureLoader();
        this.texture = loader.load(texturePath);
        this.columns = columns;
        this.rows = rows;
        this.texture.repeat.set(1 / this.columns, 1 / this.rows);
        this.texture.offset.set(0, 1 - 1 / this.rows);

        // Create Sprite
        this.mat = new THREE.SpriteMaterial({ map: this.texture, transparent: true });
        this.sprite = new THREE.Sprite(this.mat);
        this.sprite.position.copy(position);
        this.sprite.scale.set(3, 3, 3);

        scene.add(this.sprite);

        // Used for traversing spritesheet and animation
        this.row = 0;
        this.lastCol = 3;
        this.currentCol = 1;
        this.lastFrameTime = 0;
        this.movement = 'down';
        this.action = 'idle';
    }

    // Update health when taking damage
    takeDamage(damage) {
        this.health -= damage;
        if (this.health < 0 && this.isAlive) {
            this.health = 0;
            this.isAlive = false;
            this.getSpriteSheet(this.movement, 'death');
        }
    }

    // Check cooldown of attack
    attackCooldown() {
        return Date.now() >= this.atkCooldown + this.attackSpeed;
    }

    // Get spritesheet textures for action and direction of entity
    getSpriteSheet(direction, action){
        const directionIndex = { // direction
            down: 0,
            up: 1,
            left: 2,
            right: 2
        }[direction];

        const actionIndex = { // action
            idle: {set: 0, maxcolumn: 3},
            hurt: {set: 1, maxcolumn: 1},
            move: {set: 2, maxcolumn: 5},
            death: {set: 3, maxcolumn: 7},
            attack: {set: 4, maxcolumn: 3}
        }[action];

        // New animation if direction or action is different and if entity is defeated or not in the middle of attack animation
        if ((this.action !== 'attack'|| this.currentCol === 0 || this.action === 'death') && (direction !== this.movement || action !== this.action)){

            // Get sprite row and total number of columns for animation
            this.row = actionIndex['set'] * 3 + directionIndex;
            this.lastCol = actionIndex['maxcolumn'];

            // Flip texture to face towards the right when entity is moving right
            if ((direction === 'right')){
                if (this.texture.repeat.x > 0) {
                    this.texture.repeat.x = -1 / this.columns;
                    this.texture.offset.x = (this.currentCol + 1) / this.columns;
                }
            }else{
                if (this.texture.repeat.x < 0) {
                    this.texture.repeat.x = 1 / this.columns;
                    this.texture.offset.x = this.currentCol / this.columns;
                }
            }

            this.movement = direction;
            this.action = action;
            this.currentCol = 0;
            this.lastFrameTime = 0;
        }
    }

    // Animate entity using spritesheet
    animate() {
        // Check texture duration to pace animation
        const now = Date.now();
        if (now - this.lastFrameTime > 100) {

            // Continue animation by offsetting texture until reach last column
            if (this.currentCol <= this.lastCol) {
                if (this.texture.repeat.x > 0) {
                    this.texture.offset.x = this.currentCol / this.columns;
                } else {
                    this.texture.offset.x = (this.currentCol + 1) / this.columns;
                }
                this.texture.offset.y = 1 - (this.row + 1) / this.rows;
                this.currentCol++;
            } else {
                if (this.isAlive) this.currentCol = 0; // Reset column at end of animation
                else { // Delete entity when defeated and death animation ends
                    this.dispose();
                    this.stopUpdate = true;
                }
            }
            this.lastFrameTime = now;
        }
    };

    // Move and check collision of entity
    move(direction, wallBoundingBoxes){
        if (this.isAlive){
            let dx = 0, dy = 0;

            if (direction === 'up') {
                dy += this.moveSpeed; // Move up
            }else if (direction === 'down') {
                dy -= this.moveSpeed; // Move down
            }else if (direction === 'left') {
                dx -= this.moveSpeed; // Strafe left
            }else if (direction === 'right') {
                dx += this.moveSpeed; // Strafe right
            }else if (this.isAttacking === false) {
                this.getSpriteSheet(this.movement, 'idle'); // Idle
                return;
            }else if (this.isAttacking) {
                this.getSpriteSheet(this.movement, 'attack'); // Attacking while not moving
                return;
            }

            // Check Collision
            const newPos = this.sprite.position.clone().add(new THREE.Vector3(dx, dy, 0));

            const futureBox = new THREE.Box2(
                new THREE.Vector2(newPos.x - this.sprite.scale.x / 2, newPos.y - this.sprite.scale.y / 2),
                new THREE.Vector2(newPos.x + this.sprite.scale.x / 2, newPos.y + this.sprite.scale.y / 2)
            );

            let collides = false;
            for (const wallBox of wallBoundingBoxes) {
                if (futureBox.intersectsBox(wallBox)) {
                    collides = true;
                    break;
                }
            }

            if (!collides) {
                // Only move if no collision
                this.sprite.position.x += dx;
                this.sprite.position.y += dy;
            }else return;

            if (this.isAttacking) this.getSpriteSheet(direction, 'attack'); // Attacking while moving
            else this.getSpriteSheet(direction, 'move'); // Moving without attacking
        }
    };

    // Completely remove entity
    dispose() {
        this.scene.remove(this.sprite);
        if (this.sprite.geometry) this.sprite.geometry.dispose();
        if (this.sprite.material) {
            if (Array.isArray(this.sprite.material)) {
                this.sprite.material.forEach(m => m.dispose());
            } else {
                this.sprite.material.dispose();
            }
        }
        this.sprite = null;
    }
}
