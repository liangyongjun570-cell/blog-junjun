// app/api/chat/route.ts
// 双协议支持:
// 1) 配置了 OPENAI_API_KEY → 走 OpenAI 兼容接口(小米 MiMo / 硅基流动 / DeepSeek / Qwen 等)
//    - OPENAI_BASE_URL: 服务商地址,默认 https://api.siliconflow.cn/v1 (硅基流动)
//    - AI_MODEL: 模型 ID,默认 XiaomiMiMo/MiMo-V2.5 (小米 MiMo)
//    - AI_MAX_TOKENS: 单次回复上限,默认 1024(推理模型思维链也占额度,建议 ≥512)
// 2) 只配置了 GEMINI_API_KEY → 走 Google Gemini 原生接口(沿用 siteConfig.geminiConfig)
import { siteConfig } from '../../../siteConfig';

export const runtime = 'edge';

async function callOpenAICompatible(message: string, apiKey: string) {
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1').trim().replace(/\/+$/, '');
  const model = (process.env.AI_MODEL || 'XiaomiMiMo/MiMo-V2.5').trim();
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '1024', 10);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: siteConfig.geminiConfig.systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: siteConfig.geminiConfig.temperature,
      max_tokens: maxTokens
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || data?.message || `服务商返回 ${res.status}`);
  }
  const msg = data.choices?.[0]?.message;
  // 推理模型:思维链在 reasoning_content,正文在 content;正文为空时兜底
  const reply = (msg?.content || '').trim() || (msg?.reasoning_content || '').trim() || '本喵现在不想理你喵...';
  return reply;
}

async function callGemini(message: string, apiKey: string) {
  const modelId = siteConfig.geminiConfig.modelId;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: siteConfig.geminiConfig.systemPrompt }]
      },
      contents: [{
        parts: [{ text: message }]
      }],
      generationConfig: {
        maxOutputTokens: siteConfig.geminiConfig.maxOutputTokens,
        temperature: siteConfig.geminiConfig.temperature,
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `模型拒绝访问: ${response.status}`);
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '本喵现在不想理你喵...';
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
    const geminiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (!openaiKey && !geminiKey) {
      return new Response(JSON.stringify({ error: 'Key missing: 请配置 OPENAI_API_KEY 或 GEMINI_API_KEY' }), { status: 500 });
    }

    let reply: string;
    if (openaiKey) {
      reply = await callOpenAICompatible(message, openaiKey);
    } else {
      reply = await callGemini(message, geminiKey);
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('chat 路由错误:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function GET() {
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const provider = openaiKey
    ? `openai-compatible (${process.env.AI_MODEL || 'XiaomiMiMo/MiMo-V2.5'})`
    : geminiKey
      ? `gemini (${siteConfig.geminiConfig.modelId})`
      : 'not configured';
  return new Response(JSON.stringify({ status: 'Ready', provider }), { status: 200 });
}
