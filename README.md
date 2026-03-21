# 三之的博客

> 勤学如春起之苗，不见其增，日有所长。辍学如磨石之刀，不见其损，日有所亏。

个人技术博客，记录 Web 安全、CTF 竞赛、代码审计等领域的学习笔记与思考。

**在线访问**：[threezh1.github.io](https://threezh1.github.io)

## 内容方向

- **Web 安全**：XSS、SQL 注入、SSRF、反序列化、文件上传等漏洞研究
- **CTF Writeup**：各类竞赛题目的解题思路与复盘
- **代码审计**：PHP、Java、Node.js 等语言的漏洞挖掘与分析
- **工具开发**：自用安全工具与脚本的记录

## 技术栈

纯静态站点，无构建步骤，无框架依赖。

- Windows XP / IE6 复古视觉主题
- marked.js 渲染 Markdown
- highlight.js 代码高亮
- Python HTTP Server 本地开发

## 本地运行

```bash
python3 -m http.server 8082
```

访问 http://localhost:8082

## 新增文章

1. 在 `posts/` 目录创建 `YYYY-MM-DD-slug.md`，frontmatter 格式：

```yaml
---
title: 文章标题
date: January 1st 2025
tags: [TagA, TagB]
summary: 一句话摘要
---
```

2. 更新 `posts/index.json`，将新文章元数据按日期降序插入。

3. 推送到 GitHub：

```bash
git add .
git commit -m "post: 文章标题"
git push origin master
```
