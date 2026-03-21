---
name: 添加文章后重新生成 index.json
description: 每次向 posts/ 目录添加新文章后，必须重新生成 posts/index.json
type: feedback
---

每次在 posts/ 目录中新增 .md 文章文件后，必须重新生成 posts/index.json。

**Why:** 用户明确要求，index.json 需要与实际文章保持同步。

**How to apply:** 新增文章 .md 文件后，立即更新 posts/index.json，将新文章的元数据（id、title、date、tags、summary）按日期倒序插入。
