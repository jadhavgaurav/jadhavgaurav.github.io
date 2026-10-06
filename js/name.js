const BASE_WEIGHT = 600;
const PEAK_WEIGHT = 880;
/** Distance in px at which the cursor's pull on a letter has fallen to about 60%. */
const REACH = 170;
/** Share of the remaining distance a letter's weight closes each frame. */
const EASING = 0.14;

/** Wraps every letter of each line in a span so its weight can move on its own. */
function splitIntoLetters(name) {
  const letters = [];
  for (const line of name.querySelectorAll(".name-line")) {
    const text = line.textContent;
    line.textContent = "";
    for (const character of text) {
      const span = document.createElement("span");
      span.className = "char";
      span.style.setProperty("--ci", String(letters.length));
      span.textContent = character;
      line.append(span);
      letters.push(span);
    }
  }
  return letters;
}

/**
 * The name is the hero. Letters near the cursor get heavier and ease back
 * when it leaves. It exists to make the page feel handled, and it is off for
 * touch screens and for visitors who ask for less motion.
 *
 * Each letter keeps its resting width so heavier neighbours never reflow the line.
 */
export function initName(name, { prefersReducedMotion, finePointer }) {
  const letters = splitIntoLetters(name);
  if (prefersReducedMotion || !finePointer) return;

  const lockWidths = () => {
    letters.forEach((letter) => (letter.style.width = ""));
    letters.forEach((letter) => (letter.style.width = `${letter.getBoundingClientRect().width}px`));
  };
  document.fonts.ready.then(() => {
    lockWidths();
    new ResizeObserver(lockWidths).observe(name);
  });

  const weights = letters.map(() => BASE_WEIGHT);
  const hero = name.closest(".hero");
  let pointer = null;
  let frameId = 0;

  const frame = () => {
    frameId = 0;
    let moving = false;
    letters.forEach((letter, index) => {
      let goal = BASE_WEIGHT;
      if (pointer) {
        const box = letter.getBoundingClientRect();
        const dx = pointer.x - (box.left + box.width / 2);
        const dy = pointer.y - (box.top + box.height / 2);
        goal = BASE_WEIGHT + (PEAK_WEIGHT - BASE_WEIGHT) * Math.exp(-(dx * dx + dy * dy) / (2 * REACH * REACH));
      }
      weights[index] += (goal - weights[index]) * EASING;
      if (Math.abs(goal - weights[index]) > 0.6) moving = true;
      else weights[index] = goal;
      letter.style.setProperty("--w", weights[index].toFixed(1));
    });
    if (moving) frameId = requestAnimationFrame(frame);
  };
  const request = () => {
    if (!frameId) frameId = requestAnimationFrame(frame);
  };

  hero.addEventListener("pointermove", (event) => {
    pointer = { x: event.clientX, y: event.clientY };
    request();
  });
  hero.addEventListener("pointerleave", () => {
    pointer = null;
    request();
  });
}
