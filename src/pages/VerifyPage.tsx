import { useState, useEffect, useCallback } from 'react'
import { MapPin, Globe, CheckCircle, ChevronRight, RefreshCw } from 'lucide-react'
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

export default function VerifyPage({ onVerified }: Props) {
  const { profile } = useLiff()

  const [geoStatus, setGeoStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [geoData, setGeoData] = useState<Partial<LocationData>>({})

  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ok' | 'denied' | 'error'>('idle')
  const [gpsData, setGpsData] = useState<{ lat: number; lon: number; accuracy: number } | null>(null)

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
    navigator.geolocation.getCurrentPosition(
      pos => {
        setGpsData({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy })
        setGpsStatus('ok')
      },
      err => setGpsStatus(err.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const canCheckin = geoStatus === 'ok' && gpsStatus === 'ok'

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
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>imin</span>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          I'm in! 전에 현재 위치를 확인합니다
        </p>
      </div>

      <div className="flex-1 px-4 space-y-3">
        {/* GeoIP */}
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: `1px solid ${geoStatus === 'ok' ? 'var(--green-dim)' : 'var(--border)'}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={16} style={{ color: geoStatus === 'ok' ? 'var(--green)' : 'var(--text-muted)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>GeoIP</span>
            </div>
            <div className="flex items-center gap-2">
              {geoStatus === 'loading' && (
                <div className="w-4 h-4 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
              )}
              {geoStatus === 'ok' && <CheckCircle size={16} style={{ color: 'var(--green)' }} />}
              {geoStatus === 'error' && (
                <button onClick={fetchGeo}>
                  <RefreshCw size={14} style={{ color: 'var(--text-muted)' }} />
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
        <div
          className="rounded-2xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: `1px solid ${gpsStatus === 'ok' ? 'var(--green-dim)' : 'var(--border)'}` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} style={{ color: gpsStatus === 'ok' ? 'var(--green)' : 'var(--text-muted)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>GPS 위치</span>
            </div>
            {gpsStatus === 'ok' && <CheckCircle size={16} style={{ color: 'var(--green)' }} />}
            {gpsStatus === 'loading' && (
              <div className="w-4 h-4 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {gpsStatus === 'idle' && (
            <button
              onClick={requestGps}
              className="w-full py-3 rounded-xl text-sm font-semibold active:opacity-80"
              style={{ background: 'var(--green)', color: '#0a0a0a' }}
            >
              위치 권한 요청
            </button>
          )}
          {gpsStatus === 'loading' && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>위치 확인 중...</p>}
          {gpsStatus === 'ok' && gpsData && (
            <div className="space-y-1.5">
              <Row label="위도" value={gpsData.lat.toFixed(6)} />
              <Row label="경도" value={gpsData.lon.toFixed(6)} />
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
            <button onClick={requestGps} className="w-full py-3 rounded-xl text-sm font-semibold active:opacity-80" style={{ background: 'var(--bg-card2)', color: 'var(--text-muted)' }}>
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
          className="w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-30"
          style={{ background: canCheckin ? 'var(--green)' : 'var(--bg-card2)', color: canCheckin ? '#0a0a0a' : 'var(--text-muted)' }}
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
      <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-xs font-mono text-right truncate" style={{ color: 'var(--text)' }}>
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
        <div key={i} className="h-3 rounded-md animate-pulse" style={{ background: 'var(--bg-card2)', width: `${w}%` }} />
      ))}
    </div>
  )
}

function countryFlag(code: string) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))
}
