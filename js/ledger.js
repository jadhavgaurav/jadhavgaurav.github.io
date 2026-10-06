import { formatDate, formatStars, repositoryId, splitRepository } from "./format.js";

const VISIBLE_BY_DEFAULT = 12;
const ICON_PLUS = "url(/assets/icons/plus.svg)";
const ICON_MINUS = "url(/assets/icons/minus.svg)";

/**
 * Creates an element. Text always goes in through textContent: pull request
 * titles come from outside this site and must never be parsed as HTML.
 */
function element(tag, { className, text, attributes } = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  for (const [name, value] of Object.entries(attributes ?? {})) node.setAttribute(name, value);
  node.append(...children);
  return node;
}

function icon(name, className) {
  const node = element("span", { className: `icon ${className}`, attributes: { "aria-hidden": "true" } });
  node.style.setProperty("--icon", name === "plus" ? ICON_PLUS : ICON_MINUS);
  return node;
}

function pullRequestLink(pullRequest, state) {
  const label = state === "merged" ? "Merged" : "In review";
  return element("li", {}, [
    element("a", { className: "pr-link", attributes: { href: pullRequest.url, rel: "noopener" } }, [
      element("span", { className: `pr-state${state === "merged" ? " is-merged" : ""}`, text: label }),
      element("span", { className: "pr-title", text: pullRequest.title }),
      element("span", { className: "pr-date", text: formatDate(pullRequest.date) }),
    ]),
  ]);
}

function matchesFilter(project, filter) {
  if (filter === "merged") return project.merged.length > 0;
  if (filter === "open") return project.open.length > 0;
  return true;
}

function buildRow(project, filter) {
  const { owner, name } = splitRepository(project.repo);
  const id = repositoryId(project.repo);
  const showMerged = filter !== "open";
  const showOpen = filter !== "merged";
  const merged = showMerged ? project.merged : [];
  const open = showOpen ? project.open : [];

  const tally = [];
  if (merged.length) tally.push(`${merged.length} merged`);
  if (open.length) tally.push(`${open.length} in review`);

  const toggle = element(
    "button",
    { className: "project-toggle", attributes: { type: "button", "aria-expanded": "false", "aria-controls": `${id}-panel` } },
    [
      element("span", { className: "project-name" }, [
        element("span", { className: "owner", text: `${owner}/` }),
        document.createTextNode(name),
      ]),
      element("span", { className: "project-meta" }, [
        element("span", { text: `${formatStars(project.stars)} stars` }),
        element("span", { text: project.language ?? "Mixed" }),
        element("span", { className: "tally", text: tally.join(", ") }),
      ]),
      icon("plus", "icon-plus"),
      icon("minus", "icon-minus"),
    ],
  );

  const list = element("ul", { className: "pr-list" });
  list.append(...merged.map((pr) => pullRequestLink(pr, "merged")), ...open.map((pr) => pullRequestLink(pr, "open")));
  const panel = element("div", { className: "project-panel", attributes: { id: `${id}-panel`, hidden: "" } }, [list]);

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    panel.hidden = expanded;
  });

  return element("li", { className: "project", attributes: { id, "data-repo": project.repo } }, [
    element("h3", {}, [toggle]),
    panel,
  ]);
}

/**
 * Renders the filterable, expandable project list.
 * Returns `reveal(repo)`, which opens a project's row and scrolls to it.
 */
export function createLedger({ projects: unordered, list, status, moreButton, filterButtons, prefersReducedMotion }) {
  const state = { filter: "all", showAll: false };
  // Merged work leads; projects with only open pull requests follow. Stars break ties.
  const projects = [...unordered].sort(
    (a, b) => Number(b.merged.length > 0) - Number(a.merged.length > 0) || b.stars - a.stars,
  );

  function render() {
    const matching = projects.filter((project) => matchesFilter(project, state.filter));
    const visible = state.showAll ? matching : matching.slice(0, VISIBLE_BY_DEFAULT);
    list.replaceChildren(...visible.map((project) => buildRow(project, state.filter)));

    status.textContent = `Showing ${visible.length} of ${matching.length} projects.`;
    const hiddenCount = matching.length - visible.length;
    moreButton.hidden = matching.length <= VISIBLE_BY_DEFAULT;
    moreButton.textContent = state.showAll ? "Show fewer projects" : `Show all ${matching.length} projects`;
    moreButton.setAttribute("aria-expanded", String(state.showAll));
    if (hiddenCount === 0 && !state.showAll) moreButton.hidden = true;

    for (const button of filterButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.filter === state.filter));
    }
  }

  for (const button of filterButtons) {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      render();
    });
  }
  moreButton.addEventListener("click", () => {
    state.showAll = !state.showAll;
    render();
  });

  render();

  return function reveal(repo) {
    const project = projects.find((candidate) => candidate.repo === repo);
    if (!project) return;
    if (!matchesFilter(project, state.filter)) state.filter = "all";
    const index = projects.filter((candidate) => matchesFilter(candidate, state.filter)).indexOf(project);
    if (index >= VISIBLE_BY_DEFAULT) state.showAll = true;
    render();

    const row = document.getElementById(repositoryId(repo));
    const toggle = row?.querySelector(".project-toggle");
    if (!row || !toggle) return;
    toggle.setAttribute("aria-expanded", "true");
    row.querySelector(".project-panel").hidden = false;
    row.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
    toggle.focus({ preventScroll: true });
  };
}
