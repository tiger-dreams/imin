import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft, CalendarDays, CheckCircle, Clipboard, Clock, Copy, ExternalLink, Gift,
  Heart, Home, Link as LinkIcon, Loader2, LogOut, MapPin, MessageCircle,
  MonitorPlay, Plus, Send, Share2, Sparkles, Ticket, UserRound, Users,
} from 'lucide-react'
import { useLiff } from '../contexts/LiffContext'
import type { ApplicationStatus, EventCategory, EventFormState, EventParticipation, EventRecord, EventType, RsvpStatus } from '../types/events'

const DEFAULT_FORM: EventFormState = {
  title: '',
  description: '',
  category: 'meetup',
  coverImageUrl: '',
  coHostName: '',
  startsAt: '',
  endsAt: '',
  timezone: 'Asia/Seoul',
  eventType: 'offline',
  venueName: '',
  address: '',
  onlineUrl: '',
  capacity: '',
  visibility: 'public',
  approvalMode: 'auto',
  dressCode: '',
  giftNote: '',
  contactNote: '',
}

const CATEGORY_PRESETS: Record<EventCategory, Partial<EventFormState>> = {
  wedding: {
    title: '우리의 결혼식에 초대합니다',
    description: '소중한 분들과 함께 기쁜 날을 나누고 싶습니다.',
    coHostName: '',
    coverImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80',
    eventType: 'offline',
    venueName: '아름다운 정원 웨딩홀',
    address: '서울특별시 중구 세종대로 110',
    capacity: '120',
    dressCode: '밝은 색감의 단정한 복장',
    giftNote: '축하의 마음만으로도 충분합니다.',
    contactNote: '참석 관련 문의는 신랑/신부에게 LINE으로 남겨주세요.',
  },
  party: {
    title: '금요일 밤 루프탑 파티',
    description: '좋은 음악, 가벼운 음식, 반가운 사람들과 편하게 만나는 밤입니다.',
    coHostName: '',
    coverImageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=80',
    eventType: 'offline',
    venueName: '성수 루프 라운지',
    address: '서울특별시 성동구 성수이로 88',
    capacity: '60',
    dressCode: '편한 파티룩',
    giftNote: '각자 마실 음료 하나씩 가져오면 좋아요.',
    contactNote: '늦게 도착하면 입구에서 주최자에게 메시지를 보내주세요.',
  },
  conference: {
    title: 'AI Product Night 2026',
    description: '제품을 만드는 사람들을 위한 짧은 발표와 네트워킹 세션입니다.',
    coHostName: '',
    coverImageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80',
    eventType: 'hybrid',
    venueName: '강남 스타트업 라운지',
    address: '서울특별시 강남구 테헤란로 123',
    onlineUrl: 'https://meet.example.com/imin-event',
    capacity: '100',
    dressCode: '캐주얼',
    giftNote: '현장 참석자에게 네트워킹 음료가 제공됩니다.',
    contactNote: '발표자/스폰서 문의는 운영진에게 남겨주세요.',
  },
  meetup: {
    title: '토요일 커뮤니티 밋업',
    description: '관심사가 비슷한 사람들이 모여 가볍게 이야기하고 연결되는 시간입니다.',
    coHostName: '',
    coverImageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=80',
    eventType: 'offline',
    venueName: '커뮤니티 라운지',
    address: '서울특별시 마포구 동교로 25길',
    capacity: '30',
    dressCode: '편한 복장',
    giftNote: '간단한 다과가 준비됩니다.',
    contactNote: '자리가 좁아 동반 인원이 있으면 미리 알려주세요.',
  },
}

const PRESET_KEYS: (keyof EventFormState)[] = [
  'title', 'description', 'coHostName', 'coverImageUrl', 'eventType', 'venueName', 'address',
  'onlineUrl', 'capacity', 'dressCode', 'giftNote', 'contactNote',
]

const SAMPLE_EVENTS: EventRecord[] = [
  {
    id: 'sample-meetup',
    title: '토요일 커뮤니티 밋업',
    description: '관심사가 비슷한 사람들이 모여 가볍게 이야기하고 연결되는 시간입니다.',
    category: 'meetup',
    coverImageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=80',
    hostUserId: 'sample-host',
    hostName: 'imin team',
    startsAt: '2026-06-20T13:00',
    endsAt: '2026-06-20T15:00',
    timezone: 'Asia/Seoul',
    eventType: 'offline',
    venueName: '커뮤니티 라운지',
    address: '서울특별시 마포구 동교로 25길',
    capacity: 30,
    visibility: 'public',
    approvalMode: 'auto',
    dressCode: '편한 복장',
    giftNote: '간단한 다과가 준비됩니다.',
    contactNote: '자리가 좁아 동반 인원이 있으면 미리 알려주세요.',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    stats: { applied: 25, confirmed: 18, waitlisted: 4, pending: 3, rsvpAttending: 0, maybe: 0, declined: 0, total: 25 },
  },
]

const STORAGE_EVENTS = 'imin:events:local'
const STORAGE_RSVPS = 'imin:event-participations:local'
const STORAGE_PROFILE = 'imin:profile-settings:local'

interface ProfileSettings {
  realName: string
  email: string
  phone: string
  company: string
  role: string
  interests: string[]
  eventAlerts: boolean
}

const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  realName: '',
  email: '',
  phone: '',
  company: '',
  role: '',
  interests: ['밋업', '네트워킹'],
  eventAlerts: true,
}

const INTEREST_OPTIONS = ['밋업', '네트워킹', 'AI', '스타트업', '디자인', '개발', '웨딩', '파티', '컨퍼런스']

type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'detail'; id: string }

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

export default function EventPlatformPage() {
  const { profile, logout } = useLiff()
  const [route, setRoute] = useState<Route>(() => resolveRoute())
  const [events, setEvents] = useState<EventRecord[]>([])
  const [myEvents, setMyEvents] = useState<EventRecord[]>([])
  const [selected, setSelected] = useState<EventRecord | null>(null)
  const [myParticipation, setMyParticipation] = useState<EventParticipation | null>(null)
  const [participations, setParticipations] = useState<EventParticipation[]>([])
  const [loadState, setLoadState] = useState<LoadState>('idle')

  useEffect(() => {
    const onPop = () => setRoute(resolveRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: string) => {
    window.history.pushState({}, '', to)
    setRoute(resolveRoute())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const refreshHome = useCallback(async () => {
    setLoadState('loading')
    try {
      const [publicEvents, mine] = await Promise.all([
        fetchEvents(),
        profile?.userId ? fetchEvents(profile.userId) : Promise.resolve([]),
      ])
      setEvents(publicEvents)
      setMyEvents(mine)
      setLoadState('ready')
    } catch {
      const local = readLocalEvents()
      setEvents(local.length ? local : SAMPLE_EVENTS)
      setMyEvents(profile?.userId ? local.filter(event => event.hostUserId === profile.userId) : [])
      setLoadState('ready')
    }
  }, [profile?.userId])

  const refreshDetail = useCallback(async (id: string) => {
    setLoadState('loading')
    try {
      const event = await fetchEvent(id)
      setSelected(event)
      if (profile?.userId) setMyParticipation(await fetchParticipation(id, profile.userId))
      if (profile?.userId && event.hostUserId === profile.userId) setParticipations(await fetchParticipations(id))
      setLoadState('ready')
    } catch {
      const event = [...readLocalEvents(), ...SAMPLE_EVENTS].find(item => item.id === id) ?? null
      setSelected(event)
      setMyParticipation(profile?.userId ? readLocalParticipation(id, profile.userId) : null)
      setParticipations(event && profile?.userId === event.hostUserId ? readLocalParticipations(id) : [])
      setLoadState(event ? 'ready' : 'error')
    }
  }, [profile?.userId])

  useEffect(() => {
    if (route.name === 'home') refreshHome()
    if (route.name === 'detail') refreshDetail(route.id)
  }, [route, refreshHome, refreshDetail])

  if (route.name === 'new') {
    return <EventCreatePage onBack={() => navigate('/')} onCreated={event => navigate(`/events/${event.id}`)} />
  }

  if (route.name === 'detail') {
    return (
      <EventDetailPage
        event={selected}
        participation={myParticipation}
        participations={participations}
        viewerUserId={profile?.userId}
        loadState={loadState}
        onBack={() => navigate('/')}
        onNavigate={navigate}
        onApply={async payload => {
          if (!selected || !profile?.userId) return
          const next = await saveParticipation(selected.id, {
            ...payload,
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
          })
          setMyParticipation(next)
          setParticipations(await safeReloadParticipations(selected.id))
          setSelected(await safeReloadEvent(selected.id, selected))
        }}
        onHostUpdate={async (target, applicationStatus) => {
          if (!selected) return
          await saveParticipation(selected.id, {
            userId: target.userId,
            displayName: target.displayName,
            pictureUrl: target.pictureUrl,
            applicationStatus,
            companions: target.companions,
            message: target.message ?? '',
          })
          setParticipations(await safeReloadParticipations(selected.id))
          setSelected(await safeReloadEvent(selected.id, selected))
        }}
      />
    )
  }

  return (
    <EventHomePage
      events={events}
      myEvents={myEvents}
      loadState={loadState}
      onNavigate={navigate}
      onRefresh={refreshHome}
      onLogout={logout}
      profileName={profile?.displayName ?? '게스트'}
      profilePictureUrl={profile?.pictureUrl}
    />
  )
}

function EventHomePage({
  events, myEvents, loadState, profileName, profilePictureUrl, onNavigate, onRefresh, onLogout,
}: {
  events: EventRecord[]
  myEvents: EventRecord[]
  loadState: LoadState
  profileName: string
  profilePictureUrl?: string
  onNavigate: (path: string) => void
  onRefresh: () => void
  onLogout: () => void
}) {
  const [showProfile, setShowProfile] = useState(false)

  return (
    <div className="min-h-dvh" style={{ background: '#faf7f1', color: '#2f2923' }}>
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <div className="min-w-0">
          <img src="/logo.png" alt="imin" style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
          <p className="text-xs font-semibold mt-1 truncate" style={{ color: '#95785b' }}>초대장을 만들고 참석을 받아요</p>
        </div>
        <button onClick={() => setShowProfile(true)} className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }} title="프로필 관리">
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-black" style={{ color: '#7a5b3d' }}>{profileName[0] ?? '?'}</span>
          )}
        </button>
      </header>

      <main className="px-4 pb-10 space-y-4">
        <section className="relative overflow-hidden rounded-[28px] p-5 min-h-[320px] flex flex-col justify-between" style={{ background: '#2f2923', color: '#fffaf2' }}>
          <img
            src="https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1400&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'rgba(255,250,242,0.14)', border: '1px solid rgba(255,250,242,0.24)' }}>
              <Sparkles size={12} /> 링크 하나로 초대와 응답까지
            </span>
          </div>
          <div className="relative space-y-4">
            <div>
              <p className="text-sm opacity-85">{profileName}님, 오늘 만들 수 있는 것</p>
              <h2 className="text-4xl font-black leading-tight mt-1">행사 페이지,<br />공유 링크,<br />참여 관리</h2>
            </div>
            <button onClick={() => onNavigate('/events/new')} className="w-full rounded-2xl py-4 font-black flex items-center justify-center gap-2" style={{ background: '#fffaf2', color: '#2f2923' }}>
              <Plus size={18} /> 행사 만들기
            </button>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <Metric icon={<Ticket size={15} />} label="초대장" value={events.length} />
          <Metric icon={<Home size={15} />} label="내 행사" value={myEvents.length} />
          <Metric icon={<Users size={15} />} label="신청 관리" value="승인" />
        </section>

        {myEvents.length > 0 && (
          <EventSection title="내가 만든 행사" action="새로고침" onAction={onRefresh}>
            {myEvents.map(event => <EventCard key={event.id} event={event} onClick={() => onNavigate(`/events/${event.id}`)} />)}
          </EventSection>
        )}

        <EventSection title="공개 행사" action={loadState === 'loading' ? '불러오는 중' : '새로고침'} onAction={onRefresh}>
          {(events.length ? events : SAMPLE_EVENTS).map(event => <EventCard key={event.id} event={event} onClick={() => onNavigate(`/events/${event.id}`)} />)}
        </EventSection>

        <button onClick={() => {
          window.history.pushState({}, '', '/checkin')
          window.dispatchEvent(new PopStateEvent('popstate'))
        }} className="w-full rounded-2xl p-4 text-left flex items-center gap-3" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#e8f7ec', color: '#16803a' }}>
            <CheckCircle size={18} />
          </div>
          <div className="flex-1">
            <p className="font-bold">기존 현장 체크인 열기</p>
            <p className="text-xs" style={{ color: '#8d7a67' }}>Tech Week 단일 행사 플로우는 그대로 유지됩니다</p>
          </div>
          <ExternalLink size={16} style={{ color: '#8d7a67' }} />
        </button>
      </main>
      {showProfile && (
        <ProfileSheet
          profileName={profileName}
          profilePictureUrl={profilePictureUrl}
          onClose={() => setShowProfile(false)}
          onLogout={onLogout}
        />
      )}
    </div>
  )
}

function ProfileSheet({
  profileName, profilePictureUrl, onClose, onLogout,
}: {
  profileName: string
  profilePictureUrl?: string
  onClose: () => void
  onLogout: () => void
}) {
  const [settings, setSettings] = useState<ProfileSettings>(() => readProfileSettings(profileName))
  const [saved, setSaved] = useState(false)

  const update = <K extends keyof ProfileSettings>(key: K, value: ProfileSettings[K]) => {
    setSaved(false)
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const toggleInterest = (interest: string) => {
    setSaved(false)
    setSettings(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(item => item !== interest)
        : [...prev.interests, interest],
    }))
  }

  const save = () => {
    localStorage.setItem(STORAGE_PROFILE, JSON.stringify(settings))
    setSaved(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(47,41,35,0.42)' }} onClick={onClose}>
      <section className="w-full max-h-[92dvh] overflow-y-auto rounded-t-[30px] p-5" style={{ background: '#faf7f1', color: '#2f2923', border: '1px solid #eadfcc' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
            {profilePictureUrl ? <img src={profilePictureUrl} alt="" className="w-full h-full object-cover" /> : <UserRound size={24} style={{ color: '#7a5b3d' }} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black" style={{ color: '#9b7654' }}>LINE 프로필</p>
            <h2 className="text-xl font-black truncate">{profileName}</h2>
          </div>
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>닫기</button>
        </div>

        <div className="space-y-4">
          <FormBand title="내 정보" icon={<UserRound size={16} />}>
            <Field label="실명">
              <input value={settings.realName} onChange={e => update('realName', e.target.value)} style={lightInput} placeholder="행사 주최자/참석자에게 보여줄 이름" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="이메일">
                <input type="email" value={settings.email} onChange={e => update('email', e.target.value)} style={lightInput} placeholder="you@example.com" />
              </Field>
              <Field label="전화번호">
                <input type="tel" value={settings.phone} onChange={e => update('phone', e.target.value)} style={lightInput} placeholder="010-0000-0000" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="회사/소속">
                <input value={settings.company} onChange={e => update('company', e.target.value)} style={lightInput} placeholder="회사 또는 커뮤니티" />
              </Field>
              <Field label="역할">
                <input value={settings.role} onChange={e => update('role', e.target.value)} style={lightInput} placeholder="예: Product Designer" />
              </Field>
            </div>
          </FormBand>

          <FormBand title="관심사와 알림" icon={<Sparkles size={16} />}>
            <p className="text-sm leading-6" style={{ color: '#6f5c4a' }}>관심사를 설정해두면 나중에 맞는 행사가 등록됐을 때 LINE이나 이메일로 알림을 받을 수 있게 설계할 수 있어요.</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(interest => {
                const selected = settings.interests.includes(interest)
                return (
                  <button key={interest} onClick={() => toggleInterest(interest)} className="rounded-full px-3 py-2 text-xs font-black" style={{
                    background: selected ? '#302820' : '#fffaf2',
                    color: selected ? '#fffaf2' : '#302820',
                    border: '1px solid #eadfcc',
                  }}>
                    {interest}
                  </button>
                )
              })}
            </div>
            <button onClick={() => update('eventAlerts', !settings.eventAlerts)} className="w-full rounded-2xl p-4 flex items-center gap-3 text-left" style={{ background: settings.eventAlerts ? '#eef8ee' : '#fffaf2', border: `1px solid ${settings.eventAlerts ? '#b7d9bc' : '#eadfcc'}` }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: settings.eventAlerts ? '#16803a' : '#eadfcc', color: settings.eventAlerts ? '#fff' : '#6f5c4a' }}>
                <CheckCircle size={17} />
              </div>
              <div className="flex-1">
                <p className="font-black">관심 행사 자동 알림</p>
                <p className="text-xs" style={{ color: '#6f5c4a' }}>{settings.eventAlerts ? '새로운 맞춤 행사를 받을 준비 완료' : '알림 받지 않음'}</p>
              </div>
            </button>
          </FormBand>

          <button onClick={save} className="w-full rounded-2xl py-4 font-black flex items-center justify-center gap-2" style={{ background: '#302820', color: '#fffaf2' }}>
            <CheckCircle size={17} /> {saved ? '저장됐어요' : '프로필 저장'}
          </button>

          <button onClick={onLogout} className="w-full rounded-2xl py-3 font-bold flex items-center justify-center gap-2" style={{ background: '#fffaf2', color: '#7a5b3d', border: '1px solid #eadfcc' }}>
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      </section>
    </div>
  )
}

function EventCreatePage({ onBack, onCreated }: { onBack: () => void; onCreated: (event: EventRecord) => void }) {
  const { profile } = useLiff()
  const [form, setForm] = useState<EventFormState>(() => ({
    ...DEFAULT_FORM,
    ...CATEGORY_PRESETS.meetup,
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const selectCategory = (category: EventCategory) => {
    setForm(prev => {
      const previousPreset = CATEGORY_PRESETS[prev.category]
      const nextPreset = CATEGORY_PRESETS[category]
      const next = { ...prev, category }
      for (const key of PRESET_KEYS) {
        const currentValue = prev[key]
        const previousValue = previousPreset[key]
        const nextValue = nextPreset[key]
        const isBlank = currentValue === ''
        const stillPreset = currentValue === previousValue
        if ((isBlank || stillPreset) && nextValue !== undefined) {
          next[key] = nextValue as never
        }
      }
      if (category !== 'conference' && next.onlineUrl === previousPreset.onlineUrl) {
        next.onlineUrl = ''
      }
      return next
    })
  }

  const submit = async () => {
    if (saving) return
    setError(null)
    if (!form.title.trim()) return setError('행사 제목을 입력해 주세요.')
    if (!form.startsAt) return setError('시작 날짜와 시간을 입력해 주세요.')
    if (form.eventType !== 'online' && !form.venueName.trim()) return setError('장소 이름을 입력해 주세요.')

    setSaving(true)
    try {
      const event = await createEvent({
        ...form,
        hostUserId: profile?.userId ?? 'anonymous-host',
        hostName: profile?.displayName ?? '주최자',
      })
      onCreated(event)
    } catch (err) {
      setError(err instanceof Error ? err.message : '행사 저장에 실패했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-dvh" style={{ background: '#fbf8f2', color: '#302820' }}>
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(251,248,242,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid #eee2d2' }}>
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#fff', border: '1px solid #eadfcc' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-xs font-bold" style={{ color: '#9b7654' }}>Create Event</p>
          <h1 className="font-black">행사 등록하기</h1>
        </div>
      </header>

      <main className="px-4 py-5 space-y-4 max-w-3xl mx-auto">
        <CreatePreview form={form} hostName={profile?.displayName ?? '주최자'} />

        <FormBand title="기본 정보" icon={<Heart size={16} />}>
          <Field label="행사 유형">
            <div className="grid grid-cols-2 gap-2">
              {[
                ['meetup', '밋업'],
                ['conference', '컨퍼런스'],
                ['party', '파티'],
                ['wedding', '결혼식'],
              ].map(([value, label]) => (
                <button key={value} onClick={() => selectCategory(value as EventCategory)}
                  className="rounded-2xl py-3 text-sm font-bold"
                  style={{ background: form.category === value ? '#302820' : '#fff', color: form.category === value ? '#fffaf2' : '#302820', border: '1px solid #eadfcc' }}>
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="제목">
            <input value={form.title} onChange={e => update('title', e.target.value)} style={lightInput} placeholder="예: 토요일 커뮤니티 밋업" />
          </Field>
          <Field label={form.category === 'wedding' ? '신랑/신부 또는 공동 주최자' : '공동 주최자'}>
            <input value={form.coHostName} onChange={e => update('coHostName', e.target.value)} style={lightInput} placeholder="예: 지우" />
          </Field>
          <Field label="초대 문구">
            <textarea value={form.description} onChange={e => update('description', e.target.value)} style={{ ...lightInput, minHeight: 92, resize: 'vertical' }} placeholder="초대장에 보여줄 짧은 인사말" />
          </Field>
          <Field label="대표 이미지 URL">
            <input value={form.coverImageUrl} onChange={e => update('coverImageUrl', e.target.value)} style={lightInput} placeholder="https://..." />
          </Field>
        </FormBand>

        <FormBand title="일정과 장소" icon={<CalendarDays size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="시작">
              <input type="datetime-local" value={form.startsAt} onChange={e => update('startsAt', e.target.value)} style={lightInput} />
            </Field>
            <Field label="종료">
              <input type="datetime-local" value={form.endsAt} onChange={e => update('endsAt', e.target.value)} style={lightInput} />
            </Field>
          </div>
          <Field label="진행 방식">
            <div className="grid grid-cols-3 gap-2">
              {([
                ['offline', '오프라인'],
                ['online', '온라인'],
                ['hybrid', '하이브리드'],
              ] as [EventType, string][]).map(([value, label]) => (
                <button key={value} onClick={() => update('eventType', value)}
                  className="rounded-2xl py-3 text-xs font-bold"
                  style={{ background: form.eventType === value ? '#725034' : '#fff', color: form.eventType === value ? '#fffaf2' : '#302820', border: '1px solid #eadfcc' }}>
                  {label}
                </button>
              ))}
            </div>
          </Field>
          {form.eventType !== 'online' && (
            <>
              <Field label="장소 이름">
                <input value={form.venueName} onChange={e => update('venueName', e.target.value)} style={lightInput} placeholder="예: 라움 아트센터" />
              </Field>
              <Field label="주소">
                <input value={form.address} onChange={e => update('address', e.target.value)} style={lightInput} placeholder="예: 서울 강남구 ..." />
              </Field>
            </>
          )}
          {form.eventType !== 'offline' && (
            <Field label="온라인 입장 링크">
              <input value={form.onlineUrl} onChange={e => update('onlineUrl', e.target.value)} style={lightInput} placeholder="https://meet..." />
            </Field>
          )}
        </FormBand>

        <FormBand title="참여와 승인 설정" icon={<Clipboard size={16} />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="정원">
              <input inputMode="numeric" value={form.capacity} onChange={e => update('capacity', e.target.value.replace(/[^0-9]/g, ''))} style={lightInput} placeholder="예: 120" />
            </Field>
            <Field label="공개 여부">
              <select value={form.visibility} onChange={e => update('visibility', e.target.value as EventFormState['visibility'])} style={lightInput}>
                <option value="public">공개</option>
                <option value="private">링크 전용</option>
              </select>
            </Field>
            <Field label="승인 방식">
              <select value={form.approvalMode} onChange={e => update('approvalMode', e.target.value as EventFormState['approvalMode'])} style={lightInput}>
                <option value="auto">자동 승인</option>
                <option value="manual">주최자 확인</option>
              </select>
            </Field>
          </div>
          <Field label="드레스 코드 / 안내">
            <input value={form.dressCode} onChange={e => update('dressCode', e.target.value)} style={lightInput} placeholder="예: 편한 복장, 밝은 색감 환영" />
          </Field>
          <Field label="마음 전하는 곳 / 선물 안내">
            <textarea value={form.giftNote} onChange={e => update('giftNote', e.target.value)} style={{ ...lightInput, minHeight: 80, resize: 'vertical' }} placeholder="선물, 축의금, 준비물 안내 등" />
          </Field>
          <Field label="문의 안내">
            <textarea value={form.contactNote} onChange={e => update('contactNote', e.target.value)} style={{ ...lightInput, minHeight: 80, resize: 'vertical' }} placeholder="연락처나 문의 방법" />
          </Field>
        </FormBand>

        {error && <p className="rounded-2xl px-4 py-3 text-sm font-semibold" style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}>{error}</p>}

        <button onClick={submit} disabled={saving} className="w-full rounded-2xl py-4 font-black flex items-center justify-center gap-2" style={{ background: '#302820', color: '#fffaf2', opacity: saving ? 0.65 : 1 }}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {saving ? '등록 중...' : '행사 등록하고 초대장 열기'}
        </button>
      </main>
    </div>
  )
}

function EventDetailPage({
  event, participation, participations, viewerUserId, loadState, onBack, onNavigate, onApply, onHostUpdate,
}: {
  event: EventRecord | null
  participation: EventParticipation | null
  participations: EventParticipation[]
  viewerUserId?: string
  loadState: LoadState
  onBack: () => void
  onNavigate: (path: string) => void
  onApply: (payload: { applicationStatus?: ApplicationStatus; rsvpStatus?: RsvpStatus; companions: number; message: string; rsvpMessage?: string }) => Promise<void>
  onHostUpdate: (target: EventParticipation, applicationStatus: ApplicationStatus) => Promise<void>
}) {
  const [status, setStatus] = useState<RsvpStatus>(participation?.rsvpStatus ?? 'attending')
  const [companions, setCompanions] = useState(participation?.companions ?? 0)
  const [message, setMessage] = useState(participation?.message ?? '')
  const [rsvpMessage, setRsvpMessage] = useState(participation?.rsvpMessage ?? '')
  const [saving, setSaving] = useState(false)
  const [shareDone, setShareDone] = useState(false)

  useEffect(() => {
    setStatus(participation?.rsvpStatus ?? 'attending')
    setCompanions(participation?.companions ?? 0)
    setMessage(participation?.message ?? '')
    setRsvpMessage(participation?.rsvpMessage ?? '')
  }, [participation])

  if (loadState === 'loading') {
    return <CenteredState icon={<Loader2 size={24} className="animate-spin" />} title="초대장을 불러오는 중" />
  }

  if (!event) {
    return (
      <CenteredState
        icon={<Ticket size={24} />}
        title="행사를 찾지 못했어요"
        action={<button onClick={onBack} className="rounded-2xl px-5 py-3 font-bold" style={{ background: '#302820', color: '#fffaf2' }}>홈으로</button>}
      />
    )
  }

  const shareUrl = `${window.location.origin}/events/${event.id}`
  const isHost = viewerUserId === event.hostUserId
  const isConfirmed = participation?.applicationStatus === 'confirmed'
  const submitApplication = async () => {
    setSaving(true)
    try {
      await onApply({
        applicationStatus: event.approvalMode === 'auto' ? 'confirmed' : 'pending',
        companions,
        message,
      })
    } finally {
      setSaving(false)
    }
  }

  const submitRsvp = async () => {
    setSaving(true)
    try {
      await onApply({
        applicationStatus: 'confirmed',
        rsvpStatus: status,
        companions,
        message: participation?.message ?? message,
        rsvpMessage,
      })
    } finally {
      setSaving(false)
    }
  }

  const share = async () => {
    const text = `${event.title}\n${formatDate(event.startsAt)}\n${event.venueName ?? event.onlineUrl ?? ''}`
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text, url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
      }
      setShareDone(true)
      setTimeout(() => setShareDone(false), 1800)
    } catch {
      await navigator.clipboard?.writeText(shareUrl)
      setShareDone(true)
      setTimeout(() => setShareDone(false), 1800)
    }
  }

  return (
    <div className="min-h-dvh" style={{ background: '#fbf8f2', color: '#302820' }}>
      <header className="fixed top-0 left-0 right-0 z-20 px-4 py-3 flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center pointer-events-auto" style={{ background: 'rgba(255,250,242,0.9)', border: '1px solid rgba(234,223,204,0.9)' }}>
          <ArrowLeft size={18} />
        </button>
        <button onClick={share} className="h-10 rounded-full px-4 flex items-center gap-2 pointer-events-auto text-sm font-bold" style={{ background: 'rgba(255,250,242,0.92)', border: '1px solid rgba(234,223,204,0.9)' }}>
          {shareDone ? <CheckCircle size={15} /> : <Share2 size={15} />}
          {shareDone ? '복사됨' : '공유'}
        </button>
      </header>

      <section className="relative min-h-[78dvh] flex items-end overflow-hidden">
        {event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(140deg, #d9b99b, #f7efe3 48%, #a67556)' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(48,40,32,0.18), rgba(48,40,32,0.22) 36%, rgba(48,40,32,0.86))' }} />
        <div className="relative p-6 pb-10 w-full" style={{ color: '#fffaf2' }}>
          <p className="text-sm font-semibold opacity-85">{categoryLabel(event.category)}</p>
          <h1 className="text-5xl font-black leading-none mt-2">{event.title}</h1>
          {(event.hostName || event.coHostName) && (
            <p className="text-lg mt-4 opacity-90">{[event.hostName, event.coHostName].filter(Boolean).join(' & ')}</p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-6">
            <HeroInfo icon={<CalendarDays size={15} />} label={formatDate(event.startsAt)} />
            <HeroInfo icon={<MapPin size={15} />} label={event.venueName || eventTypeLabel(event.eventType)} />
          </div>
        </div>
      </section>

      <main className="px-4 py-5 space-y-4 max-w-2xl mx-auto">
        <InviteBand>
          <p className="text-center text-lg leading-8 font-medium whitespace-pre-wrap">{event.description}</p>
        </InviteBand>

        <InfoBand title="일정" icon={<Clock size={16} />}>
          <p className="font-black text-xl">{formatDate(event.startsAt)}</p>
          {event.endsAt && <p className="text-sm mt-1" style={{ color: '#8d7a67' }}>종료 {formatDate(event.endsAt)}</p>}
          <p className="text-xs mt-2" style={{ color: '#9f8c77' }}>{event.timezone}</p>
        </InfoBand>

        <InfoBand title={event.eventType === 'online' ? '입장 정보' : '오시는 길'} icon={event.eventType === 'online' ? <MonitorPlay size={16} /> : <MapPin size={16} />}>
          {event.venueName && <p className="font-black text-lg">{event.venueName}</p>}
          {event.address && <p className="text-sm mt-1" style={{ color: '#6f5c4a' }}>{event.address}</p>}
          {event.onlineUrl && (
            <a href={event.onlineUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: '#302820', color: '#fffaf2' }}>
              <ExternalLink size={14} /> 온라인 입장
            </a>
          )}
        </InfoBand>

        {(event.dressCode || event.giftNote || event.contactNote) && (
          <InfoBand title="안내" icon={<Gift size={16} />}>
            {event.dressCode && <Note label="드레스 코드" value={event.dressCode} />}
            {event.giftNote && <Note label="마음 전하는 곳" value={event.giftNote} />}
            {event.contactNote && <Note label="문의" value={event.contactNote} />}
          </InfoBand>
        )}

        <InfoBand title={isHost ? '신청자 운영' : isConfirmed ? '참석 여부 재확인' : '참여 신청'} icon={<MessageCircle size={16} />}>
          {isHost && (
            <p className="text-sm leading-6" style={{ color: '#6f5c4a' }}>
              주최자는 신청자 관리에서 참가 확정, 대기, 거절 상태를 처리합니다. 참석 여부 재확인은 참가 확정자에게만 열립니다.
            </p>
          )}

          {!isHost && !participation && (
            <>
              <p className="text-sm leading-6" style={{ color: '#6f5c4a' }}>
                공개 행사는 먼저 참여 신청을 보내고, 주최자가 신청자 목록을 확인한 뒤 참가 확정 또는 대기 상태로 안내합니다.
              </p>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 items-center">
                <label className="text-sm font-bold" style={{ color: '#6f5c4a' }}>동반 인원</label>
                <CompanionStepper value={companions} onChange={setCompanions} />
              </div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="주최자에게 전할 신청 메시지" className="mt-3 w-full rounded-2xl p-4 text-sm" style={{ background: '#fffaf2', border: '1px solid #eadfcc', minHeight: 96, outline: 'none' }} />
              <button onClick={submitApplication} disabled={saving} className="mt-3 w-full rounded-2xl py-4 font-black flex items-center justify-center gap-2" style={{ background: '#302820', color: '#fffaf2', opacity: saving ? 0.65 : 1 }}>
                {saving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                {event.approvalMode === 'auto' ? '참여 신청하고 바로 확정' : '참여 신청 보내기'}
              </button>
            </>
          )}

          {!isHost && participation && !isConfirmed && (
            <div className="rounded-2xl p-4" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
              <p className="font-black">{applicationStatusLabel(participation.applicationStatus)}</p>
              <p className="text-sm mt-2 leading-6" style={{ color: '#6f5c4a' }}>
                {participation.applicationStatus === 'pending' && '주최자가 신청자 목록을 확인한 뒤 참가 확정 여부를 알려줄 예정입니다.'}
                {participation.applicationStatus === 'waitlisted' && '현재는 대기자 명단에 있어요. 취소자가 생기면 추가 참석 가능 여부를 안내할 수 있습니다.'}
                {participation.applicationStatus === 'rejected' && '이번 행사에는 아쉽게도 참여가 확정되지 않았습니다.'}
                {participation.applicationStatus === 'cancelled' && '참여 신청이 취소된 상태입니다.'}
              </p>
            </div>
          )}

          {!isHost && isConfirmed && (
            <>
              <p className="text-sm leading-6" style={{ color: '#6f5c4a' }}>
                참가가 확정됐어요. 행사 7-10일 전 재확인 요청을 받으면 이 응답으로 최종 참석 여부를 알려주세요.
              </p>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {([
                  ['attending', '참석'],
                  ['maybe', '고민 중'],
                  ['declined', '불참'],
                ] as [RsvpStatus, string][]).map(([value, label]) => (
                  <button key={value} onClick={() => setStatus(value)} className="rounded-2xl py-3 text-sm font-black"
                    style={{ background: status === value ? '#302820' : '#fffaf2', color: status === value ? '#fffaf2' : '#302820', border: '1px solid #eadfcc' }}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2 items-center">
                <label className="text-sm font-bold" style={{ color: '#6f5c4a' }}>동반 인원</label>
                <CompanionStepper value={companions} onChange={setCompanions} />
              </div>
              <textarea value={rsvpMessage} onChange={e => setRsvpMessage(e.target.value)} placeholder="최종 참석 관련 메모를 남겨주세요" className="mt-3 w-full rounded-2xl p-4 text-sm" style={{ background: '#fffaf2', border: '1px solid #eadfcc', minHeight: 96, outline: 'none' }} />
              <button onClick={submitRsvp} disabled={saving} className="mt-3 w-full rounded-2xl py-4 font-black flex items-center justify-center gap-2" style={{ background: '#302820', color: '#fffaf2', opacity: saving ? 0.65 : 1 }}>
                {saving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                {participation.rsvpStatus ? '재확인 응답 수정하기' : '참석 여부 재확인 보내기'}
              </button>
              {participation.rsvpStatus && <p className="mt-3 text-center text-xs font-bold" style={{ color: '#16803a' }}>재확인 응답: {rsvpLabel(participation.rsvpStatus)}</p>}
            </>
          )}
        </InfoBand>

        {isHost && (
          <HostApplicantsPanel participations={participations} onUpdate={onHostUpdate} />
        )}

        <InfoBand title="공유 링크" icon={<LinkIcon size={16} />}>
          <div className="flex gap-2">
            <input value={shareUrl} readOnly className="min-w-0 flex-1 rounded-2xl px-4 py-3 text-xs" style={{ background: '#fffaf2', border: '1px solid #eadfcc', color: '#6f5c4a' }} />
            <button onClick={share} className="rounded-2xl px-4 font-black flex items-center gap-2" style={{ background: '#302820', color: '#fffaf2' }}>
              <Copy size={15} /> 복사
            </button>
          </div>
        </InfoBand>

        <button onClick={() => onNavigate('/events/new')} className="w-full rounded-2xl py-4 font-black flex items-center justify-center gap-2" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
          <Plus size={17} /> 나도 행사 만들기
        </button>
      </main>
    </div>
  )
}

function CreatePreview({ form, hostName }: { form: EventFormState; hostName: string }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] min-h-[300px] flex items-end p-5" style={{ background: '#302820', color: '#fffaf2' }}>
      {form.coverImageUrl ? <img src={form.coverImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" /> : <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #b99678, #f6ead8 55%, #7c5b43)' }} />}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent, rgba(48,40,32,0.84))' }} />
      <div className="relative">
        <p className="text-xs font-bold opacity-80">{categoryLabel(form.category)}</p>
        <h2 className="text-4xl font-black leading-none mt-2">{form.title || '행사 제목'}</h2>
        <p className="text-sm mt-3 opacity-85">{[hostName, form.coHostName].filter(Boolean).join(' & ')}</p>
        {form.startsAt && <p className="text-sm mt-4">{formatDate(form.startsAt)}</p>}
      </div>
    </section>
  )
}

function EventCard({ event, onClick }: { event: EventRecord; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-3xl overflow-hidden text-left" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
      <div className="h-36 relative">
        {event.coverImageUrl ? <img src={event.coverImageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #d9b99b, #fff7ea)' }} />}
        <div className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-black" style={{ background: 'rgba(255,250,242,0.92)', color: '#302820' }}>{categoryLabel(event.category)}</div>
      </div>
      <div className="p-4">
        <h3 className="font-black text-lg">{event.title}</h3>
        <p className="text-sm mt-1 line-clamp-2" style={{ color: '#7a6754' }}>{event.description}</p>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <SmallPill icon={<CalendarDays size={12} />} label={formatDateShort(event.startsAt)} />
          <SmallPill icon={<MapPin size={12} />} label={event.venueName || eventTypeLabel(event.eventType)} />
        </div>
        {event.stats && (
          <p className="text-xs font-bold mt-3" style={{ color: '#16803a' }}>{event.stats.confirmed}명 참가 확정 · {event.stats.pending}명 검토 중</p>
        )}
      </div>
    </button>
  )
}

function CompanionStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(0, value - 1))} className="w-9 h-9 rounded-full font-black" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>-</button>
      <span className="w-8 text-center font-black">{value}</span>
      <button onClick={() => onChange(Math.min(10, value + 1))} className="w-9 h-9 rounded-full font-black" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>+</button>
    </div>
  )
}

function HostApplicantsPanel({
  participations,
  onUpdate,
}: {
  participations: EventParticipation[]
  onUpdate: (target: EventParticipation, applicationStatus: ApplicationStatus) => Promise<void>
}) {
  const sorted = [...participations].sort((a, b) => b.updatedAt - a.updatedAt)
  return (
    <InfoBand title="신청자 관리" icon={<Users size={16} />}>
      <p className="text-sm leading-6 mb-3" style={{ color: '#6f5c4a' }}>
        신청자를 확정하거나 대기자로 두면, 이후 참석 여부 재확인 응답을 받아 최종 인원을 조정할 수 있습니다.
      </p>
      {sorted.length === 0 ? (
        <p className="text-sm rounded-2xl p-4 text-center" style={{ background: '#fffaf2', border: '1px solid #eadfcc', color: '#8d7a67' }}>아직 신청자가 없습니다</p>
      ) : (
        <div className="space-y-3">
          {sorted.map(applicant => (
            <div key={applicant.userId} className="rounded-2xl p-4" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: '#f4eadc', color: '#6f5c4a' }}>
                  {applicant.pictureUrl ? <img src={applicant.pictureUrl} alt="" className="w-full h-full object-cover" /> : applicant.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black">{applicant.displayName}</p>
                    <span className="text-[11px] rounded-full px-2 py-1 font-bold" style={{ background: '#f4eadc', color: '#6f5c4a' }}>{applicationStatusLabel(applicant.applicationStatus)}</span>
                    {applicant.rsvpStatus && <span className="text-[11px] rounded-full px-2 py-1 font-bold" style={{ background: '#e8f7ec', color: '#16803a' }}>재확인 {rsvpLabel(applicant.rsvpStatus)}</span>}
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#8d7a67' }}>동반 {applicant.companions}명</p>
                  {applicant.message && <p className="text-sm mt-2" style={{ color: '#4d4034' }}>{applicant.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {([
                  ['confirmed', '확정'],
                  ['waitlisted', '대기'],
                  ['rejected', '거절'],
                ] as [ApplicationStatus, string][]).map(([status, label]) => (
                  <button key={status} onClick={() => onUpdate(applicant, status)}
                    className="rounded-2xl py-2 text-xs font-black"
                    style={{ background: applicant.applicationStatus === status ? '#302820' : '#fbf8f2', color: applicant.applicationStatus === status ? '#fffaf2' : '#302820', border: '1px solid #eadfcc' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </InfoBand>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
      <div style={{ color: '#9b7654' }}>{icon}</div>
      <p className="text-lg font-black mt-2">{value}</p>
      <p className="text-xs" style={{ color: '#8d7a67' }}>{label}</p>
    </div>
  )
}

function EventSection({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="font-black">{title}</h2>
        {action && <button onClick={onAction} className="text-xs font-bold" style={{ color: '#9b7654' }}>{action}</button>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function FormBand({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl p-4 space-y-4" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
      <h2 className="font-black flex items-center gap-2" style={{ color: '#302820' }}>{icon}{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-black mb-2" style={{ color: '#8d6e52' }}>{label}</span>
      {children}
    </label>
  )
}

function InviteBand({ children }: { children: React.ReactNode }) {
  return <section className="rounded-3xl p-6" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>{children}</section>
}

function InfoBand({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl p-5" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>
      <h2 className="font-black mb-4 flex items-center gap-2" style={{ color: '#5b4634' }}>{icon}{title}</h2>
      {children}
    </section>
  )
}

function Note({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3" style={{ borderTop: '1px solid #eadfcc' }}>
      <p className="text-xs font-black" style={{ color: '#9b7654' }}>{label}</p>
      <p className="text-sm mt-1 whitespace-pre-wrap" style={{ color: '#4d4034' }}>{value}</p>
    </div>
  )
}

function HeroInfo({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="rounded-2xl px-3 py-2 flex items-center gap-2 text-xs font-bold" style={{ background: 'rgba(255,250,242,0.16)', border: '1px solid rgba(255,250,242,0.18)' }}>{icon}<span className="truncate">{label}</span></div>
}

function SmallPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="min-w-0 rounded-full px-3 py-2 flex items-center gap-1.5 font-bold" style={{ background: '#f4eadc', color: '#6f5c4a' }}>{icon}<span className="truncate">{label}</span></span>
}

function CenteredState({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: '#fbf8f2', color: '#302820' }}>
      <div className="w-14 h-14 rounded-3xl flex items-center justify-center" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }}>{icon}</div>
      <p className="font-black text-xl">{title}</p>
      {action}
    </div>
  )
}

const lightInput: React.CSSProperties = {
  width: '100%',
  borderRadius: 16,
  border: '1px solid #eadfcc',
  background: '#fbf8f2',
  color: '#302820',
  padding: '12px 14px',
  outline: 'none',
}

function resolveRoute(): Route {
  const path = window.location.pathname
  const detail = path.match(/^\/events\/([^/]+)$/)
  if (path === '/events/new') return { name: 'new' }
  if (detail) return { name: 'detail', id: decodeURIComponent(detail[1]) }
  return { name: 'home' }
}

async function fetchEvents(hostUserId?: string) {
  if (useLocalEventStore()) {
    const local = readLocalEvents()
    if (hostUserId) return local.filter(event => event.hostUserId === hostUserId)
    return local.length ? local : SAMPLE_EVENTS
  }
  const url = hostUserId ? `/api/events?hostUserId=${encodeURIComponent(hostUserId)}` : '/api/events'
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('events unavailable')
  const json = await res.json() as { events: EventRecord[] }
  return json.events
}

async function fetchEvent(id: string) {
  if (useLocalEventStore()) {
    const event = [...readLocalEvents(), ...SAMPLE_EVENTS].find(item => item.id === id)
    if (!event) throw new Error('event unavailable')
    return withLocalStats(event)
  }
  const res = await fetch(`/api/events?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('event unavailable')
  const json = await res.json() as { event: EventRecord }
  return json.event
}

async function createEvent(payload: EventFormState & { hostUserId: string; hostName: string }) {
  const body = {
    ...payload,
    capacity: payload.capacity ? Number(payload.capacity) : undefined,
    coverImageUrl: payload.coverImageUrl || undefined,
  }
  if (useLocalEventStore()) return createLocalEvent(payload)
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? '행사 저장 실패')
    const json = await res.json() as { event: EventRecord }
    return json.event
  } catch {
    return createLocalEvent(payload)
  }
}

async function fetchParticipation(eventId: string, userId: string) {
  if (useLocalEventStore()) return readLocalParticipation(eventId, userId)
  const res = await fetch(`/api/events?action=participation&eventId=${encodeURIComponent(eventId)}&userId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
  if (!res.ok) return null
  const json = await res.json() as { participation: EventParticipation | null }
  return json.participation
}

async function fetchParticipations(eventId: string) {
  if (useLocalEventStore()) return readLocalParticipations(eventId)
  const res = await fetch(`/api/events?action=participation&eventId=${encodeURIComponent(eventId)}`, { cache: 'no-store' })
  if (!res.ok) return []
  const json = await res.json() as { participations: EventParticipation[] }
  return json.participations
}

async function saveParticipation(eventId: string, payload: {
  userId: string
  displayName: string
  pictureUrl?: string
  applicationStatus?: ApplicationStatus
  rsvpStatus?: RsvpStatus
  companions: number
  message: string
  rsvpMessage?: string
}) {
  if (useLocalEventStore()) {
    return writeLocalParticipation({ eventId, ...payload, createdAt: Date.now(), updatedAt: Date.now() })
  }
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'participation', eventId, ...payload }),
    })
    if (!res.ok) throw new Error('participation failed')
    const json = await res.json() as { participation: EventParticipation }
    return json.participation
  } catch {
    return writeLocalParticipation({ eventId, ...payload, createdAt: Date.now(), updatedAt: Date.now() })
  }
}

function useLocalEventStore() {
  return import.meta.env.DEV && ['localhost', '127.0.0.1'].includes(window.location.hostname)
}

function createLocalEvent(payload: EventFormState & { hostUserId: string; hostName: string }) {
  const event: EventRecord = {
    id: `${slugify(payload.title)}-${Date.now().toString(36)}`,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    coverImageUrl: payload.coverImageUrl || undefined,
    hostUserId: payload.hostUserId,
    hostName: payload.hostName,
    coHostName: payload.coHostName || undefined,
    startsAt: payload.startsAt,
    endsAt: payload.endsAt || undefined,
    timezone: payload.timezone,
    eventType: payload.eventType,
    venueName: payload.venueName || undefined,
    address: payload.address || undefined,
    onlineUrl: payload.onlineUrl || undefined,
    capacity: payload.capacity ? Number(payload.capacity) : undefined,
    visibility: payload.visibility,
    approvalMode: payload.approvalMode,
    dressCode: payload.dressCode || undefined,
    giftNote: payload.giftNote || undefined,
    contactNote: payload.contactNote || undefined,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  writeLocalEvent(event)
  return event
}

async function safeReloadEvent(id: string, fallback: EventRecord) {
  try {
    return await fetchEvent(id)
  } catch {
    return withLocalStats(fallback)
  }
}

async function safeReloadParticipations(id: string) {
  try {
    return await fetchParticipations(id)
  } catch {
    return readLocalParticipations(id)
  }
}

function readLocalEvents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_EVENTS) || '[]') as EventRecord[]
  } catch {
    return []
  }
}

function writeLocalEvent(event: EventRecord) {
  const events = readLocalEvents().filter(item => item.id !== event.id)
  localStorage.setItem(STORAGE_EVENTS, JSON.stringify([event, ...events].slice(0, 50)))
}

function readLocalParticipations(eventId?: string) {
  try {
    const rows = JSON.parse(localStorage.getItem(STORAGE_RSVPS) || '[]') as EventParticipation[]
    return eventId ? rows.filter(item => item.eventId === eventId) : rows
  } catch {
    return []
  }
}

function readLocalParticipation(eventId: string, userId: string) {
  return readLocalParticipations().find(item => item.eventId === eventId && item.userId === userId) ?? null
}

function writeLocalParticipation(participation: Partial<EventParticipation> & {
  eventId: string
  userId: string
  displayName: string
  companions: number
  message: string
}) {
  const rows = readLocalParticipations().filter(item => !(item.eventId === participation.eventId && item.userId === participation.userId))
  const previous = readLocalParticipation(participation.eventId, participation.userId)
  const now = Date.now()
  const next: EventParticipation = {
    eventId: participation.eventId,
    userId: participation.userId,
    displayName: participation.displayName,
    pictureUrl: participation.pictureUrl,
    applicationStatus: participation.applicationStatus ?? previous?.applicationStatus ?? 'pending',
    rsvpStatus: participation.rsvpStatus ?? previous?.rsvpStatus,
    companions: participation.companions,
    message: participation.message || previous?.message,
    rsvpMessage: participation.rsvpMessage ?? previous?.rsvpMessage,
    createdAt: previous?.createdAt ?? participation.createdAt ?? now,
    updatedAt: now,
    decidedAt: participation.applicationStatus && participation.applicationStatus !== previous?.applicationStatus ? now : previous?.decidedAt,
    rsvpUpdatedAt: participation.rsvpStatus ? now : previous?.rsvpUpdatedAt,
  }
  localStorage.setItem(STORAGE_RSVPS, JSON.stringify([next, ...rows]))
  return next
}

function readProfileSettings(profileName: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_PROFILE) || 'null') as Partial<ProfileSettings> | null
    return {
      ...DEFAULT_PROFILE_SETTINGS,
      realName: saved?.realName ?? profileName,
      email: saved?.email ?? '',
      phone: saved?.phone ?? '',
      company: saved?.company ?? '',
      role: saved?.role ?? '',
      interests: Array.isArray(saved?.interests) ? saved.interests : DEFAULT_PROFILE_SETTINGS.interests,
      eventAlerts: saved?.eventAlerts ?? DEFAULT_PROFILE_SETTINGS.eventAlerts,
    }
  } catch {
    return { ...DEFAULT_PROFILE_SETTINGS, realName: profileName }
  }
}

function withLocalStats(event: EventRecord) {
  const rows = readLocalParticipations().filter(item => item.eventId === event.id)
  const stats = { applied: rows.length, confirmed: 0, waitlisted: 0, pending: 0, rsvpAttending: 0, maybe: 0, declined: 0, total: rows.length }
  for (const participation of rows) {
    if (participation.applicationStatus === 'confirmed') stats.confirmed += 1
    if (participation.applicationStatus === 'waitlisted') stats.waitlisted += 1
    if (participation.applicationStatus === 'pending') stats.pending += 1
    if (participation.rsvpStatus === 'attending') stats.rsvpAttending += 1 + participation.companions
    if (participation.rsvpStatus === 'maybe') stats.maybe += 1 + participation.companions
    if (participation.rsvpStatus === 'declined') stats.declined += 1
  }
  return { ...event, stats }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'event'
}

function formatDate(value: string) {
  if (!value) return '일정 미정'
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

function formatDateShort(value: string) {
  if (!value) return '일정 미정'
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function categoryLabel(value: string) {
  return ({ wedding: 'Wedding Invitation', party: 'Party', conference: 'Conference', meetup: 'Meetup' } as Record<string, string>)[value] ?? 'Event'
}

function eventTypeLabel(value: string) {
  return ({ offline: '오프라인', online: '온라인', hybrid: '하이브리드' } as Record<string, string>)[value] ?? '행사'
}

function rsvpLabel(value: RsvpStatus) {
  return ({ attending: '참석', maybe: '고민 중', declined: '불참' } as Record<RsvpStatus, string>)[value]
}

function applicationStatusLabel(value: ApplicationStatus) {
  return ({
    pending: '승인 대기',
    confirmed: '참가 확정',
    waitlisted: '대기자',
    rejected: '참가 불가',
    cancelled: '신청 취소',
  } as Record<ApplicationStatus, string>)[value]
}
