#!/usr/bin/env node
/**
 * Builds data/oss.json: every pull request Gaurav has sent to a project he does
 * not own, grouped by project, with the project's stars and language.
 *
 * Source: GitHub's public search and GraphQL APIs. Needs GITHUB_TOKEN (or
 * GH_TOKEN) for the rate limit; it reads public data only.
 *
 *   GITHUB_TOKEN=$(gh auth token) node scripts/fetch-oss.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LOGIN = "jadhavgaurav";

/** Employer organisations are not part of the open-source record. */
const EXCLUDED_ORGS = ["digibranders"];

/** A practice repository for first-time contributors; not a code contribution. */
const EXCLUDED_REPOS = new Set(["firstcontributions/first-contributions"]);

const API = "https://api.github.com";
const OUTPUT = resolve(dirname(fileURLToPath(import.meta.url)), "../data/oss.json");

const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
if (!token) {
  throw new Error("Set GITHUB_TOKEN (or GH_TOKEN) before running this script.");
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": `${LOGIN}-portfolio-data`,
};

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Fetch JSON, waiting out rate limits instead of failing the whole run. */
async function request(url, init = {}, attempt = 1) {
  const response = await fetch(url, { ...init, headers: { ...headers, ...init.headers } });
  if ((response.status === 403 || response.status === 429) && attempt <= 6) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 20_000 * attempt;
    console.warn(`Rate limited (${response.status}). Waiting ${Math.round(waitMs / 1000)}s, attempt ${attempt}.`);
    await sleep(waitMs);
    return request(url, init, attempt + 1);
  }
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${url} failed with ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

/** Every pull request matching a search qualifier, across pages. */
async function searchPullRequests(state) {
  const exclusions = EXCLUDED_ORGS.map((org) => `-org:${org}`).join(" ");
  const query = `author:${LOGIN} type:pr is:${state} -user:${LOGIN} ${exclusions}`;
  const items = [];
  for (let page = 1; page <= 10; page += 1) {
    const params = new URLSearchParams({ q: query, per_page: "100", page: String(page) });
    const result = await request(`${API}/search/issues?${params}`);
    items.push(...result.items);
    if (result.items.length < 100) break;
    await sleep(2_500);
  }
  return items;
}

function toPullRequest(item) {
  return {
    number: item.number,
    title: item.title,
    url: item.html_url,
    date: (item.pull_request?.merged_at ?? item.closed_at ?? item.created_at).slice(0, 10),
  };
}

/** Group pull requests by upstream repository ("owner/name"). */
function groupByRepository(items, key, into) {
  for (const item of items) {
    const repo = item.repository_url.replace(`${API}/repos/`, "");
    if (EXCLUDED_REPOS.has(repo)) continue;
    const entry = into.get(repo) ?? { repo, merged: [], open: [] };
    entry[key].push(toPullRequest(item));
    into.set(repo, entry);
  }
}

/** Stars and primary language for each repository, in batched GraphQL calls. */
async function fetchRepositoryFacts(repos) {
  const facts = new Map();
  for (let start = 0; start < repos.length; start += 40) {
    const batch = repos.slice(start, start + 40);
    const fields = batch
      .map((repo, index) => {
        const [owner, name] = repo.split("/");
        return `r${index}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) {
          nameWithOwner stargazerCount url primaryLanguage { name }
        }`;
      })
      .join("\n");
    const { data, errors } = await request(`${API}/graphql`, {
      method: "POST",
      body: JSON.stringify({ query: `query { ${fields} }` }),
    });
    if (errors?.length && !data) throw new Error(`GraphQL failed: ${JSON.stringify(errors)}`);
    batch.forEach((repo, index) => {
      const node = data[`r${index}`];
      if (!node) {
        console.warn(`Skipping ${repo}: repository no longer resolves.`);
        return;
      }
      facts.set(repo, {
        stars: node.stargazerCount,
        language: node.primaryLanguage?.name ?? null,
        url: node.url,
      });
    });
  }
  return facts;
}

const byRepository = new Map();
console.log("Searching merged pull requests...");
groupByRepository(await searchPullRequests("merged"), "merged", byRepository);
await sleep(2_500);
console.log("Searching open pull requests...");
groupByRepository(await searchPullRequests("open"), "open", byRepository);

const facts = await fetchRepositoryFacts([...byRepository.keys()]);

const projects = [...byRepository.values()]
  .filter((entry) => facts.has(entry.repo))
  .map((entry) => ({ ...entry, ...facts.get(entry.repo) }))
  .map((project) => ({
    ...project,
    merged: project.merged.sort((a, b) => b.date.localeCompare(a.date)),
    open: project.open.sort((a, b) => b.date.localeCompare(a.date)),
  }))
  .sort((a, b) => b.stars - a.stars || a.repo.localeCompare(b.repo));

const count = (list, pick) => list.reduce((sum, item) => sum + pick(item), 0);
const output = {
  generatedAt: new Date().toISOString(),
  totals: {
    mergedPullRequests: count(projects, (p) => p.merged.length),
    mergedProjects: projects.filter((p) => p.merged.length > 0).length,
    openPullRequests: count(projects, (p) => p.open.length),
    openProjects: projects.filter((p) => p.open.length > 0).length,
    projects: projects.length,
    languages: new Set(projects.map((p) => p.language).filter(Boolean)).size,
  },
  projects,
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${OUTPUT}`);
console.log(output.totals);
