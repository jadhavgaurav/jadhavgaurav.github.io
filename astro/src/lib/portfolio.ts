import { getCollection, type CollectionEntry } from 'astro:content';
import snapshot from '../data/contributions.json';

export const GITHUB = 'https://github.com/';
export const SNAPSHOT_DATE = snapshot.checkedAt;
export const snapshotLabel = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
}).format(new Date(`${SNAPSHOT_DATE}T00:00:00Z`));

export type Project = CollectionEntry<'projects'>['data'] & { id: string };
export type Contribution = CollectionEntry<'contributions'>['data'];

export async function getProjects(): Promise<Project[]> {
  return (await getCollection('projects'))
    .map(({ id, data }) => ({ ...data, id }))
    .sort((a, b) => a.order - b.order);
}

export async function getRepositories() {
  return (await getCollection('repositories')).map(({ data }) => data)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function contributionRepo(url: string) {
  return new URL(url).pathname.split('/').slice(1, 3).join('/');
}

export async function getContributions() {
  return (await getCollection('contributions')).map(({ data }) => data);
}

export function contributionStats(contributions: Contribution[]) {
  const merged = contributions.filter(pr => pr.status === 'merged');
  return {
    merged: merged.length,
    open: contributions.length - merged.length,
    projects: new Set(merged.map(pr => contributionRepo(pr.url))).size,
  };
}

export function repositoryCategory(name: string) {
  const slug = name.toLowerCase();
  if (['victus','jarvis','assistant','vision','yolo','seo-ai','multimodal'].some(s => slug.includes(s))) return 'AI';
  if (['prediction','classification','tumor','analysis','learning','worldcup'].some(s => slug.includes(s))) return 'Data';
  if (['alpha','elevator','tic-tac','bricks','github_actions'].some(s => slug.includes(s))) return 'Foundations';
  return 'Product';
}
