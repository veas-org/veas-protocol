import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MCPClient } from './mcp-client'
import type { AuthContext } from '../../protocols/common'

// Mock fetch globally
global.fetch = vi.fn()
;(globalThis as any).fetch = global.fetch

describe('MCPClient', () => {
  let client: MCPClient

  beforeEach(() => {
    client = new MCPClient({
      endpoint: 'http://localhost:3000/api/mcp',
      headers: {
        'X-Custom-Header': 'test-value',
      },
    })
    vi.clearAllMocks()
  })

  describe('callTool', () => {
    it('should make a successful tool call', async () => {
      const mockResponse = {
        jsonrpc: '2.0',
        result: { data: 'test-result' },
        id: 1,
      }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.callTool('test-tool', { param: 'value' })

      expect(result).toEqual({ data: 'test-result' })

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/mcp',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'test-value',
          }),
          body: expect.stringContaining('"method":"tools/call"'),
        }),
      )
    })

    it('should include tool name and arguments in request', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: {}, id: 1 }),
      })

      await client.callTool('my-tool', { arg1: 'value1', arg2: 123 })

      const callArg = (global.fetch as any).mock.calls[0][1]
      const body = JSON.parse(callArg.body)

      expect(body.method).toBe('tools/call')
      expect(body.params.name).toBe('my-tool')
      expect(body.params.arguments).toEqual({ arg1: 'value1', arg2: 123 })
    })

    it('should include auth context in headers when provided', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: {}, id: 1 }),
      })

      const authContext: AuthContext = {
        userId: 'user-123',
        scopes: ['read', 'write'],
      }

      await client.callTool('test-tool', {}, authContext)

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/mcp',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-User-Id': 'user-123',
            'X-Scopes': 'read,write',
          }),
        }),
      )
    })

    it('should handle MCP error responses', async () => {
      const mockError = {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: { details: 'Something went wrong' },
        },
        id: 1,
      }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockError,
      })

      await expect(client.callTool('test-tool', {})).rejects.toThrow('MCP error -32603: Internal error')
    })

    it('should handle HTTP errors', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      })

      await expect(client.callTool('test-tool', {})).rejects.toThrow('MCP request failed: Bad Request')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      await expect(client.callTool('test-tool', {})).rejects.toThrow('Network error')
    })

    it('should increment request ID for each call', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: {}, id: 1 }),
      })

      await client.callTool('tool1', {})
      await client.callTool('tool2', {})
      await client.callTool('tool3', {})

      const bodies = (global.fetch as any).mock.calls.map((call: any) => JSON.parse(call[1].body))

      expect(bodies[0].id).toBe(1)
      expect(bodies[1].id).toBe(2)
      expect(bodies[2].id).toBe(3)
    })

    it('should handle empty tool arguments', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: 'success', id: 1 }),
      })

      const result = await client.callTool('simple-tool')

      expect(result).toBe('success')

      const callArg = (global.fetch as any).mock.calls[0][1]
      const body = JSON.parse(callArg.body)

      expect(body.params.arguments).toBeUndefined()
    })

    it('should handle null results', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: null, id: 1 }),
      })

      const result = await client.callTool('test-tool', {})

      expect(result).toBeNull()
    })

    it('should preserve custom headers', async () => {
      const customClient = new MCPClient({
        endpoint: 'http://test.com/mcp',
        headers: {
          'X-API-Key': 'secret-key',
          'X-Custom': 'value',
        },
      })
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: {}, id: 1 }),
      })

      await customClient.callTool('test', {})

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test.com/mcp',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': 'secret-key',
            'X-Custom': 'value',
            'Content-Type': 'application/json',
          }),
        }),
      )
    })

    it('should handle complex result structures', async () => {
      const complexResult = {
        items: [
          { id: '1', name: 'Item 1', metadata: { created: '2024-01-01' } },
          { id: '2', name: 'Item 2', metadata: { created: '2024-01-02' } },
        ],
        total: 2,
        pagination: {
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: complexResult,
          id: 1,
        }),
      })

      const result = await client.callTool('list-items', { limit: 10 })

      expect(result).toEqual(complexResult)
      expect(result.items).toHaveLength(2)
      expect(result.pagination.hasMore).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined endpoint gracefully', () => {
      expect(() => new MCPClient({ endpoint: undefined as any })).toThrow()
    })

    it('should handle empty endpoint', () => {
      expect(() => new MCPClient({ endpoint: '' })).toThrow()
    })

    it('should allow endpoint without headers', () => {
      const simpleClient = new MCPClient({ endpoint: 'http://test.com' })
      expect(simpleClient).toBeDefined()
    })

    it('should handle very large request IDs', async () => {
      // Simulate many requests
      const clientWithLargeId = new MCPClient({ endpoint: 'http://test.com' })
      ;(clientWithLargeId as any).requestId = Number.MAX_SAFE_INTEGER - 1
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: {}, id: Number.MAX_SAFE_INTEGER - 1 }),
      })

      await clientWithLargeId.callTool('test', {})

      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
      expect(body.id).toBe(Number.MAX_SAFE_INTEGER - 1)
    })
  })
})
