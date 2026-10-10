# ĂN HẾT 🍱

Nền tảng kết nối đồ ăn dư cuối ngày giữa quán ăn và sinh viên quanh trường. Bản thí điểm (MVP).

- **Sinh viên**: xem tin giảm giá còn hiệu lực, lọc theo khu vực và thời gian còn lại, gọi/Zalo/chỉ đường tới quán.
- **Chủ quán**: đăng tin không cần tài khoản; nhận **mã quản lý** để sửa, báo "Đã bán hết" hoặc xóa tin.
- Tin tự ẩn khi hết giờ hoặc hết hàng.
- **Admin** (`/admin`): xem tin 7 ngày gần nhất, xóa tin spam.

Công nghệ: Vite + React + TypeScript, đăng trên GitHub Pages: https://fudoyuser.github.io/an-het/

## Chế độ hiện tại: demo, không dùng database

Khi không cấu hình Supabase, tin đăng lưu trên trình duyệt của từng người (localStorage), kèm 4 tin mẫu. Người khác **không** thấy tin bạn đăng. Trang admin bị tắt.

Cập nhật trang web: sửa code → `npm run build` (ra thư mục `docs/`) → commit và push lên `main`. GitHub Pages phục vụ thư mục `docs/`.

Muốn bật database dùng chung (để chủ quán và sinh viên thấy tin của nhau): làm theo các bước Supabase bên dưới, tạo file `.env`, build lại.

## 1. Tạo database Supabase

1. Tạo project miễn phí tại https://supabase.com (chọn region Singapore cho nhanh).
2. Vào **SQL Editor**, dán toàn bộ nội dung [supabase/schema.sql](supabase/schema.sql) rồi bấm **Run**.
3. Đặt mật khẩu admin (ít nhất 12 ký tự), cũng chạy trong SQL Editor:
   ```sql
   select public.set_admin_key('mat-khau-admin-cua-ban');
   ```
4. Vào **Project Settings → API** (hoặc **API Keys**), lấy **Project URL** và **anon / publishable key**.

> Bảo mật: trình duyệt không đọc/ghi bảng trực tiếp; mọi thao tác đi qua các hàm SQL. Mã quản lý chỉ lưu dạng băm (sha256). Key anon/publishable được phép công khai.

## 2. Chạy trên máy

```bash
cp .env.example .env      # rồi điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## 3. (Tùy chọn) Deploy lên Vercel thay cho GitHub Pages

1. Vào https://vercel.com → **Add New → Project** → import repo GitHub này.
2. Framework: **Vite** (tự nhận). Thêm 2 biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
3. Bấm **Deploy** → có link dạng `https://an-het.vercel.app`.

## Tùy chỉnh

- Danh sách khu vực, bộ lọc thời gian: [src/config.ts](src/config.ts).
- Màu sắc, giao diện: [src/styles.css](src/styles.css).

## Đường dẫn

| Trang | Đường dẫn |
|---|---|
| Danh sách tin | `/` |
| Đăng tin | `#/dang-tin` |
| Quản lý tin (nhập mã) | `#/quan-ly` hoặc `#/quan-ly?ma=XXXXXXXX` |
| Admin (chỉ khi có database) | `#/admin` |
