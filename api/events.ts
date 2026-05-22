import type { VercelRequest, VercelResponse } from '@vercel/node'

type EventType = 'offline' | 'online' | 'hybrid'
type EventVisibility = 'public' | 'private'
type ApprovalMode = 'auto' | 'manual'
type EventCategory = 'wedding' | 'party' | 'conference' | 'meetup'

interface EventRecord {
  id: string
  title: string
  description: string
  category: EventCategory
  coverImageUrl?: string
  hostUserId: string
  hostName: string
  coHostName?: string
  startsAt: string
  endsAt?: string
  timezone: string
  eventType: EventType
  venueName?: string
  address?: string
  geoLat?: number
  geoLon?: number
  onlineUrl?: string
  capacity?: number
  visibility: EventVisibility
  approvalMode: ApprovalMode
  dressCode?: string
  giftNote?: string
  contactNote?: string
  createdAt: number
  updatedAt: number
}

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const PUBLIC_EVENTS_KEY = 'imin:events:public'
const RECENT_EVENTS_KEY = 'imin:events:recent'
const MAX_LIST = 50

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

const text = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value.trim().slice(0, 2000) : fallback

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback

const optionalUrl = (value: unknown) => {
  const raw = text(value)
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol)) return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

const eventKey = (id: string) => `imin:event:${id}`
const hostKey = (hostUserId: string) => `imin:events:host:${hostUserId}`
const rsvpKey = (id: string) => `imin:event:${id}:rsvps`

function makeId(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
  return `${slug || 'event'}-${Date.now().toString(36)}`
}

async function readEvents(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, MAX_LIST)
  if (unique.length === 0) return []
  const rows = await pipeline(unique.map(id => ['GET', eventKey(id)]))
  const events = rows
    .map(row => typeof row === 'string' ? JSON.parse(row) as EventRecord : null)
    .filter((event): event is EventRecord => !!event)
  return events.sort((a, b) => b.createdAt - a.createdAt)
}

async function statsFor(eventId: string) {
  const rows = await cmd(['HVALS', rsvpKey(eventId)]) as string[] | null
  const stats = { attending: 0, maybe: 0, declined: 0, total: 0 }
  for (const raw of rows ?? []) {
    const rsvp = JSON.parse(raw) as { status?: string; companions?: number }
    if (rsvp.status === 'attending') stats.attending += 1 + Math.max(0, rsvp.companions ?? 0)
    if (rsvp.status === 'maybe') stats.maybe += 1 + Math.max(0, rsvp.companions ?? 0)
    if (rsvp.status === 'declined') stats.declined += 1
    stats.total += 1
  }
  return stats
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: 'Redis not configured' })

  if (req.method === 'GET') {
    const id = text(req.query.id)
    const hostUserId = text(req.query.hostUserId)

    if (id) {
      const raw = await cmd(['GET', eventKey(id)]) as string | null
      if (!raw) return res.status(404).json({ error: 'Event not found' })
      const event = JSON.parse(raw) as EventRecord
      return res.status(200).json({ event: { ...event, stats: await statsFor(id) } })
    }

    if (hostUserId) {
      const ids = await cmd(['SMEMBERS', hostKey(hostUserId)]) as string[] | null
      return res.status(200).json({ events: await readEvents(ids ?? []) })
    }

    const publicIds = await cmd(['LRANGE', RECENT_EVENTS_KEY, 0, MAX_LIST - 1]) as string[] | null
    const events = (await readEvents(publicIds ?? [])).filter(event => event.visibility === 'public')
    return res.status(200).json({ events })
  }

  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown>
    const title = text(body.title).slice(0, 120)
    const hostUserId = text(body.hostUserId).slice(0, 120)
    const hostName = text(body.hostName, '주최자').slice(0, 80)
    const startsAt = text(body.startsAt)

    if (!title) return res.status(400).json({ error: 'title required' })
    if (!hostUserId) return res.status(400).json({ error: 'hostUserId required' })
    if (!startsAt) return res.status(400).json({ error: 'startsAt required' })

    const now = Date.now()
    const visibility = oneOf(body.visibility, ['public', 'private'] as const, 'public')
    const event: EventRecord = {
      id: makeId(title),
      title,
      description: text(body.description).slice(0, 1200),
      category: oneOf(body.category, ['wedding', 'party', 'conference', 'meetup'] as const, 'wedding'),
      coverImageUrl: optionalUrl(body.coverImageUrl),
      hostUserId,
      hostName,
      coHostName: text(body.coHostName).slice(0, 80) || undefined,
      startsAt,
      endsAt: text(body.endsAt) || undefined,
      timezone: text(body.timezone, 'Asia/Seoul') || 'Asia/Seoul',
      eventType: oneOf(body.eventType, ['offline', 'online', 'hybrid'] as const, 'offline'),
      venueName: text(body.venueName).slice(0, 120) || undefined,
      address: text(body.address).slice(0, 240) || undefined,
      onlineUrl: optionalUrl(body.onlineUrl),
      capacity: Number.isFinite(Number(body.capacity)) && Number(body.capacity) > 0 ? Math.floor(Number(body.capacity)) : undefined,
      visibility,
      approvalMode: oneOf(body.approvalMode, ['auto', 'manual'] as const, 'auto'),
      dressCode: text(body.dressCode).slice(0, 160) || undefined,
      giftNote: text(body.giftNote).slice(0, 500) || undefined,
      contactNote: text(body.contactNote).slice(0, 500) || undefined,
      createdAt: now,
      updatedAt: now,
    }

    await cmd(['SET', eventKey(event.id), JSON.stringify(event)])
    await cmd(['SADD', hostKey(hostUserId), event.id])
    await cmd(['LPUSH', RECENT_EVENTS_KEY, event.id])
    await cmd(['LTRIM', RECENT_EVENTS_KEY, 0, MAX_LIST - 1])
    if (visibility === 'public') await cmd(['SADD', PUBLIC_EVENTS_KEY, event.id])

    return res.status(201).json({ ok: true, event })
  }

  return res.status(405).end()
}
