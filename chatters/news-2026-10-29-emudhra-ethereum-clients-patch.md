---
title: "印度证书机构翻车波及以太坊：Teku 和 Besu 紧急打补丁保奖励"
date: "2026-10-29"
tags: ["Web3 加密艺术"]
mood: 📡 情报站
---

印度数字证书机构 eMudhra 的 8 个中间 CA 私钥因生成时随机性不足而可被推导，波及以太坊验证者客户端：攻击者若拦截连接并伪造证书，可冒充验证者依赖的外部服务，诱导其把区块费用打进攻击者地址。Teku 26.10.3 与 Besu 26.10.2 已在 Docker 镜像中移除对相关证书的信任，官方确认主网默认配置不受影响、暂无被利用报告。

**为什么值得看**：以太坊自己的代码没问题，坏在 Java 默认不查证书吊销——安全这件事，链条最弱的一环永远在别人家。

🔗 [crypto.news](https://crypto.news/ethereum-clients-patch-flaw-that-could-redirect-eth-rewards/)
