import { supabase } from './supabase'

export type Listing = {
  id: string
  shop_name: string
  dish_name: string
  quantity: number
  original_price: number
  discount_price: number
  area: string
  address: string
  contact_phone: string
  expires_at: string
  created_at: string
}

export type ListingInput = Omit<Listing, 'id' | 'created_at'>

const ERROR_MESSAGES: Record<string, string> = {
  EXPIRES_TOO_SOON: 'Giờ hết hiệu lực phải cách bây giờ ít nhất 10 phút.',
  EXPIRES_TOO_LATE: 'Tin chỉ được đăng tối đa 24 tiếng.',
  CODE_NOT_FOUND: 'Không tìm thấy tin với mã này. Kiểm tra lại mã nhé!',
  NOT_ADMIN: 'Sai mật khẩu admin.',
  NOT_CONFIGURED: 'Website chưa được kết nối database.',
}

export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  for (const code of Object.keys(ERROR_MESSAGES)) {
    if (msg.includes(code)) return ERROR_MESSAGES[code]
  }
  if (msg.includes('Failed to fetch')) return 'Mất kết nối mạng. Thử lại sau nhé!'
  return 'Có lỗi xảy ra, bạn thử lại nhé.'
}

function db() {
  if (!supabase) throw new Error('NOT_CONFIGURED')
  return supabase
}

async function call<T>(fn: string, params?: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, params)
  if (error) throw new Error(error.message)
  return data as T
}

function toParams(input: ListingInput) {
  return {
    p_shop_name: input.shop_name,
    p_dish_name: input.dish_name,
    p_quantity: input.quantity,
    p_original_price: input.original_price,
    p_discount_price: input.discount_price,
    p_area: input.area,
    p_address: input.address,
    p_contact_phone: input.contact_phone,
    p_expires_at: input.expires_at,
  }
}

export async function fetchActiveListings(): Promise<Listing[]> {
  return (await call<Listing[]>('get_active_listings')) ?? []
}

export async function createListing(input: ListingInput): Promise<{ id: string; manage_code: string }> {
  const rows = await call<{ id: string; manage_code: string }[]>('create_listing', toParams(input))
  return rows[0]
}

export async function getMyListing(code: string): Promise<Listing | null> {
  const rows = await call<Listing[]>('get_my_listing', { p_code: code })
  return rows?.[0] ?? null
}

export async function updateMyListing(code: string, input: ListingInput): Promise<void> {
  await call('update_my_listing', { p_code: code, ...toParams(input) })
}

export async function deleteMyListing(code: string): Promise<void> {
  await call('delete_my_listing', { p_code: code })
}

export async function adminListListings(key: string): Promise<Listing[]> {
  return (await call<Listing[]>('admin_list_listings', { p_key: key })) ?? []
}

export async function adminDeleteListing(key: string, id: string): Promise<void> {
  await call('admin_delete_listing', { p_key: key, p_id: id })
}
