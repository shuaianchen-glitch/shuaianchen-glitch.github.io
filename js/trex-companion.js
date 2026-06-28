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
  let tailSegs = [];
  let armL;
  let armR;
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
    const c = new T.Color(color);
    return new T.MeshPhysicalMaterial({
      color,
      roughness: opts.roughness ?? 0.52,
      metalness: opts.metalness ?? 0.03,
      clearcoat: opts.clearcoat ?? 0.38,
      clearcoatRoughness: 0.22,
      emissive: opts.emissive ?? c.clone().multiplyScalar(0.12),
      emissiveIntensity: opts.emissiveIntensity ?? 0.09,
    });
  }

  function sculpt(parent, geo, mat, pos, rot, scale) {
    const m = new T.Mesh(geo, mat);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    if (scale) m.scale.set(scale[0], scale[1], scale[2]);
    parent.add(m);
    return m;
  }

  function buildEye(parent, side, y, z) {
    const sx = side;
    sculpt(
      parent,
      new T.SphereGeometry(0.105, 24, 24),
      skin(COL.moonDark, { roughness: 0.58 }),
      [0.04, y, z * sx],
      [0.08, 0, 0],
      [0.92, 0.78, 0.82]
    );

    sculpt(
      parent,
      new T.SphereGeometry(0.088, 24, 24),
      skin(COL.ivory, { roughness: 0.28, clearcoat: 0.5 }),
      [0.06, y - 0.01, (z + 0.055) * sx],
      [0.05, 0, 0],
      [1.05, 0.95, 0.72]
    );

    sculpt(
      parent,
      new T.SphereGeometry(0.072, 20, 20),
      skin(COL.amber, { roughness: 0.32, emissive: 0x5a3010, emissiveIntensity: 0.14 }),
      [0.1, y - 0.015, (z + 0.1) * sx],
      [0.12, 0, 0],
      [1.08, 1, 0.55]
    );

    const pupil = new T.Mesh(
      new T.SphereGeometry(0.034, 16, 16),
      skin(COL.amberDeep, { roughness: 0.2, emissive: 0x2a1408, emissiveIntensity: 0.05 })
    );
    pupil.position.set(0.13, y - 0.02, (z + 0.13) * sx);
    pupil.rotation.x = 0.12;
    parent.add(pupil);

    sculpt(
      parent,
      new T.SphereGeometry(0.014, 10, 10),
      skin(0xffffff, { roughness: 0.05, clearcoat: 0.9, emissive: 0xffffff, emissiveIntensity: 0.25 }),
      [0.145, y + 0.018, (z + 0.145) * sx],
      null,
      null
    );

    sculpt(
      parent,
      new T.SphereGeometry(0.008, 8, 8),
      skin(0xffffff, { roughness: 0.08, emissive: 0xffffff, emissiveIntensity: 0.18 }),
      [0.118, y - 0.028, (z + 0.138) * sx],
      null,
      null
    );

    const lid = new T.Mesh(new T.SphereGeometry(0.1, 16, 16), skin(COL.moon, { roughness: 0.48 }));
    lid.position.set(0.05, y + 0.028, (z + 0.08) * sx);
    lid.rotation.x = -0.35;
    lid.scale.set(1.05, 0.32, 0.82);
    lid.visible = false;
    parent.add(lid);

    return { pupil, lid };
  }

  function buildBabyTrex() {
    trexRoot = new T.Group();
    bodyGroup = new T.Group();
    headGroup = new T.Group();
    headGroup.position.set(0.42, 0.78, 0);

    const bodyMat = skin(COL.moon);
    const softMat = skin(COL.moonDark, { roughness: 0.56 });
    const bellyMat = skin(COL.ivory, { roughness: 0.68, emissiveIntensity: 0.06 });

    const profile = [];
    for (let i = 0; i <= 24; i += 1) {
      const t = i / 24;
      const y = t * 0.52;
      const r = 0.19 + Math.sin(t * Math.PI) * 0.14 - t * 0.06;
      profile.push(new T.Vector2(Math.max(0.08, r), y));
    }
    sculpt(bodyGroup, new T.LatheGeometry(profile, 32), bodyMat, [0, 0.08, 0], [0, 0, 0], null);

    sculpt(
      bodyGroup,
      new T.SphereGeometry(0.24, 28, 28),
      bodyMat,
      [0.08, 0.42, 0],
      [0, 0, 0],
      [1.08, 0.92, 1.18]
    );

    sculpt(
      bodyGroup,
      new T.SphereGeometry(0.18, 24, 24),
      bellyMat,
      [0.1, 0.28, 0.12],
      [0.15, 0, 0],
      [1.05, 0.72, 0.95]
    );

    sculpt(
      bodyGroup,
      new T.SphereGeometry(0.16, 20, 20),
      softMat,
      [0.34, 0.62, 0],
      [0.2, 0, 0],
      [0.95, 0.88, 0.92]
    );

    sculpt(
      headGroup,
      new T.SphereGeometry(0.4, 32, 32),
      bodyMat,
      [0, 0.08, 0],
      [0.08, 0, 0],
      [1.18, 1.08, 1.05]
    );

    sculpt(
      headGroup,
      new T.SphereGeometry(0.22, 24, 24),
      softMat,
      [0.28, -0.02, 0.14],
      [0.05, -0.15, 0.25],
      [1.05, 0.88, 0.82]
    );
    sculpt(
      headGroup,
      new T.SphereGeometry(0.22, 24, 24),
      softMat,
      [0.28, -0.02, -0.14],
      [0.05, 0.15, -0.25],
      [1.05, 0.88, 0.82]
    );

    sculpt(
      headGroup,
      new T.SphereGeometry(0.19, 22, 22),
      softMat,
      [0.34, -0.04, 0.08],
      [0.18, 0, 0.08],
      [1.35, 0.78, 0.9]
    );

    sculpt(
      headGroup,
      new T.SphereGeometry(0.16, 20, 20),
      softMat,
      [0.42, -0.08, 0.06],
      [0.22, 0, 0.05],
      [1.25, 0.72, 0.82]
    );

    sculpt(
      headGroup,
      new T.SphereGeometry(0.08, 12, 12),
      skin(COL.graphite, { roughness: 0.42 }),
      [0.48, -0.02, 0.045],
      [0.3, 0, 0],
      [1, 0.65, 0.8]
    );
    sculpt(
      headGroup,
      new T.SphereGeometry(0.08, 12, 12),
      skin(COL.graphite, { roughness: 0.42 }),
      [0.48, -0.02, -0.045],
      [0.3, 0, 0],
      [1, 0.65, 0.8]
    );

    jawGroup = new T.Group();
    jawGroup.position.set(0.24, -0.16, 0.02);
    sculpt(
      jawGroup,
      new T.SphereGeometry(0.15, 20, 20),
      softMat,
      [0.08, 0, 0.04],
      [0.08, 0, 0],
      [1.35, 0.68, 0.92]
    );
    sculpt(
      jawGroup,
      new T.SphereGeometry(0.08, 12, 12),
      bellyMat,
      [0.18, -0.02, 0.03],
      [0.15, 0, 0],
      [1.1, 0.55, 0.75]
    );
    headGroup.add(jawGroup);

    const eyeL = buildEye(headGroup, 1, 0.06, 0.12);
    pupilL = eyeL.pupil;
    eyelidL = eyeL.lid;
    const eyeR = buildEye(headGroup, -1, 0.06, 0.12);
    pupilR = eyeR.pupil;
    eyelidR = eyeR.lid;

    sculpt(
      headGroup,
      new T.SphereGeometry(0.06, 12, 12),
      softMat,
      [0.12, 0.18, 0.22],
      [0.2, 0.35, 0.15],
      [1.1, 0.75, 0.8]
    );
    sculpt(
      headGroup,
      new T.SphereGeometry(0.06, 12, 12),
      softMat,
      [0.12, 0.18, -0.22],
      [0.2, -0.35, -0.15],
      [1.1, 0.75, 0.8]
    );

    tailGroup = new T.Group();
    tailGroup.position.set(-0.22, 0.38, 0);
    tailSegs = [];
    let tx = 0;
    let ty = 0;
    for (let i = 0; i < 7; i += 1) {
      const t = i / 6;
      const rTop = 0.11 - t * 0.075;
      const rBot = 0.085 - t * 0.062;
      const len = 0.14 - t * 0.012;
      const seg = new T.Mesh(
        new T.CylinderGeometry(Math.max(0.018, rTop), Math.max(0.012, rBot), len, 14),
        i % 2 ? softMat : bodyMat
      );
      seg.rotation.z = 0.42 + t * 0.18;
      seg.position.set(tx - len * 0.42, ty + len * 0.28, 0);
      tx -= len * 0.78;
      ty += len * 0.34;
      tailGroup.add(seg);
      tailSegs.push(seg);
    }
    bodyGroup.add(tailGroup);

    for (let i = 0; i < 7; i += 1) {
      const t = i / 6;
      sculpt(
        bodyGroup,
        new T.ConeGeometry(0.022, 0.07, 5),
        skin(COL.graphite, { roughness: 0.4, metalness: 0.08 }),
        [-0.04 + i * 0.08, 0.58 + t * 0.08, (i % 2 ? 0.04 : -0.03)],
        [-0.75, (i % 2 ? 0.2 : -0.15), 0],
        null
      );
    }

    function buildArm(zSign) {
      const arm = new T.Group();
      arm.position.set(0.14, 0.34, 0.22 * zSign);
      sculpt(arm, new T.SphereGeometry(0.038, 12, 12), softMat, [0, 0.04, 0], [0, 0, -0.4 * zSign], [0.85, 1.15, 0.85]);
      sculpt(arm, new T.SphereGeometry(0.028, 10, 10), softMat, [0.03, -0.02, 0.02 * zSign], [0.5, 0, 0], null);
      sculpt(arm, new T.ConeGeometry(0.008, 0.028, 4), skin(COL.graphite), [0.05, -0.04, 0.03 * zSign], [0.8, 0, 0], null);
      sculpt(arm, new T.ConeGeometry(0.008, 0.028, 4), skin(COL.graphite), [0.05, -0.04, -0.01 * zSign], [0.8, 0.3 * zSign, 0], null);
      return arm;
    }

    armL = buildArm(1);
    armR = buildArm(-1);
    bodyGroup.add(armL, armR);

    function buildLeg(x, z) {
      const leg = new T.Group();
      leg.position.set(x, 0.1, z);
      sculpt(leg, new T.SphereGeometry(0.1, 16, 16), softMat, [0, 0.16, 0], null, [1.05, 0.95, 1.05]);
      sculpt(leg, new T.CylinderGeometry(0.07, 0.085, 0.18, 14), softMat, [0, 0.08, 0], null, null);
      sculpt(leg, new T.CylinderGeometry(0.055, 0.065, 0.14, 12), bodyMat, [0.01, -0.02, 0], null, null);
      sculpt(leg, new T.SphereGeometry(0.1, 16, 16), softMat, [0.02, -0.08, 0.04], [-0.15, 0, 0], [1.45, 0.52, 1.65]);
      for (let t = -1; t <= 1; t += 1) {
        sculpt(
          leg,
          new T.ConeGeometry(0.012, 0.04, 4),
          skin(COL.graphite, { roughness: 0.35 }),
          [0.06 + t * 0.04, -0.1, 0.1 + t * 0.02],
          [0.2, t * 0.15, 0],
          null
        );
      }
      return leg;
    }

    legL = buildLeg(0.1, 0.17);
    legR = buildLeg(0.1, -0.17);
    bodyGroup.add(legL, legR);

    for (let i = 0; i < 18; i += 1) {
      sculpt(
        bodyGroup,
        new T.SphereGeometry(0.008 + Math.random() * 0.006, 6, 6),
        i % 2 ? softMat : bodyMat,
        [0.02 + Math.random() * 0.22, 0.22 + Math.random() * 0.34, -0.16 + Math.random() * 0.32],
        null,
        null
      );
    }

    bodyGroup.add(headGroup);
    trexRoot.add(bodyGroup);
    trexRoot.scale.setScalar(baseScale);
    trexRoot.position.y = 0.02;
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
    renderer.toneMappingExposure = 1.14;
    renderer.physicallyCorrectLights = true;

    scene = new T.Scene();
    camera = new T.PerspectiveCamera(22, 1, 0.1, 30);
    camera.position.set(0.02, 0.58, 2.65);
    camera.lookAt(0.15, 0.48, 0);

    scene.add(new T.AmbientLight(0x9aa8b8, 0.28));
    scene.add(new T.HemisphereLight(0xf2eee8, 0x060608, 0.52));

    const key = new T.DirectionalLight(0xfff8f0, 1.18);
    key.position.set(1.8, 3.8, 2.4);
    scene.add(key);
    const fill = new T.DirectionalLight(0xd9d6cf, 0.42);
    fill.position.set(-2.2, 1.6, 2.5);
    scene.add(fill);
    const rim = new T.DirectionalLight(0x7ec8d8, 0.35);
    rim.position.set(-1.5, 2.2, -2.8);
    scene.add(rim);
    const warm = new T.PointLight(0xffe8d0, 0.28, 5);
    warm.position.set(0.6, 0.85, 1.6);
    scene.add(warm);

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
    b.position.set(0.42, -0.08, 0.08);
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
      tx = mouse.x - pos.x + 0.42;
      ty = 0.82;
      tz = mouse.z - pos.z + 0.12;
    }

    const cur = headGroup.rotation;
    const targetYaw = Math.max(-0.52, Math.min(0.52, tx * 0.42));
    const targetPitch = Math.max(-0.32, Math.min(0.35, (ty - 0.72) * 0.45));
    cur.y += (targetYaw - cur.y) * dt * 5;
    cur.x += (targetPitch - cur.x) * dt * 5;

    const pOffX = Math.max(-0.022, Math.min(0.022, tx * 0.035));
    const pOffY = Math.max(-0.018, Math.min(0.018, (ty - 0.78) * 0.06));
    pupilL.position.x = 0.13 + pOffX;
    pupilL.position.y = 0.04 + pOffY;
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
    bodyGroup.rotation.y = facing > 0 ? -0.1 : 0.1;

    const breath = 1 + Math.sin(animT * 1.7) * 0.014;
    bodyGroup.scale.set(1, breath, 1);

    const walk = [STATE.WANDER, STATE.FOLLOW, STATE.CURIOUS, STATE.SPRINT].includes(state);
    const phase = animT * (state === STATE.SPRINT ? 14 : walk ? 5.5 : 1.2);

    let bodyY = 0.02;
    let tailSway = Math.sin(animT * 1.4) * 0.06;

    if (walk) {
      legL.rotation.x = Math.sin(phase) * 0.48;
      legR.rotation.x = Math.sin(phase + Math.PI) * 0.48;
      bodyY += Math.abs(Math.sin(phase)) * 0.032;
      tailSway = Math.sin(phase * 0.55) * 0.12;
      if (armL) armL.rotation.z = Math.sin(phase * 1.2) * 0.18 - 0.35;
      if (armR) armR.rotation.z = Math.sin(phase * 1.2 + Math.PI) * 0.18 + 0.35;
      eyelidL.visible = false;
      eyelidR.visible = false;
    } else if (state === STATE.SIT || state === STATE.YAWN) {
      legL.rotation.x = 0.62;
      legR.rotation.x = 0.62;
      bodyY = 0.01 + Math.sin(animT * 1.1) * 0.01;
      if (armL) armL.rotation.z = -0.15;
      if (armR) armR.rotation.z = 0.15;
      if (state === STATE.YAWN) jawGroup.rotation.x = 0.32 + Math.sin(animT * 2) * 0.1;
    } else if (state === STATE.SLEEP) {
      legL.rotation.x = 0.78;
      legR.rotation.x = 0.78;
      bodyY = 0.008;
      bodyGroup.rotation.z = 0.08;
      headGroup.rotation.x = 0.12;
      if (armL) armL.rotation.z = -0.08;
      if (armR) armR.rotation.z = 0.08;
      eyelidL.visible = true;
      eyelidR.visible = true;
    } else if (state === STATE.SNIFF) {
      headGroup.rotation.x = 0.42;
      jawGroup.rotation.x = 0.1;
      bodyY = 0.028;
      if (armL) armL.rotation.z = -0.45;
    } else if (state === STATE.ROAR) {
      jawGroup.rotation.x = 0.48 + Math.sin(animT * 16) * 0.12;
      bodyGroup.rotation.z = Math.sin(animT * 18) * 0.04;
      tailSway = Math.sin(animT * 14) * 0.18;
      bodyY = 0.04 + Math.sin(animT * 12) * 0.018;
    } else if (state === STATE.JUMP) {
      bodyY = 0.02 + Math.sin(Math.min(1, stateTime / 0.28) * Math.PI) * 0.14;
    } else if (state === STATE.BOUNCE) {
      bodyY = 0.02 + Math.abs(Math.sin(animT * 10)) * 0.05;
    } else if (state === STATE.PAUSE) {
      tailSway = Math.sin(animT * 0.8) * 0.04;
      if (armL) armL.rotation.z = -0.28 + Math.sin(animT * 0.9) * 0.06;
      headGroup.rotation.x *= 0.92;
    } else {
      if (armL) armL.rotation.z = -0.32 + Math.sin(animT * 1.6) * 0.04;
      if (armR) armR.rotation.z = 0.32 - Math.sin(animT * 1.6) * 0.04;
      headGroup.rotation.x *= 0.9;
      bodyGroup.rotation.z *= 0.92;
    }

    trexRoot.position.y = bodyY;
    tailGroup.rotation.y = tailSway * 0.35;
    tailSegs.forEach((seg, i) => {
      seg.rotation.y = tailSway * (0.25 + i * 0.12);
    });

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
