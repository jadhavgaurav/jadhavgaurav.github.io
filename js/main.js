import { renderField } from "./bubbles.js";
import { createLedger } from "./ledger.js";
import { initName } from "./name.js";
import { initPet } from "./pet.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const root = document.documentElement;

/* Theme: the inline script in <head> applied any saved choice; this wires the toggle. */
function currentTheme() {
  if (root.dataset.theme === "light" || root.dataset.theme === "dark") return root.dataset.theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function initThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  const sync = () => toggle.setAttribute("aria-label", `Switch to ${currentTheme() === "dark" ? "light" : "dark"} theme`);
  sync();
  toggle.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch (error) {
      /* Storage can be blocked; the choice still applies for this visit. */
    }
    sync();
  });
}

/* Header gains a rule once the page has moved off the top. */
function initHeaderRule() {
  const header = document.querySelector(".site-header");
  const sentinel = document.getElementById("top-sentinel");
  if (!("IntersectionObserver" in window)) return;
  new IntersectionObserver(([entry]) => header.classList.toggle("is-stuck", !entry.isIntersecting)).observe(sentinel);
}

/* Elements reveal once as they enter the viewport. Nothing hides without JavaScript. */
function initReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach((target) => target.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
  );
  targets.forEach((target) => observer.observe(target));
}

/* The bubble entrance starts when the field is on screen, not at page load. */
function initFieldEntrance() {
  const field = document.getElementById("field");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    field.classList.add("is-live");
    return;
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      field.classList.add("is-live");
      observer.disconnect();
    },
    { threshold: 0.25 },
  );
  observer.observe(field);
}

/* Numbers count up once, when the stat strip scrolls into view. */
function countUp(node, target) {
  if (prefersReducedMotion) {
    node.textContent = String(target);
    return;
  }
  const duration = 1100;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    node.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function applyTotals(totals) {
  const stats = document.getElementById("stats");
  const statNodes = [...stats.querySelectorAll("[data-count]")];
  const run = () =>
    statNodes.forEach((node) => {
      const value = totals[node.dataset.count];
      if (typeof value === "number") countUp(node, value);
    });
  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    run();
    return;
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      run();
    },
    { threshold: 0.6 },
  );
  observer.observe(stats);
}

async function loadRecord() {
  const response = await fetch("data/oss.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`oss.json responded with ${response.status}`);
  return response.json();
}

async function initOpenSourceRecord() {
  const list = document.getElementById("ledger");
  const errorMessage = document.getElementById("ledger-error");
  try {
    const record = await loadRecord();
    applyTotals(record.totals);

    const refreshed = document.getElementById("refreshed");
    refreshed.dateTime = record.generatedAt;
    refreshed.textContent = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(record.generatedAt),
    );

    const reveal = createLedger({
      projects: record.projects,
      list,
      status: document.getElementById("ledger-status"),
      moreButton: document.getElementById("ledger-more"),
      filterButtons: [...document.querySelectorAll(".filter")],
      prefersReducedMotion,
    });
    renderField(document.getElementById("field"), record.projects, reveal);
  } catch (error) {
    console.error("Could not load the open-source record.", error);
    list.replaceChildren();
    errorMessage.hidden = false;
    document.getElementById("field").setAttribute("aria-busy", "false");
  }
}

initThemeToggle();
initHeaderRule();
initName(document.getElementById("hero-title"), { prefersReducedMotion, finePointer });
initPet({ prefersReducedMotion });
initReveal();
initFieldEntrance();
initOpenSourceRecord();
