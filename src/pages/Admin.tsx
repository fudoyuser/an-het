import { useState, type FormEvent } from 'react'
import { adminDeleteListing, adminListListings, friendlyError, type Listing } from '../lib/api'
import { formatVND } from '../lib/format'

const KEY = 'anhet.adminKey'

function readKey() {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export default function Admin() {
  const [key, setKey] = useState(readKey)
  const [input, setInput] = useState('')
  const [rows, setRows] = useState<Listing[] | null>(null)
  const [error, setError] = useState('')

  async function load(k: string) {
    try {
      setRows(await adminListListings(k))
      setError('')
      setKey(k)
      try {
        sessionStorage.setItem(KEY, k)
      } catch {
        // bỏ qua
      }
    } catch (e) {
      setError(friendlyError(e))
      setRows(null)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    load(input)
  }

  async function remove(l: Listing) {
    if (!window.confirm(`Xóa tin "${l.dish_name}" của ${l.shop_name}?`)) return
    try {
      await adminDeleteListing(key, l.id)
      setRows((r) => r?.filter((x) => x.id !== l.id) ?? null)
    } catch (e) {
      setError(friendlyError(e))
    }
  }

  if (!rows) {
    return (
      <div className="page narrow">
        <div className="page-head"><h1>Admin</h1></div>
        <form className="card form" onSubmit={submit}>
          <label className="field">
            <span>Mật khẩu admin</span>
            <input type="password" value={input} onChange={(e) => setInput(e.target.value)} />
          </label>
          {error && <p className="alert alert-error">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit">Vào</button>
          {key && <button type="button" className="btn btn-link" onClick={() => load(key)}>Dùng mật khẩu đã nhập</button>}
        </form>
      </div>
    )
  }

  const now = Date.now()
  return (
    <div className="page">
      <div className="page-head">
        <h1>Admin · {rows.length} tin (7 ngày)</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => load(key)}>Tải lại</button>
      </div>
      {error && <p className="alert alert-error">{error}</p>}
      <div className="admin-list">
        {rows.map((l) => {
          const live = new Date(l.expires_at).getTime() > now && l.quantity > 0
          return (
            <div key={l.id} className="card admin-row">
              <div>
                <b>{l.dish_name}</b> · {l.shop_name}{' '}
                <span className={`status ${live ? 'status-on' : 'status-off'}`}>{live ? 'đang hiện' : 'đã ẩn'}</span>
                <small>
                  {formatVND(l.discount_price)} / {formatVND(l.original_price)} · SL {l.quantity} · {l.area} · {l.address} · {l.contact_phone}
                  <br />
                  Đăng {new Date(l.created_at).toLocaleString('vi-VN')} · Hết {new Date(l.expires_at).toLocaleString('vi-VN')}
                </small>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => remove(l)}>Xóa</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
