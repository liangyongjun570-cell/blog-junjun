import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

/**
 * 🌟 手气不错：随机抽一篇文章或杂谈
 * GET → { ok, type: 'post'|'chatter', slug, title }
 */

function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function GET() {
  try {
    const items: { type: string; slug: string; title: string }[] = [];

    for (const [dir, type] of [['posts', 'post'], ['chatters', 'chatter']] as const) {
      const full = path.join(process.cwd(), dir);
      if (!fs.existsSync(full)) continue;
      for (const f of fs.readdirSync(full).filter(n => n.endsWith('.md'))) {
        const raw = fs.readFileSync(path.join(full, f), 'utf8');
        const m = raw.match(/^---\n([\s\S]*?)\n---/);
        const title = m ? (m[1].match(/^title:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, '') ?? '') : '';
        items.push({ type, slug: f.replace(/\.md$/, ''), title });
      }
    }

    const hit = pickRandom(items);
    if (!hit) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: true, ...hit });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
