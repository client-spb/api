const Loader = {
  progress: 0,
  pctEl: document.getElementById('load-pct'),
  fillEl: document.getElementById('load-fill'),
  textEl: document.getElementById('load-text'),
  set(value, text) {
    this.progress = clamp(value, 0, 1);
    this.fillEl.style.transform = 'scaleX(' + this.progress + ')';
    this.pctEl.textContent = Math.round(this.progress * 100) + '%';
    if (text) this.textEl.textContent = text;
  },
  async preloadAll() {
    const stages = [
      [0.2, 'Подготовка меню'],
      [0.45, 'Синтез звуков'],
      [0.7, 'Генерация трассы'],
      [0.9, 'Загрузка шрифтов и эффектов'],
      [1, 'Готово']
    ];

    for (const [value, text] of stages) {
      this.set(value, text);
      await nextFrame();
      await new Promise((resolve) => setTimeout(resolve, 170));
    }

    window.BOOT.done = true;
    return true;
  }
};
