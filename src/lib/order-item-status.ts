export const ORDER_ITEM_STATUSES = ['pending', 'on_delivery', 'delivered', 'cancelled'] as const
export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number]

const RANK: Record<OrderItemStatus, number> = {
  pending: 0,
  on_delivery: 1,
  delivered: 2,
  cancelled: 3,
}

export function itemStatusRank(status: string): number {
  if (status in RANK) return RANK[status as OrderItemStatus]
  return 99
}

/** Lower rank = higher priority (pending first). */
export function orderSortKeyFromItemStatuses(items: { item_status: string }[]): number {
  if (items.length === 0) return 0
  return Math.min(...items.map((i) => itemStatusRank(i.item_status)))
}

export function sortOrderItemsByStatus<T extends { item_status: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => itemStatusRank(a.item_status) - itemStatusRank(b.item_status))
}

export function isOrderItemStatus(value: unknown): value is OrderItemStatus {
  return typeof value === 'string' && (ORDER_ITEM_STATUSES as readonly string[]).includes(value)
}

export const ORDER_ITEM_STATUS_LABEL_VI: Record<OrderItemStatus, string> = {
  pending: 'Chờ xử lý',
  on_delivery: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
}

/** Tailwind classes for small status pills (account + admin UI). */
export function itemStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-900 ring-amber-200/80'
    case 'on_delivery':
      return 'bg-sky-100 text-sky-900 ring-sky-200/80'
    case 'delivered':
      return 'bg-emerald-100 text-emerald-900 ring-emerald-200/80'
    case 'cancelled':
      return 'bg-slate-200 text-slate-800 ring-slate-300/80'
    default:
      return 'bg-slate-100 text-slate-800 ring-slate-200/80'
  }
}

export function emptyOrderItemCounts(): Record<OrderItemStatus, number> {
  return ORDER_ITEM_STATUSES.reduce(
    (acc, s) => {
      acc[s] = 0
      return acc
    },
    {} as Record<OrderItemStatus, number>
  )
}

/** Counts each order line (order_items row) by fulfillment status. */
export function countOrderItemsByStatus<T extends { item_status?: string | null }>(
  items: T[]
): Record<OrderItemStatus, number> {
  const counts = emptyOrderItemCounts()
  for (const item of items) {
    const raw = item.item_status ?? 'pending'
    const key: OrderItemStatus = isOrderItemStatus(raw) ? raw : 'pending'
    counts[key]++
  }
  return counts
}
