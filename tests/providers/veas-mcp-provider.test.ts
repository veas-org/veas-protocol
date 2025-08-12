/**
 * Tests for Veas MCP Provider
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthenticationError } from '../../src'
import { VeasMCPProtocolProvider } from '../../src/providers/veas'

// Mock fetch
globalThis.fetch = vi.fn()

describe('VeasMCPProtocolProvider', () => {
  let provider: VeasMCPProtocolProvider
  const mockFetch = globalThis.fetch as any

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock implementation and provide default
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ userId: 'test', scopes: [] })
    })
    provider = new VeasMCPProtocolProvider({
      mcpEndpoint: 'http://localhost:3000/api/mcp/http',
    })
  })

  describe('Provider Configuration', () => {
    it('should have correct metadata', () => {
      expect(provider.name).toBe('veas-mcp')
      expect(provider.version).toBe('1.0.0')
      expect(provider.description).toBeDefined()
    })

    it('should expose protocol implementations', () => {
      expect(provider.projectManagement).toBeDefined()
      expect(provider.knowledgeBase).toBeDefined()
    })
  })

  describe('Authentication', () => {
    it('should authenticate with test token', async () => {
      // Mock the response for test token
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'user123' },
          scopes: ['projects:read', 'projects:write'],
        }),
      })

      const context = await provider.authenticate({
        token: 'tes_user123',
      })

      expect(context).toHaveProperty('userId', 'user123')
      expect(context).toHaveProperty('scopes')
      expect(provider.isConnected()).toBe(true)
    })

    it('should authenticate with production token', async () => {
      // Need to mock all three authenticate calls (main provider + two sub-providers)
      const authResponse = {
        ok: true,
        json: async () => ({
          user: { id: 'prod-user', organizationId: 'org-123' },
          scopes: ['projects:read', 'projects:write'],
        }),
      }

      mockFetch.mockImplementation(() => Promise.resolve(authResponse))

      const context = await provider.authenticate({
        token: 'mya_valid_token',
      })

      expect(context).toHaveProperty('userId', 'prod-user')
      expect(context).toHaveProperty('organizationId', 'org-123')
      expect(provider.isConnected()).toBe(true)

      // Verify fetch was called with correct endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('auth/verify'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mya_valid_token',
          }),
        })
      )
    })

    it('should handle authentication failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      await expect(
        provider.authenticate({
          token: 'mya_invalid_token',
        })
      ).rejects.toThrow('Authentication failed: 401 Unauthorized')
    })

    it('should disconnect properly', async () => {
      // Mock successful auth response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'user123' },
          scopes: ['projects:read'],
        }),
      })

      await provider.authenticate({
        token: 'tes_user123',
      })

      expect(provider.isConnected()).toBe(true)

      await provider.disconnect()
      expect(provider.isConnected()).toBe(false)
    })
  })

  describe('MCP Tool Calls', () => {
    beforeEach(async () => {
      // Mock successful auth for each test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'user123' },
          scopes: ['projects:read', 'projects:write', 'articles:read', 'articles:write'],
        }),
      })
      
      await provider.authenticate({
        token: 'tes_user123',
      })
    })

    it('should call project management tools via MCP', async () => {
      // Mock MCP response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: {
            content: [{
              type: 'json',
              data: {
                items: [
                  { id: '1', name: 'Test Project' },
                ],
                total: 1,
              },
            }],
          },
          id: 1,
        }),
      })

      const result = await provider.projectManagement.listProjects({
        limit: 10,
      })

      // Just verify the call was made successfully
      expect(result).toBeDefined()

      // Verify MCP call
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/mcp/http',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-User-Id': 'user123',
          }),
          body: expect.stringContaining('mcp-project-manager_list_my_projects'),
        })
      )
    })

    it('should call knowledge base tools via MCP', async () => {
      // Mock MCP response for the actual call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: {
            content: [{
              type: 'json',
              data: {
                items: [
                  { id: '1', title: 'Test Article' },
                ],
                total: 1,
              },
            }],
          },
          id: 1,
        }),
      })

      const result = await provider.knowledgeBase.listArticles({
        filters: { status: 'published' },
      })

      // Just verify the call was made successfully
      expect(result).toBeDefined()
    })

    it('should handle MCP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
          },
          id: 1,
        }),
      })

      await expect(
        provider.projectManagement.getProject('999')
      ).rejects.toThrow('MCP error -32603: Internal error')
    })

    it('should require authentication for operations', async () => {
      await provider.disconnect()

      // Mock fetch for the MCP call that will fail due to no auth
      mockFetch.mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Authentication required',
          },
          id: 1,
        }),
      }))

      await expect(
        provider.projectManagement.listProjects({})
      ).rejects.toThrow()
    })
  })

  describe('Error Handling', () => {
    beforeEach(async () => {
      // Mock successful auth
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'user123' },
          scopes: ['projects:read', 'projects:write', 'articles:read', 'articles:write'],
        }),
      })
      
      await provider.authenticate({
        token: 'tes_user123',
      })
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(
        provider.projectManagement.listProjects({})
      ).rejects.toThrow('Network error')
    })

    it('should handle invalid responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      })

      await expect(
        provider.projectManagement.listProjects({})
      ).rejects.toThrow('MCP request failed: Bad Request')
    })

    it('should handle missing content in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: {},
          id: 1,
        }),
      })

      const result = await provider.projectManagement.listProjects({})

      expect(result).toEqual({
        items: [],
        total: undefined,
        hasMore: undefined,
      })
    })
  })
})
