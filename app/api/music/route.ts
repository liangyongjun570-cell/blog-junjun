import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const NET_EASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com/',
}

type SongResult = {
  id: string
  name?: string
  artist?: string
  author?: string
  cover?: string
  pic?: string
  url?: string
  lrc?: string
  error?: string
}

type CachedSong = {
  name: string
  artist: string
  cover?: string
  lrc?: string
}

let cachePromise: Promise<Record<string, CachedSong>> | null = null

// 🌟 解析网易云外链 302 后的最终 CDN 直链（https 直链带 CORS 头，支持 Web Audio 频谱）
const directUrlCache = new Map<string, { url: string; expires: number }>()
const DIRECT_URL_TTL = 25 * 60 * 1000 // 直链带时间签名，约 25 分钟刷新一次

async function resolveDirectUrl(songId: string): Promise<string> {
  const hit = directUrlCache.get(songId)
  if (hit && hit.expires > Date.now()) return hit.url
  const outerUrl = `https://music.163.com/song/media/outer/url?id=${songId}.mp3`
  try {
    const res = await fetch(outerUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: { ...NET_EASE_HEADERS, Range: 'bytes=0-1' },
      signal: AbortSignal.timeout(6000),
    })
    const loc = res.headers.get('location')
    let finalUrl =
      loc && loc.startsWith('http') ? loc.replace(/^http:\/\//, 'https://') : outerUrl
    // 🌟 关键修复：服务器在海外（Vercel）时网易云会把外链 302 到 /404（区域限制）。
    // 此时不能把死链 404 返回给前端，改回外链原 URL，让访问者浏览器自行 302
    //（浏览器在国内，能拿到真实 CDN 直链，播放不受影响，只是频谱拿不到 CORS 数据）
    if (/music\.163\.com\/404/.test(finalUrl)) {
      finalUrl = outerUrl
      // 区域限制是长期的，缓存短一点，避免把无效解析结果长期钉死
      directUrlCache.set(songId, { url: finalUrl, expires: Date.now() + 60 * 1000 })
      return finalUrl
    }
    directUrlCache.set(songId, { url: finalUrl, expires: Date.now() + DIRECT_URL_TTL })
    return finalUrl
  } catch {
    // 解析失败时回退外链：播放不受影响，只是频谱可能拿不到数据
    return outerUrl
  }
}

function loadCache(): Promise<Record<string, CachedSong>> {
  if (!cachePromise) {
    cachePromise = readFile(path.join(process.cwd(), 'data', 'music-cache.json'), 'utf-8')
      .then((text) => JSON.parse(text))
      .catch(() => ({}))
  }
  return cachePromise
}

function fromCache(songId: string, cached: CachedSong | undefined): SongResult | null {
  if (!cached || !cached.name) return null
  return {
    id: songId,
    name: cached.name,
    artist: cached.artist,
    author: cached.artist,
    cover: cached.cover || '',
    pic: cached.cover || '',
    url: '',
    lrc: cached.lrc || '',
  }
}

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
  }

  const songIds = ids.split(',').map((id) => id.trim()).filter(Boolean)
  const cache = await loadCache()

  const results: SongResult[] = await Promise.all(
    songIds.map(async (songId): Promise<SongResult> => {
      try {
        const [detailRes, lrcRes] = await Promise.all([
          fetch(
            `https://music.163.com/api/song/detail/?id=${songId}&ids=[${songId}]`,
            { headers: NET_EASE_HEADERS, signal: AbortSignal.timeout(6000) },
          ),
          fetch(
            `https://music.163.com/api/song/lyric?id=${songId}&lv=-1&kv=-1&tv=-1`,
            { headers: NET_EASE_HEADERS, signal: AbortSignal.timeout(6000) },
          ).catch(() => null),
        ])

        const detail = await detailRes.json()
        const song = detail.songs?.[0]

        if (!song) {
          // 网易云接口不可用(限流/风控)时回退到本地缓存
          const cached = fromCache(songId, cache[songId])
          if (cached) return { ...cached, url: await resolveDirectUrl(songId) }
          return { id: songId, error: 'not_found' }
        }

        let lrcText = ''
        if (lrcRes && lrcRes.ok) {
          try {
            const lrcData = await lrcRes.json()
            lrcText = lrcData.lrc?.lyric || ''
          } catch {
            /* 歌词可选，失败不影响主流程 */
          }
        }
        // 歌词接口失败时也回退缓存
        if (!lrcText && cache[songId]?.lrc) {
          lrcText = cache[songId].lrc || ''
        }

        const artistName = song.artists?.[0]?.name || '未知歌手'

        return {
          id: songId,
          name: song.name,
          artist: artistName,
          author: artistName,
          cover: song.album?.picUrl || '',
          pic: song.album?.picUrl || '',
          url: await resolveDirectUrl(songId),
          lrc: lrcText,
        }
      } catch (error) {
        console.error(`[api/music] 获取歌曲 ${songId} 失败:`, error)
        const cached = fromCache(songId, cache[songId])
        if (cached) return { ...cached, url: await resolveDirectUrl(songId) }
        return { id: songId, error: String(error) }
      }
    }),
  )

  return NextResponse.json(results)
}
