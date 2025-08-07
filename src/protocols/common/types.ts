/**
 * Common types used across all protocols
 */

export interface PaginationParams {
  limit?: number
  offset?: number
}

export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  [key: string]: unknown
}

export interface ListParams extends PaginationParams, SortParams {
  filters?: FilterParams
}

export interface ListResponse<T> {
  items: T[]
  total?: number
  hasMore?: boolean
}

export interface Timestamps {
  createdAt: Date
  updatedAt: Date
}

export interface Entity extends Timestamps {
  id: string
}

export interface OutputFormat {
  outputFormat?: 'json' | 'markdown'
}