/**
 * Protocol error definitions
 */

export class ProtocolError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ProtocolError'
  }
}

export class AuthenticationError extends ProtocolError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_REQUIRED', 401)
  }
}

export class AuthorizationError extends ProtocolError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'INSUFFICIENT_PERMISSIONS', 403)
  }
}

export class NotFoundError extends ProtocolError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`
    super(message, 'NOT_FOUND', 404)
  }
}

export class ValidationError extends ProtocolError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details)
  }
}

export class ProviderError extends ProtocolError {
  constructor(provider: string, message: string, details?: unknown) {
    super(`${provider}: ${message}`, 'PROVIDER_ERROR', 500, details)
  }
}