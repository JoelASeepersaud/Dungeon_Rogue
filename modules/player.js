import { Entity } from './Entity.js';
import { AoeDamageArea, LightningStike, statBoost } from './perks.js'
let perkList = []

export class Player extends Entity {
    constructor(scene, position) {
        super(scene, './assets/textures/creature_sprites/player_sprite_sheet.png', position);
        this.health = 100;
        this.damage = 20;
        this.Exp = 0;
        this.level = 1;
        this.ExpReq = 10;
        this.perks = [];
        this.attackSpeed = 500; // 1 second = 1000
        this.attackRange = 3;
        this.leveledUp = false;

        perkList = [new AoeDamageArea(this.scene, this), new LightningStike(this.scene), new statBoost()]
    }

    // Levelup player if exp requirement is met
    levelUp() {
        if (this.Exp >= this.ExpReq) {
            this.level++;
            this.health += 10;
            this.damage += 6;
            this.ExpReq += 10 * this.level;
            this.leveledUp = true;
        }
    }

    selectPerks(){
        this.showPerkSelection(perkList)
    }

    // Display perk selection to select one of three perks
    showPerkSelection(perkOptions) {
        const hud = document.getElementById('perk-selection');
        hud.innerHTML = ''; // Clear previous options
      
        perkOptions.forEach(perk => {
          const card = document.createElement('div');
          card.className = 'perk-card';
          if (perk.activated) card.innerHTML = `<h3>${perk.name}</h3><p>${perk.upgradeDisc}</p>`;
          else card.innerHTML = `<h3>${perk.name}</h3><p>${perk.discription}</p>`;
          
          card.addEventListener('click', () => {
            if (perk.activated) perk.upgrade();
            else if (perk instanceof statBoost ) perk.activate(this);
            else {
                this.perks.push(perk);
                perk.activate(this);
            }
            hud.style.display = 'none'; // Hide HUD after selection
            this.leveledUp = false;

            // Resume game
            window.gamePause = false;
            requestAnimationFrame(window.render);

          });
      
          hud.appendChild(card);
        });
      
        hud.style.display = 'flex'; // Show the HUD
      }

    // Damage enemy if in range and off cooldown
    attack(enemy) {
        const distance = enemy.sprite.position.distanceTo(this.sprite.position);
        if (distance <= this.attackRange && this.isAttacking && this.attackCooldown()) {
            enemy.takeDamage(this.damage, this);
            enemy.sprite.material.color.set(0xff0000);
            setTimeout(() => {
                enemy.sprite.material.color.set(0xffffff);
              }, 200);
            this.atkCooldown = Date.now();
        }
    }

    // Update player animation and levelup condition
    update(enemies) {
        this.perks.forEach(perk=>{
            perk.update(this, enemies)
        });
        this.animate();
        this.levelUp();
    }
}
