---
title: "让 AI 直接操控博途：TIA Portal Openness MCP 安装实录"
date: "2026-10-13 16:30:00"
tags:
- 工控
- MCP
- AI
- 教程
mood: 硬核
description: 我用自然语言让 Claude Code 直接生成 S7-1500 工程和 LAD 块，全程没在博途里点过一下鼠标。这篇是 TIA Portal Openness MCP 从零装好的完整实录：用户组配置、doctor 体检、.mcp.json 接入、预热加速，以及我踩过的每一个坑。
---

> 环境：Windows 11 · TIA Portal V21 · Claude Code
> 交付包：TIA_MCP_Delivery_v2.7.2 · MIT 开源，无需 license key

以前写 PLC 程序，思路再清楚，也得在博途里一层层点：建项目 → 拖硬件 → 插 FC → 写网络 → 编译 → 存盘。一个像样的演示工程，没一两个小时下不来。

现在我用自然语言对 Claude Code 说一句「帮我建一个 S7-1500 项目，加一个启停 FC，编译并保存」，它就通过 **TIA Portal Openness MCP** 直接把工程做出来。这篇文章记录我从零装好的完整过程，照着做基本不会踩坑。

---

## 一、这是什么东西

[TIA_Portal_Openness_MCP](https://github.com/bulaofen0036-coder/TIA_Portal_Openness_MCP) 是一个开源 MCP（Model Context Protocol）服务器。它把西门子 TIA Portal 的 **Openness API** 包装成 AI 能调用的工具：

- 建项目、添加 PLC / HMI 硬件
- 生成 PLC 变量表、UDT、DB、SCL / LAD 程序块
- 生成 WinCC Unified 画面
- 编译、读诊断、导出导入、保存

只要客户端支持 MCP（Claude Code、Claude Desktop、Cursor、VS Code 都行），就能用同一个 `TiaMcpServer.exe`。包内已带编译好的运行时，**不需要克隆源码仓库**。

---

## 二、安装前准备

| 项目 | 要求 |
|---|---|
| 操作系统 | Windows 10 / 11 |
| TIA Portal | V20 或 V21（我是 V21，装在 `D:\Program Files\Siemens\Automation\Portal V21`） |
| 运行时 | .NET Framework 4.8 |
| AI 客户端 | Claude Code / Cursor 等任意 MCP 客户端 |

### 两个必须做对的前置

**1. 把当前 Windows 用户加入本地组 `Siemens TIA Openness`**

```
lusrmgr.msc → 组 → Siemens TIA Openness → 添加当前用户
```

或者管理员 PowerShell：

```powershell
net localgroup "Siemens TIA Openness" "%USERNAME%" /add
```

**2. 注销并重新登录 Windows**

这一步最容易被忽略。不重新登录，组成员资格不生效，后面连接会一直报 Openness 权限错误。我第一次就卡在这里。

---

## 三、下载并解压交付包

到 GitHub Releases 下载 `TIA_MCP_Delivery` 压缩包，解压到一个**无中文空格问题的稳定路径**。我的位置：

```
C:\nianjisan\TIA_Portal_Openness_MCP_new\TIA_MCP_Delivery_v2.7.2_20260905\
```

解压后目录长这样（关键部分）：

```
TIA_MCP_Delivery_v2.7.2_20260905\
├─ .mcp.json                 ← MCP 配置模板
├─ tia.cmd                   ← V21 命令行入口
├─ tia-v20.cmd               ← V20 命令行入口
├─ runtime\
│   ├─ v21\TiaMcpServer.exe  ← V21 引擎（我们用这个）
│   └─ v20\TiaMcpServer.exe  ← V20 引擎
├─ scripts\
│   ├─ 预热.bat               ← 常驻 headless TIA，加速连接
│   └─ 生成工程.bat            ← 把 spec 拖上去一键建工程
├─ templates\project-blueprints\   ← 现成的启停/电机工程模板
└─ docs\                     ← 手册、指令库、能力矩阵
```

> 注意：V20 和 V21 的 exe **不能混用**。V21 用 split DLL，V20 用单体 `Siemens.Engineering.dll`，绑定方式不同。装的是哪个版本就用哪个 exe。

---

## 四、先跑一次体检（强烈推荐）

装完别急着接 AI，先在交付包根目录跑：

```bat
tia.cmd doctor
```

它会一次性检查：

1. TIA Portal 是否安装、路径在哪
2. exe 版本是否和 TIA 版本匹配
3. 当前用户是否在 `Siemens TIA Openness` 组
4. 宿主注册是否正常

每一项都给出修法。如果只是用户组没加，可以直接：

```bat
tia.cmd doctor --fix
```

先体检再干活，能省掉后面 90% 的排障时间。

---

## 五、配置到 Claude Code

在你的用户目录创建或编辑 `.mcp.json`：

> Windows 上路径是 `C:\Users\<你的用户名>\.mcp.json`

```json
{
  "mcpServers": {
    "tia-portal": {
      "command": "C:\\nianjisan\\TIA_Portal_Openness_MCP_new\\TIA_MCP_Delivery_v2.7.2_20260905\\runtime\\v21\\TiaMcpServer.exe",
      "args": [
        "--tia-major-version", "21",
        "--tia-portal-location", "D:\\Program Files\\Siemens\\Automation\\Portal V21"
      ]
    }
  }
}
```

三个要点：

1. `command` 指向你机器上真实的 `TiaMcpServer.exe` 全路径
2. `--tia-major-version` 填 20 或 21
3. `--tia-portal-location` 指向 TIA 的安装目录（非默认路径时必须写）

配置好后**重启 Claude Code**，让它加载 MCP 服务器。

### 其它客户端

交付包根目录有 `配置MCP.bat`，可以一键注册到 Claude Desktop / Claude Code / Cursor / VS Code。Cursor 也可参考 `cursor-mcp.example.json`，把 `REPLACE_ME` 换成实际路径。

---

## 六、验证连接

重启后在 Claude Code 里直接说：

```
连接 TIA Portal，看看环境是否正常
```

正常的话 AI 会调用 `Bootstrap` / `Connect` / `Doctor` 这类工具，返回连接状态和项目树。

如果报权限错误，八成是：

- 用户没进 `Siemens TIA Openness` 组
- 加了组但**没注销重登**

如果找不到 TIA，检查 `--tia-portal-location` 路径是否写对。

---

## 七、实际跑一个例子

连接成功后，我让它自动生成了一个用于在线监控的 LAD 展示块：

```
帮我通过 Openness 自动导入一个 LAD 块 FC_LAD_Process_Display，
包含运行灯、故障灯、输送带、翻转气缸、红蓝绿推料、颜色记忆、分拣步骤这些展示网络，
导入后编译一遍
```

结果：

```text
FC_LAD_Process_Display [FC3]
语言：LAD
编译成功，错误 0，警告 0
```

生成 / 导出的文件：

```text
D:\我的文件\课程资料\新建文件夹\FC_LAD_Process_Display.xml
D:\我的文件\课程资料\新建文件夹\FC_LAD_Process_Display_export.xml
```

在 TIA 里双击打开 `FC_LAD_Process_Display [FC3]`，就能看到自动生成的 12 个梯形图网络。整个过程我没有在博途界面里点过一下鼠标。

---

## 八、进阶：一句话生成完整工程

这个交付包还有个很省事的功能 —— `ScaffoldProject` / `tia gen`。给一份 JSON/YAML spec，一次调用完成：

> 建项目 → 加 PLC/HMI 硬件 → UDT/DB/标签表 → SCL/LAD 块 → 编译 → HMI 画面/变量 → 保存

零编程用法：把 `templates\project-blueprints\` 里的现成模板（电机、启停）**拖到 `scripts\生成工程.bat` 图标上**即可。

命令行等价写法：

```bat
tia.cmd gen scaffold_spec_motor.json --dry-run   # 先离线校验
tia.cmd gen scaffold_spec_motor.json             # 真正执行
```

退出码 `0` = 成功。

### 连接太慢？预热一下

首次连接是冷启动，可能要几十秒到几分钟。双击 `scripts\预热.bat`（或 `tia.cmd prewarm`）挂一个常驻的无界面 TIA 实例，之后每次连接约 1 秒。用完在那个窗口按 `Ctrl+C` 关闭。

---

## 九、踩过的坑（速查）

| 问题 | 原因 / 解法 |
|---|---|
| 连接报 Openness 权限错误 | 用户没加入 `Siemens TIA Openness` 组，或加入后没注销重登 |
| 找不到 TIA | `--tia-portal-location` 路径不对，或装的是 V20 却配了 V21 的 exe |
| MCP 工具加载不出来 | 配置改完没重启 Claude Code；或 `.mcp.json` 路径写错 |
| V20/V21 exe 互换后崩溃 | 必须版本匹配，不能混用 |
| 中文乱码 | `.scl` 文件用 **UTF-8 with BOM** 保存 |
| 每次连接都要等很久 | 用 `预热.bat` 常驻实例 |

---

## 十、总结

装好之后的日常是这样的：

1. （可选）双击 `预热.bat`
2. 打开 Claude Code
3. 用中文说你要什么工程 / 什么块
4. 打开 TIA 验收

Openness API 本身是给 C#/VB 开发者准备的，门槛不低。但套上一层 MCP 之后，PLC 工程师不需要写代码，会说话就能把大部分重复性的组态和块生成工作交出去，自己专注在逻辑本身。

这套东西是 MIT 开源的，不带任何授权校验，可以放心用在教学和个人项目上。有问题可以去仓库提 Issue。

---

**相关链接**

- 项目仓库：<https://github.com/bulaofen0036-coder/TIA_Portal_Openness_MCP>
- 另一个参考实现：<https://github.com/Triao/TIA_Portal_Openness_MCP>
- MCP 协议：<https://modelcontextprotocol.io>

*本文基于 TIA_MCP_Delivery_v2.7.2（2026-09-05）在 Windows 11 + TIA Portal V21 + Claude Code 环境实测。*
