import { NextRequest, NextResponse } from 'next/server';
import { readJson, writeJson } from '../../../lib/dataStore';

/**
 * 🌟 全站真实阅读量：按 slug 计数，存 GitHub 私有仓库 views.json
 * POST { slug } → 计数 +1，返回最新阅读量
 * GET  ?slug=x  → 查询当前阅读量
 */

type ViewsMap = Record<string, number>;

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const views = await readJson<ViewsMap>('views.json', {});
    const next = { ...views, [slug]: (Number(views[slug]) || 0) + 1 };
    await writeJson('views.json', next);
    return NextResponse.json({ ok: true, views: next[slug] });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const views = await readJson<ViewsMap>('views.json', {});
  return NextResponse.json({ ok: true, views: Number(views[slug]) || 0 });
}
