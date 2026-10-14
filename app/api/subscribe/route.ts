import { NextResponse } from 'next/server';
import { readJson, writeJson } from '../../../lib/dataStore';

// 订阅名单：Vercel 上存 GitHub 私有仓库（只读 FS 落不了盘），本地开发落 data/ 文件
// 控制台的「📬 订阅」管理页读写的是同一份

type Sub = { email: string; date: string };

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ ok: false, message: '请输入有效的邮箱地址' }, { status: 400 });
    }

    const list = await readJson<Sub[]>('subscribers.json', []);
    const clean = (Array.isArray(list) ? list : []).filter(s => s && typeof s.email === 'string');

    if (clean.some(s => s.email === email)) {
      return NextResponse.json({ ok: true, message: '这个邮箱已经订阅过啦～' });
    }
    clean.push({ email, date: new Date().toISOString().slice(0, 10) });
    const saved = await writeJson('subscribers.json', clean);

    if (!saved.remote && !saved.local) {
      return NextResponse.json({ ok: false, message: '订阅通道暂时不可用，稍后再试试' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: '订阅成功，更新时会第一时间通知你 ✨' });
  } catch {
    return NextResponse.json({ ok: false, message: '订阅通道暂时不可用，稍后再试试' }, { status: 500 });
  }
}
