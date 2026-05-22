export type EventType = 'offline' | 'online' | 'hybrid'
export type EventVisibility = 'public' | 'private'
export type ApprovalMode = 'auto' | 'manual'
export type RsvpStatus = 'attending' | 'maybe' | 'declined'
export type EventCategory = 'wedding' | 'party' | 'conference' | 'meetup'

export interface EventRecord {
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
  stats?: EventStats
}

export interface EventStats {
  attending: number
  maybe: number
  declined: number
  total: number
}

export interface EventRsvp {
  eventId: string
  userId: string
  displayName: string
  pictureUrl?: string
  status: RsvpStatus
  companions: number
  message?: string
  createdAt: number
  updatedAt: number
}

export interface EventFormState {
  title: string
  description: string
  category: EventCategory
  coverImageUrl: string
  coHostName: string
  startsAt: string
  endsAt: string
  timezone: string
  eventType: EventType
  venueName: string
  address: string
  onlineUrl: string
  capacity: string
  visibility: EventVisibility
  approvalMode: ApprovalMode
  dressCode: string
  giftNote: string
  contactNote: string
}
