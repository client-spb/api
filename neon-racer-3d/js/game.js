class RacingGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.trackIndex = 0;
    this.running = false;
    this.distance = 0;
    this.score = 0;
    this.speed = 90;
    this.maxSpeed = 350;
    this.lane = 0;
    this.targetLane = 0;
    this.obstacles = [];
    this.particles = [];
    this.roadScroll = 0;
    this.spawnTimer = 0.8;
    this.lastTime = performance.now();
    this.onCrash = null;
  }

  setTrack(index) {
    this.trackIndex = index % TRACKS.length;
  }

  reset() {
    this.distance = 0;
    this.score = 0;
    this.speed = 90;
    this.lane = 0;
    this.targetLane = 0;
    this.obstacles = [];
    this.particles = [];
    this.roadScroll = 0;
    this.spawnTimer = 0.9;
    this.lastTime = performance.now();
  }

  start() {
    this.reset();
    this.running = true;
    this.runLoop();
    if (document.getElementById('game-over')) {
      document.getElementById('game-over').classList.remove('visible');
    }
  }

  runLoop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.033);
    this.lastTime = now;
    this.update(dt);
    this.render();
    requestAnimationFrame(() => this.runLoop());
  }

  shiftLane(dir) {
    if (!this.running) return;
    this.targetLane = clamp(this.targetLane + dir, -1, 1);
    AudioManager.beepMove();
  }

  triggerCrash() {
    this.running = false;
    this.score = Math.max(0, this.score);
    const scoreEl = document.getElementById('score-value');
    if (scoreEl) {
      scoreEl.textContent = String(this.score);
    }
    const panel = document.getElementById('game-over');
    if (panel) {
      panel.classList.add('visible');
    }
    if (this.onCrash) this.onCrash(this.score);
    AudioManager.beepCrash();
  }

  spawnObstacle() {
    const kindRoll = Math.random();
    const lane = Math.floor(Math.random() * 3) - 1;
    const obstacle = {
      lane,
      z: 1.75 + Math.random() * 1.5,
      kind: kindRoll < 0.18 ? 'boost' : 'car',
      color: kindRoll < 0.18 ? '#ffd166' : ['#ff5ea8', '#68f0ff', '#7cf7b3'][Math.floor(Math.random() * 3)],
      phase: Math.random() * Math.PI * 2
    };
    this.obstacles.push(obstacle);
  }

  update(dt) {
    this.speed = clamp(this.speed + dt * 20, 85, this.maxSpeed);
    this.distance += dt * this.speed * 0.38;
    this.score = Math.floor(this.distance * 2.6);
    this.lane += (this.targetLane - this.lane) * Math.min(1, dt * 12);
    this.roadScroll += dt * this.speed * 0.55;

    const speedEl = document.getElementById('speed-value');
    const scoreEl = document.getElementById('score-value');
    if (speedEl) speedEl.textContent = String(Math.round(this.speed));
    if (scoreEl) scoreEl.textContent = String(this.score);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = Math.max(0.55, 1.2 - this.speed / 440);
    }

    for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
      const obs = this.obstacles[i];
      obs.z -= dt * (0.9 + this.speed / 200);
      if (obs.z < -0.2) {
        this.obstacles.splice(i, 1);
        continue;
      }

      const sameLane = Math.abs(obs.lane - this.lane) < 0.35;
      if (obs.z < 0.32 && sameLane) {
        if (obs.kind === 'boost') {
          this.speed = clamp(this.speed + 55, 0, this.maxSpeed + 80);
          this.score += 30;
          AudioManager.beepSuccess();
          this.obstacles.splice(i, 1);
          continue;
        }
        this.triggerCrash();
        return;
      }
    }
  }

  drawSky(track) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, track.sky);
    gradient.addColorStop(1, '#04080f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 212, 118, 0.95)';
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.18, 30, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 30; i += 1) {
      const x = (i * 91.2 + this.roadScroll * 0.7) % (w + 40) - 20;
      const y = 26 + (i * 17) % (h * 0.4);
      ctx.fillStyle = `rgba(255,255,255,${0.5 + (i % 5) * 0.08})`;
      ctx.fillRect(x, y, 2, 2);
    }

    const skylineY = h * 0.46;
    for (let i = 0; i < 12; i += 1) {
      const x = i * (w / 12);
      const buildingW = (w / 12) * 0.8;
      const buildingH = 40 + ((i * 17) % 70);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(9, 14, 27, 0.8)' : 'rgba(16, 22, 38, 0.9)';
      ctx.fillRect(x, skylineY - buildingH, buildingW, buildingH);
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          if ((row + col + i) % 2 === 0) continue;
          ctx.fillStyle = 'rgba(104, 240, 255, 0.35)';
          ctx.fillRect(x + 6 + col * 10, skylineY - buildingH + 8 + row * 10, 6, 8);
        }
      }
    }
  }

  drawRoad(track) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const horizon = h * 0.24;
    const roadBottom = h * 0.98;
    const leftTop = w * 0.22;
    const rightTop = w * 0.78;
    const leftBottom = w * 0.08;
    const rightBottom = w * 0.92;

    ctx.beginPath();
    ctx.moveTo(leftTop, horizon);
    ctx.lineTo(rightTop, horizon);
    ctx.lineTo(rightBottom, roadBottom);
    ctx.lineTo(leftBottom, roadBottom);
    ctx.closePath();
    ctx.fillStyle = track.road;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftTop, horizon);
    ctx.lineTo(leftBottom, roadBottom);
    ctx.moveTo(rightTop, horizon);
    ctx.lineTo(rightBottom, roadBottom);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i < 16; i += 1) {
      const t = i / 16;
      const y1 = horizon + (roadBottom - horizon) * t;
      const y2 = horizon + (roadBottom - horizon) * (t + 0.06);
      const x1A = (leftTop * (1 - t)) + (leftBottom * t);
      const x2A = (leftTop * (1 - (t + 0.06))) + (leftBottom * (t + 0.06));
      const x1B = (rightTop * (1 - t)) + (rightBottom * t);
      const x2B = (rightTop * (1 - (t + 0.06))) + (rightBottom * (t + 0.06));
      ctx.beginPath();
      ctx.moveTo(x1A, y1);
      ctx.lineTo(x2A, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x1A, y1);
      ctx.lineTo(x2A, y2);
      ctx.stroke();
    }

    const dashCount = 18;
    for (let i = 0; i < dashCount; i += 1) {
      const t = (i / dashCount + (this.roadScroll * 0.0015)) % 1;
      const y = horizon + (roadBottom - horizon) * t;
      const laneW = 22 + (1 - t) * 42;
      const xCenter = w / 2;
      const x1 = xCenter - laneW / 2;
      const x2 = xCenter + laneW / 2;
      ctx.fillStyle = track.lane;
      ctx.fillRect(x1, y, laneW, 6);
      ctx.fillRect(xCenter - laneW / 2 - 60, y, 10, 6);
      ctx.fillRect(xCenter + laneW / 2 + 50, y, 10, 6);
    }
  }

  drawObstacle(obs) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const horizon = h * 0.24;
    const roadBottom = h * 0.98;
    const depth = clamp(1 - obs.z / 2.2, 0, 1);
    const y = horizon + (roadBottom - horizon) * depth;
    const x = w / 2 + obs.lane * (w * 0.19) * (1.1 - depth * 0.18);

    if (obs.kind === 'boost') {
      const size = 18 + depth * 18;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4 + obs.phase * 0.6);
      ctx.fillStyle = '#ffd166';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ffd166';
      ctx.fillRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
      ctx.restore();
      return;
    }

    const width = 26 + depth * 30;
    const height = 46 + depth * 70;
    const xPos = x - width / 2;
    const yPos = y - height / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(xPos + 6, yPos + height * 0.85, width - 12, 12);

    ctx.fillStyle = obs.color;
    ctx.shadowBlur = 18;
    ctx.shadowColor = obs.color;
    ctx.fillRect(xPos, yPos, width, height);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(xPos + width * 0.22, yPos + 10, width * 0.18, height * 0.35);
    ctx.fillRect(xPos + width * 0.6, yPos + 10, width * 0.18, height * 0.35);
    ctx.fillStyle = 'rgba(5, 7, 18, 0.8)';
    ctx.fillRect(xPos + width * 0.16, yPos + height * 0.8, width * 0.68, height * 0.15);
    ctx.shadowBlur = 0;
  }

  drawPlayer() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const x = w / 2 + this.lane * (w * 0.18);
    const y = h * 0.8;
    const width = 52;
    const height = 88;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x - width * 0.5 + 5, y + 54, width - 10, 12);

    ctx.fillStyle = '#68f0ff';
    ctx.shadowBlur = 24;
    ctx.shadowColor = '#68f0ff';
    ctx.fillRect(x - width / 2, y - height / 2, width, height);

    ctx.fillStyle = '#101722';
    ctx.fillRect(x - width * 0.22, y - height * 0.35, width * 0.44, height * 0.26);
    ctx.fillStyle = '#dffaff';
    ctx.fillRect(x - width * 0.25, y - height * 0.52, width * 0.17, 12);
    ctx.fillRect(x + width * 0.08, y - height * 0.52, width * 0.17, 12);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x - width * 0.13, y + height * 0.15, width * 0.26, 12);
    ctx.fillRect(x - width * 0.13 + 24, y + height * 0.15, width * 0.26, 12);
    ctx.shadowBlur = 0;
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const track = TRACKS[this.trackIndex];

    this.drawSky(track);
    this.drawRoad(track);

    for (const obs of this.obstacles) {
      this.drawObstacle(obs);
    }

    this.drawPlayer();

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, h - 26, w, 26);
    ctx.fillStyle = '#e8f6ff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('TRACK: ' + track.name.toUpperCase(), 18, h - 10);
    ctx.fillText('BOOST: ' + Math.round(this.speed), w - 105, h - 10);
  }
}
