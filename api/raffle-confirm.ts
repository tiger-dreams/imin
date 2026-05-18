import type { VercelRequest, VercelResponse } from '@vercel/node'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

async function cmd(command: unknown[]) {
  const res = await fetch(`${REDIS_URL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  const json = await res.json() as { result: unknown }
  return json.result
}

async function pushWinnerMessage(userId: string, prize: string) {
  if (!LINE_TOKEN) return
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{
        type: 'flex',
        altText: `당첨을 축하합니다! 상품: ${prize}`,
        contents: {
          type: 'bubble',
          size: 'kilo',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '당첨 확정', size: 'xs', color: '#4ade80', weight: 'bold' },
              { type: 'text', text: 'imin!', size: 'xxl', weight: 'bold', color: '#f4f4f5' },
            ],
            backgroundColor: '#09090b',
            paddingAll: '18px',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '축하합니다!', weight: 'bold', size: 'lg', color: '#f4f4f5' },
              { type: 'text', text: '추첨 확인이 완료되었습니다.', size: 'sm', color: '#a1a1aa', margin: 'sm' },
              { type: 'separator', margin: 'lg', color: '#27272a' },
              {
                type: 'box', layout: 'horizontal', margin: 'lg',
                contents: [
                  { type: 'text', text: '상품', size: 'sm', color: '#71717a', flex: 1 },
                  { type: 'text', text: prize || '—', size: 'sm', color: '#facc15', weight: 'bold', flex: 2, align: 'end' },
                ],
              },
            ],
            backgroundColor: '#18181b',
            paddingAll: '18px',
          },
        },
      }],
    }),
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(500).json({ error: 'Redis not configured' })

  const { userId } = req.body as { userId: string }
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const raw = await cmd(['GET', 'imin:raffle:state']) as string | null
  if (!raw) return res.status(404).json({ error: 'no raffle state' })

  const state = JSON.parse(raw) as {
    status: string
    prize?: string
    winners?: Array<{ userId: string; confirmed?: boolean }>
  }
  if (state.status !== 'result') return res.status(400).json({ error: 'not in result state' })

  const winner = state.winners?.find(w => w.userId === userId)
  if (!winner) return res.status(404).json({ error: 'not a winner' })

  winner.confirmed = true
  await cmd(['SET', 'imin:raffle:state', JSON.stringify(state), 'EX', 3600])

  // LINE push 메시지 (실패해도 confirm은 성공 처리)
  await pushWinnerMessage(userId, state.prize ?? '').catch(() => {})

  return res.status(200).json({ ok: true })
}
