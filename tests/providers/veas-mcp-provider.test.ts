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
    // Reset the mock implementation
    mockFetch.mockReset()
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
      const context = await provider.authenticate({
        type: 'token',
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
          userId: 'prod-user',
          scopes: ['projects:read', 'projects:write'],
          organizationId: 'org-123',
        }),
      }

      mockFetch.mockImplementation(() => Promise.resolve(authResponse))

      const context = await provider.authenticate({
        type: 'token',
        token: 'mya_valid_token',
      })

      expect(context).toHaveProperty('userId', 'prod-user')
      expect(context).toHaveProperty('organizationId', 'org-123')
      expect(provider.isConnected()).toBe(true)

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mcp/auth'),
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
        statusText: 'Unauthorized',
      })

      await expect(
        provider.authenticate({
          type: 'token',
          token: 'mya_invalid_token',
        })
      ).rejects.toThrow(AuthenticationError)
    })

    it('should disconnect properly', async () => {
      await provider.authenticate({
        type: 'token',
        token: 'tes_user123',
      })

      expect(provider.isConnected()).toBe(true)

      await provider.disconnect()
      expect(provider.isConnected()).toBe(false)
    })
  })

  describe('MCP Tool Calls', () => {
    beforeEach(async () => {
      await provider.authenticate({
        type: 'token',
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
                projects: [
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

      expect(result).toHaveProperty('items')
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Test Project')

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
      // Mock MCP response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: {
            content: [{
              type: 'json',
              data: {
                articles: [
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

      expect(result).toHaveProperty('items')
      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe('Test Article')
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
      ).rejects.toThrow('MCP error: Internal error')
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
      await provider.authenticate({
        type: 'token',
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
