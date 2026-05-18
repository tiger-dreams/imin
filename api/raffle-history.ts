import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const HISTORY_KEY = 'imin:raffle:history'
const MAX_HISTORY = 20

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
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: 'Redis not configured' })

  if (req.method === 'GET') {
    const raw = await cmd(['LRANGE', HISTORY_KEY, 0, MAX_HISTORY - 1]) as string[]
    const history = (raw ?? []).map(s => JSON.parse(s))
    return res.status(200).json({ history })
  }

  if (req.method === 'POST') {
    const entry = { ...req.body, savedAt: Date.now() }
    await cmd(['LPUSH', HISTORY_KEY, JSON.stringify(entry)])
    await cmd(['LTRIM', HISTORY_KEY, 0, MAX_HISTORY - 1])
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
