/**
 * Bitling, the desktop pet from my project of the same name, lives on this
 * page. It changes pose with the section you are reading, answers a click, and
 * falls asleep when you stop. It is decorative: the bubble is hidden from
 * assistive technology and a footer button turns it off for good.
 */
const POSES = ["hello", "sleep", "commit", "debug", "deploy", "passed", "failed", "ask"];

/** Line per section, keyed by the section's data-pet attribute. */
const SECTION_LINES = {
  hello: "hi, I'm Bitling. Gaurav built me.",
  debug: "his projects. I'm one of them.",
  commit: "his story so far, newest first.",
  passed: "all bugs squashed!",
  ask: "permission? over here!",
};

/** What a click says. These are lines the real Bitling says on a developer's desktop. */
const QUIPS = [
  { pose: "passed", line: "all bugs squashed!" },
  { pose: "failed", line: "3 tests failing in api" },
  { pose: "deploy", line: "sending it to production..." },
  { pose: "hello", line: "my circuits tingle" },
  { pose: "ask", line: "permission? over here!" },
  { pose: "sleep", line: "goodnight, human" },
];

const BUBBLE_MS = 6000;
const IDLE_MS = 35_000;
const INTRO_DELAY_MS = 1400;

export function initPet({ prefersReducedMotion }) {
  const root = document.documentElement;
  const pet = document.getElementById("pet");
  const body = document.getElementById("pet-body");
  const image = document.getElementById("pet-img");
  const bubble = document.getElementById("pet-bubble");
  const toggle = document.getElementById("pet-toggle");
  const sections = document.querySelectorAll("[data-pet]");

  // Load every pose now so a change never flashes an empty frame.
  POSES.forEach((pose) => {
    const preload = new Image();
    preload.src = `assets/pet/${pose}.webp`;
  });

  let bubbleTimer = 0;
  let idleTimer = 0;
  let quipIndex = 0;
  let sectionPose = "hello";
  let asleep = false;

  function say(pose, line) {
    image.src = `assets/pet/${pose}.webp`;
    bubble.textContent = line;
    bubble.classList.add("is-shown");
    pet.classList.add("is-awake");
    if (!prefersReducedMotion) {
      body.classList.remove("is-hopping");
      // Force a reflow so the hop restarts when poses change in quick succession.
      void body.offsetWidth;
      body.classList.add("is-hopping");
    }
    window.clearTimeout(bubbleTimer);
    bubbleTimer = window.setTimeout(() => {
      bubble.classList.remove("is-shown");
      pet.classList.remove("is-awake");
    }, BUBBLE_MS);
  }

  function sayForSection(pose) {
    sectionPose = pose;
    if (!asleep) say(pose, SECTION_LINES[pose]);
  }

  /* Follow whichever section crosses the middle of the viewport. */
  let introDone = false;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const pose = entry.target.dataset.pet;
        if (!introDone) {
          sectionPose = pose;
          continue;
        }
        sayForSection(pose);
      }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  sections.forEach((section) => observer.observe(section));
  window.setTimeout(() => {
    introDone = true;
    sayForSection(sectionPose);
  }, INTRO_DELAY_MS);

  body.addEventListener("click", () => {
    asleep = false;
    const quip = QUIPS[quipIndex % QUIPS.length];
    quipIndex += 1;
    say(quip.pose, quip.line);
  });

  /* Falls asleep when idle. Any input wakes it. No scroll listener: wheel and touch stand in for it. */
  function wake() {
    if (asleep) {
      asleep = false;
      say(sectionPose, "my circuits tingle");
    }
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      asleep = true;
      say("sleep", "goodnight, human");
    }, IDLE_MS);
  }
  ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach((type) =>
    window.addEventListener(type, wake, { passive: true }),
  );
  wake();

  /* Footer switch, remembered between visits. */
  function renderToggle() {
    const hidden = root.dataset.pet === "hidden";
    toggle.setAttribute("aria-pressed", String(hidden));
    toggle.textContent = hidden ? "Show Bitling" : "Hide Bitling";
  }
  toggle.addEventListener("click", () => {
    const hide = root.dataset.pet !== "hidden";
    if (hide) root.dataset.pet = "hidden";
    else delete root.dataset.pet;
    try {
      localStorage.setItem("pet", hide ? "hidden" : "shown");
    } catch (error) {
      /* Storage can be blocked; the choice still applies for this visit. */
    }
    renderToggle();
    if (!hide) say(sectionPose, "hi again.");
  });
  renderToggle();
}
