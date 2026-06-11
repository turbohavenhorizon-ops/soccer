import { Game } from './game.js';

const game = new Game({ target: document.getElementById('canvas-holder') });
game.start();

window.addEventListener('resize', () => game.resize());
