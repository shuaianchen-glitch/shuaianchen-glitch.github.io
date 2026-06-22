import {
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

window.HandGesture = {
  openness: 0.5,
  x: 0.5,
  y: 0.5,
  hasHand: false,
  enabled: false,
  ready: false,
  error: null,
};

let landmarker = null;
let video = null;
let raf = 0;
let smoothOpen = 0.5;
let smoothX = 0.5;
let smoothY = 0.5;

function palmCenter(lm) {
  const ids = [0, 5, 9, 13, 17];
  let x = 0;
  let y = 0;
  ids.forEach((i) => {
    x += lm[i].x;
    y += lm[i].y;
  });
  return { x: 1 - x / ids.length, y: y / ids.length };
}

function computeOpenness(lm) {
  const palm = lm[9];
  const wrist = lm[0];
  const scale = Math.hypot(palm.x - wrist.x, palm.y - wrist.y) || 0.08;
  const tips = [4, 8, 12, 16, 20];
  let sum = 0;
  tips.forEach((i) => {
    sum += Math.hypot(lm[i].x - palm.x, lm[i].y - palm.y);
  });
  const ratio = sum / tips.length / scale;
  return Math.max(0, Math.min(1, (ratio - 1.05) / 1.55));
}

function updateHud() {
  const hud = document.getElementById("gesture-hud");
  const state = document.getElementById("gesture-state");
  const fill = document.getElementById("gesture-meter-fill");
  const btn = document.getElementById("gesture-toggle");
  if (!hud) return;

  if (!window.HandGesture.enabled) {
    hud.hidden = true;
    btn?.classList.remove("is-active");
    return;
  }

  hud.hidden = false;
  btn?.classList.add("is-active");

  if (window.HandGesture.error) {
    if (state) state.textContent = "无法访问摄像头";
    return;
  }

  if (!window.HandGesture.hasHand) {
    if (state) state.textContent = "伸出手掌";
    if (fill) fill.style.width = "50%";
    return;
  }

  const o = window.HandGesture.openness;
  if (state) {
    state.textContent = o < 0.35 ? "聚合" : o > 0.65 ? "散开" : "悬停";
  }
  if (fill) fill.style.width = `${Math.round(o * 100)}%`;
}

function tick() {
  if (!window.HandGesture.enabled || !landmarker || !video) {
    raf = requestAnimationFrame(tick);
    return;
  }

  if (video.readyState >= 2) {
    try {
      const res = landmarker.detectForVideo(video, performance.now());
      if (res.landmarks?.[0]) {
        const lm = res.landmarks[0];
        const center = palmCenter(lm);
        const raw = computeOpenness(lm);
        smoothOpen += (raw - smoothOpen) * 0.14;
        smoothX += (center.x - smoothX) * 0.18;
        smoothY += (center.y - smoothY) * 0.18;
        window.HandGesture.hasHand = true;
        window.HandGesture.openness = smoothOpen;
        window.HandGesture.x = smoothX;
        window.HandGesture.y = smoothY;
      } else {
        window.HandGesture.hasHand = false;
        smoothOpen += (0.5 - smoothOpen) * 0.06;
        window.HandGesture.openness = smoothOpen;
      }
    } catch {
      /* skip frame */
    }
  }

  updateHud();
  raf = requestAnimationFrame(tick);
}

async function ensureModel() {
  if (landmarker) return;
  const vision = await FilesetResolver.forVisionTasks(WASM);
  try {
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: 1,
    });
  } catch {
    landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
      runningMode: "VIDEO",
      numHands: 1,
    });
  }
  window.HandGesture.ready = true;
}

async function start() {
  window.HandGesture.error = null;
  video = document.getElementById("gesture-video");
  if (!video) return;

  try {
    await ensureModel();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    window.HandGesture.enabled = true;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    updateHud();
  } catch (err) {
    window.HandGesture.error = err.message || "camera denied";
    window.HandGesture.enabled = false;
    updateHud();
  }
}

function stop() {
  window.HandGesture.enabled = false;
  window.HandGesture.hasHand = false;
  window.HandGesture.error = null;
  cancelAnimationFrame(raf);

  if (video?.srcObject) {
    video.srcObject.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  }

  updateHud();
}

function init() {
  document.getElementById("gesture-toggle")?.addEventListener("click", () => {
    if (window.HandGesture.enabled) stop();
    else start();
  });
}

init();
