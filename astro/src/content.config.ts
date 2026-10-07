import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: file('src/data/projects.json'),
  schema: z.object({
    order: z.number().int().nonnegative(),
    name: z.string(),
    category: z.string(),
    year: z.string(),
    tone: z.enum(['cobalt', 'slate', 'ice', 'paper']),
    headline: z.string(),
    summary: z.string(),
    role: z.string(),
    stack: z.array(z.string()),
    flow: z.array(z.string()),
    context: z.string(),
    problem: z.string(),
    changes: z.array(z.tuple([z.string(), z.string()])),
    result: z.string(),
    result_note: z.string(),
    lesson: z.string(),
    links: z.array(z.tuple([z.string(), z.url()])),
  }),
});

const repositories = defineCollection({
  loader: file('src/data/repositories.json', {
    parser: (text) => JSON.parse(text).map((repo: { name: string }) => ({ ...repo, id: repo.name })),
  }),
  schema: z.object({
    name: z.string(),
    description: z.string().nullable(),
    created_at: z.string(),
    language: z.string().nullable(),
    homepage: z.string().nullable(),
    archived: z.boolean(),
  }),
});

const contributions = defineCollection({
  loader: file('src/data/contributions.json', {
    parser: (text) => {
      const data = JSON.parse(text);
      return [...data.merged, ...data.open].map((pr: { url: string }) => ({ ...pr, id: pr.url }));
    },
  }),
  schema: z.object({
    url: z.url(),
    title: z.string(),
    status: z.enum(['merged', 'open']),
  }),
});

export const collections = { projects, repositories, contributions };
