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
    url: `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
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
          if (cached) return cached
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
          url: `https://music.163.com/song/media/outer/url?id=${songId}.mp3`,
          lrc: lrcText,
        }
      } catch (error) {
        console.error(`[api/music] 获取歌曲 ${songId} 失败:`, error)
        const cached = fromCache(songId, cache[songId])
        if (cached) return cached
        return { id: songId, error: String(error) }
      }
    }),
  )

  return NextResponse.json(results)
}
