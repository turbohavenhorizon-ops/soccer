import * as THREE from 'three';

const randomOffset = () => new THREE.Vector3((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 8);

export class TeamAI {
  constructor({ scene, physics, color, isHome, playerCount }) {
    this.scene = scene;
    this.physics = physics;
    this.color = color;
    this.isHome = isHome;
    this.players = [];
    this.goalZ = isHome ? -72.5 : 72.5;
    this.setupPlayers(playerCount);
  }

  setupPlayers(count) {
    const baseZ = this.isHome ? -25 : 25;
    for (let i = 0; i < count; i += 1) {
      const player = this.createPlayer(i, baseZ);
      this.players.push(player);
    }
  }

  createPlayer(index, baseZ) {
    const playerGroup = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.45, metalness: 0.05 });
    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 7.4, 14), bodyMaterial);
    bodyMesh.position.y = 0;
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16), new THREE.MeshStandardMaterial({ color: '#ffe7ce', roughness: 0.3 }));
    headMesh.position.y = 4.8;
    const shoulder = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.7, 8, 24), bodyMaterial);
    shoulder.rotation.x = Math.PI / 2;
    shoulder.position.y = 1.4;
    playerGroup.add(bodyMesh, headMesh, shoulder);
    playerGroup.castShadow = true;
    playerGroup.receiveShadow = true;
    const startX = -32 + index * 16 + (this.isHome ? -12 : 12);
    const startZ = baseZ + (index % 2 === 0 ? -8 : 8);
    const startPosition = new THREE.Vector3(startX, 4.2, startZ);
    playerGroup.position.copy(startPosition);
    this.scene.add(playerGroup);

    const body = this.physics.addPlayer(playerGroup, startPosition.clone());
    return new PlayerAI({ mesh: playerGroup, body, team: this, role: index, isHome: this.isHome });
  }

  update(delta, ball, activePlayer, input) {
    this.players.forEach((player) => player.update(delta, ball, activePlayer, input));
  }
}

class PlayerAI {
  constructor({ mesh, body, team, role, isHome }) {
    this.mesh = mesh;
    this.body = body;
    this.team = team;
    this.role = role;
    this.isHome = isHome;
    this.speed = 22;
    this.position = mesh.position.clone();
    this.target = mesh.position.clone();
    this.shootCooldown = 0;
  }

  reset() {
    this.body.position.copy(this.position);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
    this.mesh.position.copy(this.position);
    this.target.copy(this.position);
    this.shootCooldown = 0;
  }

  update(delta, ball, activePlayer, input) {
    this.shootCooldown = Math.max(0, this.shootCooldown - delta);
    const ballDistance = this.mesh.position.distanceTo(ball.position);
    const goalPoint = new THREE.Vector3(0, 0, this.team.goalZ + (this.isHome ? -7 : 7));
    const isControlled = activePlayer === this;
    const controlTarget = new THREE.Vector3();

    if (isControlled && input) {
      const direction = new THREE.Vector3();
      if (input.forward) direction.z -= 1;
      if (input.backward) direction.z += 1;
      if (input.left) direction.x -= 1;
      if (input.right) direction.x += 1;
      if (direction.lengthSq() > 0) {
        direction.normalize();
        this.body.velocity.set(direction.x * this.speed, 0, direction.z * this.speed);
      } else {
        this.body.velocity.scale(0.5, this.body.velocity);
      }
      if (input.shoot && ballDistance < 8) {
        this.tryKick(ball, goalPoint, 16);
      }
      return;
    }

    if (ballDistance < 16) {
      this.target.copy(ball.position).add(randomOffset());
      if (ballDistance < 6) {
        this.tryKick(ball, goalPoint, 12);
      }
    } else {
      const preferredZ = this.isHome ? -32 : 32;
      controlTarget.set(this.position.x, 0, preferredZ).add(randomOffset());
      if (Math.abs(ball.position.z - this.team.goalZ) < 30) {
        controlTarget.set(ball.position.x * 0.8, 0, ball.position.z + (this.isHome ? 16 : -16));
      }
      this.target.copy(controlTarget);
    }

    const move = this.target.clone().sub(this.mesh.position);
    if (move.length() > 0.8) {
      move.normalize();
      this.body.velocity.set(move.x * this.speed, 0, move.z * this.speed);
    } else {
      this.body.velocity.scale(0.35, this.body.velocity);
    }
  }

  tryKick(ball, goalPoint, strength) {
    if (this.shootCooldown > 0) return;
    const direction = goalPoint.clone().sub(ball.position).normalize();
    ball.body.velocity.copy(direction.multiplyScalar(strength));
    this.shootCooldown = 1.2;
  }

  sync() {
    this.mesh.position.copy(this.body.position);
  }
}
