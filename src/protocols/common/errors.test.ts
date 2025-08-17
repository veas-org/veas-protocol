import { describe, expect, it } from 'vitest'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ProtocolError,
  RateLimitError,
  ServerError,
  UnauthorizedError,
  ValidationError,
} from './errors'

describe('Protocol Errors', () => {
  describe('ProtocolError', () => {
    it('should create a basic protocol error', () => {
      const error = new ProtocolError('Test error')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ProtocolError)
      expect(error.message).toBe('Test error')
      expect(error.name).toBe('ProtocolError')
      expect(error.code).toBe('PROTOCOL_ERROR')
    })

    it('should include code and details', () => {
      const details = { field: 'test', value: 123 }
      const error = new ProtocolError('Test error', 'CUSTOM_CODE', details)
      expect(error.code).toBe('CUSTOM_CODE')
      expect(error.details).toEqual(details)
    })
  })

  describe('ValidationError', () => {
    it('should create a validation error', () => {
      const error = new ValidationError('Invalid input')
      expect(error).toBeInstanceOf(ProtocolError)
      expect(error.message).toBe('Invalid input')
      expect(error.name).toBe('ValidationError')
      expect(error.code).toBe('VALIDATION_ERROR')
    })

    it('should include field details', () => {
      const details = { field: 'email', reason: 'invalid format' }
      const error = new ValidationError('Invalid email', details)
      expect(error.details).toEqual(details)
    })
  })

  describe('NotFoundError', () => {
    it('should create a not found error', () => {
      const error = new NotFoundError('Resource not found')
      expect(error).toBeInstanceOf(ProtocolError)
      expect(error.message).toBe('Resource not found')
      expect(error.name).toBe('NotFoundError')
      expect(error.code).toBe('NOT_FOUND')
    })

    it('should include resource details', () => {
      const details = { resource: 'Article', id: 'abc123' }
      const error = new NotFoundError('Article not found', details)
      expect(error.details).toEqual(details)
    })
  })

  describe('UnauthorizedError', () => {
    it('should create an unauthorized error', () => {
      const error = new UnauthorizedError('Authentication required')
      expect(error).toBeInstanceOf(ProtocolError)
      expect(error.message).toBe('Authentication required')
      expect(error.name).toBe('UnauthorizedError')
      expect(error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('ForbiddenError', () => {
    it('should create a forbidden error', () => {
      const error = new ForbiddenError('Access denied')
      expect(error).toBeInstanceOf(ProtocolError)
      expect(error.message).toBe('Access denied')
      expect(error.name).toBe('ForbiddenError')
      expect(error.code).toBe('FORBIDDEN')
    })

    it('should include permission details', () => {
      const details = { requiredRole: 'admin', currentRole: 'user' }
      const error = new ForbiddenError('Insufficient permissions', details)
      expect(error.details).toEqual(details)
    })
  })

  describe('ConflictError', () => {
    it('should create a conflict error', () => {
      const error = new ConflictError('Resource already exists')
      expect(error).toBeInstanceOf(ProtocolError)
      expect(error.message).toBe('Resource already exists')
      expect(error.name).toBe('ConflictError')
      expect(error.code).toBe('CONFLICT')
    })
  })

  describe('RateLimitError', () => {
    it('should create a rate limit error', () => {
      const error = new RateLimitError('Too many requests')
      expect(error).toBeInstanceOf(ProtocolError)
      expect(error.message).toBe('Too many requests')
      expect(error.name).toBe('RateLimitError')
      expect(error.code).toBe('RATE_LIMIT')
    })

    it('should include rate limit details', () => {
      const details = { retryAfter: 60, limit: 100, remaining: 0 }
      const error = new RateLimitError('Rate limit exceeded', details)
      expect(error.details).toEqual(details)
    })
  })

  describe('ServerError', () => {
    it('should create a server error', () => {
      const error = new ServerError('Internal server error')
      expect(error).toBeInstanceOf(ProtocolError)
      expect(error.message).toBe('Internal server error')
      expect(error.name).toBe('ServerError')
      expect(error.code).toBe('SERVER_ERROR')
    })
  })
})
