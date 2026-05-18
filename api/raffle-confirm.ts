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
  if (req.method !== 'POST') return res.status(405).end()
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: 'Redis not configured' })

  const { userId } = req.body as { userId: string }
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const raw = await cmd(['GET', 'imin:raffle:state']) as string | null
  if (!raw) return res.status(404).json({ error: 'no raffle state' })

  const state = JSON.parse(raw) as { status: string; winners?: Array<{ userId: string; confirmed?: boolean }> }
  if (state.status !== 'result') return res.status(400).json({ error: 'not in result state' })

  const winner = state.winners?.find(w => w.userId === userId)
  if (!winner) return res.status(404).json({ error: 'not a winner' })

  winner.confirmed = true
  await cmd(['SET', 'imin:raffle:state', JSON.stringify(state), 'EX', 3600])
  return res.status(200).json({ ok: true })
}
