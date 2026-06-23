import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

window.IntroPig = (() => {
  const MIN_HOLD = 4;

  let canvas;
  let renderer;
  let scene;
  let camera;
  let pig;
  let cloud;
  let container;
  let raf = 0;
  let time = 0;
  let mouseX = 0;
  let onComplete = null;
  let done = false;

  function buildPig() {
    const group = new THREE.Group();
    const pink = new THREE.MeshStandardMaterial({
      color: 0xffb6c8,
      roughness: 0.42,
      metalness: 0.06,
    });
    const pinkDark = new THREE.MeshStandardMaterial({ color: 0xff8fab, roughness: 0.48 });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xf0c060,
      roughness: 0.32,
      metalness: 0.55,
    });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 32), pink);
    body.scale.set(1.35, 1, 1.55);
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 28, 28), pink);
    head.position.set(0, 0.35, 1.05);
    group.add(head);

    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 20), pinkDark);
    snout.scale.set(1.15, 0.85, 0.75);
    snout.position.set(0, 0.22, 1.55);
    group.add(snout);

    [[-0.12, 0.12], [0.12, 0.12]].forEach(([x, y]) => {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), pinkDark);
      nostril.position.set(x, y, 1.78);
      group.add(nostril);
    });

    [[-0.42, 0.72, -0.15], [0.42, 0.72, -0.15]].forEach(([x, y, z]) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), pink);
      ear.scale.set(0.55, 1, 0.35);
      ear.position.set(x, y, z);
      ear.rotation.z = x > 0 ? -0.45 : 0.45;
      group.add(ear);
    });

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 12, 32), gold);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, 0.62, 0.95);
    group.add(band);

    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), pinkDark);
    tail.rotation.y = Math.PI / 2;
    tail.position.set(0, 0.15, -1.35);
    group.add(tail);

    [[-0.45, -0.55, 0.55], [0.45, -0.55, 0.55], [-0.45, -0.55, -0.35], [0.45, -0.55, -0.35]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.35, 12), pinkDark);
      leg.position.set(x, y, z);
      group.add(leg);
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      transparent: true,
      opacity: 0.9,
    });
    cloud = new THREE.Group();
    for (let i = 0; i < 10; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.38 + Math.random() * 0.22, 16, 16), wingMat);
      puff.position.set((Math.random() - 0.5) * 2, -0.55 - Math.random() * 0.25, (Math.random() - 0.5) * 1.3);
      cloud.add(puff);
    }
    cloud.position.y = -0.15;
    group.add(cloud);

    group.scale.setScalar(1.25);
    return group;
  }

  function buildStars() {
    const geo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i < 400; i += 1) {
      pts.push((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xaad4ff, size: 0.06, transparent: true, opacity: 0.6 }));
  }

  function resize() {
    if (!canvas || !renderer || !camera) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function scrollProgress() {
    const intro = document.getElementById("intro");
    if (!intro) return 0;
    const max = intro.offsetHeight - window.innerHeight;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, window.scrollY / max));
  }

  function tick() {
    time += 0.016;
    const holdT = Math.min(time / MIN_HOLD, 1);
    const scrollP = time >= MIN_HOLD ? scrollProgress() : 0;
    const animP = holdT * 0.3 + scrollP * 0.7;
    const ease = 1 - Math.pow(1 - animP, 2.2);

    const bob = Math.sin(time * 1.8) * 0.1;
    const wing = Math.sin(time * 2.8) * 0.07;

    if (pig) {
      pig.position.y = bob;
      pig.rotation.y = mouseX * 0.4 + ease * Math.PI * 0.45;
      pig.rotation.z = Math.sin(time * 1.2) * 0.06 - mouseX * 0.06;
    }
    if (cloud) {
      cloud.scale.set(1 + wing * 0.18, 1, 1 + wing * 0.18);
    }

    if (container) {
      container.rotation.x = THREE.MathUtils.degToRad(12 - ease * 32);
      container.rotation.y = ease * 0.35;
      container.position.y = ease * 2.2;
      container.position.z = -ease * 2.8;
      const scale = 1.28 - ease * 0.55;
      container.scale.setScalar(Math.max(0.55, scale));
    }

    const bar = time < MIN_HOLD ? holdT * 0.35 : 0.35 + scrollP * 0.65;
    const ui = document.getElementById("intro-progress-fill");
    if (ui) ui.style.width = `${Math.round(bar * 100)}%`;

    const hint = document.getElementById("intro-sub");
    if (hint && time < MIN_HOLD) {
      hint.textContent = window.SITE?.intro?.subHold || "稍候，飞猪正在入场…";
    } else if (hint && time >= MIN_HOLD) {
      hint.textContent = window.SITE?.intro?.sub || "向下滚动继续浏览";
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);

    if (!done && time >= MIN_HOLD && scrollP >= 0.82) {
      done = true;
      onComplete?.();
    }
  }

  function init(callback) {
    onComplete = callback;
    canvas = document.getElementById("intro-canvas");
    if (!canvas) return;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x030208, 1);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030208, 0.045);

    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.45, 3.8);

    scene.add(new THREE.AmbientLight(0x8899cc, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.25);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7ec8ff, 0.5);
    rim.position.set(-4, 2, -2);
    scene.add(rim);

    container = new THREE.Group();
    pig = buildPig();
    container.add(pig);
    scene.add(container);
    scene.add(buildStars());

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    });

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function destroy() {
    cancelAnimationFrame(raf);
    renderer?.dispose();
  }

  return { init, destroy, MIN_HOLD };
})();
