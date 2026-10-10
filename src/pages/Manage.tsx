import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ListingForm from '../components/ListingForm'
import {
  deleteMyListing,
  friendlyError,
  getMyListing,
  updateMyListing,
  type Listing,
  type ListingInput,
} from '../lib/api'
import { displayCode, formatClock, dayLabel, normalizeCode } from '../lib/format'
import { forgetListing, loadSaved, saveListing } from '../lib/myListings'
import { useNow } from '../lib/useNow'

export default function Manage() {
  const [params] = useSearchParams()
  const code = normalizeCode(params.get('ma') ?? '')
  return code ? <ManageOne key={code} code={code} /> : <EnterCode />
}

function EnterCode() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const saved = loadSaved()

  function submit(e: FormEvent) {
    e.preventDefault()
    const c = normalizeCode(input)
    if (c) navigate(`/quan-ly?ma=${c}`)
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <h1>Quản lý tin đăng 🔑</h1>
        <p>Nhập mã quản lý bạn nhận được khi đăng tin.</p>
      </div>
      <form className="card form" onSubmit={submit}>
        <label className="field">
          <span>Mã quản lý</span>
          <input
            className="code-input"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="ABCD-2345"
            autoCapitalize="characters"
            autoComplete="off"
          />
        </label>
        <button className="btn btn-primary btn-block" type="submit">Mở tin</button>
      </form>

      {saved.length > 0 && (
        <div className="card">
          <h2 className="h2">Tin đã đăng trên máy này</h2>
          <ul className="saved-list">
            {saved.map((s) => (
              <li key={s.code}>
                <Link to={`/quan-ly?ma=${s.code}`}>
                  <b>{s.dish}</b> · {s.shop}
                  <small>{displayCode(s.code)} · {new Date(s.savedAt).toLocaleString('vi-VN')}</small>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function ManageOne({ code }: { code: string }) {
  const now = useNow(15000)
  const [listing, setListing] = useState<Listing | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'notfound' | 'deleted' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [formKey, setFormKey] = useState(0)

  const load = useCallback(async () => {
    try {
      const l = await getMyListing(code)
      if (!l) {
        setState('notfound')
        return
      }
      setListing(l)
      setState('ready')
      saveListing({ code, shop: l.shop_name, dish: l.dish_name, savedAt: l.created_at })
    } catch (e) {
      setMessage(friendlyError(e))
      setState('error')
    }
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpdate(input: ListingInput) {
    await updateMyListing(code, input)
    setMessage('✅ Đã lưu thay đổi!')
    await load()
    setFormKey((k) => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function markSoldOut() {
    if (!listing) return
    setBusy(true)
    try {
      const { id: _id, created_at: _c, ...rest } = listing
      await updateMyListing(code, { ...rest, quantity: 0 })
      setMessage('✅ Đã báo hết hàng, tin đã ẩn khỏi trang chủ. Cảm ơn quán đã chung tay chống lãng phí!')
      await load()
      setFormKey((k) => k + 1)
    } catch (e) {
      setMessage(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Xóa hẳn tin này? Không khôi phục được đâu nhé.')) return
    setBusy(true)
    try {
      await deleteMyListing(code)
      forgetListing(code)
      setState('deleted')
    } catch (e) {
      setMessage(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') return <div className="page narrow"><div className="card skeleton" /></div>

  if (state !== 'ready' || !listing) {
    const content = {
      notfound: { emoji: '🤔', title: 'Không tìm thấy tin', text: 'Mã không đúng, hoặc tin đã bị xóa.' },
      deleted: { emoji: '🗑️', title: 'Đã xóa tin', text: 'Tin đã được gỡ khỏi ĂN HẾT.' },
      error: { emoji: '😵', title: 'Có lỗi xảy ra', text: message },
    }[state === 'ready' ? 'error' : state]
    return (
      <div className="page narrow">
        <div className="card empty">
          <div className="empty-emoji">{content.emoji}</div>
          <p className="empty-title">{content.title}</p>
          <p>{content.text}</p>
          <div className="stack">
            <Link className="btn btn-primary" to="/dang-tin">Đăng tin mới</Link>
            <Link className="btn btn-ghost" to="/quan-ly">Nhập mã khác</Link>
          </div>
        </div>
      </div>
    )
  }

  const expires = new Date(listing.expires_at)
  const expired = expires <= now
  const soldOut = listing.quantity === 0
  const status = expired
    ? { cls: 'status-off', text: 'Đã hết hạn · không hiển thị' }
    : soldOut
      ? { cls: 'status-off', text: 'Đã bán hết · không hiển thị' }
      : { cls: 'status-on', text: `Đang hiển thị · đến ${formatClock(expires)} ${dayLabel(expires, now)}` }

  return (
    <div className="page narrow">
      <div className="page-head">
        <h1>{listing.dish_name}</h1>
        <p>🏪 {listing.shop_name} · Mã <b>{displayCode(code)}</b></p>
        <span className={`status ${status.cls}`}>{status.text}</span>
      </div>

      {message && <p className="alert alert-info">{message}</p>}

      <div className="card quick-actions">
        <button className="btn btn-sun btn-block" disabled={busy || soldOut} onClick={markSoldOut}>
          🙌 Đã bán hết
        </button>
        <button className="btn btn-danger btn-block" disabled={busy} onClick={handleDelete}>
          🗑️ Xóa tin
        </button>
      </div>

      <div className="card">
        <h2 className="h2">Sửa tin</h2>
        <ListingForm key={formKey} initial={listing} submitLabel="💾 Lưu thay đổi" onSubmit={handleUpdate} />
      </div>
    </div>
  )
}
