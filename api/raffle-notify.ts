import type { VercelRequest, VercelResponse } from '@vercel/node'

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()
  if (!LINE_TOKEN) return res.status(500).json({ error: 'LINE token not configured' })

  const { userId, prize, prizeImageUrl } = req.body as {
    userId: string
    prize?: string
    prizeImageUrl?: string
  }
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const bubble: Record<string, unknown> = {
    type: 'bubble',
    size: 'kilo',
    ...(prizeImageUrl ? {
      hero: {
        type: 'image',
        url: prizeImageUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
        action: { type: 'uri', label: 'image', uri: prizeImageUrl },
      },
    } : {}),
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: '당첨 안내', size: 'xs', color: '#4ade80', weight: 'bold' },
        { type: 'text', text: 'imin', size: 'xxl', weight: 'bold', color: '#f4f4f5' },
      ],
      backgroundColor: '#09090b',
      paddingAll: '18px',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: '🎉 축하합니다!', weight: 'bold', size: 'lg', color: '#f4f4f5' },
        ...(prize ? [
          {
            type: 'box', layout: 'horizontal', margin: 'sm',
            contents: [
              { type: 'text', text: '상품', size: 'sm', color: '#71717a', flex: 1 },
              { type: 'text', text: prize, size: 'sm', color: '#facc15', weight: 'bold', flex: 2, align: 'end', wrap: true },
            ],
          },
        ] : []),
        { type: 'separator', margin: 'lg', color: '#27272a' },
        ...(prizeImageUrl ? [
          {
            type: 'text',
            text: '위 이미지를 터치하면 기프티콘 바코드를 확인할 수 있습니다. 매장에서 바코드를 제시해주세요.',
            size: 'sm', color: '#a1a1aa', margin: 'md', wrap: true,
          },
        ] : [
          {
            type: 'text',
            text: '상품 수령은 운영진에게 문의해주세요.',
            size: 'sm', color: '#a1a1aa', margin: 'md', wrap: true,
          },
        ]),
        { type: 'separator', margin: 'lg', color: '#27272a' },
        {
          type: 'text',
          text: '☕ 커피 맛있게 드시고, imin team의 Hackday를 응원해주세요! 여러분의 투표가 큰 힘이 됩니다 💚',
          size: 'xs', color: '#52525b', margin: 'md', wrap: true,
        },
      ],
      backgroundColor: '#18181b',
      paddingAll: '18px',
    },
  }

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
        contents: bubble,
      }],
    }),
  })

  const json = await response.json()
  return res.status(response.ok ? 200 : 500).json(response.ok ? { ok: true } : { error: json })
}
