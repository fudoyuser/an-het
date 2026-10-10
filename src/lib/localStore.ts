// Chế độ không dùng database: tin đăng lưu trên trình duyệt của người dùng,
// kèm vài tin mẫu để trang luôn có nội dung khi giới thiệu.
import type { Listing, ListingInput } from './api'

type Stored = Listing & { code: string }

const KEY = 'anhet.localListings'
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const MIN_MS = 10 * 60000
const MAX_MS = 24 * 3600000

function read(): Stored[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function write(list: Stored[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    throw new Error('STORAGE_BLOCKED')
  }
}

function genCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => CODE_ALPHABET[b % 32]).join('')
}

function checkExpiry(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms < MIN_MS) throw new Error('EXPIRES_TOO_SOON')
  if (ms > MAX_MS) throw new Error('EXPIRES_TOO_LATE')
}

function strip({ code: _code, ...l }: Stored): Listing {
  return l
}

// Tin mẫu: giờ hết hạn neo theo đầu giờ hiện tại nên đếm ngược vẫn chạy đúng
function demoListings(): Listing[] {
  const anchor = new Date()
  anchor.setMinutes(0, 0, 0)
  const at = (min: number) => new Date(anchor.getTime() + min * 60000).toISOString()
  const created = anchor.toISOString()
  const demo: [string, string, number, number, number, string, string, string, number][] = [
    ['Bánh mì Cô Ba', 'Bánh mì pate trứng', 8, 25000, 12000, 'Cổng chính', 'Số 12 ngõ 30, cạnh tiệm photo', '0912345678', 105],
    ['Tiệm bánh Mây', 'Bánh su kem (hộp 6 cái)', 12, 60000, 30000, 'Phố ăn vặt gần trường', '8 phố Ăn Vặt', '0901234567', 150],
    ['Cơm tấm Sườn Ngon', 'Cơm sườn bì chả', 5, 45000, 25000, 'Khu ký túc xá', '45 đường KTX, đối diện nhà B', '0987654321', 210],
    ['Bún chả Hà Thành', 'Bún chả suất thường', 3, 40000, 28000, 'Cổng phụ / cổng sau', 'Ngõ 5 cổng sau', '0934567890', 270],
  ]
  return demo.map(([shop_name, dish_name, quantity, original_price, discount_price, area, address, contact_phone, min], i) => ({
    id: `demo-${i + 1}`,
    shop_name, dish_name, quantity, original_price, discount_price, area, address, contact_phone,
    expires_at: at(min),
    created_at: created,
  }))
}

export async function localActiveListings(): Promise<Listing[]> {
  const now = Date.now()
  return [...read().map(strip), ...demoListings()]
    .filter((l) => new Date(l.expires_at).getTime() > now && l.quantity > 0)
    .sort((a, b) => a.expires_at.localeCompare(b.expires_at))
}

export async function localCreate(input: ListingInput): Promise<{ id: string; manage_code: string }> {
  checkExpiry(input.expires_at)
  const code = genCode()
  const item: Stored = { ...input, id: crypto.randomUUID(), created_at: new Date().toISOString(), code }
  // Dọn tin đã hết hạn quá 2 ngày
  const keep = read().filter((l) => new Date(l.expires_at).getTime() > Date.now() - 2 * 86400000)
  write([...keep, item])
  return { id: item.id, manage_code: code }
}

export async function localGet(code: string): Promise<Listing | null> {
  const found = read().find((l) => l.code === code)
  return found ? strip(found) : null
}

export async function localUpdate(code: string, input: ListingInput): Promise<void> {
  const list = read()
  const i = list.findIndex((l) => l.code === code)
  if (i < 0) throw new Error('CODE_NOT_FOUND')
  if (input.expires_at !== list[i].expires_at) checkExpiry(input.expires_at)
  list[i] = { ...list[i], ...input }
  write(list)
}

export async function localDelete(code: string): Promise<void> {
  const list = read()
  if (!list.some((l) => l.code === code)) throw new Error('CODE_NOT_FOUND')
  write(list.filter((l) => l.code !== code))
}
