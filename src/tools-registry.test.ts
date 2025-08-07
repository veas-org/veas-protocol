import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getMCPTools } from './tools-registry';
import { mockTools, mockFetchResponse } from '../test/mocks';

describe('getMCPTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env.VEAS_API_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch tools successfully', async () => {
    const token = 'test-token';
    vi.mocked(global.fetch).mockResolvedValueOnce(
      mockFetchResponse({ result: { tools: mockTools } })
    );

    const result = await getMCPTools(token);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/mcp-manual',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          params: {},
          id: 'list-tools',
        }),
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
      'https://api.veas.com/api/mcp-manual',
      expect.any(Object)
    );
  });

  it('should throw error on non-ok response', async () => {
    const token = 'test-token';
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
    } as Response);

    await expect(getMCPTools(token)).rejects.toThrow(
      'Failed to fetch tools: Unauthorized'
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
});