window.Capricorn3D = (() => {
  let renderer, scene, camera, mesh, raf, container, active;

  function buildGoat() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xc4a882,
      roughness: 0.55,
      metalness: 0.08,
    });
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0x5eb8c9,
      roughness: 0.35,
      metalness: 0.12,
    });
    const hornMat = new THREE.MeshStandardMaterial({
      color: 0xf5ead6,
      roughness: 0.4,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 0.65), bodyMat);
    body.position.y = 0.15;
    group.add(body);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 16), bodyMat);
    chest.position.set(0.45, 0.35, 0);
    group.add(chest);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 16), bodyMat);
    head.position.set(0.78, 0.55, 0);
    group.add(head);

    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), bodyMat);
    snout.position.set(1.02, 0.48, 0);
    snout.scale.set(1.2, 0.85, 0.85);
    group.add(snout);

    [-0.12, 0.12].forEach((z) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 8), hornMat);
      horn.position.set(0.72, 0.88, z);
      horn.rotation.z = z > 0 ? -0.35 : 0.35;
      horn.rotation.x = -0.25;
      group.add(horn);
    });

    [-0.22, 0.22].forEach((z) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.45, 8), bodyMat);
      leg.position.set(0.1, -0.28, z);
      group.add(leg);
    });

    const tailBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.55, 10), tailMat);
    tailBase.position.set(-0.72, 0.05, 0);
    tailBase.rotation.z = 0.35;
    group.add(tailBase);

    const fishBody = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), tailMat);
    fishBody.position.set(-1.05, -0.08, 0);
    fishBody.scale.set(1.35, 0.75, 0.55);
    group.add(fishBody);

    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.35, 4), tailMat);
    fin.position.set(-1.42, -0.05, 0);
    fin.rotation.y = Math.PI / 2;
    group.add(fin);

    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x2a2035 });
    [-0.1, 0.1].forEach((z) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), eyeMat);
      eye.position.set(0.92, 0.58, z);
      group.add(eye);
    });

    group.scale.set(0.95, 0.95, 0.95);
    group.rotation.y = -0.45;
    return group;
  }

  function animate(t) {
    if (!active || !mesh) return;
    const time = t * 0.001;
    mesh.position.y = Math.sin(time * 1.2) * 0.06;
    mesh.rotation.y = -0.45 + Math.sin(time * 0.5) * 0.12;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  }

  function init() {
    container = document.getElementById("capricorn-3d");
    if (!container) return;
    if (typeof THREE === "undefined") return;

    const w = container.clientWidth || 280;
    const h = container.clientHeight || 280;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    camera.position.set(0, 0.4, 3.4);

    scene.add(new THREE.AmbientLight(0xfff5e8, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(2, 3, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88ccff, 0.45);
    rim.position.set(-3, 1, -2);
    scene.add(rim);

    mesh = buildGoat();
    scene.add(mesh);

    window.addEventListener("resize", onResize);
    setVisible(Theme.current() === "day");
  }

  function onResize() {
    if (!container || !renderer) return;
    const w = container.clientWidth || 280;
    const h = container.clientHeight || 280;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function setVisible(show) {
    active = show;
    if (container) container.classList.toggle("is-visible", show);
    if (!renderer) return;
    cancelAnimationFrame(raf);
    if (show) raf = requestAnimationFrame(animate);
  }

  function destroy() {
    active = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", onResize);
    renderer?.dispose();
    container && (container.innerHTML = "");
  }

  return { init, setVisible, destroy };
})();
