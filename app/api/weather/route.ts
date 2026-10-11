// app/api/weather/route.ts
import { NextResponse } from 'next/server';

// 🌟 和风天气认证方式自动识别:
//    - QWEATHER_KEY 为 JWT(eyJ 开头)→ Authorization: Bearer
//    - QWEATHER_KEY 为 API Key(32 位十六进制等)→ X-QW-Api-Key(和风 2024+ 控制台默认创建的类型)
// 🌟 专属 API Host 通过 QWEATHER_HOST 配置(新账号必需,控制台-设置页获取)
export async function GET() {
  const token = (process.env.QWEATHER_KEY || '').trim();
  const locationId = "101281601"; // 广东 东莞

  if (!token) {
    console.error("❌ 环境变量 QWEATHER_KEY 未找到");
    return NextResponse.json({ code: "500", message: "Token missing" }, { status: 500 });
  }

  const isJwt = token.startsWith('eyJ');
  const authHeaders: Record<string, string> = isJwt
    ? { 'Authorization': `Bearer ${token}` }
    : { 'X-QW-Api-Key': token };

  const customHost = (process.env.QWEATHER_HOST || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const apiHosts = [
    ...(customHost ? [`https://${customHost}/v7/weather/now`] : []),
    'https://api.qweather.com/v7/weather/now',
    'https://devapi.qweather.com/v7/weather/now'
  ];

  for (const host of apiHosts) {
    try {
      const url = `${host}?location=${locationId}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          ...authHeaders,
          'Accept-Encoding': 'gzip',
          'User-Agent': 'Vercel-Weather-Proxy/1.0'
        },
        cache: 'no-store'
      });

      const data = await res.json();

      if (data.code === "200" || res.status === 200) {
        return NextResponse.json(data);
      }

      console.warn(`⚠️ ${host} 未通过:`, data);

    } catch (err: any) {
      console.error(`🔥 请求 ${host} 出错:`, err.message);
      continue;
    }
  }

  return NextResponse.json({
    code: "500",
    message: "认证失败，请检查 QWEATHER_KEY / QWEATHER_HOST 配置"
  }, { status: 500 });
}
