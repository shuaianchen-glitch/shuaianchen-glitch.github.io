import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

window.IntroPig = (() => {
  const MIN_HOLD = 5;

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
      color: 0xff9eb5,
      emissive: 0xff6080,
      emissiveIntensity: 0.35,
      roughness: 0.38,
    });
    const pinkDark = new THREE.MeshStandardMaterial({
      color: 0xff7a9a,
      emissive: 0xff4060,
      emissiveIntensity: 0.2,
      roughness: 0.45,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xffd060,
      emissive: 0xffa020,
      emissiveIntensity: 0.25,
      roughness: 0.28,
      metalness: 0.5,
    });
    const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const eyeBlack = new THREE.MeshStandardMaterial({ color: 0x1a1020, roughness: 0.3 });

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

    [[-0.22, 0.48, 1.35], [0.22, 0.48, 1.35]].forEach(([x, y, z]) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), eyeWhite);
      eye.position.set(x, y, z);
      group.add(eye);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeBlack);
      pupil.position.set(x + x * 0.08, y - 0.02, z + 0.08);
      group.add(pupil);
    });

    [[-0.48, 0.78, -0.1], [0.48, 0.78, -0.1]].forEach(([x, y, z]) => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), pink);
      ear.scale.set(0.5, 1, 0.32);
      ear.position.set(x, y, z);
      ear.rotation.z = x > 0 ? -0.5 : 0.5;
      group.add(ear);
    });

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.06, 12, 32), gold);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, 0.62, 0.95);
    group.add(band);

    const tail = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), pinkDark);
    tail.rotation.y = Math.PI / 2;
    tail.position.set(0, 0.15, -1.35);
    group.add(tail);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xaaccff,
      emissiveIntensity: 0.15,
      roughness: 0.8,
      transparent: true,
      opacity: 0.92,
    });
    cloud = new THREE.Group();
    for (let i = 0; i < 12; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.42 + Math.random() * 0.25, 16, 16), wingMat);
      puff.position.set((Math.random() - 0.5) * 2.2, -0.6 - Math.random() * 0.3, (Math.random() - 0.5) * 1.4);
      cloud.add(puff);
    }
    cloud.position.y = -0.15;
    group.add(cloud);

    group.scale.setScalar(1.55);
    return group;
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
    const animP = holdT * 0.35 + scrollP * 0.65;
    const ease = 1 - Math.pow(1 - animP, 2);

    const bob = Math.sin(time * 1.6) * 0.12;
    const wing = Math.sin(time * 2.5) * 0.08;

    if (pig) {
      pig.position.y = bob;
      pig.rotation.y = mouseX * 0.35 + ease * Math.PI * 0.35;
      pig.rotation.z = Math.sin(time * 1.1) * 0.05;
    }
    if (cloud) {
      cloud.scale.set(1 + wing * 0.2, 1, 1 + wing * 0.2);
    }

    if (container) {
      container.position.set(0, 0.15 + bob * 0.5, 0);
      container.rotation.x = THREE.MathUtils.degToRad(8 - ease * 28);
      container.rotation.y = ease * 0.25;
      const scale = 1.65 - ease * 0.45;
      container.scale.setScalar(Math.max(0.85, scale));
      container.position.y = 0.2 + bob + ease * 1.8;
      container.position.z = -ease * 2.2;
    }

    const bar = time < MIN_HOLD ? holdT * 0.4 : 0.4 + scrollP * 0.6;
    const ui = document.getElementById("intro-progress-fill");
    if (ui) ui.style.width = `${Math.round(bar * 100)}%`;

    const hint = document.getElementById("intro-sub");
    if (hint && time < MIN_HOLD) {
      hint.textContent = window.SITE?.intro?.subHold || "飞猪入场中…";
    } else if (hint && time >= MIN_HOLD) {
      hint.textContent = window.SITE?.intro?.sub || "向下滚动继续浏览";
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);

    if (!done && time >= MIN_HOLD && scrollP >= 0.78) {
      done = true;
      onComplete?.();
    }
  }

  function init(callback) {
    onComplete = callback;
    canvas = document.getElementById("intro-canvas");
    if (!canvas) return;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x05030c, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05030c, 0.018);

    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.35, 2.6);
    camera.lookAt(0, 0.1, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffaac0, 0.55);
    fill.position.set(-3, 1, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0x88ccff, 0.45);
    rim.position.set(0, 2, -3);
    scene.add(rim);

    container = new THREE.Group();
    pig = buildPig();
    container.add(pig);
    scene.add(container);

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
