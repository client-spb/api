window.addEventListener('DOMContentLoaded', async () => {
  AudioManager.init();
  layoutApp();

  window.game = new RacingGame(document.getElementById('game-canvas'));
  window.game.onCrash = (score) => {
    const panel = document.getElementById('game-over');
    if (panel) {
      panel.querySelector('.overlay-text').textContent = 'Результат: ' + score + ' очков. Сыграй ещё раз!';
    }
  };

  UI.bind();

  try {
    await Loader.preloadAll();
  } catch (error) {
    bootError('Ошибка загрузки ресурсов.');
    return;
  }

  showScreen(screenIds.menu);
  document.getElementById('game-ui').classList.remove('visible');
  document.getElementById('game-over').classList.remove('visible');
});
