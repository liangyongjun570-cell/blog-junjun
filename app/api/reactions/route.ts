import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '../../../lib/dataStore';

/**
 * 🌟 表情反应：按 target（如 posts/xxx、chatters/xxx、moments/123）计数
 * 数据存 GitHub 私有仓库 reactions.json（与 views.json 同套路）
 *
 * POST { target, emoji, delta } → delta=+1 点亮 / -1 取消，返回最新计数
 * GET  ?target=x               → 查询当前各表情计数
 */

type ReactionsMap = Record<string, Record<string, number>>;

// 允许的表情白名单（防乱写 key）
// like/heart/laugh/wow/party = 药丸式 Reactions 组件
// dislike/happy/celebrate/love = ArticleFooter 大表情评价（点赞/踩/开心/庆祝/喜欢/惊叹）
const EMOJI_KEYS = ['like', 'heart', 'laugh', 'wow', 'party', 'dislike', 'happy', 'celebrate', 'love'];
// target 允许字母数字、下划线、连字符、斜杠（moments/<id>、posts/<slug>）
const TARGET_RE = /^[a-zA-Z0-9_/-]+$/;

export async function POST(req: NextRequest) {
  try {
    const { target, emoji, delta } = await req.json();
    if (!target || typeof target !== 'string' || !TARGET_RE.test(target) || target.includes('..')) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (!EMOJI_KEYS.includes(emoji)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const d = Number(delta);
    if (d !== 1 && d !== -1) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const all = await readJson<ReactionsMap>('reactions.json', {});
    const current = { ...(all[target] || {}) };
    // 不允许减到负数
    const nextVal = Math.max(0, (Number(current[emoji]) || 0) + d);
    if (nextVal === 0) delete current[emoji];
    else current[emoji] = nextVal;

    const next: ReactionsMap = { ...all, [target]: current };
    await writeJson('reactions.json', next);
    return NextResponse.json({ ok: true, reactions: current });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('target');
  if (!target || !TARGET_RE.test(target) || target.includes('..')) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const all = await readJson<ReactionsMap>('reactions.json', {});
  return NextResponse.json({ ok: true, reactions: all[target] || {} });
}
