import { useEffect } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { isConfigured } from './lib/supabase'
import Home from './pages/Home'
import Post from './pages/Post'
import Manage from './pages/Manage'
import Admin from './pages/Admin'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="ĂN HẾT - trang chủ">
      <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--primary)" />
        <path d="M12 30h40a20 20 0 0 1-40 0z" fill="#FFF8EE" stroke="#23180F" strokeWidth="3" />
        <path d="M24 22c0-4 4-4 4-8M34 22c0-4 4-4 4-8" stroke="#FFC93C" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
      <span>ĂN HẾT</span>
    </Link>
  )
}

function NotConfigured() {
  return (
    <div className="page narrow">
      <div className="card empty">
        <div className="empty-emoji">🔌</div>
        <p className="empty-title">Chưa kết nối database</p>
        <p>
          Thiếu biến môi trường <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code>. Xem README.md để cấu hình.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <header className="topbar">
        <div className="topbar-inner">
          <Logo />
          <nav className="nav">
            <NavLink to="/" end>Săn đồ</NavLink>
            <NavLink to="/dang-tin">Đăng tin</NavLink>
            <NavLink to="/quan-ly">Quản lý</NavLink>
          </nav>
        </div>
      </header>

      <main>
        {isConfigured ? (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dang-tin" element={<Post />} />
            <Route path="/quan-ly" element={<Manage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Routes>
        ) : (
          <NotConfigured />
        )}
      </main>

      <footer className="footer">
        <b>ĂN HẾT</b> · Ăn hết đồ ngon, không để lãng phí 🌱
        <br />
        Bản thí điểm · Dự án khởi nghiệp xanh của sinh viên
      </footer>
    </BrowserRouter>
  )
}
