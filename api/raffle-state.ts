import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')

  if (req.method === 'GET') {
    if (!REDIS_URL || !REDIS_TOKEN) return res.status(200).json({ status: 'idle' })
    const raw = await cmd(['GET', 'imin:raffle:state']) as string | null
    return res.status(200).json(raw ? JSON.parse(raw) : { status: 'idle' })
  }

  if (req.method === 'POST') {
    if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: 'Redis not configured' })
    const state = req.body
    await cmd(['SET', 'imin:raffle:state', JSON.stringify(state), 'EX', 3600])
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
