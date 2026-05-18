import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const TTL = 60 * 10 // 10분 비활성 시 만료

async function redis(cmd: unknown[]) {
  if (!REDIS_URL || !REDIS_TOKEN) return null
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  })
  const json = await res.json() as { result: unknown }
  return json.result
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, displayName, pictureUrl, city, country, countryCode, gpsLat, gpsLon } = req.body as {
    userId: string; displayName: string; pictureUrl?: string
    city: string; country: string; countryCode: string
    gpsLat?: number; gpsLon?: number
  }

  if (!userId) return res.status(400).json({ error: 'userId required' })

  const user = JSON.stringify({
    userId, displayName, pictureUrl, city, country, countryCode, gpsLat, gpsLon,
    checkedInAt: Date.now(),
  })

  await redis(['SET', `imin:user:${userId}`, user, 'EX', TTL])
  await redis(['SADD', 'imin:active', userId])

  return res.status(200).json({ ok: true })
}
