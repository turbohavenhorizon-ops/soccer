export class InputManager {
  constructor() {
    this.keys = new Set();
    this.keysMap = new Map([['KeyW', 'forward'], ['KeyS', 'backward'], ['KeyA', 'left'], ['KeyD', 'right'], ['ShiftLeft', 'sprint'], ['Space', 'shoot']]);
    window.addEventListener('keydown', (event) => this.keys.add(event.code));
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
  }

  update() {
    this.forward = this.keys.has('KeyW');
    this.backward = this.keys.has('KeyS');
    this.left = this.keys.has('KeyA');
    this.right = this.keys.has('KeyD');
    this.sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    this.shoot = this.keys.has('Space');
  }
}
