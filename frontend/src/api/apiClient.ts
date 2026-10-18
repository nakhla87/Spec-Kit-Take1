const DEFAULT_API_BASE_URL = 'http://localhost:5080'

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

/** RFC 7807 problem details as returned by the API for 4xx/5xx responses. */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  /** Validation errors keyed by field name (ASP.NET Core ValidationProblemDetails). */
  errors?: Record<string, string[]>
}

/** Thrown for any non-2xx response. `problem` is set when the body is ProblemDetails JSON. */
export class ApiError extends Error {
  readonly status: number
  readonly problem?: ProblemDetails

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }
  return url.toString()
}

async function parseError(response: Response): Promise<ApiError> {
  let problem: ProblemDetails | undefined
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('json')) {
    try {
      problem = (await response.json()) as ProblemDetails
    } catch {
      // Body was not valid JSON; fall back to the status text.
    }
  }
  const validationMessages = problem?.errors ? Object.values(problem.errors).flat() : []
  const message =
    validationMessages[0] ??
    problem?.detail ??
    problem?.title ??
    (response.statusText || `Request failed with status ${response.status}`)
  return new ApiError(response.status, message, problem)
}

async function request<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  if (!response.ok) throw await parseError(response)
  if (response.status === 204) return undefined as T

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T = void>(path: string, options?: Omit<RequestOptions, 'body'>) => request<T>('DELETE', path, options),
}
