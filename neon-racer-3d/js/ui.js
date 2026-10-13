const UI = {
  bind() {
    const startBtn = document.getElementById('start-race');
    const garageBtn = document.getElementById('garage-btn');
    const howBtn = document.getElementById('how-btn');
    const restartBtn = document.getElementById('restart-btn');
    const menuBtn = document.getElementById('menu-btn');
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');

    startBtn.addEventListener('click', () => {
      AudioManager.init();
      AudioManager.beepSuccess();
      showScreen(screenIds.game);
      document.getElementById('game-ui').classList.add('visible');
      window.game.start();
    });

    garageBtn.addEventListener('click', () => {
      AudioManager.init();
      AudioManager.beepMove();
      const title = document.getElementById('game-over');
      title.querySelector('.overlay-title').textContent = 'Garage';
      title.querySelector('.overlay-text').textContent = 'Выбор машины: Vega • Nova • Volt';
      title.classList.add('visible');
    });

    howBtn.addEventListener('click', () => {
      const panel = document.getElementById('game-over');
      panel.querySelector('.overlay-title').textContent = 'How to play';
      panel.querySelector('.overlay-text').textContent = 'Левый / правый свайп меняет полосу. Съедайте маяки, избегайте машин и набирайте очки.';
      panel.classList.add('visible');
    });

    restartBtn.addEventListener('click', () => {
      document.getElementById('game-over').classList.remove('visible');
      showScreen(screenIds.game);
      window.game.start();
    });

    menuBtn.addEventListener('click', () => {
      document.getElementById('game-over').classList.remove('visible');
      showScreen(screenIds.menu);
      document.getElementById('game-ui').classList.remove('visible');
    });

    leftBtn.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      window.game.shiftLane(-1);
    });

    rightBtn.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      window.game.shiftLane(1);
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        window.game.shiftLane(-1);
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        window.game.shiftLane(1);
      }
      if (event.key === ' ' && window.game && !window.game.running) {
        event.preventDefault();
        showScreen(screenIds.game);
        window.game.start();
      }
    });
  }
};
