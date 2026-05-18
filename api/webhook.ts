import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as crypto from 'crypto'

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET ?? ''
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? ''
const LIFF_ID = process.env.VITE_LIFF_ID ?? ''

function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha256', CHANNEL_SECRET)
    .update(body)
    .digest('base64')
  return hash === signature
}

async function replyMessage(replyToken: string, messages: object[]) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })
}

function welcomeMessage() {
  return {
    type: 'flex',
    altText: 'imin에 오신 것을 환영해요!',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'imin',
            size: 'xxl',
            weight: 'bold',
            color: '#4ade80',
          },
          {
            type: 'text',
            text: 'Tech Week Hackathon Idea Competition KR',
            size: 'xs',
            color: '#71717a',
            margin: 'xs',
          },
        ],
        backgroundColor: '#09090b',
        paddingAll: '20px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '지금 여기 있는 사람만 인증합니다',
            weight: 'bold',
            size: 'lg',
            color: '#f4f4f5',
            wrap: true,
          },
          {
            type: 'text',
            text: 'GeoIP + GPS로 현장 참석을 확인하고,\n활성 세션 추첨에 자동으로 참여됩니다.',
            size: 'sm',
            color: '#a1a1aa',
            margin: 'md',
            wrap: true,
          },
          {
            type: 'separator',
            margin: 'xl',
            color: '#27272a',
          },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'xl',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: '40pt', size: 'lg', weight: 'bold', color: '#4ade80', align: 'center' },
                  { type: 'text', text: '체크인', size: 'xs', color: '#71717a', align: 'center' },
                ],
                flex: 1,
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: '20pt', size: 'lg', weight: 'bold', color: '#4ade80', align: 'center' },
                  { type: 'text', text: 'GeoIP', size: 'xs', color: '#71717a', align: 'center' },
                ],
                flex: 1,
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  { type: 'text', text: '20pt', size: 'lg', weight: 'bold', color: '#4ade80', align: 'center' },
                  { type: 'text', text: 'GPS', size: 'xs', color: '#71717a', align: 'center' },
                ],
                flex: 1,
              },
            ],
          },
        ],
        backgroundColor: '#18181b',
        paddingAll: '20px',
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: "I'm in!",
              uri: `https://liff.line.me/${LIFF_ID}`,
            },
            style: 'primary',
            color: '#4ade80',
            height: 'sm',
          },
        ],
        backgroundColor: '#09090b',
        paddingAll: '16px',
      },
    },
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = JSON.stringify(req.body)
  const signature = req.headers['x-line-signature'] as string

  if (CHANNEL_SECRET && (!signature || !verifySignature(rawBody, signature))) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  const events = (req.body as { events: Array<{ type: string; replyToken?: string }> }).events ?? []

  await Promise.all(
    events.map(async event => {
      if (event.type === 'follow' && event.replyToken) {
        await replyMessage(event.replyToken, [welcomeMessage()])
      }
    })
  )

  return res.status(200).json({ ok: true })
}
