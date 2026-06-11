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
    const bodyGeometry = new THREE.CapsuleGeometry(3.2, 4.5, 6, 12);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.45, metalness: 0.05 });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 16), new THREE.MeshStandardMaterial({ color: '#ffe7ce', roughness: 0.3 }));
    head.position.y = 5.2;
    bodyMesh.add(head);
    bodyMesh.castShadow = true;
    bodyMesh.position.set(-32 + index * 16 + (this.isHome ? -12 : 12), 4, baseZ + (index % 2 === 0 ? -8 : 8));
    this.scene.add(bodyMesh);

    const body = this.physics.addPlayer(bodyMesh, bodyMesh.position);
    return new PlayerAI({ mesh: bodyMesh, body, team: this, role: index, isHome: this.isHome });
  }

  update(delta, ball, activePlayer) {
    this.players.forEach((player) => player.update(delta, ball, activePlayer));
  }
}

class PlayerAI {
  constructor({ mesh, body, team, role, isHome }) {
    this.mesh = mesh;
    this.body = body;
    this.team = team;
    this.role = role;
    this.isHome = isHome;
    this.speed = 18;
    this.position = mesh.position.clone();
    this.target = mesh.position.clone();
    this.defenseRadius = this.isHome ? -55 : 55;
    this.hasBall = false;
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

  update(delta, ball, activePlayer) {
    this.shootCooldown = Math.max(0, this.shootCooldown - delta);
    const ballDistance = this.mesh.position.distanceTo(ball.position);
    const goalPoint = new THREE.Vector3(0, 0, this.team.goalZ + (this.isHome ? -7 : 7));
    const homeOffset = this.isHome ? 1 : -1;

    if (ballDistance < 16) {
      this.target.copy(ball.position).add(randomOffset());
      if (ballDistance < 6) {
        this.tryKick(ball, goalPoint);
      }
    } else if (Math.abs(this.mesh.position.z) < 45) {
      const defenseLine = new THREE.Vector3(this.mesh.position.x * 0.75, 0, this.team.goalZ + homeOffset * 20);
      this.target.copy(defenseLine).add(randomOffset());
    } else {
      const attackLine = new THREE.Vector3(this.mesh.position.x * 0.8, 0, this.team.goalZ + homeOffset * -10);
      this.target.copy(attackLine).add(randomOffset());
    }

    const move = this.target.clone().sub(this.mesh.position);
    if (move.length() > 0.6) {
      move.normalize();
      const speed = this.speed * (this.body.velocity.length() > 0.1 ? 1 : 1.3);
      this.body.velocity.set(move.x * speed, 0, move.z * speed);
    } else {
      this.body.velocity.scale(0.4, this.body.velocity);
    }
  }

  tryKick(ball, goalPoint) {
    if (this.shootCooldown > 0) return;
    const direction = goalPoint.clone().sub(ball.position).normalize();
    const force = 12 + Math.random() * 8;
    ball.body.velocity.copy(direction.multiplyScalar(force));
    this.shootCooldown = 1.4;
  }

  sync() {
    this.mesh.position.copy(this.body.position);
  }
}
