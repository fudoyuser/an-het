import { useEffect } from 'react'
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
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


export default function App() {
  return (
    <HashRouter>
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
        {!isConfigured && (
          <div className="demo-banner">
            🧪 Bản demo: tin bạn đăng chỉ lưu trên máy này, người khác chưa xem được.
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dang-tin" element={<Post />} />
          <Route path="/quan-ly" element={<Manage />} />
          {isConfigured && <Route path="/admin" element={<Admin />} />}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <footer className="footer">
        <b>ĂN HẾT</b> · Ăn hết đồ ngon, không để lãng phí 🌱
        <br />
        Bản thí điểm · Dự án khởi nghiệp xanh của sinh viên
      </footer>
    </HashRouter>
  )
}
