import type { VercelRequest, VercelResponse } from '@vercel/node'

type RsvpStatus = 'attending' | 'maybe' | 'declined'

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

const text = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value.trim().slice(0, 1000) : fallback

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback

const rsvpKey = (eventId: string) => `imin:event:${eventId}:rsvps`
const eventKey = (id: string) => `imin:event:${id}`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: 'Redis not configured' })

  if (req.method === 'GET') {
    const eventId = text(req.query.eventId)
    const userId = text(req.query.userId)
    if (!eventId) return res.status(400).json({ error: 'eventId required' })

    if (userId) {
      const raw = await cmd(['HGET', rsvpKey(eventId), userId]) as string | null
      return res.status(200).json({ rsvp: raw ? JSON.parse(raw) : null })
    }

    const rows = await cmd(['HVALS', rsvpKey(eventId)]) as string[] | null
    return res.status(200).json({ rsvps: (rows ?? []).map(row => JSON.parse(row)) })
  }

  if (req.method === 'POST') {
    const { eventId, userId, displayName, pictureUrl } = req.body as Record<string, unknown>
    const id = text(eventId)
    const uid = text(userId)
    if (!id) return res.status(400).json({ error: 'eventId required' })
    if (!uid) return res.status(400).json({ error: 'userId required' })

    const eventExists = await cmd(['EXISTS', eventKey(id)]) as number
    if (!eventExists) return res.status(404).json({ error: 'Event not found' })

    const previousRaw = await cmd(['HGET', rsvpKey(id), uid]) as string | null
    const previous = previousRaw ? JSON.parse(previousRaw) as { createdAt?: number } : null
    const now = Date.now()
    const rsvp = {
      eventId: id,
      userId: uid,
      displayName: text(displayName, '참석자').slice(0, 80),
      pictureUrl: text(pictureUrl).slice(0, 500) || undefined,
      status: oneOf(req.body.status, ['attending', 'maybe', 'declined'] as const, 'attending') as RsvpStatus,
      companions: Math.max(0, Math.min(10, Math.floor(Number(req.body.companions) || 0))),
      message: text(req.body.message).slice(0, 500) || undefined,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    }

    await cmd(['HSET', rsvpKey(id), uid, JSON.stringify(rsvp)])
    return res.status(200).json({ ok: true, rsvp })
  }

  return res.status(405).end()
}
