window.TrexCompanion = (() => {
  const T = window.THREE;
  if (!T) return { init() {}, destroy() {} };

  const STATE = {
    WANDER: "wander",
    PAUSE: "pause",
    SIT: "sit",
    SLEEP: "sleep",
    YAWN: "yawn",
    SNIFF: "sniff",
    CURIOUS: "curious",
    FOLLOW: "follow",
    SPRINT: "sprint",
    ROAR: "roar",
    JUMP: "jump",
    BOUNCE: "bounce",
  };

  const COL = {
    moon: 0xd9d6cf,
    moonDark: 0xb8b4ab,
    ivory: 0xf2eee8,
    graphite: 0x5c5c62,
    amber: 0xc67a2e,
    amberDeep: 0x8a4f18,
  };

  let stage;
  let sceneWrap;
  let titleEl;
  let canvas;
  let renderer;
  let scene;
  let camera;
  let trexRoot;
  let bodyGroup;
  let headGroup;
  let jawGroup;
  let legL;
  let legR;
  let tailGroup;
  let pupilL;
  let pupilR;
  let eyelidL;
  let eyelidR;
  let contactShadow;
  let bubbles = [];

  let raf = 0;
  let last = 0;
  let animT = 0;
  let pos = { x: 0, z: 0 };
  let vel = { x: 0, z: 0 };
  let facing = 1;
  let energy = 82;
  let state = STATE.WANDER;
  let stateTime = 0;
  let patrol = { minX: -0.85, maxX: 0.95, minZ: -0.45, maxZ: 0.35 };
  let mouse = { x: 0, z: 0, inStage: false, screenX: 0, screenY: 0 };
  let roamTarget = { x: 0, z: 0 };
  let bubbleTimer = 0;
  let blinkTimer = 2.5;
  let lookTarget = { x: 0, y: 0.75, z: 0.3 };
  let baseScale = 1.28;

  function skin(color, opts = {}) {
    return new T.MeshPhysicalMaterial({
      color,
      roughness: opts.roughness ?? 0.62,
      metalness: opts.metalness ?? 0.04,
      clearcoat: opts.clearcoat ?? 0.22,
      clearcoatRoughness: 0.32,
      emissive: opts.emissive ?? 0x1a1814,
      emissiveIntensity: opts.emissiveIntensity ?? 0.03,
    });
  }

  function buildBabyTrex() {
    trexRoot = new T.Group();
    bodyGroup = new T.Group();
    headGroup = new T.Group();
    headGroup.position.set(0.38, 0.62, 0.06);

    const torso = new T.Mesh(new T.SphereGeometry(0.36, 32, 32), skin(COL.moon));
    torso.scale.set(1.05, 0.92, 1.22);
    torso.position.y = 0.38;
    bodyGroup.add(torso);

    const belly = new T.Mesh(new T.SphereGeometry(0.24, 28, 28), skin(COL.ivory, { roughness: 0.72 }));
    belly.scale.set(0.95, 0.65, 1.05);
    belly.position.set(0.02, 0.28, 0.14);
    bodyGroup.add(belly);

    tailGroup = new T.Group();
    tailGroup.position.set(-0.34, 0.44, 0);
    for (let i = 0; i < 5; i += 1) {
      const s = 0.13 - i * 0.018;
      const seg = new T.Mesh(new T.SphereGeometry(s, 16, 16), skin(i % 2 ? COL.moonDark : COL.moon));
      seg.position.set(-i * 0.17, i * 0.035, 0);
      tailGroup.add(seg);
    }
    bodyGroup.add(tailGroup);

    for (let i = 0; i < 6; i += 1) {
      const spike = new T.Mesh(new T.ConeGeometry(0.028, 0.075, 5), skin(COL.graphite, { roughness: 0.45 }));
      spike.position.set(-0.12 + i * 0.11, 0.62 + (i % 2) * 0.03, -0.04 + (i % 3) * 0.03);
      spike.rotation.x = -0.55;
      bodyGroup.add(spike);
    }

    const head = new T.Mesh(new T.SphereGeometry(0.38, 32, 32), skin(COL.moon));
    head.scale.set(1.12, 1.05, 1);
    headGroup.add(head);

    const snout = new T.Mesh(new T.SphereGeometry(0.2, 24, 24), skin(COL.moonDark));
    snout.scale.set(1.15, 0.82, 0.88);
    snout.position.set(0.22, -0.06, 0.06);
    headGroup.add(snout);

    jawGroup = new T.Group();
    jawGroup.position.set(0.18, -0.14, 0.08);
    const jaw = new T.Mesh(new T.SphereGeometry(0.14, 20, 20), skin(COL.moonDark));
    jaw.scale.set(1.25, 0.7, 0.95);
    jawGroup.add(jaw);
    headGroup.add(jawGroup);

    const eyeSocketL = new T.Mesh(new T.SphereGeometry(0.11, 20, 20), skin(COL.ivory, { roughness: 0.35 }));
    eyeSocketL.position.set(0.08, 0.1, 0.2);
    headGroup.add(eyeSocketL);
    const irisL = new T.Mesh(new T.SphereGeometry(0.065, 16, 16), skin(COL.amber, { roughness: 0.4 }));
    irisL.position.set(0.1, 0.08, 0.26);
    headGroup.add(irisL);
    pupilL = new T.Mesh(new T.SphereGeometry(0.028, 12, 12), skin(COL.amberDeep));
    pupilL.position.set(0.12, 0.07, 0.3);
    headGroup.add(pupilL);
    const shineL = new T.Mesh(new T.SphereGeometry(0.012, 8, 8), skin(0xffffff, { roughness: 0.1 }));
    shineL.position.set(0.13, 0.1, 0.32);
    headGroup.add(shineL);

    const eyeSocketR = eyeSocketL.clone();
    eyeSocketR.position.z = 0.08;
    headGroup.add(eyeSocketR);
    const irisR = irisL.clone();
    irisR.position.z = 0.14;
    headGroup.add(irisR);
    pupilR = pupilL.clone();
    pupilR.position.z = 0.18;
    headGroup.add(pupilR);

    eyelidL = new T.Mesh(new T.SphereGeometry(0.115, 12, 12), skin(COL.moon));
    eyelidL.position.copy(eyeSocketL.position);
    eyelidL.position.z += 0.02;
    eyelidL.scale.set(1, 0.28, 0.75);
    eyelidL.visible = false;
    headGroup.add(eyelidL);
    eyelidR = eyelidL.clone();
    eyelidR.position.copy(eyeSocketR.position);
    eyelidR.position.z += 0.02;
    headGroup.add(eyelidR);

    const armL = new T.Mesh(new T.SphereGeometry(0.045, 10, 10), skin(COL.moonDark));
    armL.scale.set(0.7, 1.1, 0.7);
    armL.position.set(0.02, 0.22, 0.24);
    bodyGroup.add(armL);
    const armR = armL.clone();
    armR.position.z = -0.18;
    bodyGroup.add(armR);

    legL = new T.Group();
    legL.position.set(0.06, 0.14, 0.2);
    const thighL = new T.Mesh(new T.CylinderGeometry(0.085, 0.1, 0.2, 12), skin(COL.moonDark));
    thighL.position.y = 0.1;
    legL.add(thighL);
    const footL = new T.Mesh(new T.SphereGeometry(0.11, 14, 14), skin(COL.moonDark));
    footL.scale.set(1.35, 0.55, 1.55);
    footL.position.set(0.02, -0.02, 0.05);
    legL.add(footL);
    bodyGroup.add(legL);

    legR = new T.Group();
    legR.position.set(0.06, 0.14, -0.14);
    legR.add(thighL.clone());
    legR.add(footL.clone());
    bodyGroup.add(legR);

    bodyGroup.add(headGroup);
    trexRoot.add(bodyGroup);
    trexRoot.scale.setScalar(baseScale);
    trexRoot.position.y = 0.04;
    scene.add(trexRoot);
  }

  function buildEnvironment() {
    const floor = new T.Mesh(
      new T.CircleGeometry(1.6, 64),
      new T.MeshStandardMaterial({
        color: 0x030304,
        roughness: 0.22,
        metalness: 0.78,
        transparent: true,
        opacity: 0.85,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    contactShadow = new T.Mesh(
      new T.CircleGeometry(0.42, 32),
      new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.008;
    scene.add(contactShadow);

    const ambientField = new T.Mesh(
      new T.CircleGeometry(0.7, 32),
      new T.MeshBasicMaterial({ color: 0x5ec4d4, transparent: true, opacity: 0.035 })
    );
    ambientField.rotation.x = -Math.PI / 2;
    ambientField.position.y = 0.012;
    scene.add(ambientField);
  }

  function initThree() {
    canvas = document.getElementById("trex-canvas");
    if (!canvas) return false;

    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.physicallyCorrectLights = true;

    scene = new T.Scene();
    camera = new T.PerspectiveCamera(24, 1, 0.1, 30);
    camera.position.set(0.05, 0.72, 3.35);
    camera.lookAt(0.1, 0.42, 0);

    scene.add(new T.AmbientLight(0x8899aa, 0.32));
    scene.add(new T.HemisphereLight(0xd9d6cf, 0x080810, 0.45));

    const key = new T.DirectionalLight(0xfff5eb, 1.05);
    key.position.set(2.5, 4.5, 3);
    scene.add(key);
    const rim = new T.DirectionalLight(0x8ecfd4, 0.28);
    rim.position.set(-2.5, 2, -2);
    scene.add(rim);
    const fill = new T.PointLight(0xf2eee8, 0.22, 6);
    fill.position.set(-0.5, 1.1, 1.8);
    scene.add(fill);

    buildEnvironment();
    buildBabyTrex();
    resizeCanvas();
    return true;
  }

  function resizeCanvas() {
    if (!canvas || !renderer || !camera || !stage) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const vw = window.innerWidth;
    const targetFrac = Math.min(0.25, Math.max(0.18, vw < 768 ? 0.2 : 0.22));
    const visibleWidth = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z * camera.aspect;
    baseScale = (visibleWidth * targetFrac) / 1.05;
    if (trexRoot) trexRoot.scale.setScalar(baseScale);
  }

  function pickRoamTarget() {
    const zones = [
      { x: [-0.75, -0.2], z: [-0.35, 0.1] },
      { x: [0.15, 0.85], z: [-0.25, 0.25] },
      { x: [-0.4, 0.5], z: [-0.4, -0.05] },
    ];
    const z = zones[Math.floor(Math.random() * zones.length)];
    roamTarget.x = z.x[0] + Math.random() * (z.x[1] - z.x[0]);
    roamTarget.z = z.z[0] + Math.random() * (z.z[1] - z.z[0]);
  }

  function setState(next) {
    if (state === next) return;
    state = next;
    stateTime = 0;
    if (sceneWrap) sceneWrap.dataset.state = next;
  }

  function spawnBubble() {
    if (!headGroup) return;
    const b = new T.Mesh(
      new T.SphereGeometry(0.022 + Math.random() * 0.012, 10, 10),
      new T.MeshPhysicalMaterial({
        color: 0xc8e8ec,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        metalness: 0,
        clearcoat: 0.8,
      })
    );
    b.position.set(0.28, 0.02, 0.12);
    headGroup.add(b);
    bubbles.push({ mesh: b, life: 0, vy: 0.22 + Math.random() * 0.1 });
  }

  function distToMouse() {
    return Math.hypot(pos.x - mouse.x, pos.z - mouse.z);
  }

  function think(dt) {
    stateTime += dt;
    energy = Math.min(100, energy + dt * (state === STATE.SLEEP || state === STATE.SIT ? 8 : 1.8));

    if (mouse.inStage && state !== STATE.ROAR && state !== STATE.SPRINT && state !== STATE.JUMP) {
      const d = distToMouse();
      if (d < 0.22 && state !== STATE.SNIFF && state !== STATE.SLEEP) setState(STATE.SNIFF);
      else if (d < 0.55 && state === STATE.WANDER) setState(STATE.CURIOUS);
      else if (d < 0.75 && ![STATE.FOLLOW, STATE.SNIFF, STATE.CURIOUS, STATE.SLEEP, STATE.SIT].includes(state)) {
        setState(STATE.FOLLOW);
      }
    } else if ([STATE.FOLLOW, STATE.CURIOUS, STATE.SNIFF].includes(state) && !mouse.inStage) {
      setState(STATE.WANDER);
      pickRoamTarget();
    }

    switch (state) {
      case STATE.ROAR:
        if (stateTime > 1.6) { setState(STATE.BOUNCE); }
        break;
      case STATE.BOUNCE:
        if (stateTime > 0.9) { setState(STATE.WANDER); pickRoamTarget(); }
        break;
      case STATE.JUMP:
        if (stateTime > 0.55) setState(STATE.WANDER);
        break;
      case STATE.SPRINT:
        if (stateTime > 1.4 || Math.hypot(pos.x - roamTarget.x, pos.z - roamTarget.z) < 0.07) setState(STATE.YAWN);
        break;
      case STATE.YAWN:
        if (stateTime > 2.2) setState(STATE.SIT);
        break;
      case STATE.SIT:
        if (stateTime > 3) setState(STATE.SLEEP);
        break;
      case STATE.SLEEP:
        bubbleTimer += dt;
        if (bubbleTimer > 1.4) { bubbleTimer = 0; spawnBubble(); }
        if (stateTime > 7 || energy > 94) {
          setState(STATE.WANDER);
          pickRoamTarget();
          if (Math.random() < 0.4) setState(STATE.ROAR);
        }
        break;
      case STATE.SNIFF:
        if (stateTime > 2.5 || !mouse.inStage) setState(STATE.PAUSE);
        break;
      case STATE.PAUSE:
        if (stateTime > 1.8) { setState(STATE.WANDER); pickRoamTarget(); }
        break;
      case STATE.CURIOUS:
        if (stateTime > 3 || distToMouse() > 0.65) setState(STATE.WANDER);
        break;
      default:
        energy -= dt * 4.5;
        if (energy < 18) {
          roamTarget.x = patrol.minX + 0.15;
          roamTarget.z = patrol.maxZ;
          setState(STATE.SPRINT);
        } else if (state === STATE.WANDER && stateTime > 5 && Math.random() < 0.012) {
          setState(STATE.PAUSE);
        } else if (state === STATE.WANDER && stateTime > 8 && Math.random() < 0.01) {
          setState(STATE.JUMP);
        } else if (stateTime > 7 && Math.hypot(pos.x - roamTarget.x, pos.z - roamTarget.z) < 0.09) {
          pickRoamTarget();
          stateTime = 0;
        } else if (stateTime > 14 && Math.random() < 0.006) {
          setState(STATE.ROAR);
        }
    }
  }

  function step(dt) {
    let tx = roamTarget.x;
    let tz = roamTarget.z;
    let speed = 0.38;

    if ([STATE.FOLLOW, STATE.CURIOUS].includes(state) && mouse.inStage) {
      tx = mouse.x;
      tz = mouse.z;
      speed = state === STATE.CURIOUS ? 0.28 : 0.42;
    } else if (state === STATE.SPRINT) speed = 1.25;
    else if ([STATE.SIT, STATE.SLEEP, STATE.YAWN, STATE.SNIFF, STATE.PAUSE, STATE.ROAR, STATE.BOUNCE, STATE.JUMP].includes(state)) {
      vel.x *= 0.82;
      vel.z *= 0.82;
      return;
    }

    const dx = tx - pos.x;
    const dz = tz - pos.z;
    const dist = Math.hypot(dx, dz) || 1;
    vel.x += ((dx / dist) * speed - vel.x) * Math.min(1, dt * 6);
    vel.z += ((dz / dist) * speed - vel.z) * Math.min(1, dt * 6);
    pos.x = Math.max(patrol.minX, Math.min(patrol.maxX, pos.x + vel.x * dt));
    pos.z = Math.max(patrol.minZ, Math.min(patrol.maxZ, pos.z + vel.z * dt));
    if (Math.abs(vel.x) > 0.015) facing = vel.x > 0 ? 1 : -1;
  }

  function updateLook(dt) {
    if (!headGroup || !pupilL) return;
    let tx = lookTarget.x;
    let ty = lookTarget.y;
    let tz = lookTarget.z;

    if (mouse.inStage) {
      tx = mouse.x - pos.x + 0.35;
      ty = 0.72;
      tz = mouse.z - pos.z + 0.15;
    }

    const cur = headGroup.rotation;
    const targetYaw = Math.max(-0.45, Math.min(0.45, tx * 0.35));
    const targetPitch = Math.max(-0.25, Math.min(0.3, (ty - 0.65) * 0.4));
    cur.y += (targetYaw - cur.y) * dt * 4;
    cur.x += (targetPitch - cur.x) * dt * 4;

    const pOffX = Math.max(-0.025, Math.min(0.025, tx * 0.04));
    const pOffY = Math.max(-0.015, Math.min(0.015, (ty - 0.7) * 0.08));
    pupilL.position.x = 0.12 + pOffX;
    pupilL.position.y = 0.07 + pOffY;
    pupilR.position.x = pupilL.position.x;
    pupilR.position.y = pupilL.position.y;

    blinkTimer -= dt;
    if (blinkTimer <= 0) {
      blinkTimer = 2.5 + Math.random() * 4;
      eyelidL.visible = true;
      eyelidR.visible = true;
      setTimeout(() => {
        if (state !== STATE.SLEEP && state !== STATE.SIT) {
          eyelidL.visible = false;
          eyelidR.visible = false;
        }
      }, 120);
    }
  }

  function animateCreature(dt) {
    if (!trexRoot) return;
    animT += dt;

    trexRoot.position.x = pos.x;
    trexRoot.position.z = pos.z;
    bodyGroup.rotation.y = facing > 0 ? -0.12 : 0.12;

    const walk = [STATE.WANDER, STATE.FOLLOW, STATE.CURIOUS, STATE.SPRINT].includes(state);
    const phase = animT * (state === STATE.SPRINT ? 14 : walk ? 5.5 : 1.2);

    let bodyY = 0.04;
    let tailSway = Math.sin(animT * 1.4) * 0.08;

    if (walk) {
      legL.rotation.x = Math.sin(phase) * 0.42;
      legR.rotation.x = Math.sin(phase + Math.PI) * 0.42;
      bodyY += Math.abs(Math.sin(phase)) * 0.028;
      tailSway = Math.sin(phase * 0.55) * 0.14;
      eyelidL.visible = false;
      eyelidR.visible = false;
    } else if (state === STATE.SIT || state === STATE.YAWN) {
      legL.rotation.x = 0.55;
      legR.rotation.x = 0.55;
      bodyY = 0.02 + Math.sin(animT * 1.1) * 0.008;
      if (state === STATE.YAWN) jawGroup.rotation.x = 0.25 + Math.sin(animT * 2) * 0.08;
    } else if (state === STATE.SLEEP) {
      legL.rotation.x = 0.72;
      legR.rotation.x = 0.72;
      bodyY = 0.015;
      bodyGroup.rotation.z = 0.06;
      eyelidL.visible = true;
      eyelidR.visible = true;
    } else if (state === STATE.SNIFF) {
      headGroup.rotation.x = 0.35;
      jawGroup.rotation.x = 0.08;
      bodyY = 0.035;
    } else if (state === STATE.ROAR) {
      jawGroup.rotation.x = 0.42 + Math.sin(animT * 16) * 0.1;
      bodyGroup.rotation.z = Math.sin(animT * 18) * 0.035;
      tailSway = Math.sin(animT * 14) * 0.22;
      bodyY = 0.05 + Math.sin(animT * 12) * 0.015;
    } else if (state === STATE.JUMP) {
      bodyY = 0.04 + Math.sin(Math.min(1, stateTime / 0.28) * Math.PI) * 0.12;
    } else if (state === STATE.BOUNCE) {
      bodyY = 0.04 + Math.abs(Math.sin(animT * 10)) * 0.045;
    } else if (state === STATE.PAUSE) {
      tailSway = Math.sin(animT * 0.8) * 0.05;
    }

    trexRoot.position.y = bodyY;
    tailGroup.rotation.y = tailSway;

    if (contactShadow) {
      contactShadow.position.x = pos.x;
      contactShadow.position.z = pos.z;
      const s = state === STATE.JUMP ? 0.75 : state === STATE.SLEEP ? 1.15 : 1;
      contactShadow.scale.set(s, s, s);
    }

    bubbles = bubbles.filter((b) => {
      b.life += dt;
      b.mesh.position.y += b.vy * dt;
      b.mesh.material.opacity = Math.max(0, 0.45 - b.life * 0.22);
      if (b.life > 2.2) {
        headGroup.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        return false;
      }
      return true;
    });

    const behind = pos.z < -0.08;
    sceneWrap?.classList.toggle("is-behind", behind);
    updateLook(dt);
  }

  function onPointerMove(e) {
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const nz = (e.clientY - r.top) / r.height;
    mouse.x = patrol.minX + nx * (patrol.maxX - patrol.minX);
    mouse.z = patrol.minZ + (1 - nz) * (patrol.maxZ - patrol.minZ);
    mouse.screenX = e.clientX;
    mouse.screenY = e.clientY;
    mouse.inStage =
      e.clientX >= r.left - 40 &&
      e.clientX <= r.right + 120 &&
      e.clientY >= r.top - 50 &&
      e.clientY <= r.bottom + 40;
  }

  function tick(now) {
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;
    think(dt);
    step(dt);
    animateCreature(dt);
    if (renderer && scene && camera) renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  function init() {
    stage = document.getElementById("hero-stage");
    sceneWrap = document.getElementById("trex-viewport");
    titleEl = document.getElementById("hero-title");
    if (!stage || !initThree()) return;

    pos.x = -0.35;
    pos.z = 0.05;
    pickRoamTarget();
    setState(STATE.WANDER);

    stage.addEventListener("mouseenter", () => stage.classList.add("is-hovered"));
    stage.addEventListener("mouseleave", () => stage.classList.remove("is-hovered"));
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
