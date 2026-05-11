/* =============================================================
   Three explorations of the agent-creation moment.
   Each starts from the preview card on the landing and morphs.
   ============================================================= */

const VIEWS = {
  landing: document.getElementById("view-landing"),
  creating: document.getElementById("view-creating"),
  details: document.getElementById("view-details"),
};

const $btnGetStarted = document.getElementById("btn-get-started");
const $caption = document.getElementById("exp-caption");
const $reset = document.getElementById("demo-reset");
const $pills = document.querySelectorAll(".demo-pill");
const $creatingView = VIEWS.creating;
const $stage = document.getElementById("exp-stage");

let activeExp = "sparkle";
let isRunning = false;
let clarityLottie = null;
let sparkleLottie = null;
let astroSparkleLottie = null;

/* ----------------------------------------------------------- */
/* Lottie — Clarity blur animation                              */
/* ----------------------------------------------------------- */
function initClarityLottie() {
  if (clarityLottie) return clarityLottie;
  if (typeof lottie === "undefined") return null;
  const container = document.getElementById("exp-clarity-lottie");
  if (!container) return null;
  try {
    clarityLottie = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: "fixed-blur.json",
      rendererSettings: {
        preserveAspectRatio: "xMidYMid slice",
        progressiveLoad: true,
      },
    });
  } catch (e) {
    console.error("[lottie load error]", e);
    clarityLottie = null;
  }
  return clarityLottie;
}

/* ----------------------------------------------------------- */
/* Lottie — Sparkle (the agent ignition motif)                  */
/* ----------------------------------------------------------- */
function initSparkleLottie() {
  if (sparkleLottie) return sparkleLottie;
  if (typeof lottie === "undefined") return null;
  const container = document.getElementById("exp-sparkle-lottie");
  if (!container) return null;
  try {
    sparkleLottie = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: "sparkle.json",
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
        progressiveLoad: true,
      },
    });
  } catch (e) {
    console.error("[sparkle lottie load error]", e);
    sparkleLottie = null;
  }
  return sparkleLottie;
}

/* ----------------------------------------------------------- */
/* Lottie — Astro Sparkle (V1: comet-from-Astro direction)      */
/* ----------------------------------------------------------- */
function initAstroSparkleLottie() {
  if (astroSparkleLottie) return astroSparkleLottie;
  if (typeof lottie === "undefined") return null;
  const container = document.getElementById("exp-astro-sparkle-lottie");
  if (!container) return null;
  try {
    // .lottie files are zip archives; we unpacked Astro Sparkle.lottie into
    // assets/astro-sparkle/ so the JSON + image asset are served as plain
    // files. assetsPath tells lottie-web where to fetch the embedded image
    // referenced inside the JSON (overrides the `u` path baked into the
    // export).
    // Cache buster — bump the version when the Lottie composition or
    // its assets change. lottie-web fetches the JSON itself (we can't
    // version it via the script tag), so this query param is how we
    // force embedded browsers to skip stale cached copies.
    const ASTRO_LOTTIE_V = 2;
    astroSparkleLottie = lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: `assets/astro-sparkle/a/Main Scene.json?v=${ASTRO_LOTTIE_V}`,
      assetsPath: `assets/astro-sparkle/i/`,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
        progressiveLoad: true,
      },
    });
  } catch (e) {
    console.error("[astro sparkle lottie load error]", e);
    astroSparkleLottie = null;
  }
  return astroSparkleLottie;
}

// Pre-warm all Lottie animations so the first click is responsive.
window.addEventListener("DOMContentLoaded", () => {
  initClarityLottie();
  initSparkleLottie();
  initAstroSparkleLottie();
});

/* ----------------------------------------------------------- */
/* View transitions                                             */
/* ----------------------------------------------------------- */
function switchView(toKey) {
  Object.entries(VIEWS).forEach(([key, el]) => {
    if (!el) return;
    if (key === toKey) {
      el.classList.add("is-active");
      el.classList.remove("is-leaving");
      el.removeAttribute("aria-hidden");
    } else if (el.classList.contains("is-active")) {
      el.classList.remove("is-active");
      el.classList.add("is-leaving");
      el.setAttribute("aria-hidden", "true");
      setTimeout(() => el.classList.remove("is-leaving"), 600);
    }
  });
  document.body.classList.toggle("is-on-details", toKey === "details");
}

/* ----------------------------------------------------------- */
/* Caption crossfade                                            */
/* ----------------------------------------------------------- */
function setCaption(text) {
  if (!$caption) return;
  $caption.classList.add("is-fading");
  setTimeout(() => {
    $caption.textContent = text;
    $caption.classList.remove("is-fading");
  }, 260);
}

/* ----------------------------------------------------------- */
/* Reset only state classes + text — does NOT touch stage style  */
/* ----------------------------------------------------------- */
function resetExplorationStates() {
  document.querySelectorAll(".exp").forEach((el) => {
    el.classList.remove("is-developing", "is-resolved", "is-drawing");
  });
  // Reset Sparkle Lottie back to frame 0 so a re-run starts clean.
  if (sparkleLottie) {
    try { sparkleLottie.goToAndStop(0, true); } catch (e) { /* ignore */ }
  }
  if (astroSparkleLottie) {
    try { astroSparkleLottie.goToAndStop(0, true); } catch (e) { /* ignore */ }
  }
  const clarityCaption = document.getElementById("exp-clarity-caption");
  if (clarityCaption) {
    clarityCaption.classList.remove("is-visible");
    clarityCaption.textContent = "";
  }

  // Process Steps rows — clear inline styles, .is-shimmer, and reset
  // the per-row data-phase so a re-run starts blank.
  const processOverlay = document.getElementById("exp-process-steps-overlay");
  if (processOverlay) {
    processOverlay.querySelectorAll(".exp-process-row").forEach((el) => {
      el.classList.remove("is-shimmer");
      el.style.opacity = "";
      el.style.transform = "";
      el.dataset.phase = "idle";
      el.querySelectorAll(
        ".exp-process-sparkle, .exp-process-check"
      ).forEach((g) => {
        g.style.opacity = "";
        g.style.transform = "";
      });
    });
  }

  // Re-trigger gesture path animation by clearing inline animation prop.
  // Wrap in try/catch — SVG element style access has bitten us before.
  document.querySelectorAll(".exp-gesture-path").forEach((p) => {
    try {
      p.style.animation = "none";
      // Force reflow so when the class re-applies, the keyframes restart.
      void p.getBoundingClientRect();
      p.style.animation = "";
    } catch (e) {
      /* ignore */
    }
  });
}

/* ----------------------------------------------------------- */
/* Stage positioning helpers                                    */
/* ----------------------------------------------------------- */
function clearStagePosition() {
  if (!$stage) return;
  $stage.removeAttribute("data-positioned");
  $stage.style.top = "";
  $stage.style.left = "";
  $stage.style.width = "";
  $stage.style.height = "";
}

function positionStageOverPreviewCard() {
  if (!$stage) return;
  const card = document.querySelector(".view-landing .preview-card");
  if (!card) return;
  const r = card.getBoundingClientRect();
  $stage.style.top = r.top + "px";
  $stage.style.left = r.left + "px";
  $stage.style.width = r.width + "px";
  $stage.style.height = r.height + "px";
  $stage.dataset.positioned = "true";
}

/* ----------------------------------------------------------- */
/* 01 — SPARKLE                                                 */
/* Timeline-driven so the playback bar can pause, restart, and  */
/* scrub the sparkle frame-by-frame.                            */
/* ----------------------------------------------------------- */
const SPARKLE_KEYFRAMES = {
  captionIn: 0,
  lottieIn: 400,
  lottieOut: 3400, // 3s Lottie at 60fps
  settle: 4000,
  end: 4400,
};

const SPARKLE_TOTAL = SPARKLE_KEYFRAMES.end;

// Pure render: given a time t (ms), paint the sparkle exploration in
// exactly that state. The visible headline is a static DOM element
// above the Lottie (driven by CSS visibility on [data-exp="sparkle"]),
// so the only thing this function scrubs is the Lottie frame.
function applySparkleStateAt(t) {
  if (sparkleLottie && sparkleLottie.totalFrames) {
    const { lottieIn, lottieOut } = SPARKLE_KEYFRAMES;
    let progress;
    if (t < lottieIn) progress = 0;
    else if (t > lottieOut) progress = 1;
    else progress = (t - lottieIn) / (lottieOut - lottieIn);

    const frame = progress * (sparkleLottie.totalFrames - 1);
    try {
      sparkleLottie.goToAndStop(frame, true);
    } catch (e) {
      /* ignore */
    }
  }
}

const SPARKLE_PLAYBACK = {
  id: "sparkle",
  total: SPARKLE_TOTAL,
  // One mark at the Lottie's entry — the moment the sparkle ignites.
  marks: [SPARKLE_KEYFRAMES.lottieIn],
  renderAt: applySparkleStateAt,
  onComplete: null, // wired per-run below
};

async function runSparkle() {
  const expEl = document.querySelector(".exp-sparkle");
  if (!expEl) return;

  // Make sure the Lottie is in DOM and at frame 0 before the timeline
  // begins controlling it.
  initSparkleLottie();
  // The headline lives above the Lottie; the top status caption stays
  // empty for this exploration so we don't double up on copy.
  setCaption("");

  return new Promise((resolve) => {
    SPARKLE_PLAYBACK.onComplete = () => {
      hidePlaybackBar();
      resolve();
    };
    startPlayback(SPARKLE_PLAYBACK);
  });
}

/* ----------------------------------------------------------- */
/* 04 — ASTRO SPARKLE                                            */
/* Astro mascot with sparkle particles emitting outward.        */
/* Same playback shape as Sparkle: the Lottie is scrubbed by    */
/* the timeline so the playback bar can pause/restart/scrub.    */
/* ----------------------------------------------------------- */
const ASTRO_SPARKLE_KEYFRAMES = {
  captionIn: 0,
  lottieIn: 400,
  // Astro composition runs ~100 frames at 60fps -> ~1.6s, but we
  // stretch the scrub window slightly so it doesn't feel rushed.
  lottieOut: 4000,
  settle: 4500,
  end: 5000,
};

const ASTRO_SPARKLE_TOTAL = ASTRO_SPARKLE_KEYFRAMES.end;

function applyAstroSparkleStateAt(t) {
  if (astroSparkleLottie && astroSparkleLottie.totalFrames) {
    const { lottieIn, lottieOut } = ASTRO_SPARKLE_KEYFRAMES;
    let progress;
    if (t < lottieIn) progress = 0;
    else if (t > lottieOut) progress = 1;
    else progress = (t - lottieIn) / (lottieOut - lottieIn);

    const frame = progress * (astroSparkleLottie.totalFrames - 1);
    try {
      astroSparkleLottie.goToAndStop(frame, true);
    } catch (e) {
      /* ignore */
    }
  }
}

const ASTRO_SPARKLE_PLAYBACK = {
  id: "astro-sparkle",
  total: ASTRO_SPARKLE_TOTAL,
  marks: [ASTRO_SPARKLE_KEYFRAMES.lottieIn],
  renderAt: applyAstroSparkleStateAt,
  onComplete: null,
};

async function runAstroSparkle() {
  const expEl = document.querySelector(".exp-astro-sparkle");
  if (!expEl) return;

  initAstroSparkleLottie();
  setCaption("");

  return new Promise((resolve) => {
    ASTRO_SPARKLE_PLAYBACK.onComplete = () => {
      hidePlaybackBar();
      resolve();
    };
    startPlayback(ASTRO_SPARKLE_PLAYBACK);
  });
}

/* ----------------------------------------------------------- */
/* 02 — CLARITY                                                 */
/* Timeline-driven so it can be paused, restarted, or scrubbed. */
/* ----------------------------------------------------------- */
const CLARITY_LINES = [
  "Preparing your AI-powered support experience",
  "Your intelligent agent is on its way",
  "Setting the stage for smarter service",
];

// Keyframe schedule for the clarity timeline. Times are in ms.
// Used both for forward playback and for "scrub to time" rendering.
// Each caption window has explicit IN and OUT moments so we can crossfade
// cleanly between lines (the CSS opacity transition is 360ms).
const CLARITY_KEYFRAMES = {
  developIn: 0,
  line1In: 600,
  line1Out: 2100,
  line2In: 2500,
  line2Out: 4000,
  line3In: 4400,
  line3Out: 5900,
  resolve: 6300,
  end: 7100,
};

const CLARITY_TOTAL = CLARITY_KEYFRAMES.end;

// Generic playback engine. Each exploration that wants timeline controls
// (pause, restart, scrub) calls startPlayback(config) with its own
// renderAt(t)/total/marks/onComplete. The engine itself knows nothing
// about clarity vs. gesture — it only ticks time and asks the config to
// paint.
const playback = {
  active: false,
  paused: false,
  startedAt: 0,
  pausedAt: 0,
  totalPaused: 0,
  rafId: null,
  config: null, // { id, renderAt, total, marks, onComplete }
};

function effectiveElapsed() {
  if (!playback.active) return 0;
  if (playback.paused) {
    return playback.pausedAt - playback.startedAt - playback.totalPaused;
  }
  return performance.now() - playback.startedAt - playback.totalPaused;
}

function applyClarityStateAt(t) {
  const expEl = document.querySelector(".exp-clarity");
  const captionEl = document.getElementById("exp-clarity-caption");
  if (!expEl) return;

  expEl.classList.toggle("is-developing", t >= CLARITY_KEYFRAMES.developIn);
  expEl.classList.toggle("is-resolved", t >= CLARITY_KEYFRAMES.resolve);

  // Piecewise caption: explicit windows with gaps so the opacity transition
  // can fade out and back in between lines.
  let lineText = "";
  if (t >= CLARITY_KEYFRAMES.line1In && t < CLARITY_KEYFRAMES.line1Out) lineText = CLARITY_LINES[0];
  else if (t >= CLARITY_KEYFRAMES.line2In && t < CLARITY_KEYFRAMES.line2Out) lineText = CLARITY_LINES[1];
  else if (t >= CLARITY_KEYFRAMES.line3In && t < CLARITY_KEYFRAMES.line3Out) lineText = CLARITY_LINES[2];

  if (captionEl) {
    if (lineText) {
      if (captionEl.textContent !== lineText) captionEl.textContent = lineText;
      captionEl.classList.add("is-visible");
    } else {
      captionEl.classList.remove("is-visible");
    }
  }

  // Drive Lottie frame from timeline progress so it scrubs with us.
  if (clarityLottie && clarityLottie.totalFrames) {
    const progress = Math.max(0, Math.min(1, t / CLARITY_TOTAL));
    const frame = progress * (clarityLottie.totalFrames - 1);
    try {
      clarityLottie.goToAndStop(frame, true);
    } catch (e) {
      /* ignore */
    }
  }
}

function updatePlaybackUI(elapsed) {
  if (!playback.config) return;
  const fill = document.getElementById("playback-fill");
  const time = document.getElementById("playback-time");
  const total = playback.config.total;
  const pct = Math.min(elapsed / total, 1);
  if (fill) fill.style.width = `${pct * 100}%`;
  if (time) time.textContent = `${(elapsed / 1000).toFixed(1)}s / ${(total / 1000).toFixed(1)}s`;
}

function tick() {
  if (!playback.active || playback.paused || !playback.config) return;

  const elapsed = effectiveElapsed();
  playback.config.renderAt(elapsed);
  updatePlaybackUI(elapsed);

  if (elapsed >= playback.config.total) {
    playback.active = false;
    playback.rafId = null;
    if (typeof playback.config.onComplete === "function") {
      playback.config.onComplete();
    }
    return;
  }

  playback.rafId = requestAnimationFrame(tick);
}

function startPlayback(config) {
  playback.config = config;
  showPlaybackBar();

  playback.active = true;
  playback.paused = false;
  playback.startedAt = performance.now();
  playback.totalPaused = 0;

  setPlaybackPausedUI(false);
  config.renderAt(0);
  tick();
}

function pausePlayback() {
  if (!playback.active || playback.paused) return;
  playback.paused = true;
  playback.pausedAt = performance.now();
  if (playback.rafId) cancelAnimationFrame(playback.rafId);
  playback.rafId = null;
  setPlaybackPausedUI(true);
}

function resumePlayback() {
  if (!playback.active || !playback.paused) return;
  playback.totalPaused += performance.now() - playback.pausedAt;
  playback.paused = false;
  setPlaybackPausedUI(false);
  tick();
}

function restartPlayback() {
  if (!playback.config) return;
  if (!playback.active && playback.rafId === null) {
    // Animation finished; re-arm with the same config.
    startPlayback(playback.config);
    return;
  }
  playback.startedAt = performance.now();
  playback.totalPaused = 0;
  playback.paused = false;
  setPlaybackPausedUI(false);
  playback.config.renderAt(0);
  if (playback.rafId) cancelAnimationFrame(playback.rafId);
  playback.active = true;
  tick();
}

function scrubTo(targetMs) {
  if (!playback.config) return;
  const total = playback.config.total;
  const t = Math.max(0, Math.min(targetMs, total));
  playback.startedAt = performance.now() - t;
  playback.totalPaused = 0;
  playback.config.renderAt(t);
  updatePlaybackUI(t);
}

function setPlaybackPausedUI(paused) {
  const bar = document.getElementById("playback");
  if (bar) bar.classList.toggle("is-paused", paused);
}

function buildPlaybackMarks() {
  const marks = document.getElementById("playback-marks");
  if (!marks || !playback.config) return;
  // Rebuild whenever the active config changes (different exploration =
  // different keyframes). We tag the container so we don't redraw the
  // same set every frame.
  const id = playback.config.id || "default";
  if (marks.dataset.builtFor === id) return;
  marks.innerHTML = "";
  const schedule = playback.config.marks || [];
  const total = playback.config.total;
  schedule.forEach((t) => {
    const node = document.createElement("span");
    node.className = "playback-mark";
    node.style.left = `${(t / total) * 100}%`;
    marks.appendChild(node);
  });
  marks.dataset.builtFor = id;
}

function showPlaybackBar() {
  const bar = document.getElementById("playback");
  if (!bar) return;
  buildPlaybackMarks();
  bar.classList.add("is-visible");
  bar.removeAttribute("aria-hidden");
}

function hidePlaybackBar() {
  const bar = document.getElementById("playback");
  if (!bar) return;
  bar.classList.remove("is-visible", "is-paused");
  bar.setAttribute("aria-hidden", "true");
}

/* ---- Clarity playback config ------------------------------------- */
const CLARITY_PLAYBACK = {
  id: "clarity",
  total: CLARITY_TOTAL,
  marks: [
    CLARITY_KEYFRAMES.line1In,
    CLARITY_KEYFRAMES.line2In,
    CLARITY_KEYFRAMES.line3In,
    CLARITY_KEYFRAMES.line3Out,
    CLARITY_KEYFRAMES.resolve,
  ],
  renderAt: applyClarityStateAt,
  onComplete: null, // wired per-run below
};

async function runClarity() {
  initClarityLottie();
  setCaption("");
  return new Promise((resolve) => {
    CLARITY_PLAYBACK.onComplete = () => {
      hidePlaybackBar();
      resolve();
    };
    startPlayback(CLARITY_PLAYBACK);
  });
}

/* ----------------------------------------------------------- */
/* 03 — GESTURE                                                 */
/* ----------------------------------------------------------- */

// WebGL grainient backdrop. Lazy-mounted on first gesture run since
// it requires the Grainient module (loaded as ES module separately).
let gestureGrainient = null;

function ensureGestureGrainient() {
  if (gestureGrainient) return gestureGrainient;
  if (!window.Grainient) return null;
  const container = document.getElementById("exp-gesture-bg");
  if (!container) return null;
  // Tuned in React Bits Background Studio — keep these in sync with the
  // referenced preset if it gets re-tuned.
  gestureGrainient = new window.Grainient(container, {
    color1: "#066AFE",
    color2: "#E5B9FE",
    color3: "#066AFE",
    // Per Ryan's feedback: gradient should drift slowly so the type does
    // the heavy lifting of "exposing what we're building". Was 1.75.
    timeSpeed: 0.35,
    colorBalance: -0.05,
    warpStrength: 1,
    warpFrequency: 4,
    // Slowed warp to match the calmer overall tempo.
    warpSpeed: 0.8,
    warpAmplitude: 50,
    blendAngle: 0,
    blendSoftness: 0.05,
    rotationAmount: 500,
    noiseScale: 0.8,
    grainAmount: 0,
    grainScale: 0.2,
    grainAnimated: false,
    contrast: 1.1,
    gamma: 1.1,
    saturation: 1,
    centerX: 0,
    centerY: 0,
    zoom: 0.9,
  });
  return gestureGrainient;
}

function startGestureGrainient() {
  const g = ensureGestureGrainient();
  const container = document.getElementById("exp-gesture-bg");
  if (g) g.start();
  if (container) container.classList.add("is-active");
}

function stopGestureGrainient() {
  if (gestureGrainient) gestureGrainient.stop();
  const container = document.getElementById("exp-gesture-bg");
  if (container) container.classList.remove("is-active");
}

// Gesture is the opening moment of agent creation. The gradient drifts
// slowly while a sequence of build-y process lines cycle through —
// type does the work of exposing what's being assembled (per Ryan's
// "leverage mostly type to expose what we are building" note).
//
// The whole sequence is timeline-driven (see GESTURE_PLAYBACK below) so
// the same playback bar that controls Clarity also pauses/scrubs
// Gesture word-by-word.
const GESTURE_LINES = [
  "Composing the experience",
  "Wiring your channels",
  "Tuning the tone of voice",
  "Indexing your knowledge",
  "Almost ready",
];

const GESTURE_INTRO = 600;     // gradient settle before first word
const GESTURE_STAGGER = 220;   // ms between word reveals (a touch faster so each line lands)
const GESTURE_HOLD = 900;      // ms the fully composed line is held before fade
const GESTURE_EXIT = 500;      // ms for words to fade out
const GESTURE_BREATH = 180;    // ms gap between lines
const GESTURE_OUTRO = 600;     // ms after last line before handoff

// Build a per-line schedule once. Each entry knows when each of its
// words appears, when it starts fading, and when it's fully gone.
function buildGestureSchedule() {
  let cursor = GESTURE_INTRO;
  return GESTURE_LINES.map((text) => {
    const words = text.split(/\s+/);
    const lineIn = cursor;
    const wordTimes = words.map((_, i) => lineIn + i * GESTURE_STAGGER);
    const lastWordIn = wordTimes[wordTimes.length - 1];
    const holdEnd = lastWordIn + GESTURE_HOLD; // begin fade-out
    const lineExit = holdEnd + GESTURE_EXIT;   // fully gone
    cursor = lineExit + GESTURE_BREATH;
    return { text, words, lineIn, wordTimes, holdEnd, lineExit };
  });
}

const GESTURE_SCHEDULE = buildGestureSchedule();
const GESTURE_TOTAL =
  GESTURE_SCHEDULE[GESTURE_SCHEDULE.length - 1].lineExit + GESTURE_OUTRO;

function clearGestureTitle() {
  const title = document.getElementById("exp-gesture-title");
  if (title) {
    title.innerHTML = "";
    title.dataset.line = "";
  }
}

// Paint the gesture title for time t. This is what gives us scrubbing:
// the function is purely deterministic on t, so dragging the timeline
// always produces the right visual state.
function applyGestureStateAt(t) {
  const title = document.getElementById("exp-gesture-title");
  if (!title) return;

  // Find the line whose window contains t. Outside any window → blank.
  let active = null;
  let revealed = false;
  for (const line of GESTURE_SCHEDULE) {
    if (t >= line.lineIn && t < line.lineExit) {
      active = line;
      // Inside the line: revealing during [lineIn, holdEnd], fading out
      // during [holdEnd, lineExit].
      revealed = t < line.holdEnd;
      break;
    }
  }

  // Sync the DOM content to the active line. Only rebuild when the line
  // actually changes — otherwise we'd thrash spans on every frame.
  const currentText = title.dataset.line || "";
  if (active) {
    if (currentText !== active.text) {
      title.innerHTML = "";
      active.words.forEach((w) => {
        const span = document.createElement("span");
        span.className = "exp-gesture-word";
        span.textContent = w;
        title.appendChild(span);
      });
      title.dataset.line = active.text;
    }
    const spans = title.querySelectorAll(".exp-gesture-word");
    active.wordTimes.forEach((wt, i) => {
      const shouldReveal = revealed && t >= wt;
      if (spans[i]) spans[i].classList.toggle("is-revealed", shouldReveal);
    });
  } else if (currentText) {
    title.innerHTML = "";
    title.dataset.line = "";
  }
}

const GESTURE_PLAYBACK = {
  id: "gesture",
  total: GESTURE_TOTAL,
  // Mark each line's entry on the scrubber so the user can jump to a
  // specific phrase to comment on it.
  marks: GESTURE_SCHEDULE.map((l) => l.lineIn),
  renderAt: applyGestureStateAt,
  onComplete: null,
};

async function runGesture() {
  const expEl = document.querySelector(".exp-gesture");
  if (!expEl) return;

  startGestureGrainient();
  setCaption("");

  return new Promise((resolve) => {
    GESTURE_PLAYBACK.onComplete = () => {
      hidePlaybackBar();
      stopGestureGrainient();
      clearGestureTitle();
      resolve();
    };
    startPlayback(GESTURE_PLAYBACK);
  });
}

/* ----------------------------------------------------------- */
/* 05 — PROCESS STEPS                                            */
/* Three text rows played in sequence (Cursor-style "thinking    */
/* log"). Each step cycles enter → working (shimmer) → settle    */
/* (sparkle→check pop) → exit, with a small dead-air gap between */
/* steps so each sentence fully clears before the next arrives — */
/* avoids the two rows visually colliding (they share the same   */
/* absolute slot).                                               */
/*                                                               */
/* Everything visible is a pure function of `t` (ms). Scrubbing  */
/* forward and backward across step boundaries is exact, because */
/* every row's state is computed solely from                     */
/* dt = t − stepStart with no retained state between frames.     */
/* ----------------------------------------------------------- */
const PROCESS_STEPS_LINE_COUNT = 3;

// Per-phase durations (ms). Tuned for a deliberate, readable
// cadence at the 30px type size — the working phase needs enough
// time to actually read the line.
const PROCESS_STEPS_ENTER = 220;
const PROCESS_STEPS_WORKING = 1800;
const PROCESS_STEPS_SETTLE = 280;
const PROCESS_STEPS_EXIT = 220;

// Step 1 (data-step="0") gets a more substantial entrance —
// matches the deliberate pace of the hero exit that precedes it.
// Step 2 and 3 keep the existing snappy 220ms enter so they don't
// feel like full hero entrances every time.
const PROCESS_STEPS_STEP1_ENTER    = 340; // was 220
const PROCESS_STEPS_STEP1_ENTER_TY = 80;  // ~10% of viewport — matches Ryan's spec for the post-hero text entrance

// Helpers that return per-step enter values without growing the
// rest of this module.
function processStepsEnterDur(i) {
  return i === 0 ? PROCESS_STEPS_STEP1_ENTER : PROCESS_STEPS_ENTER;
}
function processStepsEnterTy(i) {
  return i === 0 ? PROCESS_STEPS_STEP1_ENTER_TY : PROCESS_STEPS_ENTER_TY;
}
function processStepsStepDur(i) {
  return (
    processStepsEnterDur(i) +
    PROCESS_STEPS_WORKING +
    PROCESS_STEPS_SETTLE +
    PROCESS_STEPS_EXIT
  );
}

// Cross-step gap. After one step's `exit` ends, wait this many ms
// of dead air before the next step's `enter` begins. Gives the eye
// a clear "the previous sentence is done" beat and avoids the two
// rows visually colliding (they share the same absolute slot).
const PROCESS_STEPS_GAP = 180;

// Tail buffer after the last step's exit ends, before the timeline
// closes and Details takes over — keeps the handoff from feeling
// cut off.
const PROCESS_STEPS_TAIL = 200;

// Translate distances (px) for the (default) row's enter/exit
// slide. Step 1 overrides the enter Ty via the helper above.
const PROCESS_STEPS_ENTER_TY = 14;
const PROCESS_STEPS_EXIT_TY = 14;

// Subtle scale companions to the slide. Barely perceptible in
// isolation; you only feel them in aggregate.
const PROCESS_STEPS_ENTER_SCALE_FROM = 0.985;
const PROCESS_STEPS_EXIT_SCALE_TO   = 1.005;

// Start time (ms, relative to t=0) of each row. Step 2 begins at
// Step 1's FULL duration + GAP (so Step 1's longer enter doesn't
// crowd Step 2). Step 3 follows Step 2 at the standard cadence.
//   step 0: 0
//   step 1: (340 + 1800 + 280 + 220) + 180 = 2820
//   step 2: 2820 + (220 + 1800 + 280 + 220) + 180 = 5520
const PROCESS_STEPS_STARTS = (() => {
  const out = [0];
  for (let i = 1; i < PROCESS_STEPS_LINE_COUNT; i++) {
    out.push(out[i - 1] + processStepsStepDur(i - 1) + PROCESS_STEPS_GAP);
  }
  return out;
})();

// Total timeline duration: last step's start + its full duration + tail.
// 5520 + 2520 + 200 = 8240ms.
const PROCESS_STEPS_TOTAL =
  PROCESS_STEPS_STARTS[PROCESS_STEPS_LINE_COUNT - 1] +
  processStepsStepDur(PROCESS_STEPS_LINE_COUNT - 1) +
  PROCESS_STEPS_TAIL;

// Playback bar tick marks live at the instant each row begins entering.
const PROCESS_STEPS_STEP_STARTS = [...PROCESS_STEPS_STARTS];

// Cubic-bezier evaluator (Newton-Raphson, same approach as CSS).
// Returns a function that maps x ∈ [0,1] → y for the curve through
// (0,0), (p1x,p1y), (p2x,p2y), (1,1). Cached per call site.
function _psCubicBezier(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const sampleX  = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY  = (t) => ((ay * t + by) * t + cy) * t;
  const sampleDX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const cur = sampleX(t) - x;
      if (Math.abs(cur) < 1e-5) break;
      const dx = sampleDX(t);
      if (Math.abs(dx) < 1e-6) break;
      t -= cur / dx;
    }
    return sampleY(t);
  };
}
// Refined easings per the polish brief. Keep these as module-level
// singletons so we don't reallocate on every frame.
const _psEaseEnter      = _psCubicBezier(0.32, 0.72, 0,    1);    // iOS-like spring settle
const _psEaseExit       = _psCubicBezier(0.6,  0,    0.78, 0);    // smooth pull-out
const _psEasePopUp      = _psCubicBezier(0.34, 1.56, 0.64, 1);    // overshoot
const _psEasePopBack    = _psCubicBezier(0.4,  0,    0.6,  1);    // smooth come-back
const _psEaseInOutCubic = _psCubicBezier(0.4,  0,    0.6,  1);    // shared smooth fade

function _psClamp01(p) {
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

function applyProcessStepsStateAt(t) {
  const overlay = document.getElementById("exp-process-steps-overlay");
  if (!overlay) return;
  const rows = overlay.querySelectorAll(".exp-process-row");
  if (!rows.length) return;

  rows.forEach((row, i) => {
    const dt = t - PROCESS_STEPS_STARTS[i];

    // Per-step enter overrides. Step 1 (i === 0) slides up further
    // and takes longer; Steps 2–3 keep the original snappy enter.
    const enterDur = processStepsEnterDur(i);
    const enterTy  = processStepsEnterTy(i);

    // Defaults: row hidden, primed below its resting position with a
    // hair of scale-down so the enter animation slides up + grows in.
    let opacity = 0;
    let ty = enterTy;
    let scale = PROCESS_STEPS_ENTER_SCALE_FROM;
    let phase = "idle";
    let shimmer = false;
    let sparkleOpacity = 1;
    let sparkleScale = 1;
    let checkOpacity = 0;
    let checkScale = 1;

    if (dt < 0) {
      // Step hasn't started yet — keep defaults.
    } else if (dt < enterDur) {
      // Enter: opacity 0 → 1, ty +enterTy → 0, scale 0.985 → 1.0.
      const p = _psEaseEnter(dt / enterDur);
      opacity = p;
      ty = enterTy * (1 - p);
      scale = PROCESS_STEPS_ENTER_SCALE_FROM
        + (1 - PROCESS_STEPS_ENTER_SCALE_FROM) * p;
      phase = "enter";
    } else {
      const dt2 = dt - enterDur;
      if (dt2 < PROCESS_STEPS_WORKING) {
        // Working: full opacity, shimmer on, sparkle pulsing gently.
        // Softer ±3% scale at ~0.6 of a full cycle across the phase
        // (1.2 × π) so the pulse doesn't quite complete — reads
        // "ongoing thought", not "looping animation".
        opacity = 1;
        ty = 0;
        scale = 1;
        phase = "working";
        shimmer = true;
        const wp = dt2 / PROCESS_STEPS_WORKING;
        sparkleScale = 1 + 0.03 * Math.sin(wp * Math.PI * 1.2);
        sparkleOpacity = 1;
      } else if (dt2 < PROCESS_STEPS_WORKING + PROCESS_STEPS_SETTLE) {
        // Settle: sparkle fades out (0–70% of settle), check fades
        // in (30–100% of settle); they overlap in the 30–70% middle
        // but neither is at 0% nor 100% opacity simultaneously.
        // Check scale-pop 1.0 → 1.08 → 1.0 with overshoot up and
        // smooth come-back.
        opacity = 1;
        ty = 0;
        scale = 1;
        phase = "settle";
        const sp = (dt2 - PROCESS_STEPS_WORKING) / PROCESS_STEPS_SETTLE;

        // Sparkle fade-out: 0 → 0.70 of settle.
        if (sp < 0.70) {
          const k = sp / 0.70;
          sparkleOpacity = 1 - _psEaseInOutCubic(k);
          sparkleScale   = 1 - 0.30 * k;
        } else {
          sparkleOpacity = 0;
          sparkleScale   = 0.7;
        }

        // Check fade-in: 0.30 → 1.0 of settle.
        if (sp < 0.30) {
          checkOpacity = 0;
        } else {
          const k = (sp - 0.30) / 0.70;
          checkOpacity = _psEaseInOutCubic(k);
        }

        // Check scale-pop on the full settle window: 1.0 → 1.08 → 1.0.
        if (sp < 0.5) {
          const k = sp / 0.5;
          checkScale = 1.0 + 0.08 * _psEasePopUp(k);
        } else {
          const k = (sp - 0.5) / 0.5;
          checkScale = 1.08 - 0.08 * _psEasePopBack(k);
        }
      } else if (
        dt2 <
        PROCESS_STEPS_WORKING + PROCESS_STEPS_SETTLE + PROCESS_STEPS_EXIT
      ) {
        // Exit: opacity 1 → 0, ty 0 → −14, scale 1.0 → 1.005 (slight
        // lift-off feel). Check fades with the row.
        const ep =
          (dt2 - PROCESS_STEPS_WORKING - PROCESS_STEPS_SETTLE) /
          PROCESS_STEPS_EXIT;
        const eo = _psEaseExit(ep);
        opacity = 1 - eo;
        ty = -PROCESS_STEPS_EXIT_TY * eo;
        scale = 1 + (PROCESS_STEPS_EXIT_SCALE_TO - 1) * eo;
        phase = "exit";
        sparkleOpacity = 0;
        sparkleScale = 0.7;
        checkOpacity = 1 - eo;
        checkScale = 1;
      } else {
        // Past the row's full lifecycle.
        opacity = 0;
        ty = -PROCESS_STEPS_EXIT_TY;
        scale = PROCESS_STEPS_EXIT_SCALE_TO;
        phase = "done";
        sparkleOpacity = 0;
        checkOpacity = 0;
        checkScale = 1;
      }
    }

    row.style.opacity = String(opacity);
    row.style.transform = `translateY(${ty}px) scale(${scale})`;
    row.dataset.phase = phase;
    row.classList.toggle("is-shimmer", shimmer);

    const sparkle = row.querySelector(".exp-process-sparkle");
    if (sparkle) {
      sparkle.style.opacity = String(_psClamp01(sparkleOpacity));
      sparkle.style.transform = `scale(${sparkleScale})`;
    }
    const check = row.querySelector(".exp-process-check");
    if (check) {
      check.style.opacity = String(_psClamp01(checkOpacity));
      check.style.transform = `scale(${checkScale})`;
    }
  });
}

function resetProcessStepsLines() {
  const overlay = document.getElementById("exp-process-steps-overlay");
  if (!overlay) return;
  overlay.querySelectorAll(".exp-process-row").forEach((el) => {
    el.classList.remove("is-shimmer");
    el.style.opacity = "";
    el.style.transform = "";
    el.dataset.phase = "idle";
    el.querySelectorAll(
      ".exp-process-sparkle, .exp-process-check"
    ).forEach((g) => {
      g.style.opacity = "";
      g.style.transform = "";
    });
  });
}

const PROCESS_STEPS_PLAYBACK = {
  id: "process-steps",
  total: PROCESS_STEPS_TOTAL,
  // One mark per row's enter beat — gives the scrub bar 3 useful stops.
  marks: [...PROCESS_STEPS_STEP_STARTS],
  renderAt: applyProcessStepsStateAt,
  onComplete: null,
};

async function runProcessSteps() {
  const expEl = document.querySelector(".exp-process-steps");
  if (!expEl) return;

  setCaption("");
  // Make sure we begin at frame 0 — guards against re-runs leaving
  // stale inline styles or .is-shimmer on the rows.
  resetProcessStepsLines();

  return new Promise((resolve) => {
    PROCESS_STEPS_PLAYBACK.onComplete = () => {
      hidePlaybackBar();
      resolve();
    };
    startPlayback(PROCESS_STEPS_PLAYBACK);
  });
}

/* ----------------------------------------------------------- */
/* Sequence dispatcher                                          */
/* ----------------------------------------------------------- */
const RUNNERS = {
  sparkle: runSparkle,
  clarity: runClarity,
  gesture: runGesture,
  "astro-sparkle": runAstroSparkle,
  "process-steps": runProcessSteps,
};

async function runCreationSequence() {
  if (!$creatingView) return;
  $creatingView.dataset.exp = activeExp;

  const run = RUNNERS[activeExp];
  if (!run) return;

  try {
    await run();
  } catch (e) {
    console.error("[exploration error]", e);
  }

  switchView("details");
  isRunning = false;
}

/* ----------------------------------------------------------- */
/* Toolbar wiring                                               */
/* ----------------------------------------------------------- */
$pills.forEach((pill) => {
  pill.addEventListener("click", () => {
    const exp = pill.dataset.exp;
    if (!exp) return;
    activeExp = exp;
    $pills.forEach((p) => {
      const isActive = p === pill;
      p.classList.toggle("is-active", isActive);
      p.setAttribute("aria-checked", isActive ? "true" : "false");
    });
    if ($creatingView) $creatingView.dataset.exp = activeExp;
  });
});

// Put the landing hero back to its rest state (no .is-leaving class,
// CTA enabled). Used by the reset handler and called anywhere we
// re-enter the landing view.
function resetHero() {
  const heroEl = document.querySelector(".view-landing .hero");
  if (heroEl) heroEl.classList.remove("is-leaving");
  if ($btnGetStarted) $btnGetStarted.disabled = false;
}

if ($reset) {
  $reset.addEventListener("click", () => {
    // Stop any running playback first.
    playback.active = false;
    playback.paused = false;
    if (playback.rafId) cancelAnimationFrame(playback.rafId);
    playback.rafId = null;
    hidePlaybackBar();

    stopGestureGrainient();
    clearGestureTitle();
    resetExplorationStates();
    clearStagePosition();
    resetHero();
    if (clarityLottie) {
      try {
        clarityLottie.goToAndStop(0, true);
      } catch (e) {
        /* ignore */
      }
    }
    if ($caption) $caption.textContent = "";
    switchView("landing");
    isRunning = false;
  });
}

/* ----------------------------------------------------------- */
/* Playback control wiring                                      */
/* ----------------------------------------------------------- */
const $playbackPlay = document.getElementById("playback-play");
const $playbackRestart = document.getElementById("playback-restart");
const $playbackTrack = document.getElementById("playback-track");

if ($playbackPlay) {
  $playbackPlay.addEventListener("click", () => {
    if (!playback.active && playback.rafId === null) {
      // Animation already finished — restart on play.
      restartPlayback();
      return;
    }
    if (playback.paused) {
      resumePlayback();
    } else {
      pausePlayback();
    }
  });
}

if ($playbackRestart) {
  $playbackRestart.addEventListener("click", () => {
    restartPlayback();
  });
}

if ($playbackTrack) {
  // Click anywhere on the track to scrub to that time.
  $playbackTrack.addEventListener("click", (e) => {
    if (!playback.config) return;
    const rect = $playbackTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = ratio * playback.config.total;
    // If we're scrubbing while paused, stay paused; otherwise keep playing.
    const wasPaused = playback.paused;
    scrubTo(target);
    if (wasPaused || !playback.active) {
      // Render the moment but don't auto-resume.
      pausePlayback();
    } else {
      // Continue playing from new position.
      tick();
    }
  });

  // Drag scrubbing for finer control.
  let dragging = false;
  $playbackTrack.addEventListener("pointerdown", (e) => {
    dragging = true;
    pausePlayback();
    $playbackTrack.setPointerCapture(e.pointerId);
  });
  $playbackTrack.addEventListener("pointermove", (e) => {
    if (!dragging || !playback.config) return;
    const rect = $playbackTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    scrubTo(ratio * playback.config.total);
  });
  $playbackTrack.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    try {
      $playbackTrack.releasePointerCapture(e.pointerId);
    } catch (err) {
      /* ignore */
    }
  });
}

/* ----------------------------------------------------------- */
/* Get Started → run the active exploration                     */
/* ----------------------------------------------------------- */
// Hero exit timing. Kept in sync with .hero / .hero.is-leaving in
// styles.css (480ms). We wait a hair longer than the CSS transition
// so the rise + fade fully completes before the view swaps.
const HERO_EXIT_WAIT = 500;

if ($btnGetStarted) {
  $btnGetStarted.addEventListener("click", async () => {
    if (isRunning) return;
    isRunning = true;

    // Take focus off the button BEFORE we set aria-hidden on the landing —
    // avoids the "focused descendant inside aria-hidden" warning.
    $btnGetStarted.blur();
    $btnGetStarted.disabled = true;

    // Reset previous-run state, but DO NOT clear the stage position.
    resetExplorationStates();

    // Snapshot the preview card position while landing is still visible.
    positionStageOverPreviewCard();

    // Hero exit — preview card + title + subtitle + CTA lift up 10%
    // and fade to 0 before the view switches. .hero.is-leaving also
    // disables pointer events on the section so a second click can't
    // sneak through during the animation.
    const heroEl = document.querySelector(".view-landing .hero");
    if (heroEl) heroEl.classList.add("is-leaving");

    await wait(HERO_EXIT_WAIT);

    // Now the view swap. We call runCreationSequence on the next tick
    // (no extra delay) so Step 1's enhanced 340ms entrance overlaps
    // with the view's fade-in — feels like one continuous motion.
    switchView("creating");
    setTimeout(runCreationSequence, 0);
  });
}

/* ----------------------------------------------------------- */
/* Replay reveals on the details view                           */
/* ----------------------------------------------------------- */
if (VIEWS.details) {
  const detailsObserver = new MutationObserver(() => {
    if (!VIEWS.details.classList.contains("is-active")) return;
    VIEWS.details.querySelectorAll(".reveal").forEach((el) => {
      try {
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "";
      } catch (e) {
        /* ignore */
      }
    });
  });
  detailsObserver.observe(VIEWS.details, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

/* ----------------------------------------------------------- */
/* Helpers                                                       */
/* ----------------------------------------------------------- */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function typeText(el, text, perChar) {
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    const jitter = Math.random() * 24 - 12;
    await wait(Math.max(20, perChar + jitter));
  }
}
