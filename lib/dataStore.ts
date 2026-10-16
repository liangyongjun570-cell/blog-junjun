import fs from 'fs/promises';
import path from 'path';

/**
 * 🌟 运行时数据存储层
 *
 * Vercel 生产环境文件系统只读，无法落盘，所以持久数据（订阅名单/阅读量）
 * 存在 GitHub 私有仓库 junjun-site-data（通过 Contents API 读写，即存即取）。
 * 本地开发或 API 不可用时，自动回退到本地 data/ 目录文件，功能不受影响。
 */

const REPO = process.env.DATA_REPO || 'liangyongjun570-cell/junjun-site-data';
const BRANCH = 'main';
const API_BASE = `https://api.github.com/repos/${REPO}/contents/data`;

const GH_HEADERS: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'junjun-site',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

function localPath(name: string) {
  return path.join(process.cwd(), 'data', name);
}

/** 读一份 JSON 数据：有 GITHUB_TOKEN（生产环境）时远程优先，本地仅兜底 */
export async function readJson<T>(name: string, fallback: T): Promise<T> {
  // ① GitHub 仓库优先（生产环境必须读最新数据——本地文件是构建时快照，
  //    若以快照为准，部署冷启动后第一次写入会用旧数据覆盖远程，导致计数清零）
  if (process.env.GITHUB_TOKEN) {
    try {
      const res = await fetch(`${API_BASE}/${name}?ref=${BRANCH}`, {
        headers: GH_HEADERS,
        signal: AbortSignal.timeout(8000),
        // 🌟 禁用任何缓存，保证读到最新
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        return JSON.parse(Buffer.from(json.content, 'base64').toString('utf8')) as T;
      }
    } catch { /* 网络失败走本地兜底 */ }
  }

  // ② 本地文件（本地开发以本地为准，所见即所得；生产仅在远程不可用时兜底）
  try {
    const local = JSON.parse(await fs.readFile(localPath(name), 'utf8'));
    if (Array.isArray(local) ? local.length > 0 : Object.keys(local).length > 0) return local as T;
  } catch { /* 本地也没有就返回 fallback */ }

  return fallback;
}

/** 写一份 JSON 数据：GitHub 仓库 + 本地文件双写 */
export async function writeJson(name: string, data: unknown): Promise<{ remote: boolean; local: boolean }> {
  const content = JSON.stringify(data, null, 2);
  const results = { remote: false, local: false };

  // ① 本地写（本地开发/兜底）
  try {
    await fs.mkdir(path.dirname(localPath(name)), { recursive: true });
    await fs.writeFile(localPath(name), content, 'utf8');
    results.local = true;
  } catch { /* 只读 FS（Vercel）忽略 */ }

  // ② GitHub 仓库写（需要先拿 sha；sha 冲突说明并发写入过，重试一次拿新 sha）
  if (process.env.GITHUB_TOKEN) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        let sha: string | undefined;
        try {
          const head = await fetch(`${API_BASE}/${name}?ref=${BRANCH}`, {
            headers: GH_HEADERS,
            signal: AbortSignal.timeout(8000),
            cache: 'no-store',
          });
          if (head.ok) sha = ((await head.json()) as { sha?: string }).sha;
        } catch { /* 文件不存在就是首次创建 */ }

        const res = await fetch(`${API_BASE}/${name}`, {
          method: 'PUT',
          headers: { ...GH_HEADERS, 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            message: `chore(data): update ${name}`,
            content: Buffer.from(content, 'utf8').toString('base64'),
            branch: BRANCH,
            ...(sha ? { sha } : {}),
          }),
        });
        if (res.ok) { results.remote = true; break; }
        // sha 冲突（409/422）：远程刚被并发请求更新过，重试以拿到新 sha 再写
        if (res.status !== 409 && res.status !== 422) break;
      } catch { /* 网络失败忽略 */ }
    }
  }

  return results;
}
