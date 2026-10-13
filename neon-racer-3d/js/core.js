const GAME_NAME = 'neon-racer-3d';

const app = document.getElementById('app');
const canvas = document.getElementById('game-canvas');
const screenIds = {
  loading: 'scr-loading',
  menu: 'scr-menu',
  game: 'scr-game'
};

let APPW = 390;
let APPH = 700;
let ROT = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.id === id);
  });
}

function layoutApp() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  APPW = Math.min(w, 420);
  APPH = Math.min(h, 760);
  app.style.width = APPW + 'px';
  app.style.height = APPH + 'px';
  app.style.left = Math.round((w - APPW) / 2) + 'px';
  app.style.top = Math.round((h - APPH) / 2) + 'px';
  canvas.width = APPW;
  canvas.height = APPH;
  canvas.style.width = APPW + 'px';
  canvas.style.height = APPH + 'px';
}

window.addEventListener('resize', layoutApp);
layoutApp();

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
