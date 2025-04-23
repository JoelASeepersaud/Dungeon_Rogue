import * as THREE from 'three';
import Stats from "stats.js";

import { Room } from './modules/room.js';
import { characterControls } from './modules/CharacterControls.js';
import { Player } from './modules/player.js';
import { Enemy } from './modules/enemy.js';

// Create an empty scene
var scene = new THREE.Scene();

// Create a basic perspective camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.set(0,0,20)

// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer({antialias:true});

// Configure renderer clear color
renderer.setClearColor("#000000");

// Configure renderer size
renderer.setSize( window.innerWidth, window.innerHeight );

// Append Renderer to DOM
document.body.appendChild( renderer.domElement );

// Handle Window Resizing
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

// fps counter
const stats = new Stats();
document.body.appendChild(stats.dom);
stats.dom.style.transform = 'scale(2)'; // Scale up by 2x
stats.dom.style.transformOrigin = 'bottom right'; // Set the scaling origin
stats.dom.style.position = 'fixed';
stats.dom.style.right = '0px';
stats.dom.style.bottom = '0px';
stats.dom.style.left = 'auto';
stats.dom.style.top = 'auto';

// HTML Elements
const menu = document.getElementById('menu-screen');
const hud = document.getElementById('hud');
const GameOver = document.getElementById('GameOver');
const playButton = document.getElementById('play-button');
const replayButton = document.getElementById('replay-button');

// Global Variables
let character;
let spawnAmt;
let enemyRemain;
let enemies = [];
let spawnInterval;
let gameStart = false;
let difficulty;
let roomNum;
let walls = [];
window.gamePause = false;

// Button to start game
playButton.addEventListener('click', () => {
  requestAnimationFrame(() => {
    menu.style.display = 'none';
    GameOver.style.display = 'none';
    hud.style.display = 'block';
    startGame();
  });
});

// Button to reset game
replayButton.addEventListener('click', () => {
  requestAnimationFrame(() => {
    menu.style.display = 'none';
    GameOver.style.display = 'none';
    hud.style.display = 'block';
    reset();
  });
});

// Update Hud
function updateHUD(character) {
  document.getElementById('Room').textContent = roomNum;
  document.getElementById('Enemies').textContent = enemyRemain;
  document.getElementById('Score').textContent = character.score;
  document.getElementById('PlayerScore').textContent = character.score;
  document.getElementById('health').textContent = character.health;
  document.getElementById('level').textContent = character.level;
  document.getElementById('Exp').textContent = character.Exp;
  document.getElementById('ExpReq').textContent = character.ExpReq;
}

// Reset scene
function reset(){
  scene.traverse(object => {
    if (object.geometry) object.geometry.dispose();
  
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(mat => mat.dispose());
      } else {
        object.material.dispose();
      }
    }
  
    // Dispose of any textures if applicable
    if (object.material && object.material.map) {
      object.material.map.dispose();
    }
  });

  while (scene.children.length > 0) {
    scene.remove(scene.children[0]);
  }
  startGame();
}

// Function to setup and start game
function startGame(){
  gameStart = true;

  // directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, .5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // ambient light
  const ambientLight = new THREE.AmbientLight(0x777777, 0.5); // Soft light
  scene.add(ambientLight);

  // Generate room
  walls = Room(scene, 30, 15);

  // generate player
  character = new Player(scene);

  characterControls(character, walls);

  enemies = [];
  spawnAmt = 20;
  enemyRemain = spawnAmt;
  spawnInterval = setInterval(spawnEnemies, 1000)

  window.gamePause = false;
  difficulty = 1;
  roomNum = 1;
}

// Spawn enemies away from player
function spawnEnemies(){
  let minDistance = 5;
  if (spawnAmt > 0) {
    let spawnPos;
    do {
      // Random position within spawn range
      const x = (Math.random() * 50) - 25;
      const y = (Math.random() * 20) - 10;
  
      spawnPos = new THREE.Vector3(x, y, .5);
    } while (spawnPos.distanceTo(character.sprite.position) < minDistance);

    enemies.push( new Enemy(scene, difficulty, new THREE.Vector3(spawnPos.x, spawnPos.y, .5)) );
    spawnAmt--;
  }else clearInterval(spawnInterval);
}

// Render Loop
var render = function () {
  window.render = render;
  stats.begin();
  if (!window.gamePause){
    requestAnimationFrame( render );
    if (gameStart){

      // Check if player is defeated to display GameOver Screen
      if (character && !scene.children.includes(character.sprite)) {
        GameOver.style.display = 'block';
        return;
      }

      // Update enemies and character
      enemies = enemies.filter(enemy => {
        character.attack(enemy);
        enemy.update(character, walls);

        if (enemy.stopUpdate) {
          enemyRemain--;
          enemy = null;
          return false; 
        }else return true;
      });

      character?.update(enemies);
    
      // Update hud
      updateHUD(character);

      if (character.leveledUp  && !window.gamePause) {
        window.gamePause = true;
        character.selectPerks();
      }
      
      // Progress to next room if all enemies are defeated
      if (enemyRemain == 0  && !window.gamePause){
        difficulty++;
        roomNum++;
        enemies = [];
        spawnAmt = 10;
        enemyRemain = spawnAmt;
        spawnInterval = setInterval(spawnEnemies, 1000)
        character.score += 1000;
        window.gamePause = true
        character.selectPerks();
      }
    }
  
    // Render the scene
    renderer.render(scene, camera);
  }
  stats.end();
};

render();