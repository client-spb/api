class RacingGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.trackIndex = 0;
    this.running = false;
    this.distance = 0;
    this.score = 0;
    this.speed = 28;
    this.maxSpeed = 70;
    this.laneIndex = 1;
    this.targetLaneIndex = 1;
    this.lanePositions = [-4, 0, 4];
    this.obstacles = [];
    this.pickups = [];
    this.spawnTimer = 1.1;
    this.pickupTimer = 2.4;
    this.lastTime = performance.now();
    this.onCrash = null;
    this.rafId = 0;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040a12);
    this.scene.fog = new THREE.Fog(0x040a12, 16, 110);

    this.camera = new THREE.PerspectiveCamera(58, canvas.width / canvas.height, 0.1, 200);
    this.camera.position.set(0, 5.5, 12);
    this.camera.lookAt(0, 1.6, -35);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(canvas.width, canvas.height, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.initLights();
    this.buildTrack();
    this.buildPlayer();
    this.buildBackdrop();
    this.reset();
  }

  initLights() {
    const ambient = new THREE.AmbientLight(0x7ec8ff, 1.25);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff4d6, 1.1);
    sun.position.set(0, 18, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);

    const neon = new THREE.PointLight(0x68f0ff, 25, 130, 2);
    neon.position.set(0, 6, 3);
    this.scene.add(neon);
  }

  buildBackdrop() {
    const stars = new THREE.Group();
    for (let i = 0; i < 120; i += 1) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xffd166 : 0x9ae9ff })
      );
      s.position.set(rand(-45, 45), rand(10, 28), rand(-120, -20));
      stars.add(s);
    }
    this.scene.add(stars);
  }

  buildTrack() {
    this.trackGroup = new THREE.Group();
    this.scene.add(this.trackGroup);

    const roadMat = new THREE.MeshStandardMaterial({ color: 0x121a2a, emissive: 0x0a0f18, metalness: 0.2, roughness: 0.85 });
    const glowMat = new THREE.MeshStandardMaterial({ color: 0x68f0ff, emissive: 0x2fe0ff, metalness: 0.6, roughness: 0.3 });

    for (let i = 0; i < 18; i += 1) {
      const segment = new THREE.Group();
      const road = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 18), roadMat);
      road.position.y = -0.35;
      road.receiveShadow = true;
      segment.add(road);

      const line = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 3.8), new THREE.MeshStandardMaterial({ color: 0xf7f0a8, emissive: 0xffd166 }));
      line.position.set(0, 0.1, 0);
      segment.add(line);

      const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 18), glowMat);
      leftRail.position.set(-8.5, 0.2, 0);
      const rightRail = leftRail.clone();
      rightRail.position.x = 8.5;
      segment.add(leftRail, rightRail);

      segment.position.z = -i * 18;
      this.trackGroup.add(segment);
    }

    const laneGlowGeo = new THREE.BoxGeometry(0.18, 0.2, 18);
    const laneGlowMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xffd166, emissiveIntensity: 1.5 });
    for (let i = 0; i < 3; i += 1) {
      const laneGlow = new THREE.Mesh(laneGlowGeo, laneGlowMat);
      laneGlow.position.set(-3.8 + i * 3.8, 0.18, -40);
      this.trackGroup.add(laneGlow);
    }
  }

  buildPlayer() {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x68f0ff, emissive: 0x2fe0ff, metalness: 0.4, roughness: 0.35 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x081720, emissive: 0x0b1830 });

    const car = new THREE.Group();
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 4.2), bodyMat);
    chassis.castShadow = true;
    chassis.position.y = 0.8;
    car.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7, 2.2), accentMat);
    cabin.position.set(0, 1.35, -0.2);
    cabin.castShadow = true;
    car.add(cabin);

    const light = new THREE.PointLight(0x68f0ff, 12, 18, 2);
    light.position.set(0, 1.2, 2.5);
    car.add(light);

    car.position.set(0, 0, 2.5);
    this.scene.add(car);
    this.player = car;
  }

  reset() {
    this.distance = 0;
    this.score = 0;
    this.speed = 28;
    this.maxSpeed = 70;
    this.laneIndex = 1;
    this.targetLaneIndex = 1;
    this.spawnTimer = 1.1;
    this.pickupTimer = 2.5;
    this.lastTime = performance.now();

    this.obstacles.forEach((item) => this.scene.remove(item.mesh));
    this.pickups.forEach((item) => this.scene.remove(item.mesh));
    this.obstacles = [];
    this.pickups = [];

    this.player.position.x = 0;
    this.player.rotation.y = 0;
    this.camera.position.x = 0;
    this.camera.position.y = 5.5;
    this.camera.position.z = 12;
    this.camera.lookAt(0, 1.6, -35);

    if (document.getElementById('score-value')) {
      document.getElementById('score-value').textContent = '0';
    }
    if (document.getElementById('speed-value')) {
      document.getElementById('speed-value').textContent = '0';
    }
  }

  start() {
    this.reset();
    this.running = true;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.loop());
    if (document.getElementById('game-over')) {
      document.getElementById('game-over').classList.remove('visible');
    }
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.033);
    this.lastTime = now;
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame(() => this.loop());
  }

  shiftLane(dir) {
    if (!this.running) return;
    this.targetLaneIndex = clamp(this.targetLaneIndex + dir, 0, 2);
    AudioManager.beepMove();
  }

  spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const obstacle = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 1.2, 2.9),
      new THREE.MeshStandardMaterial({
        color: ['#ff5ea8', '#68f0ff', '#7cf7b3'][Math.floor(Math.random() * 3)],
        emissive: 0x142e3d,
        metalness: 0.4,
        roughness: 0.3
      })
    );
    obstacle.castShadow = true;
    obstacle.position.set(this.lanePositions[lane], 1.2, -60 - Math.random() * 30);
    obstacle.userData = { lane, type: 'enemy' };
    this.scene.add(obstacle);
    this.obstacles.push({ mesh: obstacle, lane, type: 'enemy' });
  }

  spawnPickup() {
    const lane = Math.floor(Math.random() * 3);
    const pickup = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.9, 0),
      new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xffd166,
        emissiveIntensity: 1.4,
        metalness: 0.2,
        roughness: 0.3
      })
    );
    pickup.position.set(this.lanePositions[lane], 1.8, -60 - Math.random() * 30);
    pickup.userData = { lane, type: 'pickup' };
    this.scene.add(pickup);
    this.pickups.push({ mesh: pickup, lane, type: 'pickup' });
  }

  triggerCrash() {
    this.running = false;
    this.score = Math.max(0, this.score);
    const panel = document.getElementById('game-over');
    if (panel) {
      panel.classList.add('visible');
      panel.querySelector('.overlay-text').textContent = 'Результат: ' + this.score + ' очков. Сыграй ещё раз!';
    }
    if (this.onCrash) this.onCrash(this.score);
    AudioManager.beepCrash();
  }

  update(dt) {
    const targetX = this.lanePositions[this.targetLaneIndex];
    this.player.position.x += (targetX - this.player.position.x) * Math.min(1, dt * 9);
    this.player.rotation.y += (targetX * 0.08 - this.player.rotation.y) * Math.min(1, dt * 8);

    this.speed = clamp(this.speed + dt * 5.2, 24, this.maxSpeed);
    this.distance += dt * this.speed * 2.8;
    this.score = Math.floor(this.distance * 3.2);

    const speedEl = document.getElementById('speed-value');
    const scoreEl = document.getElementById('score-value');
    if (speedEl) speedEl.textContent = String(Math.round(this.speed * 5));
    if (scoreEl) scoreEl.textContent = String(this.score);

    this.trackGroup.position.z += this.speed * dt * 6;
    if (this.trackGroup.position.z > 18) this.trackGroup.position.z = 0;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = Math.max(0.7, 1.7 - this.speed / 32);
    }

    this.pickupTimer -= dt;
    if (this.pickupTimer <= 0) {
      this.spawnPickup();
      this.pickupTimer = 5.5;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
      const item = this.obstacles[i];
      item.mesh.position.z += this.speed * dt * 8;
      item.mesh.rotation.y += dt * 1.4;
      if (item.mesh.position.z > 15) {
        this.scene.remove(item.mesh);
        this.obstacles.splice(i, 1);
        continue;
      }

      if (Math.abs(item.mesh.position.z - this.player.position.z) < 1.8 && Math.abs(item.mesh.position.x - this.player.position.x) < 1.9) {
        this.triggerCrash();
        return;
      }
    }

    for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
      const item = this.pickups[i];
      item.mesh.position.z += this.speed * dt * 8;
      item.mesh.rotation.x += dt * 3;
      item.mesh.rotation.y += dt * 3.5;
      if (item.mesh.position.z > 15) {
        this.scene.remove(item.mesh);
        this.pickups.splice(i, 1);
        continue;
      }

      if (Math.abs(item.mesh.position.z - this.player.position.z) < 1.8 && Math.abs(item.mesh.position.x - this.player.position.x) < 1.8) {
        this.speed = clamp(this.speed + 12, 0, this.maxSpeed + 20);
        this.score += 80;
        AudioManager.beepSuccess();
        this.scene.remove(item.mesh);
        this.pickups.splice(i, 1);
      }
    }

    this.camera.position.x += (this.player.position.x * 0.7 - this.camera.position.x) * Math.min(1, dt * 4);
    this.camera.position.y += (5.2 - this.camera.position.y) * Math.min(1, dt * 3);
    this.camera.lookAt(this.player.position.x * 0.7, 1.2, -30);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
