import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PhysicsWorld } from './physics.js';
import { InputManager } from './input.js';
import { TeamAI } from './ai.js';

export class Game {
  constructor({ target }) {
    this.target = target;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b1327');
    this.scene.fog = new THREE.FogExp2('#0b1327', 0.008);

    this.camera = new THREE.PerspectiveCamera(55, this.width / this.height, 0.1, 2200);
    this.camera.position.set(0, 100, 180);
    this.camera.lookAt(0, 10, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearColor('#0b1327', 1);
    this.target.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 70;
    this.controls.maxDistance = 380;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.target.set(0, 12, 0);

    this.physics = new PhysicsWorld();
    this.input = new InputManager();

    this.teams = [];
    this.players = [];
    this.ball = null;
    this.interface = {
      scoreboard: document.getElementById('scoreboard'),
      clock: document.getElementById('clock'),
    };
    this.matchTime = 0;
    this.homeScore = 0;
    this.awayScore = 0;
    this.activePlayer = null;

    this.buildEnvironment();
    this.buildEntities();
    this.buildLights();
    this.buildStadium();
    this.buildUI();
  }

  buildEnvironment() {
    const ambient = new THREE.HemisphereLight('#a6cfff', '#0a1320', 0.55);
    const directional = new THREE.DirectionalLight('#f8f0dc', 1.3);
    directional.position.set(120, 250, 140);
    directional.castShadow = true;
    directional.shadow.mapSize.set(2048, 2048);
    directional.shadow.camera.near = 10;
    directional.shadow.camera.far = 700;
    directional.shadow.camera.left = -260;
    directional.shadow.camera.right = 260;
    directional.shadow.camera.top = 240;
    directional.shadow.camera.bottom = -240;
    this.scene.add(ambient, directional);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1200, 32, 32),
      new THREE.MeshBasicMaterial({ color: '#0a1320', side: THREE.BackSide })
    );
    this.scene.add(sky);
  }

  buildLights() {
    const fill1 = new THREE.PointLight('#b9dbff', 1.2, 1200);
    fill1.position.set(-180, 180, -140);
    const fill2 = new THREE.PointLight('#faf3b0', 0.9, 1200);
    fill2.position.set(180, 140, 160);
    this.scene.add(fill1, fill2);
  }

  buildStadium() {
    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(215, 145),
      new THREE.MeshStandardMaterial({ color: '#1f5c20', roughness: 0.65, metalness: 0.12 })
    );
    field.rotation.x = -Math.PI / 2;
    field.receiveShadow = true;
    this.scene.add(field);
    this.physics.addGround(field);

    const painted = new THREE.Mesh(
      new THREE.PlaneGeometry(215, 145),
      new THREE.MeshBasicMaterial({ color: '#66a86d', wireframe: false, opacity: 0.18, transparent: true })
    );
    painted.rotation.x = -Math.PI / 2;
    painted.position.y = 0.01;
    this.scene.add(painted);

    const white = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(215, 145)),
      new THREE.LineBasicMaterial({ color: '#f4f4f4', linewidth: 1.2 })
    );
    white.rotation.x = -Math.PI / 2;
    white.position.y = 0.02;
    this.scene.add(white);

    this.addFieldMarkings();
    this.addStands();
    const gridHelper = new THREE.GridHelper(220, 22, '#3a5d8a', '#1f324d');
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.y = 0.02;
    this.scene.add(gridHelper);
  }

  addFieldMarkings() {
    const markings = new THREE.Group();
    const material = new THREE.LineBasicMaterial({ color: '#f4f4f4' });
    const lines = [];

    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-107.5, 0.05, 0), new THREE.Vector3(107.5, 0.05, 0)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.05, -72.5), new THREE.Vector3(0, 0.05, 72.5)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-107.5, 0.05, -72.5), new THREE.Vector3(-90, 0.05, -72.5)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(107.5, 0.05, -72.5), new THREE.Vector3(90, 0.05, -72.5)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-107.5, 0.05, 72.5), new THREE.Vector3(-90, 0.05, 72.5)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(107.5, 0.05, 72.5), new THREE.Vector3(90, 0.05, 72.5)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-55, 0.05, -72.5), new THREE.Vector3(55, 0.05, -72.5)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-55, 0.05, 72.5), new THREE.Vector3(55, 0.05, 72.5)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-18, 0.05, -72.5), new THREE.Vector3(-18, 0.05, -50)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(18, 0.05, -72.5), new THREE.Vector3(18, 0.05, -50)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-18, 0.05, 72.5), new THREE.Vector3(-18, 0.05, 50)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(18, 0.05, 72.5), new THREE.Vector3(18, 0.05, 50)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.05, -72.5), new THREE.Vector3(0, 0.05, -64.5)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.05, 72.5), new THREE.Vector3(0, 0.05, 64.5)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, 0.05, -32), new THREE.Vector3(6, 0.05, -32)]));
    lines.push(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-6, 0.05, 32), new THREE.Vector3(6, 0.05, 32)]));

    lines.forEach((geometry) => {
      const line = new THREE.Line(geometry, material);
      markings.add(line);
    });

    const centerCircle = new THREE.Line(
      new THREE.CircleGeometry(9.15, 54),
      material
    );
    centerCircle.geometry.attributes.position.array = centerCircle.geometry.attributes.position.array;
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.05;
    markings.add(centerCircle);

    this.scene.add(markings);
  }

  addStands() {
    const standMaterial = new THREE.MeshStandardMaterial({ color: '#313c55', roughness: 0.8, metalness: 0.1 });
    const standGeometry = new THREE.BoxGeometry(220, 20, 24);
    const topStand = new THREE.Mesh(standGeometry, standMaterial);
    topStand.position.set(0, 10, -92);
    topStand.receiveShadow = true;
    topStand.castShadow = true;
    this.scene.add(topStand);

    const bottomStand = topStand.clone();
    bottomStand.position.set(0, 10, 92);
    this.scene.add(bottomStand);

    const sideStandLeft = new THREE.Mesh(new THREE.BoxGeometry(22, 20, 160), standMaterial);
    sideStandLeft.position.set(-120, 10, 0);
    this.scene.add(sideStandLeft);

    const sideStandRight = sideStandLeft.clone();
    sideStandRight.position.set(120, 10, 0);
    this.scene.add(sideStandRight);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(240, 12, 190), new THREE.MeshStandardMaterial({ color: '#1d2436', roughness: 0.9 }));
    roof.position.set(0, 28, 0);
    roof.castShadow = true;
    this.scene.add(roof);

    const crowd = new THREE.Group();
    const crowdMaterial = new THREE.MeshStandardMaterial({ color: '#d3d7e2', roughness: 0.9 });
    for (let i = 0; i < 320; i += 1) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 1.2), crowdMaterial);
      seat.position.set((Math.random() - 0.5) * 210, 18 + Math.random() * 1.8, (Math.random() - 0.5) * 176);
      crowd.add(seat);
    }
    this.scene.add(crowd);
  }

  buildEntities() {
    this.buildBall();
    this.buildPlayers();
  }

  buildBall() {
    const ballGeometry = new THREE.SphereGeometry(3.5, 24, 24);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: '#f6f6f6', roughness: 0.25, metalness: 0.05 });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.castShadow = true;
    ballMesh.position.set(0, 3.5, 0);
    this.scene.add(ballMesh);
    this.physics.addBall(ballMesh);
    this.ball = ballMesh;
    this.ball.body = this.physics.ball.body;
  }

  buildPlayers() {
    const homeColor = '#1e88e5';
    const awayColor = '#f44336';
    this.homeTeam = new TeamAI({ scene: this.scene, physics: this.physics, color: homeColor, isHome: true, playerCount: 5 });
    this.awayTeam = new TeamAI({ scene: this.scene, physics: this.physics, color: awayColor, isHome: false, playerCount: 5 });
    this.players = [...this.homeTeam.players, ...this.awayTeam.players];
    this.activePlayer = this.homeTeam.players[0];
  }

  buildUI() {
    this.updateScore();
    this.updateClock();
  }

  updateScore() {
    this.interface.scoreboard.textContent = `Home ${this.homeScore} - ${this.awayScore} Away`;
  }

  updateClock() {
    const minutes = Math.floor(this.matchTime / 60);
    const seconds = Math.floor(this.matchTime % 60);
    this.interface.clock.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  start() {
    this.lastFrame = performance.now();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    this.matchTime += delta;
    this.updateClock();
    this.input.update();
    this.physics.step(delta);
    this.updatePlayers(delta);
    this.syncBall();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  updatePlayers(delta) {
    this.homeTeam.update(delta, this.ball, this.activePlayer);
    this.awayTeam.update(delta, this.ball, this.activePlayer);
    this.players.forEach((player) => player.sync());
  }

  syncBall() {
    this.ball.position.copy(this.physics.ball.body.position);
    this.ball.quaternion.copy(this.physics.ball.body.quaternion);

    const ballPos = this.ball.position;
    if (Math.abs(ballPos.z) > 72.5 && Math.abs(ballPos.x) < 22) {
      const isHomeGoal = ballPos.z > 0;
      if (isHomeGoal) {
        this.homeScore += 1;
      } else {
        this.awayScore += 1;
      }
      this.resetPlay();
    }
  }

  resetPlay() {
    this.physics.resetBall({ position: new THREE.Vector3(0, 3.5, 0), velocity: new THREE.Vector3() });
    this.ball.position.set(0, 3.5, 0);
    this.players.forEach((player) => player.reset());
    this.updateScore();
  }
}
