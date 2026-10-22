---
title: "AI 挖出 PHP 十年大洞，全球网站连夜打补丁"
date: "2026-10-22"
tags: ["其他"]
mood: 📡 情报站
---

PHP 于 10 月 21 日紧急发布修复版本，补上两个 CVSS 9.2 的严重漏洞（CVE-2026-109618 和 CVE-2026-109619），均可未授权远程代码执行，还能泄漏进程内存中的密码和 API 密钥。这两个洞由安全公司 Calif 用 OpenAI 的 GPT-5.6 Sol 发现，谷歌旗下 Wiz 用 Gemini 4 Argon 独立复现，波及最近十年发布的所有 PHP 版本，最老追溯到 PHP 5.4。FBI、NSA 和 CISA 已联合发声敦促紧急修补。

**为什么值得看**：AI 把复杂内存漏洞的利用门槛踩平了——你的 WordPress 打得再勤，底层 PHP 没升级照样裸奔，AI 攻防时代的第一枪已经打响。

🔗 [Rainvent AI 日报](https://rainvent.ai/genai-daily-october-22-2026-ai-found-php-flaws-force-emergency-patches-anthropic-ships-claude-duet-meta-lifts-ai-spend-floor)
