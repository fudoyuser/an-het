export function formatVND(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ'
}

export function discountPercent(original: number, discounted: number): number {
  if (original <= 0) return 0
  return Math.round((1 - discounted / original) * 100)
}

export function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function dayLabel(d: Date, now: Date): string {
  const diff = Math.round((startOfDay(d) - startOfDay(now)) / 86400000)
  if (diff === 0) return 'hôm nay'
  if (diff === 1) return 'ngày mai'
  if (diff === -1) return 'hôm qua'
  return d.toLocaleDateString('vi-VN')
}

export function formatTimeLeft(ms: number): string {
  if (ms <= 0) return 'Hết giờ'
  const totalMin = Math.floor(ms / 60000)
  if (totalMin < 1) return 'Còn < 1 phút'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `Còn ${m} phút`
  return m === 0 ? `Còn ${h} tiếng` : `Còn ${h}g ${m}p`
}

// "21:30" -> thời điểm gần nhất trong tương lai (hôm nay, hoặc ngày mai nếu giờ đó đã qua)
export function timeInputToDate(value: string, now: Date): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!m) return null
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(m[1]), Number(m[2]))
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1)
  return d
}

export function normalizePhone(raw: string): string {
  let p = raw.replace(/[^\d+]/g, '')
  if (p.startsWith('+84')) p = '0' + p.slice(3)
  else if (p.startsWith('84') && p.length === 11) p = '0' + p.slice(2)
  return p.replace(/\D/g, '')
}

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function displayCode(code: string): string {
  const c = normalizeCode(code)
  return c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c
}

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '')
}
