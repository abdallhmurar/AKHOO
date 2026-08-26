/**
 * A small, transport-agnostic error model used by repositories, providers,
 * and route components. Raw Supabase errors should never need to leak into
 * the UI.
 */
export type AppErrorCode =
  | 'auth'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'validation'
  | 'rate-limited'
  | 'offline'
  | 'timeout'
  | 'database'
  | 'storage'
  | 'unknown'

export type AppErrorContext = {
  operation?: string
  domain?: string
  silent?: boolean
  metadata?: Record<string, unknown>
}

type ErrorLike = {
  message?: unknown
  code?: unknown
  status?: unknown
  name?: unknown
  details?: unknown
  hint?: unknown
}

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly status?: number
  readonly cause?: unknown
  readonly context?: AppErrorContext
  readonly details?: string

  constructor(
    message: string,
    options: {
      code?: AppErrorCode
      status?: number
      cause?: unknown
      context?: AppErrorContext
      details?: string
    } = {}
  ) {
    super(message)
    this.name = 'AppError'
    this.code = options.code ?? 'unknown'
    this.status = options.status
    this.cause = options.cause
    this.context = options.context
    this.details = options.details
  }
}

function asErrorLike(value: unknown): ErrorLike {
  return value && typeof value === 'object' ? (value as ErrorLike) : {}
}

function readStatus(error: ErrorLike): number | undefined {
  if (typeof error.status === 'number') return error.status
  if (typeof error.status === 'string') {
    const parsed = Number(error.status)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function classify(error: ErrorLike, message: string): AppErrorCode {
  const code = typeof error.code === 'string' ? error.code : ''
  const status = readStatus(error)
  const text = `${code} ${message}`.toLowerCase()

  if (status === 401 || text.includes('invalid login') || text.includes('jwt') || text.includes('session')) return 'auth'
  if (status === 403 || code === '42501' || text.includes('permission denied') || text.includes('row-level security')) return 'forbidden'
  if (status === 404 || code === 'PGRST116' || text.includes('not found')) return 'not-found'
  if (status === 409 || code === '23505' || text.includes('already exists') || text.includes('duplicate')) return 'conflict'
  if (status === 422 || code === '23514' || code === '22023' || text.includes('validation')) return 'validation'
  if (status === 429 || text.includes('rate limit')) return 'rate-limited'
  if (text.includes('network request failed') || text.includes('failed to fetch') || text.includes('offline')) return 'offline'
  if (text.includes('timeout') || text.includes('timed out')) return 'timeout'
  if (code.startsWith('PGRST') || /^\d{5}$/.test(code)) return 'database'
  if (text.includes('storage') || text.includes('bucket')) return 'storage'
  return 'unknown'
}

export function normalizeAppError(error: unknown, context?: AppErrorContext): AppError {
  if (error instanceof AppError) {
    if (!context || error.context) return error
    return new AppError(error.message, {
      code: error.code,
      status: error.status,
      cause: error.cause,
      details: error.details,
      context
    })
  }

  const source = asErrorLike(error)
  const message = typeof source.message === 'string'
    ? source.message
    : typeof error === 'string'
      ? error
      : 'Something went wrong. Please try again.'
  const details = typeof source.details === 'string'
    ? source.details
    : typeof source.hint === 'string'
      ? source.hint
      : undefined

  return new AppError(message, {
    code: classify(source, message),
    status: readStatus(source),
    cause: error,
    context,
    details
  })
}

export type ErrorTranslator = (ar: string, he: string, en: string) => string

/** Safe, user-facing copy for transport errors in all launch languages. */
export function localizeAppError(error: unknown, tr: ErrorTranslator) {
  const normalized = normalizeAppError(error)
  switch (normalized.code) {
    case 'auth': return tr('تعذر التحقق من الحساب. راجع بياناتك وحاول مجدداً.', 'לא ניתן לאמת את החשבון. בדקו את הפרטים ונסו שוב.', 'We could not verify the account. Check your details and try again.')
    case 'forbidden': return tr('لا تملك صلاحية تنفيذ هذا الإجراء.', 'אין הרשאה לבצע פעולה זו.', 'You do not have permission to do that.')
    case 'not-found': return tr('لم يعد هذا العنصر متاحاً.', 'הפריט הזה אינו זמין עוד.', 'This item is no longer available.')
    case 'conflict': return tr('تغيّرت الحالة للتو. حدّث الشاشة وحاول مجدداً.', 'המצב השתנה כעת. רעננו ונסו שוב.', 'The state just changed. Refresh and try again.')
    case 'validation': return tr('تحقق من المعلومات المدخلة وحاول مجدداً.', 'בדקו את הפרטים שהוזנו ונסו שוב.', 'Check the information you entered and try again.')
    case 'rate-limited': return tr('هناك محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.', 'בוצעו ניסיונות רבים. המתינו מעט ונסו שוב.', 'Too many attempts. Wait a moment and try again.')
    case 'offline': return tr('لا يوجد اتصال بالإنترنت حالياً.', 'אין כרגע חיבור לאינטרנט.', 'There is no internet connection right now.')
    case 'timeout': return tr('استغرق الاتصال وقتاً أطول من المتوقع. حاول مجدداً.', 'החיבור נמשך זמן רב מהצפוי. נסו שוב.', 'The connection took longer than expected. Try again.')
    case 'storage': return tr('تعذر حفظ الملف بأمان. حاول مجدداً.', 'לא ניתן לשמור את הקובץ בבטחה. נסו שוב.', 'We could not save the file securely. Try again.')
    case 'database': return tr('الخدمة غير متاحة مؤقتاً. حاول بعد قليل.', 'השירות אינו זמין זמנית. נסו שוב מאוחר יותר.', 'The service is temporarily unavailable. Try again shortly.')
    default: return tr('حدث خطأ غير متوقع. حاول مجدداً.', 'אירעה שגיאה לא צפויה. נסו שוב.', 'Something unexpected happened. Try again.')
  }
}

/** PostgreSQL/PostgREST codes returned while a V2 migration is not applied. */
export function isMissingDatabaseObject(error: unknown) {
  const source = asErrorLike(error)
  const code = typeof source.code === 'string' ? source.code : ''
  const message = typeof source.message === 'string' ? source.message.toLowerCase() : ''
  return code === '42P01'
    || code === '42703'
    || code === 'PGRST200'
    || code === 'PGRST204'
    || code === 'PGRST205'
    || message.includes('could not find the table')
    || message.includes('does not exist')
}

export function throwIfError(error: unknown, context?: AppErrorContext): asserts error is null | undefined {
  if (error) throw normalizeAppError(error, context)
}

export type AppErrorEvent = { error: AppError; occurredAt: string }
type AppErrorListener = (event: AppErrorEvent) => void

const listeners = new Set<AppErrorListener>()

/**
 * QueryProvider reports background/query errors here. A toast host or an
 * observability adapter can subscribe without coupling repositories to UI.
 */
export function reportAppError(error: unknown, context?: AppErrorContext) {
  const normalized = normalizeAppError(error, context)
  if (!normalized.context?.silent) {
    const event = { error: normalized, occurredAt: new Date().toISOString() }
    listeners.forEach(listener => listener(event))
  }
  return normalized
}

export function subscribeToAppErrors(listener: AppErrorListener) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
