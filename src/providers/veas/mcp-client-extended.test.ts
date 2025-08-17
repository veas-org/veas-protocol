import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthContext } from '../../protocols/common'
import { MCPClient } from './mcp-client'

// Mock fetch globally
global.fetch = vi.fn()
;(globalThis as any).fetch = global.fetch

describe('MCPClient Extended Tests', () => {
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

  describe('callTool edge cases', () => {
    it('should handle text content type with JSON', async () => {
      const mockData = { test: 'data' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(mockData),
              },
            ],
          },
          id: 1,
        }),
      })

      const result = await client.callTool('test-tool', {})
      expect(result).toEqual(mockData)
    })

    it('should handle text content type with plain text', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: 'plain text response',
              },
            ],
          },
          id: 1,
        }),
      })

      const result = await client.callTool('test-tool', {})
      expect(result).toBe('plain text response')
    })

    it('should handle json content type', async () => {
      const mockData = { test: 'json-data' }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'json',
                data: mockData,
              },
            ],
          },
          id: 1,
        }),
      })

      const result = await client.callTool('test-tool', {})
      expect(result).toEqual(mockData)
    })

    it('should handle authContext with headers', async () => {
      const authContext: AuthContext = {
        userId: 'user-123',
        scopes: ['read', 'write'],
        email: 'test@example.com',
      }
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: {}, id: 1 }),
      })

      await client.callTool('test-tool', { param: 'value' }, authContext)

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

    it('should handle empty args object', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: {}, id: 1 }),
      })

      await client.callTool('test-tool', {})

      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
      expect(body.params).toEqual({ name: 'test-tool' })
    })

    it('should handle args with values', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: {}, id: 1 }),
      })

      await client.callTool('test-tool', { key: 'value' })

      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
      expect(body.params).toEqual({
        name: 'test-tool',
        arguments: { key: 'value' },
      })
    })

    it('should handle undefined args', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: {}, id: 1 }),
      })

      await client.callTool('test-tool', undefined)

      const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
      expect(body.params).toEqual({ name: 'test-tool' })
    })

    it('should throw error when response is not ok', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      })

      await expect(client.callTool('test-tool', {})).rejects.toThrow('MCP request failed: Internal Server Error')
    })

    it('should throw error when response contains error', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          error: {
            code: -32601,
            message: 'Method not found',
          },
          id: 1,
        }),
      })

      await expect(client.callTool('test-tool', {})).rejects.toThrow('MCP error -32601: Method not found')
    })
  })

  describe('listTools', () => {
    it('should list available tools', async () => {
      const mockTools = [
        { name: 'tool1', description: 'Tool 1' },
        { name: 'tool2', description: 'Tool 2' },
      ]
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: { tools: mockTools },
          id: 1,
        }),
      })

      const result = await client.listTools()

      expect(result).toEqual(mockTools)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/mcp',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"method":"tools/list"'),
        }),
      )
    })

    it('should return empty array when no tools available', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          result: {},
          id: 1,
        }),
      })

      const result = await client.listTools()
      expect(result).toEqual([])
    })

    it('should handle listTools error response', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      })

      await expect(client.listTools()).rejects.toThrow('MCP request failed: Bad Request')
    })

    it('should handle listTools error in response', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request',
          },
          id: 1,
        }),
      })

      await expect(client.listTools()).rejects.toThrow('MCP error -32600: Invalid Request')
    })
  })

  describe('constructor validation', () => {
    it('should throw error when config is null', () => {
      expect(() => new MCPClient(null as any)).toThrow('Endpoint is required')
    })

    it('should throw error when config is undefined', () => {
      expect(() => new MCPClient(undefined as any)).toThrow('Endpoint is required')
    })

    it('should throw error when endpoint is empty string', () => {
      expect(() => new MCPClient({ endpoint: '' })).toThrow('Endpoint is required')
    })

    it('should not throw when endpoint is provided without headers', () => {
      const client = new MCPClient({ endpoint: 'http://test.com' })
      expect(client).toBeDefined()
    })
  })

  describe('request ID management', () => {
    it('should increment request ID for each call', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', result: {}, id: 1 }),
      })

      await client.callTool('test1', {})
      await client.callTool('test2', {})
      await client.listTools()

      const calls = (global.fetch as any).mock.calls
      const body1 = JSON.parse(calls[0][1].body)
      const body2 = JSON.parse(calls[1][1].body)
      const body3 = JSON.parse(calls[2][1].body)

      expect(body1.id).toBe(1)
      expect(body2.id).toBe(2)
      expect(body3.id).toBe(3)
    })
  })
})
