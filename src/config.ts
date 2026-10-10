// Danh sách khu vực hiển thị ở bộ lọc và form đăng tin.
// Sửa lại cho đúng các khu vực quanh trường của bạn.
export const AREAS = [
  'Cổng chính',
  'Cổng phụ / cổng sau',
  'Khu ký túc xá',
  'Phố ăn vặt gần trường',
  'Khu vực khác',
]

// Bộ lọc "còn hiệu lực ít nhất ..." (phút)
export const TIME_FILTERS = [
  { label: 'Tất cả', minutes: 0 },
  { label: 'Còn ≥ 30 phút', minutes: 30 },
  { label: 'Còn ≥ 1 tiếng', minutes: 60 },
  { label: 'Còn ≥ 2 tiếng', minutes: 120 },
]

// Tin phải còn hiệu lực ít nhất bao lâu khi đăng (khớp với database)
export const MIN_EXPIRY_MINUTES = 10
