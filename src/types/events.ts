export type EventType = 'offline' | 'online' | 'hybrid'
export type EventVisibility = 'public' | 'private'
export type ApprovalMode = 'auto' | 'manual'
export type RsvpStatus = 'attending' | 'maybe' | 'declined'
export type ApplicationStatus = 'pending' | 'confirmed' | 'waitlisted' | 'rejected' | 'cancelled'
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
  stats?: EventStats
}

export interface EventStats {
  applied: number
  confirmed: number
  waitlisted: number
  pending: number
  rsvpAttending: number
  maybe: number
  declined: number
  total: number
}

export interface EventParticipation {
  eventId: string
  userId: string
  displayName: string
  pictureUrl?: string
  applicationStatus: ApplicationStatus
  rsvpStatus?: RsvpStatus
  companions: number
  message?: string
  rsvpMessage?: string
  onlineEnteredAt?: number
  checkedInAt?: number
  createdAt: number
  updatedAt: number
  decidedAt?: number
  rsvpUpdatedAt?: number
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
  overbookingPercent: string
  applicationLimit: string
  applicationStartsAt: string
  applicationEndsAt: string
  visibility: EventVisibility
  approvalMode: ApprovalMode
  dressCode: string
  giftNote: string
  contactNote: string
}
