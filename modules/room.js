import * as THREE from 'three';

// Size of floor tile
const tileSize = 2;

// function to generate room 
export function Room(scene, width, height){

    // Load textures for room walls and floors
    const loader = new THREE.TextureLoader();
    const floorTexture = loader.load('./assets/textures/floor_tiles/Tile_96.png');
    const wallTexture = loader.load('./assets/textures/floor_tiles/Tile_48.png');

    // Array to store wall bounding boxes
    const wallBoundingBoxes = [];

    for (let x = 0; x < width; x++){
        for (let y = 0; y< height; y++){

            const isWall = (x === 0 || x === width - 1 || y === 0 || y === height - 1);
            const floorGeo = new THREE.PlaneGeometry(tileSize, tileSize);
            const floorMat = new THREE.MeshStandardMaterial({transparent: true, map: isWall? wallTexture : floorTexture});

            const floorTile = new THREE.Mesh(floorGeo, floorMat);
            floorTile.position.set(
                (x - width/2) * tileSize + tileSize/2,
                (y - height/2) * tileSize + tileSize/2,
                0
            );
            scene.add(floorTile);

            if (isWall) {
                // Add wall bounding box
                const box = new THREE.Box2(
                    new THREE.Vector2(floorTile.position.x - tileSize / 2, floorTile.position.y - tileSize / 2),
                    new THREE.Vector2(floorTile.position.x + tileSize / 2, floorTile.position.y + tileSize / 2)
                );
                wallBoundingBoxes.push(box);
            }
        }
    }
    return wallBoundingBoxes;
}