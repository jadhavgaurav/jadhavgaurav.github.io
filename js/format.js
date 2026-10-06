/** Shared helpers. Pure functions, no DOM. */

/** 46616 -> "46.6k", 1995 -> "2k", 292 -> "292". */
export function formatStars(stars) {
  if (stars < 1000) return String(stars);
  return `${(stars / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}

/** "2026-09-18" -> "18 Sep 2026" (UTC, so the day never shifts by locale). */
export function formatDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

/** "jgm/pandoc" -> { owner: "jgm", name: "pandoc" }. */
export function splitRepository(repo) {
  const [owner, ...rest] = repo.split("/");
  return { owner, name: rest.join("/") };
}

/** DOM id fragment that is safe for any repository name. */
export function repositoryId(repo) {
  return `project-${repo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
