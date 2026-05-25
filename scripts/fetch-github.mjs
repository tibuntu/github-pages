#!/usr/bin/env node
// Fetches public GitHub repos for tibuntu and writes src/data/projects.json.
// Port of the previous scripts/fetch_github.py.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GITHUB_USER = 'tibuntu';
const OUTPUT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
  'projects.json'
);

async function fetchRepos() {
  const url =
    `https://api.github.com/users/${GITHUB_USER}/repos` +
    `?sort=updated&per_page=100&type=public`;

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'tibuntu-dev-site-builder',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function shape(repos) {
  return repos
    .filter((r) => !r.fork && !r.archived && r.name !== 'github-pages')
    .sort((a, b) => {
      const sa = a.stargazers_count ?? 0;
      const sb = b.stargazers_count ?? 0;
      if (sb !== sa) return sb - sa;
      return new Date(b.updated_at) - new Date(a.updated_at);
    })
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      description: r.description ?? '',
      language: r.language ?? '',
      stars: r.stargazers_count ?? 0,
    }));
}

async function main() {
  let projects = [];
  try {
    const repos = await fetchRepos();
    projects = shape(repos);
  } catch (err) {
    console.warn(`[fetch-github] could not fetch repos: ${err.message}`);
    console.warn('[fetch-github] writing empty projects list as fallback.');
  }

  await mkdir(dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(projects, null, 2) + '\n');
  console.log(`[fetch-github] wrote ${projects.length} repos to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
