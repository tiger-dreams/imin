import type { VercelRequest, VercelResponse } from '@vercel/node'

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()
  if (!LINE_TOKEN) return res.status(500).json({ error: 'LINE token not configured' })

  const { userId, prize } = req.body as { userId: string; prize?: string }
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{
        type: 'flex',
        altText: `당첨 안내${prize ? `: ${prize}` : ''}`,
        contents: {
          type: 'bubble',
          size: 'kilo',
          header: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '당첨 안내', size: 'xs', color: '#4ade80', weight: 'bold' },
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
              { type: 'text', text: '추첨에 당첨되셨습니다. 상품 수령 방법은 운영진에게 문의해주세요.', size: 'sm', color: '#a1a1aa', margin: 'sm', wrap: true },
              ...(prize ? [
                { type: 'separator', margin: 'lg', color: '#27272a' },
                {
                  type: 'box', layout: 'horizontal', margin: 'lg',
                  contents: [
                    { type: 'text', text: '상품', size: 'sm', color: '#71717a', flex: 1 },
                    { type: 'text', text: prize, size: 'sm', color: '#facc15', weight: 'bold', flex: 2, align: 'end' },
                  ],
                },
              ] : []),
            ],
            backgroundColor: '#18181b',
            paddingAll: '18px',
          },
        },
      }],
    }),
  })

  const json = await response.json()
  return res.status(response.ok ? 200 : 500).json(response.ok ? { ok: true } : { error: json })
}
