import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const TTL = 45 // heartbeat 20s 주기, 2회 miss 허용

async function cmd(command: unknown[]) {
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  return res.json()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()

  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: 'Redis not configured' })

  const { userId, displayName, pictureUrl, city, country, countryCode, gpsLat, gpsLon } = req.body as {
    userId: string; displayName: string; pictureUrl?: string
    city: string; country: string; countryCode: string
    gpsLat?: number; gpsLon?: number
  }

  if (!userId) return res.status(400).json({ error: 'userId required' })

  const score = 40 + 20 + (gpsLat ? 20 : 0) // checkin(40) + geoip(20) + gps(20)

  const user = JSON.stringify({
    userId, displayName, pictureUrl, city, country, countryCode, gpsLat, gpsLon,
    score, checkedInAt: Date.now(),
  })

  await cmd(['SET', `imin:user:${userId}`, user, 'EX', TTL])
  await cmd(['SADD', 'imin:active', userId])

  return res.status(200).json({ ok: true, score })
}
