import type { Listing } from '../lib/api'
import { dayLabel, discountPercent, formatClock, formatTimeLeft, formatVND } from '../lib/format'

type Props = { listing: Listing; now: Date }

export default function ListingCard({ listing: l, now }: Props) {
  const expires = new Date(l.expires_at)
  const msLeft = expires.getTime() - now.getTime()
  const urgent = msLeft < 30 * 60000
  const pct = discountPercent(l.original_price, l.discount_price)
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.shop_name} ${l.address}`)}`

  return (
    <article className="card listing">
      <div className="listing-top">
        <span className="badge-discount">-{pct}%</span>
        <span className={`countdown ${urgent ? 'urgent' : ''}`}>
          ⏰ {formatTimeLeft(msLeft)}
        </span>
      </div>

      <h3 className="dish">{l.dish_name}</h3>
      <p className="shop">🏪 {l.shop_name}</p>

      <div className="prices">
        <span className="price-new">{formatVND(l.discount_price)}</span>
        <span className="price-old">{formatVND(l.original_price)}</span>
      </div>

      <ul className="meta">
        <li>
          <strong>Còn {l.quantity} suất</strong>
        </li>
        <li>
          Đến {formatClock(expires)} {dayLabel(expires, now) !== 'hôm nay' && dayLabel(expires, now)}
        </li>
      </ul>

      <p className="address">
        <span className="chip-area">{l.area}</span> {l.address}
      </p>

      <div className="actions">
        <a className="btn btn-primary" href={`tel:${l.contact_phone}`}>📞 Gọi</a>
        <a className="btn btn-zalo" href={`https://zalo.me/${l.contact_phone}`} target="_blank" rel="noreferrer">
          Zalo
        </a>
        <a className="btn btn-ghost" href={mapUrl} target="_blank" rel="noreferrer">
          📍 Đường
        </a>
      </div>
    </article>
  )
}
