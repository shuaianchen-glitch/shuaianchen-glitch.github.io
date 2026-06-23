import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

window.IntroPig = (() => {
  let canvas;
  let renderer;
  let scene;
  let camera;
  let pig;
  let cloud;
  let container;
  let raf = 0;
  let scrollProgress = 0;
  let mouseX = 0;
  let mouseY = 0;
  let time = 0;
  let onComplete = null;
  let done = false;

  function buildPig() {
    const group = new THREE.Group();
    const pink = new THREE.MeshStandardMaterial({
      color: 0xffb6c8,
      roughness: 0.45,
      metalness: 0.08,
    });
    const pinkDark = new THREE.MeshStandardMaterial({ color: 0xff8fab, roughness: 0.5 });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xf0c060,
      roughness: 0.35,
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
      opacity: 0.88,
    });
    cloud = new THREE.Group();
    for (let i = 0; i < 8; i += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.35 + Math.random() * 0.2, 16, 16), wingMat);
      puff.position.set((Math.random() - 0.5) * 1.8, -0.55 - Math.random() * 0.2, (Math.random() - 0.5) * 1.2);
      cloud.add(puff);
    }
    cloud.position.y = -0.15;
    group.add(cloud);

    group.position.y = 0.2;
    return group;
  }

  function buildStars() {
    const geo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i < 500; i += 1) {
      pts.push((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const mat = new THREE.PointsMaterial({ color: 0xaad4ff, size: 0.06, transparent: true, opacity: 0.7 });
    return new THREE.Points(geo, mat);
  }

  function resize() {
    if (!canvas || !renderer || !camera) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function getProgress() {
    const intro = document.getElementById("intro");
    if (!intro) return 0;
    const max = intro.offsetHeight - window.innerHeight;
    if (max <= 0) return 0;
    return Math.max(0, Math.min(1, window.scrollY / max));
  }

  function tick() {
    time += 0.016;
    scrollProgress = getProgress();

    const bob = Math.sin(time * 2.2) * 0.08;
    const wing = Math.sin(time * 3.5) * 0.06;

    if (pig) {
      pig.position.y = bob;
      pig.rotation.y = mouseX * 0.35 + scrollProgress * Math.PI * 0.6;
      pig.rotation.z = Math.sin(time * 1.5) * 0.05 - mouseX * 0.08;
    }
    if (cloud) {
      cloud.scale.set(1 + wing * 0.15, 1, 1 + wing * 0.15);
      cloud.position.y = -0.15 + wing * 0.05;
    }

    if (container) {
      const p = scrollProgress;
      const ease = 1 - Math.pow(1 - p, 3);
      container.rotation.x = THREE.MathUtils.degToRad(18 - ease * 42);
      container.rotation.y = ease * 0.4;
      container.position.y = ease * 2.8;
      container.position.z = -ease * 3.5;
      const scale = 1 + ease * 0.15 - Math.max(0, p - 0.7) * 1.2;
      container.scale.setScalar(Math.max(0.35, scale));
    }

    const ui = document.getElementById("intro-progress-fill");
    if (ui) ui.style.width = `${Math.round(scrollProgress * 100)}%`;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);

    if (!done && scrollProgress >= 0.92) {
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
    scene.fog = new THREE.FogExp2(0x030208, 0.055);

    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0.8, 5.2);

    scene.add(new THREE.AmbientLight(0x8899cc, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x7ec8ff, 0.45);
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
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function destroy() {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    renderer?.dispose();
  }

  return { init, destroy, getProgress };
})();
