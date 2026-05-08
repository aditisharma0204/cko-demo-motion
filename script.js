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
  // the per-row data-phase so a re-run starts blank. Also clears the
  // finale row's sparkle wrappers (primary + 2 companions).
  const processOverlay = document.getElementById("exp-process-steps-overlay");
  if (processOverlay) {
    processOverlay.querySelectorAll(".exp-process-row").forEach((el) => {
      el.classList.remove("is-shimmer");
      el.style.opacity = "";
      el.style.transform = "";
      el.dataset.phase = "idle";
      el.querySelectorAll(
        ".exp-process-sparkle, .exp-process-check, .exp-process-finale-spark"
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
/* One row at a time, Cursor-style "thinking log". Each non-     */
/* final step cycles enter → working (shimmer) → settle          */
/* (sparkle→check pop) → exit. The next row replaces it in the   */
/* same slot. The final row is wordless: a small SF-sparkle      */
/* "finale" — a primary sparkle does an overshoot entrance and   */
/* gentle twinkle, with two companion sparkles that stagger in.  */
/*                                                               */
/* Everything visible is a pure function of `t` (ms). Scrubbing  */
/* forward and backward across step boundaries is exact.         */
/* ----------------------------------------------------------- */
const PROCESS_STEPS_LINE_COUNT = 3;

// Per-phase durations (ms) for non-final rows. Tuned for a
// deliberate, readable cadence at the 25px type size — each
// working phase needs enough time to actually read the line.
const PROCESS_STEPS_ENTER = 220;
const PROCESS_STEPS_WORKING = 1800;
const PROCESS_STEPS_SETTLE = 280;
const PROCESS_STEPS_EXIT = 220;

// Final row "sparkle finale" budget — kept ~equal to the prior
// final-row duration (1420ms) so the total run length is stable.
const PROCESS_STEPS_FINALE_ENTER = 280; // primary scale 0→1.06→1.0 + fade in
const PROCESS_STEPS_FINALE_HOLD  = 960; // twinkle/rotation drift
const PROCESS_STEPS_FINALE_EXIT  = 180; // soft fade-out before handoff

const PROCESS_STEPS_NONFINAL_DUR =
  PROCESS_STEPS_ENTER +
  PROCESS_STEPS_WORKING +
  PROCESS_STEPS_SETTLE +
  PROCESS_STEPS_EXIT; // 2520ms
const PROCESS_STEPS_FINAL_DUR =
  PROCESS_STEPS_FINALE_ENTER +
  PROCESS_STEPS_FINALE_HOLD +
  PROCESS_STEPS_FINALE_EXIT; // 1420ms

// Companion sparkle stagger — each gets its own short fade-up.
const PROCESS_STEPS_FINALE_C1_START = 180;
const PROCESS_STEPS_FINALE_C2_START = 340;
const PROCESS_STEPS_FINALE_COMPANION_ENTER = 220;

// Translate distances (px) for the row's enter/exit slide. Sized to feel
// proportional to the larger 36px line-height row.
const PROCESS_STEPS_ENTER_TY = 12;
const PROCESS_STEPS_EXIT_TY = 12;

// Start time (ms, relative to t=0) of each row. Rows 0..1 are
// non-final and take PROCESS_STEPS_NONFINAL_DUR; row 2 is final.
const PROCESS_STEPS_STARTS = (() => {
  const out = [];
  let s = 0;
  for (let i = 0; i < PROCESS_STEPS_LINE_COUNT; i++) {
    out.push(s);
    s +=
      i < PROCESS_STEPS_LINE_COUNT - 1
        ? PROCESS_STEPS_NONFINAL_DUR
        : PROCESS_STEPS_FINAL_DUR;
  }
  return out;
})();

// Total timeline duration: 2 × 2520 + 1420 = 6460ms.
const PROCESS_STEPS_TOTAL =
  PROCESS_STEPS_STARTS[PROCESS_STEPS_LINE_COUNT - 1] +
  PROCESS_STEPS_FINAL_DUR;

// Playback bar tick marks live at the instant each row begins entering.
const PROCESS_STEPS_STEP_STARTS = [...PROCESS_STEPS_STARTS];

function _psEaseOutCubic(p) {
  return 1 - Math.pow(1 - p, 3);
}
function _psClamp01(p) {
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

// Sparkle finale render — pure function of dt (ms relative to the
// final row's start). Sets opacity/transform on the primary sparkle
// and both companions; their decorative twinkle (an infinite CSS
// animation on the inner <img>) composes with this entrance lifecycle
// so the wrapper opacity going to 0 reliably hides them. Forward and
// backward scrub both work because we never rely on retained state.
function _psApplyFinaleRow(row, dt) {
  // Row container — always opacity 1 once the step is in range; the
  // child sparkle wrappers carry the visibility lifecycle. Before the
  // step starts (or after it ends), force the row hidden so the
  // companions' CSS infinite pulse can't bleed through.
  let phase = "idle";
  let primaryOpacity = 0;
  let primaryScale = 0.4;
  let primaryRot = 0;

  if (dt < 0) {
    phase = "idle";
  } else if (dt < PROCESS_STEPS_FINALE_ENTER) {
    // Enter: scale 0 → 1.06 (overshoot at p=0.7) → 1.0 settle, fade in.
    phase = "enter";
    const p = dt / PROCESS_STEPS_FINALE_ENTER;
    primaryOpacity = _psEaseOutCubic(p);
    if (p < 0.7) {
      primaryScale = 1.06 * _psEaseOutCubic(p / 0.7);
    } else {
      primaryScale = 1.06 - 0.06 * ((p - 0.7) / 0.3);
    }
  } else if (dt < PROCESS_STEPS_FINALE_ENTER + PROCESS_STEPS_FINALE_HOLD) {
    // Hold/twinkle: subtle scale pulse + ±3deg rotation drift.
    phase = "finale";
    primaryOpacity = 1;
    const dh = dt - PROCESS_STEPS_FINALE_ENTER;
    const dhp = dh / PROCESS_STEPS_FINALE_HOLD;
    primaryScale = 1 + Math.sin(dhp * Math.PI * 2 * 1.5) * 0.02;
    primaryRot   = Math.sin(dhp * Math.PI * 2 * 1.0) * 3;
  } else {
    // Exit: short fade-out before Details takes over.
    phase = "exit";
    const ep =
      (dt - PROCESS_STEPS_FINALE_ENTER - PROCESS_STEPS_FINALE_HOLD) /
      PROCESS_STEPS_FINALE_EXIT;
    const e = _psClamp01(ep);
    primaryOpacity = 1 - _psEaseOutCubic(e);
    primaryScale = 1 - 0.04 * e;
  }

  // Companion entrance lifecycles (staggered, share the primary's exit).
  const companionEntry = (start, dur) => {
    if (dt < start) return { o: 0, s: 0.4 };
    const p = _psClamp01((dt - start) / dur);
    const eased = _psEaseOutCubic(p);
    return { o: eased, s: 0.4 + 0.6 * eased };
  };
  const c1 = companionEntry(
    PROCESS_STEPS_FINALE_C1_START,
    PROCESS_STEPS_FINALE_COMPANION_ENTER
  );
  const c2 = companionEntry(
    PROCESS_STEPS_FINALE_C2_START,
    PROCESS_STEPS_FINALE_COMPANION_ENTER
  );

  // Apply the same exit fade to companions so the moment ends together.
  if (phase === "exit") {
    const ep =
      (dt - PROCESS_STEPS_FINALE_ENTER - PROCESS_STEPS_FINALE_HOLD) /
      PROCESS_STEPS_FINALE_EXIT;
    const fade = 1 - _psEaseOutCubic(_psClamp01(ep));
    c1.o *= fade;
    c2.o *= fade;
  }

  // Row defaults — clear text-row-era styles in case of any leakage.
  row.style.transform = "translateY(0px)";
  row.style.opacity = dt < 0 ? "0" : "1";
  row.dataset.phase = phase;
  row.classList.remove("is-shimmer");

  const primary = row.querySelector(".exp-process-finale-spark--primary");
  if (primary) {
    primary.style.opacity = String(_psClamp01(primaryOpacity));
    primary.style.transform = `scale(${primaryScale}) rotate(${primaryRot}deg)`;
  }
  const c1El = row.querySelector(".exp-process-finale-spark--c1");
  if (c1El) {
    c1El.style.opacity = String(_psClamp01(c1.o));
    c1El.style.transform = `scale(${c1.s})`;
  }
  const c2El = row.querySelector(".exp-process-finale-spark--c2");
  if (c2El) {
    c2El.style.opacity = String(_psClamp01(c2.o));
    c2El.style.transform = `scale(${c2.s})`;
  }
}

function applyProcessStepsStateAt(t) {
  const overlay = document.getElementById("exp-process-steps-overlay");
  if (!overlay) return;
  const rows = overlay.querySelectorAll(".exp-process-row");
  if (!rows.length) return;

  rows.forEach((row, i) => {
    const isFinal = i === PROCESS_STEPS_LINE_COUNT - 1;
    const dt = t - PROCESS_STEPS_STARTS[i];

    if (isFinal) {
      // Final row has its own (very different) lifecycle — no slide,
      // no shimmer, no check; just a centered SF-sparkle finale.
      _psApplyFinaleRow(row, dt);
      return;
    }

    // Defaults: row hidden, primed below its resting position so the
    // enter animation appears to slide up from below.
    let opacity = 0;
    let ty = PROCESS_STEPS_ENTER_TY;
    let phase = "idle";
    let shimmer = false;
    let sparkleOpacity = 1;
    let sparkleScale = 1;
    let checkOpacity = 0;
    let checkScale = 0.6;

    if (dt < 0) {
      // Step hasn't started yet — keep defaults.
    } else if (dt < PROCESS_STEPS_ENTER) {
      // Enter: fade in + slide from +PROCESS_STEPS_ENTER_TY to 0.
      const p = _psEaseOutCubic(dt / PROCESS_STEPS_ENTER);
      opacity = p;
      ty = PROCESS_STEPS_ENTER_TY * (1 - p);
      phase = "enter";
    } else {
      const dt2 = dt - PROCESS_STEPS_ENTER;
      if (dt2 < PROCESS_STEPS_WORKING) {
        // Working: full opacity, shimmer on, sparkle pulsing gently.
        opacity = 1;
        ty = 0;
        phase = "working";
        shimmer = true;
        // Subtle pulse: ±4% scale, ≤10% opacity travel, ~1.4 cycles
        // across the working phase. Drives off `t`, no real-time deps.
        const wave = Math.sin(
          (dt2 / PROCESS_STEPS_WORKING) * Math.PI * 2 * 1.4
        );
        sparkleScale = 1 + wave * 0.04;
        sparkleOpacity = 1 - Math.abs(wave) * 0.1;
      } else if (dt2 < PROCESS_STEPS_WORKING + PROCESS_STEPS_SETTLE) {
        // Settle: sparkle fades out while check pops in (1.0 → 1.08 → 1.0).
        opacity = 1;
        ty = 0;
        phase = "settle";
        const sp = (dt2 - PROCESS_STEPS_WORKING) / PROCESS_STEPS_SETTLE;
        if (sp < 0.4) {
          // 0–40%: cross-fade sparkle → check, check ramps toward 1.10.
          const k = sp / 0.4;
          sparkleOpacity = 1 - k;
          sparkleScale = 1 - 0.3 * k;
          checkOpacity = k;
          checkScale = 0.6 + 0.5 * k; // 0.6 → 1.10
        } else if (sp < 0.7) {
          // 40–70%: check at peak (1.10 → 1.08), sparkle fully gone.
          sparkleOpacity = 0;
          sparkleScale = 0.7;
          checkOpacity = 1;
          checkScale = 1.1 - 0.02 * ((sp - 0.4) / 0.3);
        } else {
          // 70–100%: check settles to 1.0.
          sparkleOpacity = 0;
          sparkleScale = 0.7;
          checkOpacity = 1;
          checkScale = 1.08 - 0.08 * ((sp - 0.7) / 0.3);
        }
      } else if (
        dt2 <
        PROCESS_STEPS_WORKING + PROCESS_STEPS_SETTLE + PROCESS_STEPS_EXIT
      ) {
        // Exit: fade out + slide further up by PROCESS_STEPS_EXIT_TY.
        // Check fades with the row.
        const ep =
          (dt2 - PROCESS_STEPS_WORKING - PROCESS_STEPS_SETTLE) /
          PROCESS_STEPS_EXIT;
        const eo = _psEaseOutCubic(ep);
        opacity = 1 - eo;
        ty = -PROCESS_STEPS_EXIT_TY * eo;
        phase = "exit";
        sparkleOpacity = 0;
        sparkleScale = 0.7;
        checkOpacity = 1 - eo;
        checkScale = 1;
      } else {
        // Past the row's full lifecycle.
        opacity = 0;
        ty = -PROCESS_STEPS_EXIT_TY;
        phase = "done";
        sparkleOpacity = 0;
        checkOpacity = 0;
      }
    }

    row.style.opacity = String(opacity);
    row.style.transform = `translateY(${ty}px)`;
    row.dataset.phase = phase;
    row.classList.toggle("is-shimmer", shimmer);

    const sparkle = row.querySelector(".exp-process-sparkle");
    if (sparkle) {
      sparkle.style.opacity = String(_psClamp01(sparkleOpacity));
      sparkle.style.transform = `scale(${sparkleScale})`;
    }
    // Final row has no check element; guard the lookup.
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
      ".exp-process-sparkle, .exp-process-check, .exp-process-finale-spark"
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
if ($btnGetStarted) {
  $btnGetStarted.addEventListener("click", () => {
    if (isRunning) return;
    isRunning = true;

    // Take focus off the button BEFORE we set aria-hidden on the landing —
    // avoids the "focused descendant inside aria-hidden" warning.
    $btnGetStarted.blur();

    // Reset previous-run state, but DO NOT clear the stage position.
    resetExplorationStates();

    // Snapshot the preview card position while landing is still visible.
    positionStageOverPreviewCard();

    switchView("creating");
    setTimeout(runCreationSequence, 350);
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
