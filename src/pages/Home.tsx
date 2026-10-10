import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import { AREAS, TIME_FILTERS } from '../config'
import { fetchActiveListings, friendlyError, type Listing } from '../lib/api'
import { useNow } from '../lib/useNow'

const REFRESH_MS = 60000

export default function Home() {
  const now = useNow(15000)
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [area, setArea] = useState<string | null>(null)
  const [minMinutes, setMinMinutes] = useState(0)

  const load = useCallback(async () => {
    try {
      setListings(await fetchActiveListings())
      setError('')
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  // Ẩn ngay trên máy người xem khi tin hết giờ, không cần chờ tải lại
  const live = useMemo(
    () => listings.filter((l) => new Date(l.expires_at).getTime() > now.getTime()),
    [listings, now],
  )

  const byTime = useMemo(
    () => live.filter((l) => new Date(l.expires_at).getTime() - now.getTime() >= minMinutes * 60000),
    [live, now, minMinutes],
  )

  const visible = area ? byTime.filter((l) => l.area === area) : byTime
  const totalPortions = live.reduce((s, l) => s + l.quantity, 0)
  const countByArea = (a: string) => byTime.filter((l) => l.area === a).length
  // Khu vực ngoài danh sách cấu hình (nếu có) vẫn hiện trong bộ lọc
  const areas = [...AREAS, ...Array.from(new Set(live.map((l) => l.area))).filter((a) => !AREAS.includes(a))]

  return (
    <div className="page">
      <section className="hero">
        <h1>
          Đồ ngon cuối ngày,
          <br />
          <span className="hl">giá hời</span> cho sinh viên!
        </h1>
        <p>Quán quanh trường còn dư đồ ăn? Ghé mua giá rẻ. Ăn hết, không bỏ phí 🌱</p>
        {!loading && !error && (
          <div className="stat">
            <span className="stat-num">{totalPortions}</span> suất đang chờ được ăn hết
          </div>
        )}
      </section>

      <section className="filters" aria-label="Bộ lọc">
        <div className="filter-label">📍 Khu vực</div>
        <div className="chips scroll">
          <button className={`chip ${area === null ? 'active' : ''}`} onClick={() => setArea(null)}>
            Tất cả <span className="count">{byTime.length}</span>
          </button>
          {areas.map((a) => (
            <button key={a} className={`chip ${area === a ? 'active' : ''}`} onClick={() => setArea(a)}>
              {a} <span className="count">{countByArea(a)}</span>
            </button>
          ))}
        </div>

        <div className="filter-label">⏰ Thời gian còn lại</div>
        <div className="chips scroll">
          {TIME_FILTERS.map((t) => (
            <button key={t.minutes} className={`chip ${minMinutes === t.minutes ? 'active' : ''}`} onClick={() => setMinMinutes(t.minutes)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="grid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="empty">
          <div className="empty-emoji">😵</div>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={load}>Thử lại</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">{live.length === 0 ? '🍽️' : '🔍'}</div>
          {live.length === 0 ? (
            <>
              <p className="empty-title">Chưa có quán nào đăng tin lúc này</p>
              <p>Có thể các quán đã bán sạch rồi! Quay lại vào buổi tối nhé.</p>
            </>
          ) : (
            <>
              <p className="empty-title">Không có món nào khớp bộ lọc</p>
              <button className="btn btn-ghost" onClick={() => { setArea(null); setMinMinutes(0) }}>
                Xem tất cả
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid">
          {visible.map((l) => (
            <ListingCard key={l.id} listing={l} now={now} />
          ))}
        </div>
      )}

      <section className="owner-cta card">
        <div>
          <b>Bạn là chủ quán?</b>
          <p>Còn đồ dư cuối ngày? Đăng tin trong 1 phút, miễn phí, không cần tài khoản.</p>
        </div>
        <Link className="btn btn-primary" to="/dang-tin">Đăng tin ngay</Link>
      </section>

      <Link className="fab" to="/dang-tin" aria-label="Đăng tin">＋ Đăng tin</Link>
    </div>
  )
}
