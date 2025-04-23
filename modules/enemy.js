import { Entity } from './Entity.js';

// Class to create enemies
export class Enemy extends Entity {
    constructor(scene, difficulty, position) {
        super(scene, './assets/textures/creature_sprites/enemy_sprite_sheet_4.png', position);
        this.health = 50 + 10 * (difficulty - 1);
        this.damage = 10 + 10 * (difficulty - 1);
        this.moveSpeed = 0.02;
        this.Exp = 2 + 2 * (difficulty - 1);
        this.attackSpeed = 1000; // 1 second = 1000
        this.attackRange = 1;
        this.score = 10;
    }

    // Update Enemy health when taking damage and gives player exp and score when health full depletes
    takeDamage(damage, player) {
        super.takeDamage(damage);
        if (!this.isAlive) {
            player.Exp += this.Exp;
            player.score += this.score;
        }
    }

    // Enemies target player
    targetPlayer(player, wallBoundingBoxes) {

        // Move towards player
        const dx = player.sprite.position.x - this.sprite.position.x;
        const dy = player.sprite.position.y - this.sprite.position.y;
        const direction = Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? 'right' : 'left'
            : dy > 0 ? 'up' : 'down';

        this.move(direction, wallBoundingBoxes);

        // Attack player when close and able to
        const distance = player.sprite.position.distanceTo(this.sprite.position);
        if (distance <= this.attackRange && this.attackCooldown()) {
            this.getSpriteSheet(this.movement, 'attack');
            player.takeDamage(this.damage);
            this.atkCooldown = Date.now();
        }
    }

    // Update animations and player targeting
    update(player, wallBoundingBoxes) {
        if (this.isAlive) {
            this.targetPlayer(player, wallBoundingBoxes);
        }
        this.animate();
    }
}
