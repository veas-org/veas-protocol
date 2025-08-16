import { describe, it, expect } from 'vitest'
import type { AuthContext, AuthCredentials, TokenCredentials, ApiKeyCredentials, OAuthCredentials } from './auth'

describe('Auth Types', () => {
  describe('AuthCredentials', () => {
    it('should handle token credentials', () => {
      const creds: TokenCredentials = {
        token: 'test-token-123',
      }

      expect(creds.token).toBe('test-token-123')
      expect('token' in creds).toBe(true)
    })

    it('should handle API key credentials', () => {
      const creds: ApiKeyCredentials = {
        apiKey: 'api-key-456',
      }

      expect(creds.apiKey).toBe('api-key-456')
      expect('apiKey' in creds).toBe(true)
    })

    it('should handle OAuth credentials', () => {
      const creds: OAuthCredentials = {
        clientId: 'client-123',
        clientSecret: 'secret-456',
        redirectUri: 'http://localhost:3000/callback',
        scope: 'read write',
      }

      expect(creds.clientId).toBe('client-123')
      expect(creds.clientSecret).toBe('secret-456')
      expect(creds.redirectUri).toBe('http://localhost:3000/callback')
      expect(creds.scope).toBe('read write')
    })

    it('should handle OAuth credentials with tokens', () => {
      const creds: OAuthCredentials = {
        clientId: 'client-123',
        clientSecret: 'secret-456',
        accessToken: 'access-789',
        refreshToken: 'refresh-012',
      }

      expect(creds.accessToken).toBe('access-789')
      expect(creds.refreshToken).toBe('refresh-012')
    })

    it('should handle username/password credentials', () => {
      const creds: AuthCredentials = {
        username: 'testuser',
        password: 'testpass123',
      }

      expect(creds.username).toBe('testuser')
      expect(creds.password).toBe('testpass123')
    })
  })

  describe('AuthContext', () => {
    it('should create a valid auth context', () => {
      const context: AuthContext = {
        userId: 'user-123',
        organizationId: 'org-456',
        scopes: ['read', 'write'],
        expiresAt: new Date('2024-12-31'),
      }

      expect(context.userId).toBe('user-123')
      expect(context.organizationId).toBe('org-456')
      expect(context.scopes).toEqual(['read', 'write'])
      expect(context.expiresAt).toEqual(new Date('2024-12-31'))
    })

    it('should handle auth context without optional fields', () => {
      const context: AuthContext = {
        userId: 'user-123',
        scopes: [],
      }

      expect(context.userId).toBe('user-123')
      expect(context.organizationId).toBeUndefined()
      expect(context.scopes).toEqual([])
      expect(context.expiresAt).toBeUndefined()
    })

    it('should handle auth context with metadata', () => {
      const context: AuthContext = {
        userId: 'user-123',
        scopes: ['admin'],
        metadata: {
          role: 'admin',
          department: 'engineering',
          customField: 'value',
        },
      }

      expect(context.metadata).toEqual({
        role: 'admin',
        department: 'engineering',
        customField: 'value',
      })
    })
  })
})
