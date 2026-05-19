import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const TTL = 60 * 60 * 24 * 7 // 7 days

async function cmd(command: unknown[]) {
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const json = await res.json() as { result: unknown }
  return json.result
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // GET /api/raffle-prize-image?id=xxx — return image bytes
  if (req.method === 'GET') {
    const id = req.query.id as string
    if (!id || !REDIS_URL) return res.status(404).end()

    const raw = await cmd(['GET', `imin:prize:image:${id}`]) as string | null
    if (!raw) return res.status(404).end()

    const { data } = JSON.parse(raw) as { data: string; type: string }
    // data URL: "data:image/jpeg;base64,/9j/..."
    const commaIdx = data.indexOf(',')
    if (commaIdx === -1) return res.status(500).end()
    const base64 = data.slice(commaIdx + 1)
    const buf = Buffer.from(base64, 'base64')

    // Always JPEG after client-side compression
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': buf.length,
      'Cache-Control': 'public, max-age=604800',
      'Access-Control-Allow-Origin': '*',
    })
    res.end(buf)
    return
  }

  // POST /api/raffle-prize-image — upload image, return public URL
  if (req.method === 'POST') {
    if (!REDIS_URL) return res.status(500).json({ error: 'Redis not configured' })

    const { data, type } = req.body as { data: string; type: string }
    if (!data || !type) return res.status(400).json({ error: 'data and type required' })

    // Rough size check — base64 string length * 0.75 ≈ bytes
    if (data.length * 0.75 > 3 * 1024 * 1024) {
      return res.status(413).json({ error: '이미지가 너무 큽니다 (최대 3MB)' })
    }

    const id = Date.now().toString(36)
    await cmd(['SET', `imin:prize:image:${id}`, JSON.stringify({ data, type }), 'EX', TTL])

    const host = (req.headers['x-forwarded-host'] || req.headers.host) as string
    const proto = ((req.headers['x-forwarded-proto'] as string) || 'https').split(',')[0].trim()
    const url = `${proto}://${host}/api/raffle-prize-image?id=${id}`

    return res.status(200).json({ ok: true, url, id })
  }

  return res.status(405).end()
}
