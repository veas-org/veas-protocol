/**
 * Protocol error definitions
 */

export class ProtocolError extends Error {
  public code: string
  public details?: unknown

  constructor(message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'ProtocolError'
    this.code = code || 'PROTOCOL_ERROR'
    this.details = details
  }
}

export class AuthenticationError extends ProtocolError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_REQUIRED')
  }
}

export class AuthorizationError extends ProtocolError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'INSUFFICIENT_PERMISSIONS')
  }
}

export class ValidationError extends ProtocolError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ProtocolError {
  constructor(message: string, details?: unknown) {
    super(message, 'NOT_FOUND', details)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends ProtocolError {
  constructor(message: string, details?: unknown) {
    super(message, 'UNAUTHORIZED', details)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ProtocolError {
  constructor(message: string, details?: unknown) {
    super(message, 'FORBIDDEN', details)
    this.name = 'ForbiddenError'
  }
}

export class ConflictError extends ProtocolError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ProtocolError {
  constructor(message: string, details?: unknown) {
    super(message, 'RATE_LIMIT', details)
    this.name = 'RateLimitError'
  }
}

export class ServerError extends ProtocolError {
  constructor(message: string, details?: unknown) {
    super(message, 'SERVER_ERROR', details)
    this.name = 'ServerError'
  }
}

export class ProviderError extends ProtocolError {
  constructor(provider: string, message: string, details?: unknown) {
    super(`${provider}: ${message}`, 'PROVIDER_ERROR', details)
  }
}