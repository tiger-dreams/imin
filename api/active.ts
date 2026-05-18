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

async function pipeline(commands: unknown[][]) {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  })
  const json = await res.json() as { result: unknown }[]
  return json.map(r => r.result)
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(200).json({ users: [] })
  }

  const members = await cmd(['SMEMBERS', 'imin:active']) as string[] | null
  if (!members || members.length === 0) return res.status(200).json({ users: [] })

  const results = await pipeline(members.map(id => ['GET', `imin:user:${id}`]))

  const users = []
  const expired: string[] = []

  for (let i = 0; i < members.length; i++) {
    const raw = results[i]
    if (raw) {
      users.push(typeof raw === 'string' ? JSON.parse(raw) : raw)
    } else {
      expired.push(members[i])
    }
  }

  if (expired.length > 0) {
    await cmd(['SREM', 'imin:active', ...expired])
  }

  return res.status(200).json({ users })
}
