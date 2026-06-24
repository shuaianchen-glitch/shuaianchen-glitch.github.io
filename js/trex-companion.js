window.TrexCompanion = (() => {
  const STATE = {
    WANDER: "wander",
    REST: "rest",
    BUBBLE: "bubble",
    SPRINT: "sprint",
    ROAR: "roar",
    FOLLOW: "follow",
  };

  let stage;
  let layer;
  let trex;
  let fxLayer;
  let titleEl;
  let raf = 0;
  let last = 0;

  let pos = { x: 0, y: 0 };
  let vel = { x: 0, y: 0 };
  let target = { x: 0, y: 0 };
  let facing = 1;
  let energy = 88;
  let walkDist = 0;
  let state = STATE.WANDER;
  let stateTime = 0;
  let patrol = { minX: 0, maxX: 200, minY: 0, maxY: 80, midY: 40 };
  let mouse = { x: 0, y: 0, inStage: false };
  let roamTarget = { x: 0, y: 0 };
  let bubbleTimer = 0;
  let roarCooldown = 0;

  function measure() {
    if (!stage || !titleEl) return;
    const sr = stage.getBoundingClientRect();
    const tr = titleEl.getBoundingClientRect();
    const pad = 12;
    patrol.minX = pad;
    patrol.maxX = Math.max(patrol.minX + 80, sr.width - 72);
    patrol.minY = Math.max(0, tr.top - sr.top - 36);
    patrol.maxY = Math.min(sr.height - 48, tr.bottom - sr.top + 28);
    patrol.midY = (patrol.minY + patrol.maxY) * 0.5;

    if (pos.x === 0 && pos.y === 0) {
      pos.x = patrol.minX + 20;
      pos.y = patrol.maxY;
      pickRoamTarget();
    }
  }

  function pickRoamTarget() {
    const nearTitle = Math.random() > 0.35;
    if (nearTitle) {
      roamTarget.x = patrol.minX + Math.random() * (patrol.maxX - patrol.minX);
      roamTarget.y = patrol.minY + Math.random() * (patrol.maxY - patrol.minY);
    } else {
      roamTarget.x = patrol.minX + Math.random() * (patrol.maxX - patrol.minX) * 0.6;
      roamTarget.y = patrol.maxY - Math.random() * 18;
    }
  }

  function setState(next) {
    if (state === next) return;
    state = next;
    stateTime = 0;
    trex.dataset.state = next;
    trex.classList.toggle("is-walking", next === STATE.WANDER || next === STATE.SPRINT || next === STATE.FOLLOW);
    trex.classList.toggle("is-resting", next === STATE.REST || next === STATE.BUBBLE);
    trex.classList.toggle("is-roaring", next === STATE.ROAR);
    trex.classList.toggle("is-sprinting", next === STATE.SPRINT);
  }

  function spawnBubble() {
    if (!fxLayer) return;
    const b = document.createElement("span");
    b.className = "trex-bubble";
    b.style.left = `${facing > 0 ? 58 : 42}%`;
    b.style.top = "28%";
    fxLayer.appendChild(b);
    setTimeout(() => b.remove(), 2200);
  }

  function spawnRoar() {
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
      if (state !== STATE.FOLLOW && state !== STATE.REST && state !== STATE.BUBBLE) {
        setState(STATE.FOLLOW);
      }
    } else if (state === STATE.FOLLOW && !mouse.inStage) {
      setState(STATE.WANDER);
      pickRoamTarget();
    }

    if (state === STATE.ROAR) {
      if (stateTime > 1.4) {
        setState(STATE.WANDER);
        pickRoamTarget();
      }
      return;
    }

    if (state === STATE.SPRINT) {
      if (stateTime > 1.2 || Math.hypot(pos.x - roamTarget.x, pos.y - roamTarget.y) < 8) {
        setState(STATE.REST);
      }
      return;
    }

    if (state === STATE.BUBBLE) {
      bubbleTimer += dt;
      if (bubbleTimer > 1.1) {
        bubbleTimer = 0;
        spawnBubble();
      }
      if (stateTime > 5 || energy > 92) {
        setState(STATE.WANDER);
        pickRoamTarget();
        if (roarCooldown <= 0 && Math.random() < 0.35) {
          roarCooldown = 8;
          setState(STATE.ROAR);
          spawnRoar();
        }
      }
      return;
    }

    if (state === STATE.REST) {
      if (stateTime > 1.2) setState(STATE.BUBBLE);
      return;
    }

    walkDist += dt * 40;
    energy -= dt * 5.5;

    if (energy < 22 && state !== STATE.FOLLOW) {
      roamTarget.x = patrol.minX + 10;
      roamTarget.y = patrol.maxY;
      setState(STATE.SPRINT);
      return;
    }

    if (energy < 48 && state === STATE.WANDER && stateTime > 4 && Math.random() < 0.015) {
      setState(STATE.REST);
      return;
    }

    if (stateTime > 6 && Math.hypot(pos.x - roamTarget.x, pos.y - roamTarget.y) < 10) {
      pickRoamTarget();
      stateTime = 0;
    }

    if (roarCooldown <= 0 && stateTime > 12 && Math.random() < 0.008) {
      roarCooldown = 14;
      setState(STATE.ROAR);
      spawnRoar();
    }
  }

  function step(dt) {
    let tx = roamTarget.x;
    let ty = roamTarget.y;
    let speed = 28;

    if (state === STATE.FOLLOW && mouse.inStage) {
      tx = mouse.x;
      ty = mouse.y;
      speed = 34;
    } else if (state === STATE.SPRINT) {
      speed = 95;
    } else if (state === STATE.REST || state === STATE.BUBBLE || state === STATE.ROAR) {
      vel.x *= 0.85;
      vel.y *= 0.85;
      applyTransform();
      return;
    }

    const dx = tx - pos.x;
    const dy = ty - pos.y;
    const dist = Math.hypot(dx, dy) || 1;
    const ax = (dx / dist) * speed;
    const ay = (dy / dist) * speed;

    vel.x += (ax - vel.x) * Math.min(1, dt * 8);
    vel.y += (ay - vel.y) * Math.min(1, dt * 8);
    pos.x += vel.x * dt;
    pos.y += vel.y * dt;

    pos.x = Math.max(patrol.minX, Math.min(patrol.maxX, pos.x));
    pos.y = Math.max(patrol.minY, Math.min(patrol.maxY, pos.y));

    if (Math.abs(vel.x) > 2) facing = vel.x > 0 ? 1 : -1;

    applyTransform();
  }

  function applyTransform() {
    const titleMid = titleEl ? (titleEl.offsetTop + titleEl.offsetHeight * 0.45) : patrol.midY;
    const behind = pos.y < titleMid - 6;
    layer.classList.toggle("is-behind", behind);

    trex.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) scaleX(${facing})`;
  }

  function onPointerMove(e) {
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const mx = e.clientX - r.left - 36;
    const my = e.clientY - r.top - 40;
    mouse.x = Math.max(patrol.minX, Math.min(patrol.maxX, mx));
    mouse.y = Math.max(patrol.minY, Math.min(patrol.maxY, my));
    mouse.inStage =
      e.clientX >= r.left - 40 &&
      e.clientX <= r.right + 60 &&
      e.clientY >= r.top - 40 &&
      e.clientY <= r.bottom + 40;
  }

  function tick(now) {
    const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
    last = now;
    think(dt);
    step(dt);
    raf = requestAnimationFrame(tick);
  }

  function init() {
    stage = document.getElementById("hero-stage");
    layer = document.getElementById("trex-layer");
    trex = document.getElementById("trex");
    fxLayer = document.getElementById("trex-fx");
    titleEl = document.getElementById("hero-title");
    if (!stage || !trex) return;

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("pointermove", onPointerMove);
    setState(STATE.WANDER);
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function destroy() {
    cancelAnimationFrame(raf);
  }

  return { init, destroy };
})();
