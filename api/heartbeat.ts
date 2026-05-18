import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const TTL = 60 * 10

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

  const { userId } = req.body as { userId: string }
  if (!userId) return res.status(400).json({ error: 'userId required' })

  await redis(['EXPIRE', `imin:user:${userId}`, TTL])
  return res.status(200).json({ ok: true })
}
