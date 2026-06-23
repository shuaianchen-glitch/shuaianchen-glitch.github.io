window.CognitiveField = (() => {
  const T = window.THREE;
  if (!T) return null;

  const PHYS = {
    damping: 0.94,
    corePull: 0.018,
    orbitSpring: 0.024,
    repulsion: 1.05,
    repulsionR: 1.35,
    cursorForce: 0.055,
    cursorR: 2.8,
    maxSpeed: 0.35,
    settle: 0.016,
  };

  let canvas;
  let renderer;
  let scene;
  let camera;
  let raf = 0;
  let clock;
  let nodes = [];
  let links = [];
  let coreMesh = null;
  let raycaster;
  let pointer;
  let hoverNode = null;
  let focusNode = null;
  let scrollDepth = 0;
  let targetScrollDepth = 0;
  let fieldIntensity = 1;
  let mouseNdc = { x: 0, y: 0 };
  let mouseWorld = new T.Vector3();
  let probeActive = false;
  let width = 0;
  let height = 0;
  let dpr = 1;

  const cameraBase = { z: 11, y: 0.4 };
  const accent = 0x8eb4ff;

  function sphericalToCartesian(orbit, theta, phi) {
    const r = orbit;
    return new T.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi) * 0.55,
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  function createGlowMesh(radius, color, opacity) {
    const geo = new T.SphereGeometry(radius, 32, 32);
    const mat = new T.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: T.AdditiveBlending,
    });
    return new T.Mesh(geo, mat);
  }

  function createNodeMesh(entry, type) {
    const mass = entry.weight || 0.5;
    const importance = entry.importance || 0.5;
    const baseR = 0.08 + mass * 0.14;
    const geo = new T.SphereGeometry(baseR, 24, 24);
    const emissive = importance * (entry.live === false ? 0.35 : 0.65);
    const mat = new T.MeshStandardMaterial({
      color: 0xdde4f0,
      emissive: accent,
      emissiveIntensity: emissive,
      roughness: 0.35,
      metalness: 0.15,
      transparent: true,
      opacity: 0.55 + importance * 0.4,
    });
    const mesh = new T.Mesh(geo, mat);
    const glow = createGlowMesh(baseR * 2.8, accent, 0.06 + importance * 0.12);
    mesh.add(glow);

    const hit = new T.Mesh(
      new T.SphereGeometry(baseR * 2.4, 12, 12),
      new T.MeshBasicMaterial({ visible: false })
    );
    hit.userData.parentNode = mesh;
    mesh.add(hit);

    mesh.userData = { entry, type, baseR, importance, mass, hit };
    return mesh;
  }

  function buildNodes() {
    const site = window.SITE;
    const list = [];

    site.projects.forEach((p) => {
      const f = p.field || {};
      list.push({
        id: `project-${p.title}`,
        type: "project",
        entry: p,
        mass: f.weight || 0.7,
        importance: f.importance || 0.8,
        relevance: f.relevance || 0.85,
        orbit: f.orbit || 5,
        theta: f.theta ?? Math.random() * Math.PI * 2,
        phi: f.phi ?? 1.0,
        velocity: new T.Vector3(),
      });
    });

    site.skills.forEach((s) => {
      list.push({
        id: s.id,
        type: "skill",
        entry: s,
        mass: s.weight,
        importance: s.importance,
        relevance: s.relevance,
        orbit: s.orbit,
        theta: s.theta,
        phi: s.phi,
        velocity: new T.Vector3(),
      });
    });

    site.experience.forEach((e) => {
      list.push({
        id: e.id,
        type: "experience",
        entry: e,
        mass: e.weight,
        importance: e.importance,
        relevance: e.relevance,
        orbit: 4.5 + e.depth * 3,
        theta: e.theta,
        phi: e.phi,
        velocity: new T.Vector3(),
      });
    });

    site.notes.forEach((n) => {
      list.push({
        id: n.id,
        type: "note",
        entry: n,
        mass: n.weight,
        importance: n.importance,
        relevance: n.relevance,
        orbit: n.orbit,
        theta: n.theta,
        phi: n.phi,
        velocity: new T.Vector3(),
      });
    });

    return list;
  }

  function initScene() {
    scene = new T.Scene();
    scene.fog = new T.FogExp2(0x050608, 0.028);
    scene.background = new T.Color(0x050608);

    camera = new T.PerspectiveCamera(42, 1, 0.1, 120);
    camera.position.set(0, cameraBase.y, cameraBase.z);

    const coreGeo = new T.SphereGeometry(0.42, 48, 48);
    const coreMat = new T.MeshStandardMaterial({
      color: 0xf2f4f8,
      emissive: accent,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.4,
    });
    coreMesh = new T.Mesh(coreGeo, coreMat);
    coreMesh.add(createGlowMesh(1.4, accent, 0.18));
    coreMesh.add(createGlowMesh(2.6, 0xffffff, 0.04));
    scene.add(coreMesh);

    const coreLight = new T.PointLight(accent, 2.2, 18);
    coreLight.position.set(0, 0, 0);
    scene.add(coreLight);

    scene.add(new T.AmbientLight(0x404860, 0.35));
    const rim = new T.DirectionalLight(0xc8d4e8, 0.45);
    rim.position.set(-4, 6, 8);
    scene.add(rim);

    const data = buildNodes();
    data.forEach((n) => {
      const mesh = createNodeMesh(n.entry, n.type);
      const anchor = sphericalToCartesian(n.orbit, n.theta, n.phi);
      mesh.position.copy(anchor);
      n.mesh = mesh;
      n.anchor = anchor.clone();
      n.orbitTarget = anchor.clone();
      scene.add(mesh);
      nodes.push(n);
    });

    buildLinks();
    addAmbientDust();
  }

  function addAmbientDust() {
    const count = 120;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(positions, 3));
    const mat = new T.PointsMaterial({
      color: accent,
      size: 0.035,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: T.AdditiveBlending,
    });
    scene.add(new T.Points(geo, mat));
  }

  function buildLinks() {
    const projectNodes = nodes.filter((n) => n.type === "project");
    const skillNodes = nodes.filter((n) => n.type === "skill");
    projectNodes.forEach((p, i) => {
      const s = skillNodes[i % skillNodes.length];
      if (!s) return;
      const pts = new Float32Array([
        p.mesh.position.x, p.mesh.position.y, p.mesh.position.z,
        s.mesh.position.x, s.mesh.position.y, s.mesh.position.z,
      ]);
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(pts, 3));
      const line = new T.Line(
        geo,
        new T.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.06 })
      );
      scene.add(line);
      links.push({ line, a: p, b: s });
    });
  }

  function updateLinks() {
    links.forEach(({ line, a, b }) => {
      const pos = line.geometry.attributes.position.array;
      pos[0] = a.mesh.position.x;
      pos[1] = a.mesh.position.y;
      pos[2] = a.mesh.position.z;
      pos[3] = b.mesh.position.x;
      pos[4] = b.mesh.position.y;
      pos[5] = b.mesh.position.z;
      line.geometry.attributes.position.needsUpdate = true;
    });
  }

  function applyForces(dt) {
    const core = new T.Vector3(0, 0, 0);
    const intensity = fieldIntensity * (0.85 + scrollDepth * 0.35);

    nodes.forEach((node) => {
      if (focusNode && focusNode !== node && focusNode.type === "project") {
        node.orbitTarget.copy(node.anchor).multiplyScalar(1.35);
      } else {
        node.orbitTarget.copy(node.anchor);
      }

      const pos = node.mesh.position;
      const force = new T.Vector3();

      const toCore = core.clone().sub(pos);
      const coreDist = toCore.length();
      if (coreDist > 0.001) {
        force.add(toCore.normalize().multiplyScalar(PHYS.corePull * node.relevance * intensity * node.mass));
      }

      const toOrbit = node.orbitTarget.clone().sub(pos);
      force.add(toOrbit.multiplyScalar(PHYS.orbitSpring * PHYS.settle * 60));

      nodes.forEach((other) => {
        if (other === node) return;
        const delta = pos.clone().sub(other.mesh.position);
        const dist = delta.length();
        if (dist < PHYS.repulsionR && dist > 0.001) {
          const push = (PHYS.repulsionR - dist) / PHYS.repulsionR;
          force.add(delta.normalize().multiplyScalar(push * PHYS.repulsion * node.mass));
        }
      });

      if (probeActive && !focusNode) {
        const toProbe = pos.clone().sub(mouseWorld);
        const dist = toProbe.length();
        if (dist < PHYS.cursorR && dist > 0.001) {
          const pull = hoverNode === node ? 1.8 : 1;
          const f = (1 - dist / PHYS.cursorR) * PHYS.cursorForce * pull;
          force.add(toProbe.normalize().multiplyScalar(-f));
        }
      }

      if (hoverNode === node) {
        const pull = core.clone().sub(pos).normalize().multiplyScalar(0.008);
        force.add(pull);
      }

      node.velocity.add(force.multiplyScalar(dt * 60));
      if (node.velocity.length() > PHYS.maxSpeed) {
        node.velocity.setLength(PHYS.maxSpeed);
      }
      node.velocity.multiplyScalar(PHYS.damping);
      pos.add(node.velocity.clone().multiplyScalar(dt * 60));

      const breathe = 0.04 * Math.sin(clock.getElapsedTime() * 0.6 + node.theta);
      const scale = 1 + breathe * node.importance;
      node.mesh.scale.setScalar(focusNode === node ? scale * 1.35 : scale);
    });
  }

  function updateNodeVisuals() {
    nodes.forEach((node) => {
      const { mesh, importance, entry } = node;
      const mat = mesh.material;
      const targetEmissive = importance * (entry.live === false ? 0.3 : 0.55);
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.04;
      if (hoverNode === node) mat.emissiveIntensity = Math.min(1.2, mat.emissiveIntensity + 0.02);
      mat.opacity = 0.35 + importance * 0.5 + (hoverNode === node ? 0.15 : 0);
    });
  }

  function updateCamera(dt) {
    scrollDepth += (targetScrollDepth - scrollDepth) * 0.04;
    fieldIntensity = 0.75 + scrollDepth * 0.55;

    const t = clock.getElapsedTime();
    const drift = focusNode ? 0 : Math.sin(t * 0.12) * 0.15;
    const targetZ = cameraBase.z - scrollDepth * 5.5;
    const targetY = cameraBase.y + scrollDepth * 1.2 + drift;

    if (focusNode) {
      const fp = focusNode.mesh.position;
      const offset = new T.Vector3(0, 0.3, 3.2);
      const desired = fp.clone().add(offset);
      camera.position.lerp(desired, 0.028);
      camera.lookAt(fp);
    } else {
      camera.position.y += (targetY - camera.position.y) * 0.035;
      camera.position.z += (targetZ - camera.position.z) * 0.035;
      camera.lookAt(0, 0, 0);
    }
  }

  function updateProbe() {
    raycaster.setFromCamera(new T.Vector2(mouseNdc.x, mouseNdc.y), camera);
    mouseWorld.copy(raycaster.ray.origin).add(
      raycaster.ray.direction.clone().multiplyScalar(4.5 + scrollDepth * 2)
    );
    probeActive = true;
  }

  function resolveNodeFromHit(object) {
    if (object.userData.parentNode) return object.userData.parentNode;
    return object;
  }

  function pickNode() {
    raycaster.setFromCamera(new T.Vector2(mouseNdc.x, mouseNdc.y), camera);
    const hits = raycaster.intersectObjects(
      nodes.flatMap((n) => [n.mesh, n.mesh.userData.hit]),
      false
    );
    if (!hits.length) return null;
    const mesh = resolveNodeFromHit(hits[0].object);
    return nodes.find((n) => n.mesh === mesh) || null;
  }

  function showMeta(node) {
    const panel = document.getElementById("field-meta");
    if (!panel || !node) return;
    const { entry, type } = node;
    panel.hidden = false;
    panel.dataset.type = type;
    document.getElementById("meta-type").textContent = type;
    document.getElementById("meta-title").textContent = entry.title || entry.label || entry.text;
    document.getElementById("meta-body").textContent =
      entry.desc || entry.detail || entry.period || entry.cluster || "";
    const tags = document.getElementById("meta-tags");
    tags.innerHTML = "";
    (entry.tags || [entry.cluster].filter(Boolean)).forEach((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.appendChild(span);
    });
    document.getElementById("meta-weight").textContent = `${Math.round(node.importance * 100)}%`;
    document.getElementById("meta-relevance").textContent = `${Math.round(node.relevance * 100)}%`;
  }

  function hideMeta() {
    const panel = document.getElementById("field-meta");
    if (panel) panel.hidden = true;
  }

  function openSubField(node) {
    if (!node) return;
    focusNode = node;
    const panel = document.getElementById("field-sub");
    const { entry, type } = node;
    if (!panel) return;

    panel.hidden = false;
    document.getElementById("sub-type").textContent = type;
    document.getElementById("sub-title").textContent = entry.title || entry.label || entry.text;
    document.getElementById("sub-body").textContent = entry.desc || entry.detail || entry.text || "";
    const tags = document.getElementById("sub-tags");
    tags.innerHTML = "";
    (entry.tags || [entry.period, entry.cluster].filter(Boolean)).forEach((tag) => {
      const span = document.createElement("span");
      span.textContent = tag;
      tags.appendChild(span);
    });

    const cta = document.getElementById("sub-cta");
    if (type === "project" && entry.link) {
      cta.hidden = false;
      cta.textContent = entry.live ? "Open project →" : window.SITE.soon.message;
      cta.onclick = () => {
        if (!entry.live) return;
        if (entry.external) window.open(entry.link, "_blank", "noopener");
        else window.location.href = entry.link;
      };
    } else {
      cta.hidden = true;
    }

    document.body.classList.add("field-focused");
    hideMeta();
  }

  function closeSubField() {
    focusNode = null;
    document.getElementById("field-sub").hidden = true;
    document.body.classList.remove("field-focused");
  }

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.032);
    applyForces(dt);
    updateLinks();
    updateNodeVisuals();
    updateCamera(dt);
    updateLabels();
    updateCore(clock.getElapsedTime());
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  function updateCore(t) {
    if (!coreMesh) return;
    const pulse = 1 + Math.sin(t * 0.5) * 0.04;
    coreMesh.scale.setScalar(pulse);
  }

  function updateLabels() {
    nodes.forEach((node) => {
      if (!node.labelEl) return;
      const projected = node.mesh.position.clone().project(camera);
      const visible = projected.z < 1 && projected.x > -1.2 && projected.x < 1.2 && projected.y > -1.2 && projected.y < 1.2;
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;
      node.labelEl.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
      node.labelEl.style.opacity = visible ? 0.35 + node.importance * 0.45 : 0;
      if (hoverNode === node) node.labelEl.style.opacity = Math.min(1, parseFloat(node.labelEl.style.opacity) + 0.25);
    });
  }

  function createLabels() {
    const layer = document.getElementById("field-labels");
    if (!layer) return;
    nodes.forEach((node) => {
      const el = document.createElement("span");
      el.className = `field-node-label field-node-label--${node.type}`;
      el.textContent = node.entry.title || node.entry.label || node.entry.text;
      layer.appendChild(el);
      node.labelEl = el;
    });
  }

  function bindUi() {
    const identity = window.SITE.field.identity;
    document.getElementById("field-name").textContent = identity.name;
    document.getElementById("field-name-en").textContent = identity.nameEn;
    document.getElementById("field-role").textContent = identity.role;
    document.getElementById("field-philosophy").textContent = identity.philosophy;
    document.getElementById("field-label").textContent = window.SITE.field.label;
    document.getElementById("field-hint-scroll").textContent = window.SITE.field.hints.scroll;
    document.getElementById("field-hint-probe").textContent = window.SITE.field.hints.probe;
    document.getElementById("year").textContent = new Date().getFullYear();

    document.getElementById("field-close")?.addEventListener("click", closeSubField);
    document.getElementById("field-backdrop")?.addEventListener("click", closeSubField);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSubField();
    });

    canvas.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      updateProbe();
      if (!focusNode) {
        const hit = pickNode();
        if (hit !== hoverNode) {
          hoverNode = hit;
          if (hit) showMeta(hit);
          else hideMeta();
        }
      }
    });

    canvas.addEventListener("pointerleave", () => {
      hoverNode = null;
      hideMeta();
      probeActive = false;
    });

    canvas.addEventListener("click", () => {
      if (hoverNode) openSubField(hoverNode);
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      targetScrollDepth = Math.max(0, Math.min(1, targetScrollDepth + e.deltaY * 0.0008));
    }, { passive: false });
  }

  function resize() {
    if (!canvas || !renderer || !camera) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(dpr);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function init() {
    canvas = document.getElementById("field-canvas");
    if (!canvas) return;

    clock = new T.Clock();
    raycaster = new T.Raycaster();
    pointer = new T.Vector2();

    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;

    initScene();
    createLabels();
    bindUi();
    resize();
    window.addEventListener("resize", resize);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function destroy() {
    cancelAnimationFrame(raf);
    renderer?.dispose();
  }

  return { init, destroy, closeSubField };
})();
