import { formatStars, splitRepository } from "./format.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const WIDTH = 640;
const HEIGHT = 560;
const MIN_RADIUS = 12;
const MAX_RADIUS = 62;
const GAP = 5;
const EDGE = 6;
const FULL_LABEL_SIZE = 11;
const MIN_LABEL_SIZE = 8.5;
/** Average advance of one Geist Mono character at FULL_LABEL_SIZE. */
const LABEL_CHAR_WIDTH = 6.6;

/**
 * Radius follows the logarithm of stars: a 60k-star project is not 3,000 times
 * wider than a 20-star one, but it should still read as clearly larger.
 */
function radiusScale(projects) {
  const logs = projects.map((project) => Math.log10(project.stars + 1));
  const low = Math.min(...logs);
  const high = Math.max(...logs);
  const span = high - low || 1;
  return (stars) => MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * ((Math.log10(stars + 1) - low) / span);
}

/**
 * Deterministic circle packing: start on a sunflower spiral, then push
 * overlapping circles apart while pulling everything toward the centre.
 * No randomness, so the picture is identical on every visit.
 */
export function packCircles(projects) {
  const radius = radiusScale(projects);
  const circles = projects
    .map((project) => ({ project, r: radius(project.stars), x: 0, y: 0 }))
    .sort((a, b) => b.r - a.r);

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  circles.forEach((circle, index) => {
    const distance = 22 * Math.sqrt(index + 1);
    circle.x = WIDTH / 2 + Math.cos(index * goldenAngle) * distance;
    circle.y = HEIGHT / 2 + Math.sin(index * goldenAngle) * distance;
  });

  for (let step = 0; step < 500; step += 1) {
    for (let i = 0; i < circles.length; i += 1) {
      for (let j = i + 1; j < circles.length; j += 1) {
        const a = circles[i];
        const b = circles[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.01;
        const overlap = a.r + b.r + GAP - distance;
        if (overlap > 0) {
          const push = overlap / 2;
          const ux = dx / distance;
          const uy = dy / distance;
          a.x -= ux * push;
          a.y -= uy * push;
          b.x += ux * push;
          b.y += uy * push;
        }
      }
    }
    for (const circle of circles) {
      circle.x += (WIDTH / 2 - circle.x) * 0.012;
      circle.y += (HEIGHT / 2 - circle.y) * 0.012;
      circle.x = Math.min(WIDTH - circle.r - EDGE, Math.max(circle.r + EDGE, circle.x));
      circle.y = Math.min(HEIGHT - circle.r - EDGE, Math.max(circle.r + EDGE, circle.y));
    }
  }
  return circles;
}

function svg(tag, attributes = {}) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  return element;
}

/**
 * Largest label size (up to 11px) whose text fits inside the circle, or 0 when
 * even the smallest readable size would not fit. Names stay in the tooltip.
 */
function labelFontSize(name, radius) {
  const available = radius * 1.7;
  const atFull = name.length * LABEL_CHAR_WIDTH;
  const size = atFull <= available ? FULL_LABEL_SIZE : (FULL_LABEL_SIZE * available) / atFull;
  return size >= MIN_LABEL_SIZE ? Math.round(size * 10) / 10 : 0;
}

/** First line of text a visitor sees for a project: its latest merged PR, else latest open one. */
function headlinePullRequest(project) {
  const pullRequest = project.merged[0] ?? project.open[0];
  return { title: pullRequest.title, state: project.merged[0] ? "merged" : "in review" };
}

/**
 * Draws the field into `container` and wires hover and click.
 * `onSelect(repo)` runs when a bubble is clicked.
 */
export function renderField(container, projects, onSelect) {
  const root = container.querySelector("svg");
  const tooltip = container.querySelector(".tooltip");
  root.replaceChildren();

  packCircles(projects).forEach((circle, index) => {
    const { project, r } = circle;
    const { name } = splitRepository(project.repo);
    const isMerged = project.merged.length > 0;

    const group = svg("g", { class: "bubble", "data-repo": project.repo });
    const enter = svg("g", { class: "bubble-enter" });
    enter.style.setProperty("--i", String(index));
    const body = svg("g", { class: "bubble-body" });

    body.append(svg("circle", { cx: circle.x, cy: circle.y, r, class: isMerged ? "bubble-fill" : "bubble-outline" }));
    if (isMerged && project.open.length > 0) {
      body.append(svg("circle", { cx: circle.x, cy: circle.y, r: r + 4, class: "bubble-ring" }));
    }
    const fontSize = labelFontSize(name, r);
    if (fontSize) {
      const label = svg("text", {
        x: circle.x,
        y: circle.y,
        class: `bubble-label ${isMerged ? "on-fill" : "on-outline"}`,
        "font-size": fontSize,
      });
      label.textContent = name;
      body.append(label);
    }

    enter.append(body);
    group.append(enter);
    root.append(group);

    group.addEventListener("pointerenter", () => showTooltip(container, tooltip, group, circle, project));
    group.addEventListener("pointerleave", () => hideTooltip(tooltip, group));
    group.addEventListener("click", () => onSelect(project.repo));
  });

  container.setAttribute("aria-busy", "false");
}

function showTooltip(container, tooltip, group, circle, project) {
  group.classList.add("is-active");
  const { title, state } = headlinePullRequest(project);
  const tally = [];
  if (project.merged.length) tally.push(`${project.merged.length} merged`);
  if (project.open.length) tally.push(`${project.open.length} in review`);

  tooltip.replaceChildren();
  const heading = document.createElement("strong");
  heading.textContent = project.repo;
  const meta = document.createElement("span");
  meta.className = "tooltip-meta";
  meta.textContent = `${formatStars(project.stars)} stars${project.language ? `, ${project.language}` : ""}. ${tally.join(", ")}.`;
  const latest = document.createElement("span");
  latest.className = "tooltip-title";
  latest.textContent = `Latest (${state}): ${title}`;
  tooltip.append(heading, meta, latest);
  tooltip.hidden = false;

  // Convert SVG units to CSS pixels, then keep the card inside the field.
  const scale = container.clientWidth / WIDTH;
  const half = tooltip.offsetWidth / 2;
  const x = Math.min(container.clientWidth - half, Math.max(half, circle.x * scale));
  const below = (circle.y + circle.r) * scale + 10;
  const fitsBelow = below + tooltip.offsetHeight <= container.clientHeight + 40;
  const y = fitsBelow ? below : (circle.y - circle.r) * scale - tooltip.offsetHeight - 10;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${Math.max(0, y)}px`;
}

function hideTooltip(tooltip, group) {
  group.classList.remove("is-active");
  tooltip.hidden = true;
}
