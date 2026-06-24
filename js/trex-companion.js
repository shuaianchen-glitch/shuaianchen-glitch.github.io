window.TrexCompanion = (() => {
  const T = window.THREE;
  const STATE = {
    WANDER: "wander",
    REST: "rest",
    BUBBLE: "bubble",
    SPRINT: "sprint",
    ROAR: "roar",
    FOLLOW: "follow",
  };

  let stage;
  let sceneWrap;
  let fxLayer;
  let titleEl;
  let canvas;
  let renderer;
  let scene;
  let camera;
  let trexGroup;
  let jawGroup;
  let legL;
  let legR;
  let tailGroup;
  let eyelidL;
  let eyelidR;
  let floor;
  let bubbles = [];

  let raf = 0;
  let last = 0;
  let animT = 0;
  let pos = { x: 0, z: 0 };
  let vel = { x: 0, z: 0 };
  let facing = 1;
  let energy = 88;
  let state = STATE.WANDER;
  let stateTime = 0;
  let patrol = { minX: -0.55, maxX: 0.55, minZ: -0.35, maxZ: 0.25 };
  let mouse = { x: 0, z: 0, inStage: false };
  let roamTarget = { x: 0, z: 0 };
  let bubbleTimer = 0;
  let roarCooldown = 0;

  const teal = 0x5ec4b8;
  const tealDark = 0x3a9a8e;
  const cream = 0xf4efe4;

  function mat(color, opts = {}) {
    return new T.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.42,
      metalness: opts.metalness ?? 0.08,
      emissive: opts.emissive ?? 0x000000,
      emissiveIntensity: opts.emissiveIntensity ?? 0,
    });
  }

  function buildTrex() {
    trexGroup = new T.Group();

    const body = new T.Mesh(new T.SphereGeometry(0.42, 24, 24), mat(teal));
    body.scale.set(1.1, 0.95, 1.35);
    body.position.y = 0.42;
    trexGroup.add(body);

    const belly = new T.Mesh(new T.SphereGeometry(0.28, 20, 20), mat(cream, { roughness: 0.55 }));
    belly.scale.set(0.9, 0.7, 1.1);
    belly.position.set(0, 0.32, 0.12);
    trexGroup.add(belly);

    tailGroup = new T.Group();
    tailGroup.position.set(-0.38, 0.48, 0);
    for (let i = 0; i < 4; i += 1) {
      const seg = new T.Mesh(new T.SphereGeometry(0.14 - i * 0.02, 12, 12), mat(i % 2 ? tealDark : teal));
      seg.position.set(-i * 0.18, i * 0.04, 0);
      tailGroup.add(seg);
    }
    trexGroup.add(tailGroup);

    for (let i = 0; i < 5; i += 1) {
      const spike = new T.Mesh(new T.ConeGeometry(0.04, 0.1, 6), mat(cream));
      spike.position.set(-0.15 + i * 0.12, 0.72, -0.05 + (i % 2) * 0.04);
      spike.rotation.x = -0.4;
      trexGroup.add(spike);
    }

    const head = new T.Mesh(new T.SphereGeometry(0.34, 24, 24), mat(teal));
    head.position.set(0.42, 0.72, 0.08);
    head.scale.set(1.05, 1, 0.95);
    trexGroup.add(head);

    jawGroup = new T.Group();
    jawGroup.position.set(0.58, 0.58, 0.12);
    const jaw = new T.Mesh(new T.SphereGeometry(0.18, 16, 16), mat(tealDark));
    jaw.scale.set(1.2, 0.75, 1);
    jawGroup.add(jaw);
    const mouth = new T.Mesh(new T.SphereGeometry(0.1, 12, 12), mat(0xe8a0b4, { roughness: 0.6 }));
    mouth.position.set(0.08, -0.04, 0.02);
    mouth.scale.set(1.3, 0.5, 0.8);
    jawGroup.add(mouth);
    trexGroup.add(jawGroup);

    [[0.52, 0.82, 0.18], [0.62, 0.78, 0.22]].forEach(([x, y, z]) => {
      const eyeW = new T.Mesh(new T.SphereGeometry(0.09, 16, 16), mat(0xffffff, { roughness: 0.2 }));
      eyeW.position.set(x, y, z);
      trexGroup.add(eyeW);
      const eye = new T.Mesh(new T.SphereGeometry(0.045, 12, 12), mat(0x1a1a28));
      eye.position.set(x + 0.02, y - 0.01, z + 0.05);
      trexGroup.add(eye);
      const shine = new T.Mesh(new T.SphereGeometry(0.018, 8, 8), mat(0xffffff));
      shine.position.set(x + 0.03, y + 0.02, z + 0.07);
      trexGroup.add(shine);
    });

    eyelidL = new T.Mesh(new T.SphereGeometry(0.1, 12, 12), mat(teal));
    eyelidL.position.set(0.52, 0.82, 0.2);
    eyelidL.scale.set(1, 0.35, 0.6);
    eyelidL.visible = false;
    trexGroup.add(eyelidL);
    eyelidR = eyelidL.clone();
    eyelidR.position.set(0.62, 0.78, 0.24);
    trexGroup.add(eyelidR);

    const armL = new T.Mesh(new T.SphereGeometry(0.06, 10, 10), mat(tealDark));
    armL.scale.set(0.8, 1.2, 0.8);
    armL.position.set(0.18, 0.38, 0.28);
    trexGroup.add(armL);
    const armR = armL.clone();
    armR.position.z = -0.22;
    trexGroup.add(armR);

    legL = new T.Group();
    legL.position.set(0.08, 0.18, 0.18);
    const upperL = new T.Mesh(new T.CylinderGeometry(0.07, 0.08, 0.22, 10), mat(tealDark));
    upperL.position.y = 0.12;
    legL.add(upperL);
    const footL = new T.Mesh(new T.SphereGeometry(0.1, 12, 12), mat(tealDark));
    footL.position.set(0.02, -0.02, 0.04);
    footL.scale.set(1.2, 0.6, 1.4);
    legL.add(footL);
    trexGroup.add(legL);

    legR = new T.Group();
    legR.position.set(0.08, 0.18, -0.16);
    legR.add(upperL.clone());
    legR.add(footL.clone());
    trexGroup.add(legR);

    trexGroup.scale.setScalar(1.15);
    trexGroup.position.y = 0.02;
    scene.add(trexGroup);
  }

  function initThree() {
    canvas = document.getElementById("trex-canvas");
    if (!canvas || !T) return false;

    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    scene = new T.Scene();
    camera = new T.PerspectiveCamera(28, 1, 0.1, 20);
    camera.position.set(0, 0.85, 2.8);
    camera.lookAt(0, 0.35, 0);

    scene.add(new T.AmbientLight(0x404860, 0.55));
    const key = new T.DirectionalLight(0xffffff, 1.15);
    key.position.set(2, 4, 3);
    scene.add(key);
    const rim = new T.DirectionalLight(0x8ecfd4, 0.55);
    rim.position.set(-2, 2, -2);
    scene.add(rim);
    const fill = new T.PointLight(0x5ec4d4, 0.35, 8);
    fill.position.set(0, 1.2, 1.5);
    scene.add(fill);

    floor = new T.Mesh(
      new T.CircleGeometry(1.35, 48),
      new T.MeshStandardMaterial({
        color: 0x050508,
        roughness: 0.18,
        metalness: 0.82,
        transparent: true,
        opacity: 0.92,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    const glow = new T.Mesh(
      new T.CircleGeometry(0.55, 32),
      new T.MeshBasicMaterial({ color: 0x5ec4d4, transparent: true, opacity: 0.06 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.01;
    scene.add(glow);

    buildTrex();
    resizeCanvas();
    return true;
  }

  function resizeCanvas() {
    if (!canvas || !renderer || !camera) return;
    const wrap = document.getElementById("trex-viewport");
    const w = wrap?.clientWidth || 240;
    const h = wrap?.clientHeight || 220;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function pickRoamTarget() {
    roamTarget.x = patrol.minX + Math.random() * (patrol.maxX - patrol.minX);
    roamTarget.z = patrol.minZ + Math.random() * (patrol.maxZ - patrol.minZ);
  }

  function setState(next) {
    if (state === next) return;
    state = next;
    stateTime = 0;
    if (sceneWrap) sceneWrap.dataset.state = next;
  }

  function spawnBubble3D() {
    if (!trexGroup) return;
    const b = new T.Mesh(
      new T.SphereGeometry(0.035 + Math.random() * 0.02, 10, 10),
      new T.MeshBasicMaterial({ color: 0x8ee8f0, transparent: true, opacity: 0.65 })
    );
    b.position.set(0.62 * facing, 0.78, 0.15 * facing);
    trexGroup.add(b);
    bubbles.push({ mesh: b, life: 0, vy: 0.35 + Math.random() * 0.15 });
  }

  function spawnRoarDom() {
    if (!fxLayer) return;
    const r = document.createElement("span");
    r.className = "trex-roar-burst";
    r.textContent = "ROAR!";
    fxLayer.appendChild(r);
    setTimeout(() => r.remove(), 900);
  }

  function think(dt) {
    roarCooldown = Math.max(0, roarCooldown - dt);
    stateTime += dt;
    energy = Math.min(100, energy + dt * (state === STATE.REST || state === STATE.BUBBLE ? 9 : 2));

    if (mouse.inStage && state !== STATE.ROAR && state !== STATE.SPRINT) {
      if (state !== STATE.FOLLOW && state !== STATE.REST && state !== STATE.BUBBLE) setState(STATE.FOLLOW);
    } else if (state === STATE.FOLLOW && !mouse.inStage) {
      setState(STATE.WANDER);
      pickRoamTarget();
    }

    if (state === STATE.ROAR) {
      if (stateTime > 1.4) { setState(STATE.WANDER); pickRoamTarget(); }
      return;
    }
    if (state === STATE.SPRINT) {
      if (stateTime > 1.2 || Math.hypot(pos.x - roamTarget.x, pos.z - roamTarget.z) < 0.06) setState(STATE.REST);
      return;
    }
    if (state === STATE.BUBBLE) {
      bubbleTimer += dt;
      if (bubbleTimer > 1.1) { bubbleTimer = 0; spawnBubble3D(); }
      if (stateTime > 5 || energy > 92) {
        setState(STATE.WANDER);
        pickRoamTarget();
        if (roarCooldown <= 0 && Math.random() < 0.35) {
          roarCooldown = 8;
          setState(STATE.ROAR);
          spawnRoarDom();
        }
      }
      return;
    }
    if (state === STATE.REST) {
      if (stateTime > 1.2) setState(STATE.BUBBLE);
      return;
    }

    energy -= dt * 5.5;
    if (energy < 22 && state !== STATE.FOLLOW) {
      roamTarget.x = patrol.minX + 0.1;
      roamTarget.z = patrol.maxZ;
      setState(STATE.SPRINT);
      return;
    }
    if (energy < 48 && state === STATE.WANDER && stateTime > 4 && Math.random() < 0.015) {
      setState(STATE.REST);
      return;
    }
    if (stateTime > 6 && Math.hypot(pos.x - roamTarget.x, pos.z - roamTarget.z) < 0.08) {
      pickRoamTarget();
      stateTime = 0;
    }
    if (roarCooldown <= 0 && stateTime > 12 && Math.random() < 0.008) {
      roarCooldown = 14;
      setState(STATE.ROAR);
      spawnRoarDom();
    }
  }

  function step(dt) {
    let tx = roamTarget.x;
    let tz = roamTarget.z;
    let speed = 0.45;

    if (state === STATE.FOLLOW && mouse.inStage) {
      tx = mouse.x;
      tz = mouse.z;
      speed = 0.55;
    } else if (state === STATE.SPRINT) {
      speed = 1.35;
    } else if (state === STATE.REST || state === STATE.BUBBLE || state === STATE.ROAR) {
      vel.x *= 0.85;
      vel.z *= 0.85;
      return;
    }

    const dx = tx - pos.x;
    const dz = tz - pos.z;
    const dist = Math.hypot(dx, dz) || 1;
    vel.x += ((dx / dist) * speed - vel.x) * Math.min(1, dt * 7);
    vel.z += ((dz / dist) * speed - vel.z) * Math.min(1, dt * 7);
    pos.x = Math.max(patrol.minX, Math.min(patrol.maxX, pos.x + vel.x * dt));
    pos.z = Math.max(patrol.minZ, Math.min(patrol.maxZ, pos.z + vel.z * dt));
    if (Math.abs(vel.x) > 0.02) facing = vel.x > 0 ? 1 : -1;
  }

  function animateTrex(dt) {
    if (!trexGroup) return;
    animT += dt;
    trexGroup.position.x = pos.x;
    trexGroup.position.z = pos.z;
    trexGroup.rotation.y = facing > 0 ? -0.15 : 0.15;

    const walking = state === STATE.WANDER || state === STATE.SPRINT || state === STATE.FOLLOW;
    const speedMul = state === STATE.SPRINT ? 2.8 : state === STATE.FOLLOW ? 1.2 : 1;
    const phase = animT * (walking ? 6 * speedMul : 1);

    if (walking) {
      legL.rotation.x = Math.sin(phase) * 0.45;
      legR.rotation.x = Math.sin(phase + Math.PI) * 0.45;
      trexGroup.position.y = 0.02 + Math.abs(Math.sin(phase)) * 0.035;
      tailGroup.rotation.y = Math.sin(phase * 0.5) * 0.12;
      eyelidL.visible = false;
      eyelidR.visible = false;
      jawGroup.rotation.x = 0;
    } else if (state === STATE.REST || state === STATE.BUBBLE) {
      legL.rotation.x = 0.35;
      legR.rotation.x = 0.35;
      trexGroup.position.y = 0.01 + Math.sin(animT * 1.2) * 0.012;
      eyelidL.visible = true;
      eyelidR.visible = true;
      jawGroup.rotation.x = 0.05;
    } else if (state === STATE.ROAR) {
      jawGroup.rotation.x = 0.35 + Math.sin(animT * 18) * 0.12;
      trexGroup.rotation.z = Math.sin(animT * 22) * 0.04;
      tailGroup.rotation.y = Math.sin(animT * 12) * 0.2;
      trexGroup.position.y = 0.02 + Math.sin(animT * 10) * 0.02;
    }

    bubbles = bubbles.filter((b) => {
      b.life += dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.material.opacity = Math.max(0, 0.65 - b.life * 0.35);
      b.mesh.scale.setScalar(1 + b.life * 0.4);
      if (b.life > 2) {
        trexGroup.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        return false;
      }
      return true;
    });

    const behind = pos.z < -0.05;
    sceneWrap?.classList.toggle("is-behind", behind);
  }

  function onPointerMove(e) {
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const nz = (e.clientY - r.top) / r.height;
    mouse.x = patrol.minX + nx * (patrol.maxX - patrol.minX);
    mouse.z = patrol.minZ + (1 - nz) * (patrol.maxZ - patrol.minZ);
    mouse.inStage =
      e.clientX >= r.left - 30 &&
      e.clientX <= r.right + 80 &&
      e.clientY >= r.top - 30 &&
      e.clientY <= r.bottom + 30;
  }

  function tick(now) {
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;
    think(dt);
    step(dt);
    animateTrex(dt);
    if (renderer && scene && camera) renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  function init() {
    stage = document.getElementById("hero-stage");
    sceneWrap = document.getElementById("trex-viewport");
    fxLayer = document.getElementById("trex-fx");
    titleEl = document.getElementById("hero-title");
    if (!stage || !initThree()) return;

    pos.x = -0.15;
    pos.z = 0.1;
    pickRoamTarget();
    setState(STATE.WANDER);

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", onPointerMove);
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function destroy() {
    cancelAnimationFrame(raf);
    renderer?.dispose();
  }

  return { init, destroy };
})();
