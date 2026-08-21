// Shared server-side pagination helper. The caller builds its own Supabase
// query (filters/order/`{count:'exact'}`) and hands us a function that
// applies `.range(from, to)` to it - keeps this helper decoupled from
// Supabase's builder generics (which change shape after `.range()` is
// called) while still centralizing the from/to math and the
// error-to-exception conversion every list hook needs.

export type PageResult<T> = { rows: T[]; total: number }

export type PageQueryFn<T> = (
  from: number,
  to: number
) => PromiseLike<{ data: T[] | null; count: number | null; error: { message: string } | null }>

export async function fetchPage<T>(queryFn: PageQueryFn<T>, page: number, pageSize: number): Promise<PageResult<T>> {
  const from = page * pageSize
  const to = from + pageSize - 1
  const { data, count, error } = await queryFn(from, to)
  if (error) throw new Error(error.message)
  return { rows: data ?? [], total: count ?? 0 }
}

export const DEFAULT_PAGE_SIZE = 20
