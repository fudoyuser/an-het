import { useState, type FormEvent } from 'react'
import { AREAS, MIN_EXPIRY_MINUTES } from '../config'
import { friendlyError, type Listing, type ListingInput } from '../lib/api'
import {
  dayLabel,
  digitsOnly,
  discountPercent,
  formatClock,
  formatTimeLeft,
  formatVND,
  normalizePhone,
  timeInputToDate,
} from '../lib/format'
import { useNow } from '../lib/useNow'

type Props = {
  initial?: Listing
  submitLabel: string
  onSubmit: (input: ListingInput) => Promise<void>
}

type Fields = {
  shop_name: string
  dish_name: string
  quantity: string
  original_price: string
  discount_price: string
  area: string
  address: string
  contact_phone: string
  expiry: string
}

type Errors = Partial<Record<keyof Fields, string>>

export default function ListingForm({ initial, submitLabel, onSubmit }: Props) {
  const now = useNow(15000)
  const [f, setF] = useState<Fields>(() => ({
    shop_name: initial?.shop_name ?? '',
    dish_name: initial?.dish_name ?? '',
    quantity: initial ? String(initial.quantity) : '',
    original_price: initial ? String(initial.original_price) : '',
    discount_price: initial ? String(initial.discount_price) : '',
    area: initial?.area ?? '',
    address: initial?.address ?? '',
    contact_phone: initial?.contact_phone ?? '',
    expiry: initial ? formatClock(new Date(initial.expires_at)) : '',
  }))
  // Khi sửa tin mà không đổi giờ, giữ nguyên thời điểm hết hạn cũ
  const [expiryTouched, setExpiryTouched] = useState(!initial)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const set = (k: keyof Fields) => (v: string) => setF((prev) => ({ ...prev, [k]: v }))

  const expiresAt: Date | null = expiryTouched
    ? timeInputToDate(f.expiry, now)
    : initial
      ? new Date(initial.expires_at)
      : null

  const orig = Number(f.original_price) || 0
  const disc = Number(f.discount_price)
  const showPct = orig > 0 && f.discount_price !== '' && disc < orig

  function setExpiry(value: string) {
    setExpiryTouched(true)
    set('expiry')(value)
  }

  function addHours(h: number) {
    const d = new Date(now.getTime() + h * 3600000)
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0)
    setExpiry(formatClock(d))
  }

  function validate(): Errors {
    const e: Errors = {}
    if (f.shop_name.trim().length < 2) e.shop_name = 'Nhập tên quán nhé'
    if (f.dish_name.trim().length < 2) e.dish_name = 'Nhập tên món nhé'
    const q = Number(f.quantity)
    if (!f.quantity || !Number.isInteger(q) || q < 0 || q > 999) e.quantity = 'Số lượng từ 0 đến 999'
    if (!f.original_price || orig < 1000) e.original_price = 'Giá gốc tối thiểu 1.000đ'
    else if (orig > 10000000) e.original_price = 'Giá gốc quá lớn'
    if (f.discount_price === '') e.discount_price = 'Nhập giá sau giảm'
    else if (disc >= orig) e.discount_price = 'Giá giảm phải thấp hơn giá gốc'
    if (!f.area) e.area = 'Chọn khu vực'
    if (f.address.trim().length < 3) e.address = 'Nhập địa chỉ quán'
    if (!/^0\d{9}$/.test(normalizePhone(f.contact_phone)))
      e.contact_phone = 'Số điện thoại 10 số, ví dụ 0912345678'
    if (expiryTouched) {
      if (!expiresAt) e.expiry = 'Chọn giờ hết hiệu lực'
      else if (expiresAt.getTime() - now.getTime() < MIN_EXPIRY_MINUTES * 60000)
        e.expiry = `Chọn giờ cách bây giờ ít nhất ${MIN_EXPIRY_MINUTES} phút`
    }
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0 || !expiresAt) {
      document.querySelector('.field-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({
        shop_name: f.shop_name.trim(),
        dish_name: f.dish_name.trim(),
        quantity: Number(f.quantity),
        original_price: orig,
        discount_price: disc,
        area: f.area,
        address: f.address.trim(),
        contact_phone: normalizePhone(f.contact_phone),
        expires_at: expiresAt.toISOString(),
      })
    } catch (e) {
      setSubmitError(friendlyError(e))
    } finally {
      setSubmitting(false)
    }
  }

  const err = (k: keyof Fields) => errors[k] && <p className="field-error">{errors[k]}</p>
  const expiredInitial = initial && !expiryTouched && new Date(initial.expires_at) <= now

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span>Tên quán</span>
        <input value={f.shop_name} onChange={(e) => set('shop_name')(e.target.value)} maxLength={80} placeholder="VD: Bánh mì Cô Ba" />
        {err('shop_name')}
      </label>

      <label className="field">
        <span>Tên món</span>
        <input value={f.dish_name} onChange={(e) => set('dish_name')(e.target.value)} maxLength={100} placeholder="VD: Bánh mì pate trứng" />
        {err('dish_name')}
      </label>

      <div className="row-2">
        <label className="field">
          <span>Giá gốc (đ)</span>
          <input inputMode="numeric" value={f.original_price} onChange={(e) => set('original_price')(digitsOnly(e.target.value))} placeholder="30000" />
          {orig > 0 && <small className="hint">{formatVND(orig)}</small>}
          {err('original_price')}
        </label>
        <label className="field">
          <span>Giá giảm (đ)</span>
          <input inputMode="numeric" value={f.discount_price} onChange={(e) => set('discount_price')(digitsOnly(e.target.value))} placeholder="15000" />
          {showPct && (
            <small className="hint hint-good">
              {formatVND(disc)} · giảm {discountPercent(orig, disc)}%
            </small>
          )}
          {err('discount_price')}
        </label>
      </div>

      <label className="field">
        <span>Số lượng còn (suất)</span>
        <input inputMode="numeric" value={f.quantity} onChange={(e) => set('quantity')(digitsOnly(e.target.value))} placeholder="10" />
        {err('quantity')}
      </label>

      <div className="field">
        <span>Khu vực</span>
        <div className="chips wrap">
          {AREAS.map((a) => (
            <button type="button" key={a} className={`chip ${f.area === a ? 'active' : ''}`} onClick={() => set('area')(a)}>
              {a}
            </button>
          ))}
        </div>
        {err('area')}
      </div>

      <label className="field">
        <span>Địa chỉ cụ thể</span>
        <input value={f.address} onChange={(e) => set('address')(e.target.value)} maxLength={200} placeholder="VD: Số 12 ngõ 30, cạnh tiệm photo" />
        {err('address')}
      </label>

      <div className="field">
        <span>Còn hiệu lực đến</span>
        <div className="expiry-row">
          <input type="time" value={f.expiry} onChange={(e) => setExpiry(e.target.value)} />
          <div className="chips">
            <button type="button" className="chip" onClick={() => addHours(1)}>+1 tiếng</button>
            <button type="button" className="chip" onClick={() => addHours(2)}>+2 tiếng</button>
            <button type="button" className="chip" onClick={() => addHours(3)}>+3 tiếng</button>
          </div>
        </div>
        {expiredInitial ? (
          <small className="hint hint-warn">Tin đã hết hạn. Chọn giờ mới để tin hiện lại.</small>
        ) : (
          expiresAt && (
            <small className="hint">
              Tin tự ẩn lúc <b>{formatClock(expiresAt)} {dayLabel(expiresAt, now)}</b> ({formatTimeLeft(expiresAt.getTime() - now.getTime()).toLowerCase()})
            </small>
          )
        )}
        {err('expiry')}
      </div>

      <label className="field">
        <span>Số điện thoại / Zalo</span>
        <input type="tel" inputMode="tel" value={f.contact_phone} onChange={(e) => set('contact_phone')(e.target.value)} placeholder="0912345678" />
        {err('contact_phone')}
      </label>

      {submitError && <p className="alert alert-error">{submitError}</p>}

      <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={submitting}>
        {submitting ? 'Đang gửi...' : submitLabel}
      </button>
    </form>
  )
}
