#!/usr/bin/env python3
"""Fetches public GitHub repos for tibuntu and generates docs/projects.md."""

import json
import os
import urllib.request

GITHUB_USER = "tibuntu"
OUTPUT_FILE = "docs/projects.md"


def fetch(url):
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "zensical-site-builder")
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def build_markdown(repos):
    lines = [
        "# Projects",
        "",
        "Public repositories on [GitHub](https://github.com/tibuntu), "
        "automatically updated on every deploy.",
        "",
    ]

    for repo in repos:
        if repo.get("fork"):
            continue
        name = repo["name"]
        url = repo["html_url"]
        description = repo.get("description") or ""
        language = repo.get("language") or ""
        stars = repo.get("stargazers_count", 0)

        lines.append(f"## [{name}]({url})")
        if description:
            lines.append("")
            lines.append(description)
        meta = []
        if language:
            meta.append(f"**Language:** {language}")
        if stars:
            meta.append(f"**Stars:** {stars}")
        if meta:
            lines.append("")
            lines.append(" &nbsp;·&nbsp; ".join(meta))
        lines.append("")

    return "\n".join(lines)


def main():
    url = (
        f"https://api.github.com/users/{GITHUB_USER}/repos"
        "?sort=updated&per_page=100&type=public"
    )
    repos = fetch(url)
    repos = [r for r in repos if not r.get("fork")]
    repos.sort(key=lambda r: r.get("stargazers_count", 0), reverse=True)

    md = build_markdown(repos)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        f.write(md)

    print(f"Written {len(repos)} repos to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
