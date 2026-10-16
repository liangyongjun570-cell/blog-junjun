import { NextResponse } from 'next/server';
import { readJson } from '../../../lib/dataStore';

/**
 * 🌟 全站统计：views.json 所有条目求和 = 全站总阅读
 * GET → { ok, totalViews }
 */

type ViewsMap = Record<string, number>;

// 🌟 必须 force-dynamic：无参数 GET 会被 Next 构建时静态化成快照，导致线上计数永远不更新
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const views = await readJson<ViewsMap>('views.json', {});
    const totalViews = Object.values(views).reduce((sum, n) => sum + (Number(n) || 0), 0);
    return NextResponse.json(
      { ok: true, totalViews },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json({ ok: false, totalViews: 0 }, { status: 500 });
  }
}
