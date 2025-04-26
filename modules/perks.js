import * as THREE from 'three';

export class perk {
    constructor(name, discription, upgradeDisc){
        this.name = name;
        this.discription = discription;
        this.upgradeDisc = upgradeDisc;
        this.level = 1;
        this.isActive = false;
        this.activated = false;
    }
}

export class AoeDamageArea extends perk {
    constructor(scene){
        super("Damaging Circle", 
            "Damage enemies every 0.3 seconds within the circle, player is center of circle", 
            "Increase radius and damage by .2")
        this.scene = scene;
        this.damage = 1;
        this.attackSpeed = 300;
        this.atkCooldown = Date.now();

        this.radius = 5;
        const circleMat = new THREE.MeshBasicMaterial({color: 0xff0000, transparent: true, opacity: 0.1})
        const circleGeo = new THREE.CircleGeometry(this.radius);
        this.aoeArea = new THREE.Mesh(circleGeo, circleMat);
        
    }

    // Activate perk
    activate(player){
        this.activated = true;
        this.aoeArea.position.set(player.sprite.position.x, player.sprite.position.y, player.sprite.position.z - .1);
        this.scene.add(this.aoeArea);
    }

    // Check cooldown of attack
    attackCooldown() {
        return Date.now() >= this.atkCooldown + this.attackSpeed;
    }

    // Apply perk effect
    effect(player, targets){
        function getTargetsInAOE(center, targets, radius) {
            return targets.filter(target => {
              const distance = center.distanceTo(target.sprite.position);
              return distance <= radius;
            });
          }
          const enemiesInRange = getTargetsInAOE(this.aoeArea.position, targets, this.radius);
          enemiesInRange.forEach(enemy => {
            if (enemy.isAlive) enemy.takeDamage(this.damage, player);
          });
          this.atkCooldown = Date.now();
    }

    // Apply perk upgrade
    upgrade(){
        this.radius += .2;
        this.damage += .2;
        const newGeo = new THREE.CircleGeometry(this.radius);
        this.aoeArea.geometry.dispose();
        this.aoeArea.geometry = newGeo;
    }

    // Update perk
    update(player, enemies){
        if (this.activate){
            this.aoeArea.position.set(player.sprite.position.x, player.sprite.position.y, player.sprite.position.z - .1);
            if (this.attackCooldown()) this.effect(player, enemies);
        }
    }
}

export class LightningStike extends perk {
    constructor(scene){
        super("Lightning Strike", 
            "Every 6 seconds there is a chance that a random enemy will be struck by lightning", 
            "Reduce cooldown by 1 second and increase chance by +20%")
        this.scene = scene;

        this.damage = 20;
        this.isActive = false;
        this.strikeChance = .1;
        this.attackSpeed = 6000;
        this.atkCooldown = Date.now();

        const loader = new THREE.TextureLoader();
        this.texture = loader.load('./assets/textures/effects/lightning_strike_sprite_sheet.png');
        this.columns = 5;
        this.rows = 1;
        this.texture.repeat.set(1 / this.columns, 1 / this.rows);
        this.texture.offset.set(0, 1 - 1 / this.rows);
        
        this.mat = new THREE.SpriteMaterial({ map: this.texture, transparent: true });
        this.sprite = new THREE.Sprite(this.mat);
        this.sprite.scale.set(3,3,3)

        this.row = 0;
        this.lastCol = 3;
        this.currentCol = 1;
        this.lastFrameTime = 0;
    }

    // Activate Perk
    activate(player){
        this.activated = true;
    }

    // Animate perk using spritesheet
    animate() {
        // Check texture duration to pace animation
        const now = Date.now();
        if (now - this.lastFrameTime > 50) {

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
                this.currentCol = 0;
                this.scene.remove(this.sprite);
                this.isActive = false;
            }
            this.lastFrameTime = now;
        }
    };

    // Check cooldown of attack
    attackCooldown() {
        return Date.now() >= this.atkCooldown + this.attackSpeed;
    }

    // Apply perk effect
    effect(player, targets){
        if(Math.random() < this.strikeChance && targets.length !== 0 && this.attackCooldown()){
            let target = targets[Math.floor(Math.random() * targets.length)];
            this.sprite.position.set(target.sprite.position.x, target.sprite.position.y+.5, target.sprite.position.z + .1);
            this.scene.add(this.sprite);
            target.takeDamage(this.damage, player)
            this.isActive = true;
            this.atkCooldown = Date.now()
        }
    }

    // Upgrade perk
    upgrade(){
        if (this.level <= 3){
            this.attackSpeed -= 1;
            this.strikeChance += .2;
            if (this.level === 3) this.upgradeDisc = "Increase damage by 20";
        }else this.damage += 20;
        this.level++;
    }

    // Update perk
    update(player, enemies){
        if (this.activated){
            if (this.isActive) this.animate();
            else this.effect(player, enemies)
        }
    }
}

export class statBoost extends perk {
    constructor() {

        const name = `Stat Boost: Health`;
        const description = `Increases Health by 10.`;
        super(name, description);

        this.statNameMap = {
            health: {name: "Health", amt: 10},
            attackPower: {name: "Attack Damage", amt: 10},
            speed: {name: "Movement Speed", amt: .003}
          };
  
          this.amount = this.statNameMap['health']['amt'];
          this.stat = this.statNameMap['health']['name'];
      }

    // Activate perk
    activate(player){
        this.effect(player);
    }

    // Get random stat
    getStat(){
        const stats = Object.entries(this.statNameMap);
        const randomEntry = stats[Math.floor(Math.random() * stats.length)];
        const [key, value] = randomEntry;
        this.stat = value.name;
        this.amount = value.amt;
        this.name = `Stat Boost: ${this.stat}`;
        this.discription = `Increases ${this.stat} by ${this.amount}.`;
    }

    // Apply perk effect
    effect(player){
        if (this.stat === 'Health') player.health += this.amount;
        else if (this.stat === 'Attack Damage') player.damage += this.amount;
        else if (this.stat === 'Movement Speed') player.moveSpeed += this.amount;
        this.getStat();
    }
}