import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getMCPTools } from './tools/registry.js';
import type { AuthToken } from './auth/types.js';

// Mock tools
const mockTools = [
  {
    name: 'test-tool-1',
    description: 'Test tool 1',
    inputSchema: { type: 'object' },
  },
  {
    name: 'test-tool-2',
    description: 'Test tool 2',
    inputSchema: { type: 'object' },
  },
];

// Mock fetch response helper
const mockFetchResponse = (data: any, ok = true) => ({
  ok,
  status: ok ? 200 : 400,
  statusText: ok ? 'OK' : 'Error',
  headers: new Map(),  // Add headers as a Map
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
} as unknown as Response);

describe('getMCPTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env.VEAS_API_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.VEAS_API_URL;
  });

  it('should fetch tools successfully with string token', async () => {
    const token = 'mya_test_token';
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockFetchResponse({ result: { tools: mockTools } })
    );

    const result = await getMCPTools(token);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/mcp/mcp',
      {
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-MCP-Token': token,
        }),
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: 'list-tools',
        }),
        signal: expect.any(AbortSignal)
      }
    );

    expect(result).toEqual(mockTools);
  });

  it('should fetch tools successfully with AuthToken', async () => {
    const authToken: AuthToken = {
      token: 'test-bearer-token',
      type: 'bearer'
    };
    
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockFetchResponse({ result: { tools: mockTools } })
    );

    const result = await getMCPTools(authToken);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/mcp/mcp',
      {
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${authToken.token}`,
          'X-MCP-Token': authToken.token,
          'X-Token-Type': 'bearer'
        }),
        body: expect.any(String),
        signal: expect.any(AbortSignal)
      }
    );

    expect(result).toEqual(mockTools);
  });

  it('should use custom API URL from environment', async () => {
    process.env.VEAS_API_URL = 'https://api.veas.com';
    const token = 'test-token';
    
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockFetchResponse({ result: { tools: mockTools } })
    );

    await getMCPTools(token);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.veas.com/api/mcp/mcp',
      expect.any(Object)
    );
  });

  it('should throw error on non-ok response', async () => {
    const token = 'test-token';
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Map(),
      text: vi.fn().mockResolvedValue('Unauthorized'),
    } as unknown as Response);

    await expect(getMCPTools(token)).rejects.toThrow(
      'Failed to fetch tools: 401 Unauthorized'
    );
  });

  it('should throw error when API returns error', async () => {
    const token = 'test-token';
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockFetchResponse({ error: { message: 'Invalid token' } })
    );

    await expect(getMCPTools(token)).rejects.toThrow(
      'Failed to list tools: Invalid token'
    );
  });

  it('should return empty array when no tools in response', async () => {
    const token = 'test-token';
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockFetchResponse({ result: {} })
    );

    const result = await getMCPTools(token);

    expect(result).toEqual([]);
  });

  it('should handle network errors', async () => {
    const token = 'test-token';
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    await expect(getMCPTools(token)).rejects.toThrow('Network error');
  });

  it('should use getBestAuthToken when no token provided', async () => {
    process.env.VEAS_PAT = 'mya_env_pat';
    
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockFetchResponse({ result: { tools: mockTools } })
    );

    const result = await getMCPTools();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-MCP-Token': 'mya_env_pat',
        })
      })
    );

    expect(result).toEqual(mockTools);
    
    delete process.env.VEAS_PAT;
  });
});