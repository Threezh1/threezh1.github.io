# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Server

```bash
python3 -m http.server 8082
```

**Must** be served via HTTP (not `file://`) — `app.js` relies on fetching the `posts/` directory listing to discover `.md` files.

After editing JS files, bump the `?v=N` query string on the `<script>` tag in the relevant HTML to bust the browser cache.

## Architecture

Pure static site — no build step, no framework, no package manager.

```
index.html   — Homepage (post list + pagination + tag filter)
post.html    — Individual post reader
js/app.js    — Homepage logic
js/post.js   — Post page logic
css/xp.css   — Windows XP / IE6 visual theme
posts/*.md   — Article files
posts/index.json — Pre-built metadata (currently unused by JS; kept for reference)
```

### Data flow

**Homepage (`app.js`):**
1. Fetches `posts/` directory listing (Python's HTTP server returns an HTML page with `<a>` links)
2. Extracts `.md` filenames from anchor hrefs
3. Fetches every `.md` in parallel and parses YAML-like frontmatter
4. Sorts by date (newest first), renders paginated list and sidebar

**Post page (`post.js`):**
1. Reads `?id=` URL param (filename without `.md` extension)
2. Fetches `posts/{id}.md` and re-fetches all posts metadata for sidebar
3. Renders markdown body with [marked.js](https://cdn.jsdelivr.net/npm/marked@9/marked.min.js) (loaded from CDN)

### Post frontmatter format

```yaml
---
title: 文章标题
date: January 1st 2018
tags: [TagA, TagB, TagC]
summary: 一句话摘要
---
```

- `date` uses ordinal English format (`January 1st 2018`). `formatDate()` in `app.js` strips ordinal suffixes before passing to `new Date()`.
- Filename convention: `YYYY-MM-DD-slug.md` (slug may contain Chinese characters and spaces).
- `tags` is a bracketed comma-separated list, not standard YAML.

## Adding a New Post

1. Create `posts/YYYY-MM-DD-slug.md` with the frontmatter above.
2. **Regenerate `posts/index.json`** — add the new post's metadata (id, title, date, tags, summary) in descending date order.

## GitHub Deployment

- **主仓库**: `git@github.com:Threezh1/threezh1.github.io.git`（GitHub Pages，域名 threezh1.github.io）
- **默认分支**: `master`（不用 main）
- **SSH 认证**：已配置，邮箱 makefoxm@qq.com

### 发布步骤

```bash
git add <files>
git commit -m "描述"
git push origin master
```
