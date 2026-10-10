# ĂN HẾT 🍱

Nền tảng kết nối đồ ăn dư cuối ngày giữa quán ăn và sinh viên quanh trường. Bản thí điểm (MVP).

Link: https://fudoyuser.github.io/an-het/

- **Sinh viên**: xem tin giảm giá còn hiệu lực, lọc theo khu vực và thời gian còn lại, gọi/Zalo/chỉ đường tới quán.
- **Chủ quán**: đăng tin không cần tài khoản, nhận **mã quản lý** để sửa, báo "Đã bán hết" hoặc xóa tin.
- Tin tự ẩn khi hết giờ hoặc hết hàng.

Toàn bộ trang nằm trong một file [index.html](index.html) (HTML + CSS + JavaScript), không cần cài đặt hay build.

## Bản demo

Chưa dùng database: tin đăng lưu trên trình duyệt của từng người (localStorage), kèm 4 tin mẫu. Người khác **không** thấy tin bạn đăng.

## Tùy chỉnh

Mở `index.html`, tìm phần `Cấu hình` trong thẻ `<script>`:

- `AREAS`: danh sách khu vực quanh trường.
- `TIME_FILTERS`: các mốc lọc thời gian còn lại.

Sửa xong thì commit và push lên `main`, GitHub Pages tự cập nhật sau khoảng 1 phút.
