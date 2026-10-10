// Ghi nhớ mã quản lý trên máy của chủ quán cho tiện.
// Chỉ là tiện ích: xóa dữ liệu trình duyệt là mất, nên vẫn phải tự lưu mã.
export type SavedListing = { code: string; shop: string; dish: string; savedAt: string }

const KEY = 'anhet.myListings'

export function loadSaved(): SavedListing[] {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveListing(item: SavedListing) {
  try {
    const list = loadSaved().filter((x) => x.code !== item.code)
    list.unshift(item)
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)))
  } catch {
    // trình duyệt chặn lưu trữ: bỏ qua
  }
}

export function forgetListing(code: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(loadSaved().filter((x) => x.code !== code)))
  } catch {
    // bỏ qua
  }
}
