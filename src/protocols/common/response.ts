/**
 * Protocol response format definitions
 */

export type ResponseFormat = 'json' | 'markdown'

export interface ProtocolResponse<T = unknown> {
  data: T
  format?: ResponseFormat
  metadata?: ResponseMetadata
}

export interface ResponseMetadata {
  timestamp: Date
  provider: string
  version: string
  requestId?: string
}
