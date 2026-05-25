import type { VercelRequest, VercelResponse } from '@vercel/node'

type EventType = 'offline' | 'online' | 'hybrid'
type EventVisibility = 'public' | 'private'
type ApprovalMode = 'auto' | 'manual'
type EventCategory = 'wedding' | 'party' | 'conference' | 'meetup'
type RsvpStatus = 'attending' | 'maybe' | 'declined'
type ApplicationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'rejected' | 'cancelled'

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
  overbookingPercent?: number
  applicationLimit?: number
  applicationStartsAt?: string
  applicationEndsAt?: string
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
const participationKey = (id: string) => `imin:event:${id}:participations`

const adminUserIds = () =>
  (process.env.IMIN_ADMIN_USER_IDS ?? '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)

const canManageEvent = (event: EventRecord, userId: string) =>
  !!userId && (event.hostUserId === userId || adminUserIds().includes(userId))

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
  const rows = await cmd(['HVALS', participationKey(eventId)]) as string[] | null
  const stats = { applied: 0, confirmed: 0, waitlisted: 0, pending: 0, rsvpAttending: 0, maybe: 0, declined: 0, total: 0 }
  for (const raw of rows ?? []) {
    const participation = JSON.parse(raw) as { applicationStatus?: string; rsvpStatus?: string; companions?: number }
    stats.applied += 1
    if (participation.applicationStatus === 'confirmed') stats.confirmed += 1
    if (participation.applicationStatus === 'waitlisted') stats.waitlisted += 1
    if (participation.applicationStatus === 'pending') stats.pending += 1
    if (participation.rsvpStatus === 'attending') stats.rsvpAttending += 1 + Math.max(0, participation.companions ?? 0)
    if (participation.rsvpStatus === 'maybe') stats.maybe += 1 + Math.max(0, participation.companions ?? 0)
    if (participation.rsvpStatus === 'declined') stats.declined += 1
    stats.total += 1
  }
  return stats
}

async function activeApplicationCount(eventId: string) {
  const rows = await cmd(['HVALS', participationKey(eventId)]) as string[] | null
  let count = 0
  for (const raw of rows ?? []) {
    const participation = JSON.parse(raw) as { applicationStatus?: string }
    if (!['rejected', 'cancelled'].includes(participation.applicationStatus ?? 'pending')) count += 1
  }
  return count
}

async function confirmedCount(eventId: string, excludingUserId?: string) {
  const rows = await cmd(['HVALS', participationKey(eventId)]) as string[] | null
  let count = 0
  for (const raw of rows ?? []) {
    const participation = JSON.parse(raw) as { userId?: string; applicationStatus?: string }
    if (participation.userId !== excludingUserId && participation.applicationStatus === 'confirmed') count += 1
  }
  return count
}

function confirmationLimit(event: EventRecord) {
  if (!event.capacity) return Number.POSITIVE_INFINITY
  return Math.floor(event.capacity * Math.max(100, event.overbookingPercent ?? 100) / 100)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: 'Redis not configured' })

  if (req.method === 'GET') {
    const action = text(req.query.action)
    const id = text(req.query.id)
    const hostUserId = text(req.query.hostUserId)
    const eventId = text(req.query.eventId)
    const userId = text(req.query.userId)
    const requesterUserId = text(req.query.requesterUserId)

    if (action === 'participation' || action === 'rsvp') {
      if (!eventId) return res.status(400).json({ error: 'eventId required' })

      if (userId) {
        const raw = await cmd(['HGET', participationKey(eventId), userId]) as string | null
        return res.status(200).json({ participation: raw ? JSON.parse(raw) : null, rsvp: raw ? JSON.parse(raw) : null })
      }

      const rows = await cmd(['HVALS', participationKey(eventId)]) as string[] | null
      const eventRaw = await cmd(['GET', eventKey(eventId)]) as string | null
      if (!eventRaw) return res.status(404).json({ error: 'Event not found' })
      const event = JSON.parse(eventRaw) as EventRecord
      if (!canManageEvent(event, requesterUserId)) return res.status(403).json({ error: 'Forbidden' })
      const participations = (rows ?? []).map(row => JSON.parse(row))
      return res.status(200).json({ participations, rsvps: participations })
    }

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
    if (body.action === 'delete') {
      const id = text(body.eventId)
      const actorUserId = text(body.actorUserId)
      if (!id) return res.status(400).json({ error: 'eventId required' })
      if (!actorUserId) return res.status(400).json({ error: 'actorUserId required' })
      const eventRaw = await cmd(['GET', eventKey(id)]) as string | null
      if (!eventRaw) return res.status(404).json({ error: 'Event not found' })
      const event = JSON.parse(eventRaw) as EventRecord
      if (!canManageEvent(event, actorUserId)) return res.status(403).json({ error: 'Forbidden' })
      await pipeline([
        ['DEL', eventKey(id)],
        ['DEL', participationKey(id)],
        ['SREM', hostKey(event.hostUserId), id],
        ['SREM', PUBLIC_EVENTS_KEY, id],
        ['LREM', RECENT_EVENTS_KEY, 0, id],
      ])
      return res.status(200).json({ ok: true })
    }

    if (body.action === 'visibility') {
      const id = text(body.eventId)
      const actorUserId = text(body.actorUserId)
      const visibility = oneOf(body.visibility, ['public', 'private'] as const, 'public')
      if (!id) return res.status(400).json({ error: 'eventId required' })
      if (!actorUserId) return res.status(400).json({ error: 'actorUserId required' })
      const eventRaw = await cmd(['GET', eventKey(id)]) as string | null
      if (!eventRaw) return res.status(404).json({ error: 'Event not found' })
      const event = JSON.parse(eventRaw) as EventRecord
      if (!canManageEvent(event, actorUserId)) return res.status(403).json({ error: 'Forbidden' })
      const next = { ...event, visibility, updatedAt: Date.now() }
      await pipeline([
        ['SET', eventKey(id), JSON.stringify(next)],
        visibility === 'public' ? ['SADD', PUBLIC_EVENTS_KEY, id] : ['SREM', PUBLIC_EVENTS_KEY, id],
      ])
      return res.status(200).json({ ok: true, event: next })
    }

    if (body.action === 'participation' || body.action === 'rsvp') {
      const id = text(body.eventId)
      const uid = text(body.userId)
      const actorUserId = text(body.actorUserId, uid)
      if (!id) return res.status(400).json({ error: 'eventId required' })
      if (!uid) return res.status(400).json({ error: 'userId required' })

      const eventExists = await cmd(['EXISTS', eventKey(id)]) as number
      if (!eventExists) return res.status(404).json({ error: 'Event not found' })
      const eventRaw = await cmd(['GET', eventKey(id)]) as string | null
      const event = eventRaw ? JSON.parse(eventRaw) as EventRecord : null
      const isManager = !!event && canManageEvent(event, actorUserId)
      if (uid !== actorUserId && !isManager) return res.status(403).json({ error: 'Forbidden' })

      const previousRaw = await cmd(['HGET', participationKey(id), uid]) as string | null
      const previous = previousRaw ? JSON.parse(previousRaw) as {
        createdAt?: number
        applicationStatus?: ApplicationStatus
        rsvpStatus?: RsvpStatus
        companions?: number
        message?: string
        rsvpMessage?: string
        onlineEnteredAt?: number
        checkedInAt?: number
        decidedAt?: number
        rsvpUpdatedAt?: number
      } : null
      const now = Date.now()
      const nextApplicationStatus = oneOf(
        body.applicationStatus,
        ['pending', 'confirmed', 'waitlisted', 'rejected', 'cancelled'] as const,
        previous?.applicationStatus ?? 'pending'
      ) as ApplicationStatus
      if (event && !isManager) {
        const allowedGuestStatus = event.approvalMode === 'auto' ? 'confirmed' : 'pending'
        if (nextApplicationStatus !== (previous?.applicationStatus ?? allowedGuestStatus)) {
          return res.status(403).json({ error: 'Only hosts or admins can change application status' })
        }
      }
      const rsvpStatus = body.rsvpStatus
        ? oneOf(body.rsvpStatus, ['attending', 'maybe', 'declined'] as const, 'attending') as RsvpStatus
        : previous?.rsvpStatus
      const participation = {
        eventId: id,
        userId: uid,
        displayName: text(body.displayName, '참석자').slice(0, 80),
        pictureUrl: text(body.pictureUrl).slice(0, 500) || undefined,
        applicationStatus: nextApplicationStatus,
        rsvpStatus,
        companions: body.companions === undefined ? previous?.companions ?? 0 : Math.max(0, Math.min(10, Math.floor(Number(body.companions) || 0))),
        message: text(body.message).slice(0, 500) || previous?.message || undefined,
        rsvpMessage: text(body.rsvpMessage).slice(0, 500) || previous?.rsvpMessage || undefined,
        onlineEnteredAt: Number.isFinite(Number(body.onlineEnteredAt)) ? Number(body.onlineEnteredAt) : previous?.onlineEnteredAt,
        checkedInAt: Number.isFinite(Number(body.checkedInAt)) ? Number(body.checkedInAt) : previous?.checkedInAt,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
        decidedAt: nextApplicationStatus !== previous?.applicationStatus ? now : previous?.decidedAt,
        rsvpUpdatedAt: body.rsvpStatus ? now : previous?.rsvpUpdatedAt,
      }

      const isNewApplication = !previous && ['pending', 'confirmed'].includes(nextApplicationStatus)
      if (event && isNewApplication) {
        const applicationStart = event.applicationStartsAt ? new Date(event.applicationStartsAt).getTime() : Number.NEGATIVE_INFINITY
        const applicationEnd = event.applicationEndsAt ? new Date(event.applicationEndsAt).getTime() : Number.POSITIVE_INFINITY
        if (Number.isFinite(applicationStart) && now < applicationStart) return res.status(409).json({ error: 'Application is not open yet' })
        if (Number.isFinite(applicationEnd) && now > applicationEnd) return res.status(409).json({ error: 'Application is closed' })
        if (event.applicationLimit && await activeApplicationCount(id) >= event.applicationLimit) return res.status(409).json({ error: 'Application limit reached' })
      }
      if (event && nextApplicationStatus === 'confirmed' && previous?.applicationStatus !== 'confirmed') {
        if (await confirmedCount(id, uid) >= confirmationLimit(event)) return res.status(409).json({ error: 'Confirmation limit reached' })
      }

      await cmd(['HSET', participationKey(id), uid, JSON.stringify(participation)])
      return res.status(200).json({ ok: true, participation, rsvp: participation })
    }

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
      category: oneOf(body.category, ['wedding', 'party', 'conference', 'meetup'] as const, 'meetup'),
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
      overbookingPercent: Number.isFinite(Number(body.overbookingPercent)) && Number(body.overbookingPercent) >= 100
        ? Math.min(200, Math.floor(Number(body.overbookingPercent)))
        : 100,
      applicationLimit: Number.isFinite(Number(body.applicationLimit)) && Number(body.applicationLimit) > 0 ? Math.floor(Number(body.applicationLimit)) : undefined,
      applicationStartsAt: text(body.applicationStartsAt) || undefined,
      applicationEndsAt: text(body.applicationEndsAt) || undefined,
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
