import type { VercelRequest, VercelResponse } from '@vercel/node'

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

async function redisCmd(command: unknown[]) {
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const json = await res.json() as { result: unknown }
  return json.result
}

async function redisPipeline(commands: unknown[][]) {
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  })
  const json = await res.json() as { result: unknown }[]
  return json.map(r => r.result)
}

function makeMessage(text: string, linkUrl?: string) {
  const bubble: Record<string, unknown> = {
    type: 'bubble',
    size: 'kilo',
    header: {
      type: 'box', layout: 'vertical', backgroundColor: '#09090b', paddingAll: '14px',
      contents: [{ type: 'text', text: 'imin', size: 'lg', weight: 'bold', color: '#4ade80' }],
    },
    body: {
      type: 'box', layout: 'vertical', backgroundColor: '#18181b', paddingAll: '16px',
      contents: [{ type: 'text', text, wrap: true, color: '#f4f4f5', size: 'sm' }],
    },
  }
  if (linkUrl) {
    bubble.footer = {
      type: 'box', layout: 'vertical', backgroundColor: '#18181b',
      paddingTop: '0px', paddingBottom: '14px', paddingStart: '14px', paddingEnd: '14px',
      contents: [{
        type: 'button', style: 'primary', color: '#06C755', height: 'sm',
        action: { type: 'uri', label: '바로가기', uri: linkUrl },
      }],
    }
  }
  return [{ type: 'flex', altText: text, contents: bubble }]
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()
  if (!LINE_TOKEN) return res.status(500).json({ error: 'LINE token not configured' })

  const { text, linkUrl, broadcast, userIds: targetIds } = req.body as {
    text: string
    linkUrl?: string
    broadcast?: boolean   // true → LINE broadcast (전체 팔로워)
    userIds?: string[]    // 지정 시 해당 목록에만 multicast
  }
  if (!text?.trim()) return res.status(400).json({ error: 'text required' })

  const messages = makeMessage(text.trim(), linkUrl)

  // broadcast mode
  if (broadcast) {
    const lineRes = await fetch('https://api.line.me/v2/bot/message/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LINE_TOKEN}` },
      body: JSON.stringify({ messages }),
    })
    const json = await lineRes.json()
    if (!lineRes.ok) return res.status(500).json({ error: json })
    return res.status(200).json({ ok: true, sent: 'all' })
  }

  // 지정 userIds multicast (추첨 후 pool 전체 발송에 사용)
  if (targetIds && targetIds.length > 0) {
    const to = [...new Set(targetIds)].slice(0, 500)
    const lineRes = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LINE_TOKEN}` },
      body: JSON.stringify({ to, messages }),
    })
    const json = await lineRes.json()
    if (!lineRes.ok) return res.status(500).json({ error: json })
    return res.status(200).json({ ok: true, sent: to.length })
  }

  // active imin 유저에게만 발송 (기본)
  if (!REDIS_URL) return res.status(500).json({ error: 'Redis not configured' })
  const members = await redisCmd(['SMEMBERS', 'imin:active']) as string[] | null
  if (!members || members.length === 0) return res.status(200).json({ ok: true, sent: 0 })

  const results = await redisPipeline(members.map(id => ['GET', `imin:user:${id}`]))
  const userIds = members.filter((_, i) => !!results[i])
  if (userIds.length === 0) return res.status(200).json({ ok: true, sent: 0 })

  const lineRes = await fetch('https://api.line.me/v2/bot/message/multicast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LINE_TOKEN}` },
    body: JSON.stringify({ to: userIds.slice(0, 500), messages }),
  })
  const json = await lineRes.json()
  if (!lineRes.ok) return res.status(500).json({ error: json })
  return res.status(200).json({ ok: true, sent: userIds.length })
}
