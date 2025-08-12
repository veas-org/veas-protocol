import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { VeasAuthProvider } from './auth'
import type { TokenCredentials, ApiKeyCredentials } from '../../protocols/common/auth'

// Mock fetch globally
global.fetch = vi.fn()

describe('VeasAuthProvider', () => {
  let authProvider: VeasAuthProvider
  
  beforeEach(() => {
    authProvider = new VeasAuthProvider({
      apiUrl: 'https://api.test.com'
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('authenticate', () => {
    it('should authenticate with token credentials', async () => {
      const mockResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          organizationId: 'org-456'
        },
        scopes: ['read', 'write'],
        expiresAt: '2024-12-31T00:00:00Z'
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })
      
      const credentials: TokenCredentials = {
        token: 'test-token-123'
      }
      
      const context = await authProvider.authenticate(credentials)
      
      expect(context.userId).toBe('user-123')
      expect(context.organizationId).toBe('org-456')
      expect(context.scopes).toEqual(['read', 'write'])
      expect(context.expiresAt).toEqual(new Date('2024-12-31T00:00:00Z'))
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/verify',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token-123'
          }
        })
      )
    })

    it('should authenticate with API key credentials', async () => {
      const mockResponse = {
        user: {
          id: 'user-456',
          organizationId: 'org-789'
        },
        scopes: ['admin']
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })
      
      const credentials: ApiKeyCredentials = {
        apiKey: 'api-key-xyz'
      }
      
      const context = await authProvider.authenticate(credentials)
      
      expect(context.userId).toBe('user-456')
      expect(context.scopes).toEqual(['admin'])
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/verify',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'api-key-xyz'
          })
        })
      )
    })

    it('should authenticate with username/password', async () => {
      const mockResponse = {
        token: 'generated-token',
        user: {
          id: 'user-789'
        },
        scopes: ['user']
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })
      
      const credentials = {
        username: 'testuser',
        password: 'testpass123'
      }
      
      const context = await authProvider.authenticate(credentials)
      
      expect(context.userId).toBe('user-789')
      expect(context.scopes).toEqual(['user'])
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            username: 'testuser',
            password: 'testpass123'
          })
        })
      )
    })

    it('should handle authentication failure', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })
      
      const credentials: TokenCredentials = {
        token: 'invalid-token'
      }
      
      await expect(authProvider.authenticate(credentials)).rejects.toThrow(
        'Authentication failed: 401 Unauthorized'
      )
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))
      
      const credentials: TokenCredentials = {
        token: 'test-token'
      }
      
      await expect(authProvider.authenticate(credentials)).rejects.toThrow(
        'Network error'
      )
    })

    it('should throw error for unsupported credentials', async () => {
      const credentials = {
        unsupported: 'value'
      } as any
      
      await expect(authProvider.authenticate(credentials)).rejects.toThrow(
        'Unsupported authentication method'
      )
    })

    it('should cache authentication context', async () => {
      const mockResponse = {
        user: { id: 'user-123' },
        scopes: ['read']
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })
      
      const credentials: TokenCredentials = { token: 'test-token' }
      
      // First call
      await authProvider.authenticate(credentials)
      expect(authProvider.isAuthenticated()).toBe(true)
      
      // Second call should use cached context
      const context = await authProvider.authenticate(credentials)
      expect(context.userId).toBe('user-123')
      
      // Fetch should only be called once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', () => {
      expect(authProvider.isAuthenticated()).toBe(false)
    })

    it('should return true after successful authentication', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'user-123' },
          scopes: []
        })
      })
      
      await authProvider.authenticate({ token: 'test-token' })
      expect(authProvider.isAuthenticated()).toBe(true)
    })

    it('should return false after disconnect', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'user-123' },
          scopes: []
        })
      })
      
      await authProvider.authenticate({ token: 'test-token' })
      expect(authProvider.isAuthenticated()).toBe(true)
      
      authProvider.disconnect()
      expect(authProvider.isAuthenticated()).toBe(false)
    })
  })

  describe('getAuthContext', () => {
    it('should return null when not authenticated', () => {
      expect(authProvider.getAuthContext()).toBeNull()
    })

    it('should return auth context after authentication', async () => {
      const mockResponse = {
        user: { id: 'user-123' },
        scopes: ['read', 'write']
      }
      
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })
      
      await authProvider.authenticate({ token: 'test-token' })
      
      const context = authProvider.getAuthContext()
      expect(context).not.toBeNull()
      expect(context?.userId).toBe('user-123')
      expect(context?.scopes).toEqual(['read', 'write'])
    })
  })

  describe('disconnect', () => {
    it('should clear auth context', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'user-123' },
          scopes: []
        })
      })
      
      await authProvider.authenticate({ token: 'test-token' })
      expect(authProvider.isAuthenticated()).toBe(true)
      
      authProvider.disconnect()
      expect(authProvider.isAuthenticated()).toBe(false)
      expect(authProvider.getAuthContext()).toBeNull()
    })
  })

  describe('config validation', () => {
    it('should accept valid API URL', () => {
      const provider = new VeasAuthProvider({
        apiUrl: 'https://api.example.com'
      })
      expect(provider).toBeDefined()
    })

    it('should handle API URL with trailing slash', () => {
      const provider = new VeasAuthProvider({
        apiUrl: 'https://api.example.com/'
      })
      expect(provider).toBeDefined()
    })

    it('should handle localhost URLs', () => {
      const provider = new VeasAuthProvider({
        apiUrl: 'http://localhost:3000'
      })
      expect(provider).toBeDefined()
    })
  })
})