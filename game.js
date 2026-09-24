const Game = {
  state: 'menu', // menu | play | pause | over | win
  scene: null, camera: null, cat: null,
  vel: new THREE.Vector3(), onGround: true,
  hp: CFG.maxHP, invuln: 0, facing: 0, camYaw: Math.PI,
  phase: 0, // 0 lawn 1 obama 2 biden 3 kamala 4 boss 5 win
  keys: {}, touchDir: { x: 0, y: 0 },
  doors: [], solids: [], npcs: {}, tokens: [], pickups: [],
  projectiles: [], particles: [], micDrop: null, micTaken: false,
  trump: null, trumpState: 'patrol', trumpTimer: 0, trumpHits: 0, tweetTimer: 1.5,
  kamalaTimer: 0, bidenNap: false, bidenTimer: 0, fishGot: 0,
  time: 0, shake: 0, msgTimer: 0, animT: 0,

  // ---------- setup ----------
  build() {
    const S = this.scene;
    // floor sections
    const floorMats = [
      [0x3f8f4a, 0, CFG.lawnEnd + 1, 46],          // lawn grass
      [0xb9a179, CFG.lawnEnd, CFG.room3End + 1, 96] // marble floors
    ];
    floorMats.forEach(f => {
      const len = f[2] - f[1];
      const m = new THREE.Mesh(new THREE.BoxGeometry(f[3], 0.4, len),
        new THREE.MeshLambertMaterial({ color: f[0] }));
      m.position.set(0, -0.2, f[1] + len / 2); S.add(m);
    });
    // White House facade on lawn
    const facade = new THREE.Group();
    facade.add(box(30, 8, 6, 0xf3efe4, 0, 4, CFG.lawnEnd + 3));
    for (let i = -4; i <= 4; i++) facade.add(box(1.2, 6, 0.5, 0xdddddd, i * 3, 3, CFG.lawnEnd - 0.2));
    const roof = box(32, 1.5, 8, 0xd8d2c4, 0, 8.6, CFG.lawnEnd + 3); facade.add(roof);
    S.add(facade);

    // interior walls (side walls for each room) — stored as solids
    const wallC = 0xe8e2d2;
    const segs = [
      [CFG.lawnEnd, CFG.room1End, 20], [CFG.room1End, CFG.room2End, 24],
      [CFG.room2End, CFG.room3End, 24], [CFG.room3End, CFG.bossEnd, 24]
    ];
    segs.forEach(sg => {
      [[-sg[2] / 2, 12], [sg[2] / 2, 12]].forEach(w => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(12, 5, sg[1] - sg[0]), new THREE.MeshLambertMaterial({ color: wallC }));
        m.position.set(w[0], 2.5, (sg[0] + sg[1]) / 2); S.add(m);
        this.solids.push({ x: w[0], z: (sg[0] + sg[1]) / 2, w: 12, d: sg[1] - sg[0], y0: 0, y1: 5 });
      });
    });
    // back wall of boss room
    const back = new THREE.Mesh(new THREE.BoxGeometry(24, 5, 1), new THREE.MeshLambertMaterial({ color: wallC }));
    back.position.set(0, 2.5, CFG.bossEnd + 0.5); S.add(back);
    this.solids.push({ x: 0, z: CFG.bossEnd + 0.5, w: 24, d: 1, y0: 0, y1: 5 });
    // oval office rug + desk
    const rug = new THREE.Mesh(new THREE.CircleGeometry(7, 24), new THREE.MeshLambertMaterial({ color: 0x8a3a3a }));
    rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, CFG.bossEnd - 14); S.add(rug);
    const desk = box(5, 1.2, 2, 0x6b4a2a, 0, 0.6, CFG.bossEnd - 2); S.add(desk);
    this.solids.push({ x: 0, z: CFG.bossEnd - 2, w: 5, d: 2, y0: 0, y1: 1.2 });
    // flags
    [[-8, CFG.bossEnd - 3], [8, CFG.bossEnd - 3]].forEach(p => {
      S.add(box(0.2, 4, 0.2, 0x886644, p[0], 2, p[1]));
      S.add(box(2, 1.2, 0.08, 0xcc3333, p[0] + (p[0] < 0 ? 1.1 : -1.1), 3.4, p[1]));
    });

    // doors (dynamic walls)
    const doorDefs = [
      { z: CFG.lawnEnd + 1, locked: false },           // gate
      { z: CFG.room1End + 1, locked: true },           // obama door
      { z: CFG.room2End + 1, locked: true },           // biden door
      { z: CFG.room3End + 1, locked: true }            // kamala door
    ];
    doorDefs.forEach(d => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(24, 5, 1.2), new THREE.MeshLambertMaterial({ color: 0x7a5230 }));
      m.position.set(0, 2.5, d.z); S.add(m);
      this.doors.push({ mesh: m, z: d.z, open: !d.locked, solid: { x: 0, z: d.z, w: 24, d: 1.2, y0: 0, y1: 5 } });
    });

    // NPCs
    const obama = makeObama(); obama.position.set(0, 0, CFG.room1End - 4); S.add(obama); this.npcs.obama = obama;
    const biden = makeBiden(); biden.position.set(0, 0, 79); S.add(biden); this.npcs.biden = biden;
    const kamala = makeKamala(); kamala.position.set(0, 0, CFG.room3End - 6); S.add(kamala); this.npcs.kamala = kamala;
    const trump = makeTrump(); trump.position.set(0, 0, CFG.bossEnd - 14); S.add(trump); this.npcs.trump = trump;
    this.trump = trump;

    // fish tokens in Obama room
    const spots = [[-7, 40], [7, 44], [0, 50], [-8, 55], [8, 58]];
    spots.forEach(p => {
      const f = makeFish(); f.position.set(p[0], 0, p[1]); S.add(f);
      this.pickups.push({ mesh: f, got: false, kind: 'fish' });
    });

    // decorative bushes on lawn
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.9, 8, 6), new THREE.MeshLambertMaterial({ color: 0x2f7a3a }));
      b.position.set((i % 2 === 0 ? -14 : 14) + (Math.random() * 4 - 2), 0.8, 4 + i * 3.4); S.add(b);
    }

    this.resetCat(0, 6);
  },

  resetCat(x, z) {
    this.cat.position.set(x, 0, z);
    this.vel.set(0, 0, 0); this.onGround = true;
  },

  startGame() {
    this.state = 'play'; this.phase = 0; this.hp = CFG.maxHP; this.fishGot = 0;
    this.invuln = 0; this.trumpHits = 0; this.trumpState = 'patrol';
    this.projectiles.forEach(p => this.scene.remove(p.mesh)); this.projectiles = [];
    this.pickups.forEach(p => { p.got = false; p.mesh.visible = true; });
    this.doors.forEach((d, i) => { d.open = i === 0; d.mesh.visible = !d.open; });
    this.npcs.obama.position.set(0, 0, CFG.room1End - 4);
    this.npcs.biden.visible = true; this.npcs.biden.position.set(0, 0, 79);
    this.npcs.kamala.position.set(0, 0, CFG.room3End - 6);
    this.npcs.trump.position.set(0, 0, CFG.bossEnd - 14);
    this.npcs.trump.visible = true;
    if (this.micDrop) { this.scene.remove(this.micDrop); this.micDrop = null; }
    this.micTaken = false;
    this.resetCat(0, 6);
    this.updateHUD();
    this.showMessage('Run to the White House gate!', 2.5);
  },

  // ---------- HUD ----------
  updateHUD() {
    document.getElementById('hearts').textContent = '❤️'.repeat(this.hp) + '🖤'.repeat(CFG.maxHP - this.hp);
    const obj = document.getElementById('objective'), fc = document.getElementById('fishcount');
    const t = [
      'Reach the White House gate!',
      'Obama blocks the way: collect all 5 fish! 🐟',
      'Sneak past Biden while he naps! 😴',
      'Dodge Kamala\u2019s folders, reach the far door! 📁',
      'BOSS: bounce on Trump 3x when he\u2019s dizzy! ⭐',
      'You are the new president! 🎉'
    ];
    obj.textContent = 'Objective: ' + (t[this.phase] || '');
    fc.textContent = this.phase === 1 ? ('🐟 ' + this.fishGot + '/5') : '';
  },

  showMessage(txt, dur) {
    const m = document.getElementById('message');
    m.textContent = txt; m.classList.add('show');
    this.msgTimer = txt ? (txt.length * 0.05 + 1.5) : 0;
    if (this.msgTimer > 4) this.msgTimer = 4;
  },

  hideMsg() { document.getElementById('message').classList.remove('show'); },

  // ---------- particles ----------
  spawnParticles(pos, color, n, spread) {
    for (let i = 0; i < (n || 10); i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15),
        new THREE.MeshBasicMaterial({ color }));
      m.position.copy(pos);
      this.scene.add(m);
      this.particles.push({ mesh: m, life: 0.7,
        vx: (Math.random() - 0.5) * spread, vy: Math.random() * 5 + 2, vz: (Math.random() - 0.5) * spread });
    }
  },

  // ---------- damage ----------
  hurt(knock) {
    if (this.invuln > 0 || this.state !== 'play') return;
    this.hp--; this.invuln = CFG.invulnTime; this.shake = 0.5;
    AudioSys.hurt();
    if (knock) { this.vel.x = knock.x; this.vel.z = knock.z; this.vel.y = 5; this.onGround = false; }
    this.updateHUD();
    if (this.hp <= 0) {
      this.state = 'over'; AudioSys.lose();
      document.getElementById('gameover').classList.remove('hidden');
    }
  },

  openDoor(i, msg) {
    const d = this.doors[i];
    if (d && !d.open) {
      d.open = true; d.mesh.visible = false;
      AudioSys.door();
      if (msg) this.showMessage(msg, 3);
    }
  },

  // ---------- physics ----------
  collideHorizontal(px, pz, py) {
    let x = px, z = pz;
    const r = CFG.catRadius;
    const all = this.solids.concat(this.doors.filter(d => !d.open).map(d => d.solid));
    all.forEach(s => {
      const halfW = s.w / 2 + r, halfD = s.d / 2 + r;
      if (py < s.y1 - 0.25 && Math.abs(x - s.x) < halfW && Math.abs(z - s.z) < halfD) {
        const dx = halfW - Math.abs(x - s.x), dz = halfD - Math.abs(z - s.z);
        if (dx < dz) x = s.x + Math.sign(x - s.x || 1) * halfW;
        else z = s.z + Math.sign(z - s.z || 1) * halfD;
      }
    });
    return [x, z];
  },

  landCheck(prevY, newY) {
    // returns ground height under cat
    let ground = 0;
    const r = CFG.catRadius;
    this.solids.forEach(s => {
      if (Math.abs(this.cat.position.x - s.x) < s.w / 2 + r * 0.4 &&
          Math.abs(this.cat.position.z - s.z) < s.d / 2 + r * 0.4) {
        if (prevY >= s.y1 - 0.05 && newY <= s.y1 && s.y1 > ground) ground = s.y1;
      }
    });
    return ground;
  },

  // ---------- update ----------
  update(dt) {
    if (this.state !== 'play') return;
    this.time += dt; this.animT += dt;
    if (this.msgTimer > 0) { this.msgTimer -= dt; if (this.msgTimer <= 0) this.hideMsg(); }
    if (this.invuln > 0) this.invuln -= dt;
    if (this.shake > 0) this.shake -= dt;

    const k = this.keys;
    let ix = (k['ArrowRight'] || k['d'] ? 1 : 0) - (k['ArrowLeft'] || k['a'] ? 1 : 0) + this.touchDir.x;
    let iz = (k['ArrowDown'] || k['s'] ? 1 : 0) - (k['ArrowUp'] || k['w'] ? 1 : 0) + this.touchDir.y;
    const mag = Math.hypot(ix, iz);
    if (mag > 1) { ix /= mag; iz /= mag; }

    // camera-relative movement (camera looks +z)
    const spd = CFG.speed;
    if (mag > 0.05) {
      this.vel.x = ix * spd; this.vel.z = iz * spd;
      this.facing = Math.atan2(ix, iz);
    } else {
      this.vel.x *= 0.8; this.vel.z *= 0.8;
    }

    // jump
    if ((k[' '] || k['Spacebar']) && this.onGround) {
      this.vel.y = CFG.jumpV; this.onGround = false; AudioSys.jump();
      k[' '] = false;
    }
    this.vel.y += CFG.gravity * dt;

    // integrate with collisions
    const p = this.cat.position;
    const prevY = p.y;
    p.x += this.vel.x * dt;
    p.z += this.vel.z * dt;
    const res = this.collideHorizontal(p.x, p.z, p.y);
    p.x = res[0]; p.z = res[1];
    p.x = Math.max(-19, Math.min(19, p.x));
    p.y += this.vel.y * dt;
    const g = this.landCheck(prevY, p.y);
    if (p.y <= g) { p.y = g; this.vel.y = 0; this.onGround = true; }
    else this.onGround = false;

    // cat orientation & animation
    this.cat.rotation.y += (this.facing - this.cat.rotation.y) * Math.min(1, dt * 10);
    const moving = mag > 0.05 && this.onGround;
    this.cat.userData.legs.forEach((leg, i) => {
      leg.rotation.x = moving ? Math.sin(this.animT * 14 + i * Math.PI / 2) * 0.7 : 0;
    });
    const tail = this.cat.getObjectByName('tail');
    if (tail) tail.rotation.y = Math.sin(this.animT * 4) * 0.4;
    this.cat.visible = !(this.invuln > 0 && Math.floor(this.time * 12) % 2 === 0);

    // phase logic
    this.updatePhase(dt);
    this.updateParticles(dt);

    // camera
    const cam = this.camera;
    const camTargetZ = Math.min(p.z - 9, CFG.bossEnd + 6);
    cam.position.x += (p.x * 0.6 - cam.position.x) * Math.min(1, dt * 3);
    cam.position.y += (5.5 - cam.position.y) * Math.min(1, dt * 3);
    cam.position.z += (camTargetZ - cam.position.z) * Math.min(1, dt * 4);
    const sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    cam.lookAt(p.x + sx, p.y + 1.5 + sy, p.z + 2);
  },

  updatePhase(dt) {
    const p = this.cat.position;
    // phase transitions by door passing
    if (this.phase === 0 && p.z > CFG.lawnEnd + 1) {
      this.phase = 1; this.updateHUD();
      this.showMessage('Obama: "No cat enters without… FISH. All 5 of them."', 3.5);
      AudioSys.meow();
    }
    switch (this.phase) {
      case 0: { // lawn: ambient tweets from the house
        this.ambientTweetTimer = (this.ambientTweetTimer || 2) - dt;
        if (this.ambientTweetTimer <= 0 && this.projectiles.length < 3) {
          this.spawnTweet(Math.random() * 10 - 5, CFG.lawnEnd - 3, Math.random() < 0.5 ? -1 : 1);
          this.ambientTweetTimer = 2.5 + Math.random() * 2;
        }
        this.updateProjectiles(dt);
        break;
      }
      case 1: { // Obama room: collect fish
        let all = true;
        this.pickups.forEach(pk => {
          if (pk.got) return;
          const d = pk.mesh.position.distanceTo(p);
          pk.mesh.rotation.y += dt * 3;
          pk.mesh.position.y = 0.15 + Math.sin(this.time * 4 + pk.mesh.position.x) * 0.12;
          if (d < 1.1) {
            pk.got = true; pk.mesh.visible = false; this.fishGot++;
            AudioSys.pickup();
            this.spawnParticles(pk.mesh.position, 0x66d9ff, 8, 3);
            this.updateHUD();
          } else all = false;
        });
        if (all) {
          this.phase = 2; this.updateHUD();
          this.openDoor(1);
          this.npcs.obama.rotation.y = Math.PI; // turns away
          this.showMessage('Obama: "Fine. The fish were delicious. Go on through."', 3.5);
        }
        break;
      }
      case 2: { // Biden nap timing
        const b = this.npcs.biden;
        this.bidenTimer -= dt;
        if (this.bidenTimer <= 0) {
          this.bidenNap = !this.bidenNap;
          this.bidenTimer = this.bidenNap ? 3.2 : 2.4;
          if (this.bidenNap) AudioSys.meow();
        }
        b.rotation.x = this.bidenNap ? 0.5 : 0; // slouch when asleep
        if (this.bidenNap) {
          if (!this.zzz) {
            this.zzz = makeZzz(); this.scene.add(this.zzz);
          }
          this.zzz.visible = true;
          this.zzz.position.set(b.position.x, 3 + Math.sin(this.time * 3) * 0.3, b.position.z + 1);
          this.zzz.quaternion.copy(this.camera.quaternion);
        } else if (this.zzz) this.zzz.visible = false;
        // contact damage if awake & close
        if (!this.bidenNap && Math.hypot(p.x - b.position.x, p.z - b.position.z) < 2.2 && p.y < 2) {
          this.hurt({ x: (p.x - b.position.x) * 4, z: -8 });
          this.showMessage('Biden: "Whoa whoa whoa, easy pal!"', 2);
        }
        if (p.z > b.position.z + 4) {
          this.phase = 3; this.updateHUD(); this.openDoor(2);
          if (this.zzz) { this.scene.remove(this.zzz); this.zzz = null; }
          b.position.x = 10; b.rotation.y = Math.PI;
          this.showMessage('Sneaky! Door unlocked. Kamala awaits…', 3);
        }
        break;
      }
      case 3: { // Kamala throws folders
        const km = this.npcs.kamala;
        km.rotation.y = Math.atan2(p.x - km.position.x, p.z - km.position.z);
        if (p.z > CFG.room3End + 1) { this.phase = 4; this.updateHUD(); this.openDoor(3); }
        break;
      }
      case 4: this.updateBoss(dt); break;
      case 5: break;
    }
    this.updateProjectiles(dt);
  },

  spawnTweet(x, z, dirZ) {
    const m = makeTweet();
    m.position.set(x, 1.5, z); this.scene.add(m);
    this.projectiles.push({ mesh: m, vx: (Math.random() - 0.5) * 2, vz: dirZ * 7, vy: 0, kind: 'tweet', life: 5 });
    AudioSys.tweet();
  },
  spawnFolder() {
    const km = this.npcs.kamala, p = this.cat.position;
    const m = makeFolder();
    m.position.set(km.position.x, 1.6, km.position.z); this.scene.add(m);
    const dx = p.x - km.position.x, dz = p.z - km.position.z;
    const d = Math.hypot(dx, dz) || 1;
    this.projectiles.push({ mesh: m, vx: dx / d * 8, vz: dz / d * 8, vy: 0, kind: 'folder', life: 4, spin: true });
    AudioSys.tweet();
  },

  updateProjectiles(dt) {
    // kamala folders spawn while she's active
    if (this.phase === 3 && this.cat.position.z > CFG.room3End - 24) {
      this.kamalaTimer -= dt;
      if (this.kamalaTimer <= 0) { this.spawnFolder(); this.kamalaTimer = 1.3; }
    }
    const p = this.cat.position;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.mesh.position.x += pr.vx * dt; pr.mesh.position.z += pr.vz * dt;
      pr.mesh.rotation.y += dt * 4;
      pr.life -= dt;
      const hit = Math.hypot(pr.mesh.position.x - p.x, pr.mesh.position.z - p.z) < 1.1 && p.y < 2.2;
      if (hit) {
        this.hurt({ x: pr.vx * 2, z: pr.vz * 2 * 0.5 - 6 });
        this.spawnParticles(pr.mesh.position, 0x4a99e9, 6, 3);
      }
      if (pr.life <= 0 || hit || Math.abs(pr.mesh.position.x) > 20) {
        this.scene.remove(pr.mesh); this.projectiles.splice(i, 1);
      }
    }
  },

  updateBoss(dt) {
    const T = this.npcs.trump, p = this.cat.position;
    const dist = Math.hypot(p.x - T.position.x, p.z - T.position.z);
    this.trumpTimer -= dt;
    if (this.trumpState === 'patrol') {
      // circle + approach
      const dx = p.x - T.position.x, dz = p.z - T.position.z, d = Math.hypot(dx, dz) || 1;
      T.position.x += dx / d * 3 * dt; T.position.z += dz / d * 3 * dt;
      T.position.x = Math.max(-9, Math.min(9, T.position.x));
      T.rotation.y = Math.atan2(dx, dz);
      if (this.trumpTimer <= 0) { this.trumpState = 'charge'; this.trumpTimer = 0.7; this.chargeDir = null; }
      if (dist < 1.6 && p.y < 2.4) this.hurt({ x: (p.x - T.position.x) * 6, z: -8 });
    } else if (this.trumpState === 'charge') {
      // telegraph then dash
      if (this.chargeDir === null) {
        T.rotation.y = Math.atan2(p.x - T.position.x, p.z - T.position.z);
        T.position.y = Math.abs(Math.sin(this.time * 20)) * 0.15;
        if (this.trumpTimer <= 0) {
          const dx = p.x - T.position.x, dz = p.z - T.position.z, d = Math.hypot(dx, dz) || 1;
          this.chargeDir = { x: dx / d * 14, z: dz / d * 14 };
          AudioSys.bossHit();
        }
      } else {
        T.position.x += this.chargeDir.x * dt; T.position.z += this.chargeDir.z * dt;
        const px = Math.max(-9, Math.min(9, T.position.x)), pz = Math.max(CFG.room3End + 3, Math.min(CFG.bossEnd - 4, T.position.z));
        if (px !== T.position.x || pz !== T.position.z) {
          // hit wall -> dizzy
          T.position.x = px; T.position.z = pz;
          this.trumpState = 'dizzy'; this.trumpTimer = 2.8;
          T.rotation.z = 0.4;
          this.shake = 0.4; AudioSys.stomp();
        }
        if (dist < 1.7 && p.y < 2.4) this.hurt({ x: this.chargeDir.x, z: this.chargeDir.z * 0.3 - 6 });
      }
    } else if (this.trumpState === 'dizzy') {
      T.position.y = Math.abs(Math.sin(this.time * 8)) * 0.1;
      if (this.trumpTimer <= 0) { this.trumpState = 'patrol'; this.trumpTimer = 2 + Math.random(); T.rotation.z = 0; }
    }
    // tweets from desk while patrolling
    if (this.trumpState === 'patrol') {
      this.tweetTimer -= dt;
      if (this.tweetTimer <= 0) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        this.spawnTweet(T.position.x + dir * 1.5, T.position.z, Math.random() < 0.5 ? -1 : 1);
        this.tweetTimer = 1.5 + Math.random();
      }
    }
    // stomp attack
    if (this.vel.y < -1 && dist < 1.5 &&
        p.y > T.position.y + 2.6 && this.trumpState === 'dizzy') {
      this.trumpHits++; this.vel.y = 9; this.onGround = false;
      AudioSys.stomp();
      this.spawnParticles(T.position.clone().setY(2.5), 0xf2d21f, 14, 5);
      this.shake = 0.4;
      this.showMessage('BOING! Trump hit ' + this.trumpHits + '/3', 1.5);
      if (this.trumpHits >= CFG.trumpHP) this.winSequence();
      else { this.trumpState = 'patrol'; this.trumpTimer = 1.5; T.rotation.z = 0; }
    }
  },

  winSequence() {
    this.phase = 5; this.updateHUD();
    this.npcs.trump.visible = false;
    this.spawnParticles(this.npcs.trump.position.clone().setY(1), 0xffd34d, 25, 7);
    this.micDrop = makeMic();
    this.micDrop.position.set(0, 0, (this.cat.position.z + this.npcs.trump.position.z) / 2);
    this.scene.add(this.micDrop);
    this.showMessage('The microphone dropped! Grab it and press E! 🎤', 4);
  },

  interact() {
    if (this.state !== 'play') return;
    if (this.phase === 5 && this.micDrop && !this.micTaken) {
      const d = this.cat.position.distanceTo(this.micDrop.position);
      if (d < 2.2) {
        this.micTaken = true;
        AudioSys.win();
        this.state = 'win';
        document.getElementById('win').classList.remove('hidden');
      } else this.showMessage('Get closer to the microphone!', 1.5);
    }
  },

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      pt.vy += CFG.gravity * 0.6 * dt;
      pt.mesh.position.x += pt.vx * dt; pt.mesh.position.y += pt.vy * dt; pt.mesh.position.z += pt.vz * dt;
      pt.mesh.rotation.x += dt * 6; pt.mesh.rotation.y += dt * 5;
      if (pt.life <= 0 || pt.mesh.position.y < 0) {
        this.scene.remove(pt.mesh); this.particles.splice(i, 1);
      }
    }
  }
};

Game.touchDir = { x: 0, y: 0 };
Game.ambientTweetTimer = 2;
Game.kamalaTimer = 0.5;
