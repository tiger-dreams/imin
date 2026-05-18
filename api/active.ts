import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

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

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(200).json({ users: [] })
  }

  // active set에서 userId 목록 조회
  const members = await redis(['SMEMBERS', 'imin:active']) as string[] | null
  if (!members || members.length === 0) return res.status(200).json({ users: [] })

  // 각 유저 데이터 가져오기
  const pipeline = members.map(id => ['GET', `imin:user:${id}`])
  const results = await redis(pipeline) as (string | null)[]

  const users = []
  const expired: string[] = []

  for (let i = 0; i < members.length; i++) {
    const raw = Array.isArray(results) ? results[i] : null
    if (raw) {
      users.push(typeof raw === 'string' ? JSON.parse(raw) : raw)
    } else {
      expired.push(members[i])
    }
  }

  // 만료된 유저 active set에서 제거
  if (expired.length > 0) {
    await redis(['SREM', 'imin:active', ...expired])
  }

  return res.status(200).json({ users })
}
