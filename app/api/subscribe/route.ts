import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// 订阅名单统一落在这个文件（已在 .gitignore 排除，避免隐私进仓库）
// 控制台的「订阅名单」页面读的是同一份
const FILE = path.join(process.cwd(), 'data', 'subscribers.json');

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ ok: false, message: '请输入有效的邮箱地址' }, { status: 400 });
    }

    await fs.mkdir(path.dirname(FILE), { recursive: true });
    let list: { email: string; date: string }[] = [];
    try { list = JSON.parse(await fs.readFile(FILE, 'utf8')); } catch {}

    if (list.some(s => s.email === email)) {
      return NextResponse.json({ ok: true, message: '这个邮箱已经订阅过啦～' });
    }
    list.push({ email, date: new Date().toISOString().slice(0, 10) });
    await fs.writeFile(FILE, JSON.stringify(list, null, 2), 'utf8');
    return NextResponse.json({ ok: true, message: '订阅成功，更新时会第一时间通知你 ✨' });
  } catch {
    return NextResponse.json({ ok: false, message: '订阅通道暂时不可用，稍后再试试' }, { status: 500 });
  }
}
