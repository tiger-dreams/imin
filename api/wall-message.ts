import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const KEY = 'imin:wall:messages'
const MAX = 150

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'GET') {
    if (!REDIS_URL) return res.status(200).json({ messages: [] })
    const raw = await cmd(['LRANGE', KEY, 0, MAX - 1]) as string[]
    const messages = (raw || []).map(s => JSON.parse(s))
    return res.status(200).json({ messages })
  }

  if (req.method === 'POST') {
    if (!REDIS_URL) return res.status(500).json({ error: 'Redis not configured' })
    const { text, displayName, userId } = req.body as { text: string; displayName?: string; userId?: string }
    if (!text?.trim()) return res.status(400).json({ error: 'text required' })
    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: text.trim().slice(0, 60),
      displayName: displayName || '익명',
      userId,
      sentAt: Date.now(),
    }
    await cmd(['LPUSH', KEY, JSON.stringify(msg)])
    await cmd(['LTRIM', KEY, 0, MAX - 1])
    return res.status(200).json({ ok: true, msg })
  }

  if (req.method === 'DELETE') {
    if (!REDIS_URL) return res.status(500).json({ error: 'Redis not configured' })
    await cmd(['DEL', KEY])
    return res.status(200).json({ ok: true })
  }

  return res.status(405).end()
}
