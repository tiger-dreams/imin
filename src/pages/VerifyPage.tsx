import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, MapPin, Globe, CheckCircle, ChevronRight, RefreshCw } from 'lucide-react'
import { useLiff } from '../contexts/LiffContext'

export interface LocationData {
  ip: string
  city: string
  region: string
  country: string
  countryCode: string
  geoLat: number
  geoLon: number
  isp: string
  gpsLat?: number
  gpsLon?: number
  gpsAccuracy?: number
  score: number
}

interface Props {
  onVerified: (data: LocationData) => void
}

interface CheckinContext {
  eventId?: string
  title?: string
  venueName?: string
  returnPath?: string
}

const readCheckinContext = (): CheckinContext | null => {
  try {
    return JSON.parse(sessionStorage.getItem('imin:checkin-context') || 'null') as CheckinContext | null
  } catch {
    return null
  }
}

export default function VerifyPage({ onVerified }: Props) {
  const { profile } = useLiff()
  const [context] = useState<CheckinContext | null>(() => readCheckinContext())

  const [geoStatus, setGeoStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [geoData, setGeoData] = useState<Partial<LocationData>>({})

  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ok' | 'denied' | 'error'>('idle')
  const [gpsData, setGpsData] = useState<{ lat: number; lon: number; accuracy: number } | null>(null)
  const [gpsAddress, setGpsAddress] = useState<string | null>(null)

  const fetchGeo = useCallback(async () => {
    setGeoStatus('loading')
    try {
      const res = await fetch('https://ipapi.co/json/')
      const d = await res.json() as {
        ip: string; city: string; region: string; country_name: string
        country_code: string; latitude: number; longitude: number; org: string; error?: boolean
      }
      if (!d.error) {
        setGeoData({ ip: d.ip, city: d.city, region: d.region, country: d.country_name, countryCode: d.country_code, geoLat: d.latitude, geoLon: d.longitude, isp: d.org })
        setGeoStatus('ok')
      } else {
        setGeoStatus('error')
      }
    } catch {
      setGeoStatus('error')
    }
  }, [])

  useEffect(() => { fetchGeo() }, [fetchGeo])

  const requestGps = () => {
    setGpsStatus('loading')
    setGpsAddress(null)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords
        setGpsData({ lat, lon, accuracy })
        setGpsStatus('ok')
        // 역지오코딩 — Nominatim (무료, 키 불필요)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ko`,
            { headers: { 'Accept-Language': 'ko' } }
          )
          const json = await res.json() as {
            address?: {
              road?: string; quarter?: string; suburb?: string
              city?: string; town?: string; county?: string
              state?: string; country?: string
            }
          }
          const a = json.address ?? {}
          const parts = [
            a.state,
            a.city ?? a.town ?? a.county,
            a.suburb ?? a.quarter,
            a.road,
          ].filter(Boolean)
          setGpsAddress(parts.length > 0 ? parts.join(' ') : null)
        } catch {
          // 주소 조회 실패해도 GPS 자체는 성공으로 유지
        }
      },
      err => setGpsStatus(err.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const canCheckin = geoStatus === 'ok' && gpsStatus === 'ok'
  const goBack = () => {
    if (!context?.returnPath) return
    window.history.pushState({}, '', context.returnPath)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleCheckin = async () => {
    if (!canCheckin || !geoData.ip) return
    const data: LocationData = {
      ip: geoData.ip!,
      city: geoData.city!,
      region: geoData.region!,
      country: geoData.country!,
      countryCode: geoData.countryCode!,
      geoLat: geoData.geoLat!,
      geoLon: geoData.geoLon!,
      isp: geoData.isp!,
      score: 40 + 20 + (gpsData?.lat ? 20 : 0),
      gpsLat: gpsData?.lat,
      gpsLon: gpsData?.lon,
      gpsAccuracy: gpsData?.accuracy,
    }

    let score = 40 + 20 + (data.gpsLat ? 20 : 0)
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.userId ?? 'unknown',
          displayName: profile?.displayName ?? '참가자',
          pictureUrl: profile?.pictureUrl,
          ...data,
        }),
      })
      if (res.ok) {
        const json = await res.json() as { score?: number }
        if (json.score) score = json.score
      }
    } catch {
      // API 실패해도 체크인은 진행
    }

    onVerified({ ...data, score })
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: '#fbf8f2', color: '#302820' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          {context?.returnPath && (
            <button onClick={goBack} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#fffaf2', border: '1px solid #eadfcc' }} aria-label="행사로 돌아가기">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="min-w-0">
            <p className="text-xs font-black" style={{ color: '#9b7654' }}>{context?.title ?? 'imin check-in'}</p>
            <h1 className="text-2xl font-black leading-tight">현장 체크인</h1>
            <p className="text-sm mt-1 truncate" style={{ color: '#8d7a67' }}>
              {context?.venueName ? `${context.venueName}에서 위치를 확인합니다` : '체크인 전에 현재 위치를 확인합니다'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-3">
        <div className="rounded-[28px] p-5" style={{ background: '#302820', color: '#fffaf2' }}>
          <p className="text-xs font-bold opacity-80">I'm in</p>
          <p className="text-3xl font-black leading-tight mt-2">지금 여기 있는<br />사람만 인증합니다</p>
          <p className="text-sm leading-6 mt-3 opacity-75">GeoIP와 GPS를 확인한 뒤 체크인 완료 화면으로 이어집니다.</p>
        </div>

        {/* GeoIP */}
        <div
          className="rounded-3xl p-5 space-y-3"
          style={{ background: '#fffaf2', border: `1px solid ${geoStatus === 'ok' ? '#b7d9bc' : '#eadfcc'}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} style={{ color: geoStatus === 'ok' ? '#16803a' : '#8d7a67' }} />
              <span className="text-sm font-black">GeoIP</span>
            </div>
            <div className="flex items-center gap-2">
              {geoStatus === 'loading' && (
                <div className="w-4 h-4 border-2 border-[#16803a] border-t-transparent rounded-full animate-spin" />
              )}
              {geoStatus === 'ok' && <CheckCircle size={16} style={{ color: '#16803a' }} />}
              {geoStatus === 'error' && (
                <button onClick={fetchGeo}>
                  <RefreshCw size={14} style={{ color: '#8d7a67' }} />
                </button>
              )}
            </div>
          </div>

          {geoStatus === 'ok' && (
            <div className="space-y-1.5">
              <Row label="IP" value={geoData.ip!} />
              <Row label="위치" value={`${geoData.city}, ${geoData.region}`} flag={geoData.countryCode} />
              <Row label="좌표" value={`${geoData.geoLat?.toFixed(4)}, ${geoData.geoLon?.toFixed(4)}`} />
              <Row label="ISP" value={geoData.isp!} />
            </div>
          )}
          {geoStatus === 'loading' && <Skeleton />}
          {geoStatus === 'error' && <p className="text-xs" style={{ color: '#f87171' }}>조회 실패 — 새로고침 버튼을 눌러주세요</p>}
        </div>

        {/* GPS */}
        <div className="rounded-3xl p-5 space-y-3" style={{ background: '#fffaf2', border: `1px solid ${gpsStatus === 'ok' ? '#b7d9bc' : '#eadfcc'}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} style={{ color: gpsStatus === 'ok' ? '#16803a' : '#8d7a67' }} />
              <span className="text-sm font-black">GPS 위치</span>
            </div>
            {gpsStatus === 'ok' && <CheckCircle size={16} style={{ color: '#16803a' }} />}
            {gpsStatus === 'loading' && (
              <div className="w-4 h-4 border-2 border-[#16803a] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {gpsStatus === 'idle' && (
            <button
              onClick={requestGps}
              className="w-full py-3 rounded-2xl text-sm font-black active:opacity-80"
              style={{ background: '#302820', color: '#fffaf2' }}
            >
              위치 권한 요청
            </button>
          )}
          {gpsStatus === 'loading' && <p className="text-sm" style={{ color: '#8d7a67' }}>위치 확인 중...</p>}
          {gpsStatus === 'ok' && gpsData && (
            <div className="space-y-1.5">
              {gpsAddress
                ? <Row label="주소" value={gpsAddress} />
                : <Row label="좌표" value={`${gpsData.lat.toFixed(5)}, ${gpsData.lon.toFixed(5)}`} />
              }
              <Row label="정확도" value={`±${Math.round(gpsData.accuracy)}m`} />
              {/* 지도 미리보기 */}
              <div className="mt-2 rounded-xl overflow-hidden" style={{ height: 160 }}>
                <iframe
                  title="map"
                  width="100%"
                  height="160"
                  style={{ border: 'none' }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${gpsData.lon - 0.01},${gpsData.lat - 0.01},${gpsData.lon + 0.01},${gpsData.lat + 0.01}&layer=mapnik&marker=${gpsData.lat},${gpsData.lon}`}
                />
              </div>
            </div>
          )}
          {gpsStatus === 'denied' && <p className="text-xs" style={{ color: '#f87171' }}>위치 권한이 거부됐어요. 브라우저 설정에서 허용해주세요.</p>}
          {gpsStatus === 'error' && (
            <button onClick={requestGps} className="w-full py-3 rounded-2xl text-sm font-black active:opacity-80" style={{ background: '#f4eadc', color: '#6f5c4a' }}>
              다시 시도
            </button>
          )}
        </div>

        {/* 안내 메시지 */}
        {!canCheckin && (
          <p className="text-center text-xs px-4" style={{ color: 'var(--text-muted)' }}>
            GeoIP와 GPS 위치를 모두 확인해야 I'm in! 할 수 있어요
          </p>
        )}
      </div>

      {/* I'm in! 버튼 */}
      <div className="px-4 pb-8 pt-4">
        <button
          onClick={handleCheckin}
          disabled={!canCheckin}
          className="w-full py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
          style={{ background: canCheckin ? '#302820' : '#eadfcc', color: canCheckin ? '#fffaf2' : '#8d7a67' }}
        >
          <CheckCircle size={22} />
          I'm in!
          {canCheckin && <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, flag }: { label: string; value: string; flag?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs shrink-0" style={{ color: '#8d7a67' }}>{label}</span>
      <span className="text-xs font-mono text-right truncate" style={{ color: '#302820' }}>
        {flag && <span className="mr-1">{countryFlag(flag)}</span>}
        {value}
      </span>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[70, 85, 60].map((w, i) => (
        <div key={i} className="h-3 rounded-md animate-pulse" style={{ background: '#f4eadc', width: `${w}%` }} />
      ))}
    </div>
  )
}

function countryFlag(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))
}
