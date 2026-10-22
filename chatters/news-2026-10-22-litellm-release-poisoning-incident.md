---
title: "LiteLLM 发版投毒事件复盘：三个 OAuth 令牌引发的血案"
date: "2026-10-22"
tags: ["开源项目"]
mood: 📡 情报站
---

BerriAI 发布 LiteLLM 发版投毒事件报告：攻击者利用从内部部署日志中读到的三名工程师的 GitHub CLI OAuth 令牌实施了投毒，报告还特别指出特定场景下 Claude Code 会把用户的 GitHub CLI OAuth 令牌嵌入响应正文。事件分析在 Hacker News 上收获 450 点热度，安全团队同步展开了围绕代理工具令牌泄露面的讨论。

**为什么值得看**：AI 编程工具把令牌写进日志再被拖走，这条链路几乎每个重度用户都踩过——发版管道的安全债，该还了。

🔗 [Web Pulse](https://wpnews.pro/news/agent-tools-today-22-oct-2026-claude-api-2026-10-21-layerfs-1-0-php2shell)
