import { useState } from 'react'
import { Link } from 'react-router-dom'
import ListingForm from '../components/ListingForm'
import { createListing, type ListingInput } from '../lib/api'
import { displayCode } from '../lib/format'
import { saveListing } from '../lib/myListings'
import CopyButton from '../components/CopyButton'

export default function Post() {
  const [done, setDone] = useState<{ code: string; input: ListingInput } | null>(null)
  const [formKey, setFormKey] = useState(0)

  async function handleSubmit(input: ListingInput) {
    const res = await createListing(input)
    saveListing({ code: res.manage_code, shop: input.shop_name, dish: input.dish_name, savedAt: new Date().toISOString() })
    setDone({ code: res.manage_code, input })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (done) {
    const manageUrl = `${window.location.origin}/quan-ly?ma=${done.code}`
    return (
      <div className="page narrow">
        <div className="card success">
          <div className="success-emoji">🎉</div>
          <h1>Đăng tin thành công!</h1>
          <p>
            <b>{done.input.dish_name}</b> của <b>{done.input.shop_name}</b> đã lên sóng. Sinh viên đang tới đây!
          </p>

          <div className="code-box">
            <span className="code-label">Mã quản lý tin</span>
            <span className="code">{displayCode(done.code)}</span>
            <CopyButton text={displayCode(done.code)} label="Chép mã" />
          </div>

          <p className="alert alert-warn">
            ⚠️ <b>Lưu lại mã này</b> (chụp màn hình hoặc chép link bên dưới). Bạn cần mã để sửa số lượng, báo hết hàng hoặc xóa tin. Mất mã thì không sửa được tin.
          </p>

          <div className="stack">
            <CopyButton text={manageUrl} label="📋 Chép link quản lý tin" className="btn btn-ghost btn-block" />
            <Link className="btn btn-primary btn-block" to={`/quan-ly?ma=${done.code}`}>Quản lý tin này</Link>
            <button className="btn btn-ghost btn-block" onClick={() => { setDone(null); setFormKey((k) => k + 1) }}>
              Đăng thêm món khác
            </button>
            <Link className="btn btn-link" to="/">Xem trang chủ →</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page narrow">
      <div className="page-head">
        <h1>Đăng đồ ăn dư 🍱</h1>
        <p>Miễn phí, không cần tài khoản. Tin tự ẩn khi hết giờ.</p>
      </div>
      <div className="card">
        <ListingForm key={formKey} submitLabel="🚀 Đăng tin" onSubmit={handleSubmit} />
      </div>
    </div>
  )
}
