import { NextResponse } from 'next/server';
import { readJson } from '../../../lib/dataStore';

/**
 * 🌟 全站统计：views.json 所有条目求和 = 全站总阅读
 * GET → { ok, totalViews }
 */

type ViewsMap = Record<string, number>;

export async function GET() {
  try {
    const views = await readJson<ViewsMap>('views.json', {});
    const totalViews = Object.values(views).reduce((sum, n) => sum + (Number(n) || 0), 0);
    return NextResponse.json({ ok: true, totalViews });
  } catch {
    return NextResponse.json({ ok: false, totalViews: 0 }, { status: 500 });
  }
}
