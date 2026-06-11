import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.solver.iterations = 12;
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.35;

    this.ball = null;
    this.playerBodies = [];
  }

  addGround(mesh) {
    const shape = new CANNON.Plane();
    const body = new CANNON.Body({ mass: 0, shape, material: this.world.defaultContactMaterial });
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(body);
  }

  addBall(mesh) {
    const radius = 3.5;
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({ mass: 0.55, shape, position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z), material: this.world.defaultContactMaterial });
    body.linearDamping = 0.24;
    body.angularDamping = 0.26;
    this.world.addBody(body);
    this.ball = { mesh, body };
  }

  addPlayer(mesh, position) {
    const shape = new CANNON.Sphere(4);
    const body = new CANNON.Body({ mass: 55, shape, position: new CANNON.Vec3(position.x, position.y, position.z), fixedRotation: true });
    body.linearDamping = 0.75;
    this.world.addBody(body);
    this.playerBodies.push({ mesh, body });
    return body;
  }

  step(delta) {
    this.world.step(1 / 60, delta, 3);
    this.playerBodies.forEach((entry) => {
      entry.mesh.position.copy(entry.body.position);
    });
  }

  resetBall({ position, velocity }) {
    this.ball.body.position.copy(position);
    this.ball.body.velocity.copy(velocity);
    this.ball.body.angularVelocity.set(0, 0, 0);
  }
}
