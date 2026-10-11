import { NextResponse } from 'next/server';

// 诊断口：只报告密钥是否存在及长度，不泄露任何内容
export async function GET() {
  const s = (process.env.GITALK_CLIENT_SECRET || '').trim();
  return NextResponse.json({
    hasSecret: s.length > 0,
    secretLength: s.length,
    looksHex40: /^[0-9a-f]{40}$/.test(s),
    startsWithOv23: s.startsWith('Ov23'), // 若为 true 说明误填了 Client ID
  });
}

export async function POST(req: Request) {
  try {
    // 1. 读取 Gitalk 发过来的数据（JSON: { code, client_id, client_secret, redirect_uri? }）
    const raw = await req.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(raw);
    } catch {
      // 兼容 form 表单提交
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 2. clientSecret 不打包进前端代码：由服务端环境变量注入
    //    （siteConfig 里 clientSecret 留空，这里补上，密钥永不进 git 仓库）
    const envSecret = (process.env.GITALK_CLIENT_SECRET || '').trim();
    if (envSecret && (!body.client_secret || body.client_secret === '')) {
      body.client_secret = envSecret;
    }

    // 3. 由我们自己的服务器在后台转发给 GitHub，绕过浏览器跨域
    const githubRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // 4. 把 GitHub 的响应原封不动地还给前端 Gitalk
    const data = await githubRes.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('代理请求失败:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
