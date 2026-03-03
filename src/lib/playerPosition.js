import * as THREE from 'three'

// Shared mutable Vector3 for the player's world position.
// Written by the Player component each frame, read by the camera.
export const playerPosition = new THREE.Vector3()
