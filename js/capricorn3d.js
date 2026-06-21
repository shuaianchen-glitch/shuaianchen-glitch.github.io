window.Capricorn3D = (() => {
  let renderer, scene, camera, root, raf, container, bubble, active;
  let head, leftEye, rightEye, leftPupil, rightPupil, leftLid, rightLid, tail;
  let moodIdx = 0;
  let moodTimer = 0;
  let targetRotY = 0;
  let targetRotX = 0;
  let pointer = { x: 0, y: 0 };
  let raycaster, mouse;

  function mat(color) {
    return new THREE.MeshToonMaterial({ color });
  }

  function mesh(geo, material, parent, pos, scale, rot) {
    const m = new THREE.Mesh(geo, material);
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (scale) m.scale.set(scale[0], scale[1], scale[2]);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    (parent || root).add(m);
    return m;
  }

  function buildGoat() {
    root = new THREE.Group();

    const fur = mat(0xd4b896);
    const furDark = mat(0xb89368);
    const tailMat = mat(0x4fa8bc);
    const tailDeep = mat(0x2d7f96);
    const hornMat = mat(0xfff3dc);
    const hoof = mat(0x5c4a3a);

    mesh(new THREE.SphereGeometry(1, 32, 32), fur, root, [0.15, 0.05, 0], [1.15, 0.95, 0.72]);
    mesh(new THREE.SphereGeometry(0.55, 28, 28), fur, root, [0.72, 0.42, 0], [1, 0.92, 0.82]);
    mesh(new THREE.SphereGeometry(0.48, 28, 28), furDark, root, [1.08, 0.58, 0], [0.95, 0.88, 0.78]);

    head = new THREE.Group();
    head.position.set(1.05, 0.72, 0);
    root.add(head);

    mesh(new THREE.SphereGeometry(0.42, 28, 28), fur, head, [0, 0, 0], [1.05, 1, 0.92]);
    mesh(new THREE.SphereGeometry(0.22, 20, 20), furDark, head, [0.28, -0.06, 0], [1.15, 0.85, 0.82]);

    [-0.16, 0.16].forEach((z, i) => {
      mesh(new THREE.ConeGeometry(0.07, 0.52, 10), hornMat, head, [0.02, 0.38, z], [1, 1, 1], [0.15, 0, z > 0 ? -0.45 : 0.45]);
      mesh(new THREE.SphereGeometry(0.1, 12, 12), fur, head, [-0.08, 0.08, z * 1.35], [0.55, 0.35, 0.25]);
    });

    const eyeWhiteMat = mat(0xffffff);
    const pupilMat = mat(0x1a1424);
    leftEye = new THREE.Group();
    leftEye.position.set(0.24, 0.08, -0.14);
    head.add(leftEye);
    mesh(new THREE.SphereGeometry(0.09, 16, 16), eyeWhiteMat, leftEye);
    leftPupil = mesh(new THREE.SphereGeometry(0.045, 12, 12), pupilMat, leftEye, [0.02, 0, 0.06]);
    leftLid = mesh(new THREE.SphereGeometry(0.095, 12, 12), furDark, leftEye, [0, 0.04, 0.02], [1.05, 0.55, 1], [0, 0, 0]);
    leftLid.visible = false;

    rightEye = new THREE.Group();
    rightEye.position.set(0.24, 0.08, 0.14);
    head.add(rightEye);
    mesh(new THREE.SphereGeometry(0.09, 16, 16), eyeWhiteMat, rightEye);
    rightPupil = mesh(new THREE.SphereGeometry(0.045, 12, 12), pupilMat, rightEye, [0.02, 0, 0.06]);
    rightLid = mesh(new THREE.SphereGeometry(0.095, 12, 12), furDark, rightEye, [0, 0.04, 0.02], [1.05, 0.55, 1], [0, 0, 0]);
    rightLid.visible = false;

    mesh(new THREE.SphereGeometry(0.035, 10, 10), mat(0xffb4c8), head, [0.12, -0.08, -0.2], [1, 0.6, 0.5]);
    mesh(new THREE.SphereGeometry(0.035, 10, 10), mat(0xffb4c8), head, [0.12, -0.08, 0.2], [1, 0.6, 0.5]);

    [[0.05, -0.42, -0.28], [0.05, -0.42, 0.28], [-0.15, -0.44, -0.24], [-0.15, -0.44, 0.24]].forEach((p) => {
      mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.52, 12), furDark, root, p);
      mesh(new THREE.SphereGeometry(0.1, 10, 10), hoof, root, [p[0], p[1] - 0.28, p[2]]);
    });

    tail = new THREE.Group();
    tail.position.set(-0.95, 0.02, 0);
    root.add(tail);
    mesh(new THREE.SphereGeometry(0.42, 24, 24), tailMat, tail, [-0.15, 0, 0], [1.45, 0.82, 0.62]);
    mesh(new THREE.SphereGeometry(0.28, 20, 20), tailDeep, tail, [-0.55, -0.02, 0], [1.2, 0.75, 0.55]);
    mesh(new THREE.ConeGeometry(0.24, 0.42, 4), tailDeep, tail, [-0.88, 0, 0], [1, 1, 0.35], [0, 0, Math.PI / 2]);

    root.rotation.y = -0.35;
    root.scale.setScalar(1.35);
    return root;
  }

  function size() {
    if (Theme.current() === "day") {
      return { w: window.innerWidth, h: window.innerHeight };
    }
    const el = container;
    return { w: el?.clientWidth || 400, h: el?.clientHeight || 400 };
  }

  function setMood(name) {
    leftLid.visible = false;
    rightLid.visible = false;
    leftEye.scale.set(1, 1, 1);
    rightEye.scale.set(1, 1, 1);
    targetRotX = 0;

    switch (name) {
      case "wink":
        rightLid.visible = true;
        targetRotX = 0.05;
        break;
      case "happy":
        leftEye.scale.y = 0.55;
        rightEye.scale.y = 0.55;
        break;
      case "think":
        targetRotX = -0.12;
        targetRotY = -0.55;
        break;
      case "climb":
        targetRotX = 0.15;
        root.position.y = 0.15;
        break;
      default:
        targetRotY = -0.35;
    }
  }

  function showBubble(text) {
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add("is-visible");
    clearTimeout(showBubble._t);
    showBubble._t = setTimeout(() => bubble.classList.remove("is-visible"), 2800);
  }

  function onClick(e) {
    if (!active || Theme.current() !== "day") return;
    const moods = window.SITE.capricorn.moods;
    const mood = moods[moodIdx % moods.length];
    moodIdx++;
    moodTimer = 90;
    setMood(mood.face);
    showBubble(mood.text);
  }

  function onMove(e) {
    if (!active) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    if (Theme.current() === "day" && moodTimer <= 0) {
      targetRotY = -0.35 + pointer.x * 0.35;
      targetRotX = pointer.y * 0.12;
    }
    if (leftPupil && rightPupil) {
      const px = pointer.x * 0.025;
      const py = pointer.y * 0.015;
      leftPupil.position.set(0.02 + px, py, 0.06);
      rightPupil.position.set(0.02 + px, py, 0.06);
    }
  }

  function animate(t) {
    if (!active || !root) return;
    const time = t * 0.001;
    if (moodTimer > 0) {
      moodTimer--;
      if (moodTimer === 0) setMood("curious");
    }

    root.position.y = 0.08 + Math.sin(time * 1.1) * 0.08;
    root.rotation.y += (targetRotY - root.rotation.y) * 0.06;
    head.rotation.x += (targetRotX - head.rotation.x) * 0.08;
    head.rotation.z = Math.sin(time * 0.8) * 0.03;
    if (tail) tail.rotation.z = 0.25 + Math.sin(time * 1.4) * 0.12;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  }

  function init() {
    container = document.getElementById("capricorn-3d");
    bubble = document.getElementById("capricorn-bubble");
    if (!container || typeof THREE === "undefined") return;

    const { w, h } = size();
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.classList.add("capricorn-canvas");
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(Theme.current() === "day" ? 32 : 38, w / h, 0.1, 100);
    camera.position.set(0, 0.55, Theme.current() === "day" ? 4.8 : 3.6);

    scene.add(new THREE.AmbientLight(0xfff8ee, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xa8d8ff, 0.55);
    fill.position.set(-4, 2, -3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffd4a8, 0.35);
    rim.position.set(0, -2, -4);
    scene.add(rim);

    buildGoat();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderer.domElement.addEventListener("click", onClick);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("resize", onResize);
    setVisible(Theme.current() === "day");
  }

  function onResize() {
    if (!renderer || !camera) return;
    const { w, h } = size();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.position.z = Theme.current() === "day" ? 4.8 : 3.6;
    renderer.setSize(w, h);
  }

  function setVisible(show) {
    active = show;
    container?.classList.toggle("is-visible", show);
    document.body.classList.toggle("day-capricorn", show);
    if (!renderer) return;
    onResize();
    cancelAnimationFrame(raf);
    if (show) {
      moodIdx = 0;
      moodTimer = 0;
      setMood("curious");
      raf = requestAnimationFrame(animate);
    }
  }

  return { init, setVisible };
})();
