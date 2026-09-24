// ---------- low level helpers ----------
function box(w, h, d, color, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
  m.position.set(x || 0, y || 0, z || 0);
  return m;
}

// ---------- the cat ----------
function makeCat() {
  const g = new THREE.Group();
  const ORANGE = 0xf39c48, CREAM = 0xffe0b3, PINK = 0xff7bac;
  const body = box(0.9, 0.65, 1.4, ORANGE, 0, 0.85, 0); g.add(body);
  const belly = box(0.6, 0.3, 1.0, CREAM, 0, 0.6, 0); g.add(belly);
  const head = box(0.75, 0.65, 0.7, ORANGE, 0, 1.45, 0.75); g.add(head);
  const earL = box(0.18, 0.25, 0.15, ORANGE, -0.25, 1.9, 0.75); g.add(earL);
  const earR = box(0.18, 0.25, 0.15, ORANGE, 0.25, 1.9, 0.75); g.add(earR);
  const eyeL = box(0.1, 0.12, 0.05, 0x222222, -0.18, 1.5, 1.11); g.add(eyeL);
  const eyeR = box(0.1, 0.12, 0.05, 0x222222, 0.18, 1.5, 1.11); g.add(eyeR);
  const nose = box(0.12, 0.08, 0.05, PINK, 0, 1.36, 1.11); g.add(nose);
  const whisk = box(0.55, 0.03, 0.03, 0xffffff, 0, 1.32, 1.13); g.add(whisk);
  const tail = box(0.14, 0.14, 0.8, ORANGE, 0, 1.2, -0.95); tail.name = 'tail'; g.add(tail);
  g.userData.legs = [];
  for (let i = 0; i < 4; i++) {
    const leg = box(0.22, 0.55, 0.22, ORANGE, (i % 2 === 0 ? -0.3 : 0.3), 0.28, (i < 2 ? 0.45 : -0.45));
    g.userData.legs.push(leg); g.add(leg);
  }
  g.userData.mats = [body.material, head.material];
  return g;
}

// ---------- humans ----------
function makePerson(opts) {
  const g = new THREE.Group();
  const H = opts.height || 2.2;
  const body = box(1.1, H * 0.55, 0.7, opts.suit, 0, H * 0.4, 0); g.add(body);
  const tie = box(0.18, 0.5, 0.05, opts.tie || 0xcc2222, 0, H * 0.48, 0.37); g.add(tie);
  const head = box(0.6, 0.6, 0.6, opts.skin, 0, H * 0.72 + 0.35, 0); g.add(head);
  const hair = box(0.66, 0.2, 0.66, opts.hair, 0, H * 0.72 + 0.72, 0); g.add(hair);
  const eyeL = box(0.08, 0.1, 0.05, 0x111111, -0.14, H * 0.72 + 0.4, 0.31); g.add(eyeL);
  const eyeR = box(0.08, 0.1, 0.05, 0x111111, 0.14, H * 0.72 + 0.4, 0.31); g.add(eyeR);
  const armL = box(0.22, H * 0.4, 0.25, opts.suit, -0.7, H * 0.4, 0); g.add(armL);
  const armR = box(0.22, H * 0.4, 0.25, opts.suit, 0.7, H * 0.4, 0); g.add(armR);
  g.userData.head = head;
  return g;
}

function makeObama() { return makePerson({ suit: 0x232733, skin: 0x8a5a3b, hair: 0x1a1a1a, tie: 0x3b6fd4 }); }
function makeBiden() { return makePerson({ suit: 0x2b3a55, skin: 0xf0c8a0, hair: 0xeeeeee, tie: 0x3366aa }); }
function makeKamala() { return makePerson({ suit: 0x3a2f45, skin: 0xc08a5f, hair: 0x201510, tie: 0x8844aa, height: 2.0 }); }
function makeTrump() {
  const g = makePerson({ suit: 0x1f2430, skin: 0xf5b56a, hair: 0xf2d21f, tie: 0xdd2222, height: 2.4 });
  // exaggerated hair swoosh
  const swoosh = box(0.8, 0.18, 0.5, 0xf2d21f, 0, 2.6, 0.15); g.add(swoosh);
  return g;
}

function makeFish() {
  const g = new THREE.Group();
  const b = box(0.5, 0.3, 0.2, 0x66d9ff, 0, 0.5, 0); g.add(b);
  const t = box(0.2, 0.3, 0.15, 0x3aa9cc, 0.32, 0.5, 0); g.add(t);
  const e = box(0.07, 0.07, 0.05, 0x111111, -0.18, 0.56, 0.11); g.add(e);
  return g;
}

function makeTweet() {
  const g = new THREE.Group();
  const b = box(0.7, 0.7, 0.7, 0x4a99e9, 0, 0, 0); g.add(b);
  const bird = box(0.3, 0.2, 0.72, 0xffffff, 0, 0, 0); g.add(bird);
  return g;
}

function makeFolder() {
  const g = new THREE.Group();
  g.add(box(0.7, 0.5, 0.1, 0xd9a441));
  g.add(box(0.55, 0.08, 0.12, 0x8a6420, 0, 0.12, 0));
  return g;
}

function makeMic() {
  const g = new THREE.Group();
  g.add(box(0.12, 0.9, 0.12, 0x333333, 0, 0.45, 0));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshLambertMaterial({ color: 0x9aa0aa }));
  head.position.y = 1.0; g.add(head);
  return g;
}

function makeZzz() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  x.font = 'bold 48px Trebuchet MS'; x.fillStyle = '#7fe3ff'; x.fillText('Z', 10, 50);
  const t = new THREE.CanvasTexture(c);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
  return s;
}
