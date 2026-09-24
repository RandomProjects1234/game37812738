(function () {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8ec9f0);
  scene.fog = new THREE.Fog(0x8ec9f0, 40, 90);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 5.5, -4);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x665544, 0.9));
  const sun = new THREE.DirectionalLight(0xfff2cc, 0.8);
  sun.position.set(10, 20, -10); scene.add(sun);

  Game.scene = scene; Game.camera = camera;
  Game.cat = makeCat(); scene.add(Game.cat);
  Game.build();

  // ---------- input ----------
  const keys = Game.keys;
  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    keys[e.key] = true;
    if (e.key === 'e' || e.key === 'E') Game.interact();
    AudioSys.init();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // touch: left half drag = move, buttons for jump/E
  let touchStart = null;
  const tUI = document.getElementById('touchUI');
  document.addEventListener('touchstart', e => {
    AudioSys.init();
    if (Game.state !== 'play') return;
    for (const t of e.changedTouches) {
      if (t.target.id === 'touchJump') { keys[' '] = true; setTimeout(() => keys[' '] = false, 120); }
      else if (t.target.id === 'touchUse') { Game.interact(); }
      else if (t.clientX < window.innerWidth / 2) touchStart = { id: t.identifier, x: t.clientX, y: t.clientY };
    }
  }, { passive: false });
  document.addEventListener('touchmove', e => {
    if (!touchStart) return;
    for (const t of e.changedTouches) {
      if (t.identifier === touchStart.id) {
        Game.touchDir.x = Math.max(-1, Math.min(1, (t.clientX - touchStart.x) / 50));
        Game.touchDir.y = Math.max(-1, Math.min(1, (t.clientY - touchStart.y) / 50));
      }
    }
  }, { passive: false });
  document.addEventListener('touchend', e => {
    if (touchStart && e.changedTouches.some(t => t.identifier === touchStart.id)) {
      touchStart = null; Game.touchDir.x = 0; Game.touchDir.y = 0;
    }
  });

  // ---------- overlays ----------
  function show(id) { document.getElementById(id).classList.remove('hidden'); }
  function hide(id) { document.getElementById(id).classList.add('hidden'); }
  function restart() {
    hide('gameover'); hide('win'); hide('pause');
    Game.startGame();
  }
  document.getElementById('startBtn').addEventListener('click', () => {
    AudioSys.init(); hide('menu'); tUI.classList.remove('hidden'); Game.startGame();
  });
  document.getElementById('resumeBtn').addEventListener('click', () => { hide('pause'); Game.state = 'play'; });
  document.getElementById('restartBtn1').addEventListener('click', restart);
  document.getElementById('restartBtn2').addEventListener('click', restart);
  document.getElementById('restartBtn3').addEventListener('click', restart);

  function togglePause() {
    if (Game.state === 'play') { Game.state = 'pause'; show('pause'); }
    else if (Game.state === 'pause') { Game.state = 'play'; hide('pause'); }
  }
  window.addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause(); });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---------- loop ----------
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    let dt = (now - last) / 1000; last = now;
    dt = Math.max(0, Math.min(dt, 0.05));
    if (Game.state === 'play' || Game.state === 'win' || Game.state === 'over') Game.update(dt);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
})();
