import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPServer } from './server';
import { AuthManager } from '../auth/auth-manager';
import { CacheManager } from '../cache/cache-manager';
import { mockTools, mockFetchResponse } from '../test/mocks';
import * as toolsRegistry from './tools-registry';

// Mock dependencies
vi.mock('../auth/auth-manager');
vi.mock('../cache/cache-manager');
vi.mock('./tools-registry');
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
  })),
}));
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  const mockServer = {
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
    close: vi.fn(),
  };
  return {
    Server: vi.fn(() => mockServer),
  };
});
vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: 'CallToolRequestSchema',
  ListToolsRequestSchema: 'ListToolsRequestSchema',
}));

describe('MCPServer', () => {
  let server: MCPServer;
  let mockAuthManager: any;
  let mockCacheManager: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup auth manager mock
    mockAuthManager = {
      isAuthenticated: vi.fn().mockResolvedValue(true),
      getToken: vi.fn().mockResolvedValue('test-token'),
      refreshToken: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(AuthManager).getInstance.mockReturnValue(mockAuthManager);

    // Setup cache manager mock
    mockCacheManager = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      getStats: vi.fn().mockReturnValue({ hits: 0, misses: 0, keys: 0 }),
    };
    vi.mocked(CacheManager).mockImplementation(() => mockCacheManager);

    // Setup tools registry mock
    vi.mocked(toolsRegistry.getMCPTools).mockResolvedValue(mockTools);

    // Setup global fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create server with default options', () => {
      server = new MCPServer();
      expect(server).toBeDefined();
      expect(CacheManager).toHaveBeenCalledWith(undefined);
    });

    it('should create server with custom options', () => {
      const options = {
        port: 4000,
        cacheOptions: { enabled: true, ttl: 600 },
      };

      server = new MCPServer(options);
      expect(CacheManager).toHaveBeenCalledWith(options.cacheOptions);
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      server = new MCPServer();
    });

    it('should initialize successfully when authenticated', async () => {
      await server.initialize();

      expect(mockAuthManager.isAuthenticated).toHaveBeenCalled();
      expect(toolsRegistry.getMCPTools).toHaveBeenCalledWith('test-token');
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Loaded 2 MCP tools'));
    });

    it('should throw error when not authenticated', async () => {
      mockAuthManager.isAuthenticated.mockResolvedValueOnce(false);

      await expect(server.initialize()).rejects.toThrow(
        'Not authenticated. Please run "veas login" first.'
      );
    });

    it('should throw error when no token available', async () => {
      mockAuthManager.getToken.mockResolvedValueOnce(null);

      await expect(server.initialize()).rejects.toThrow(
        'No authentication token available'
      );
    });
  });

  describe('request handlers', () => {
    let serverInstance: any;
    let handlers: Map<any, any>;

    beforeEach(async () => {
      server = new MCPServer();
      serverInstance = (server as any).server;
      handlers = new Map();

      // Capture registered handlers
      serverInstance.setRequestHandler.mockImplementation((schema: any, handler: any) => {
        // Store the handler with a string key for easier retrieval
        const schemaName = schema === 'ListToolsRequestSchema' ? 'ListToolsRequestSchema' : 'CallToolRequestSchema';
        handlers.set(schemaName, handler);
      });

      await server.initialize();
    });

    describe('ListToolsRequest', () => {
      it('should return all loaded tools', async () => {
        const handler = handlers.get('ListToolsRequestSchema');
        const result = await handler({});

        expect(result).toEqual({
          tools: mockTools,
        });
      });
    });

    describe('CallToolRequest', () => {
      const request = {
        params: {
          name: 'project_list',
          arguments: { limit: 10 },
        },
      };

      it('should return cached result when available', async () => {
        const cachedData = { projects: ['cached-project'] };
        mockCacheManager.get.mockResolvedValueOnce(cachedData);

        const handler = handlers.get('CallToolRequestSchema');
        const result = await handler(request);

        expect(mockCacheManager.get).toHaveBeenCalledWith('project_list', { limit: 10 });
        expect(result).toEqual({
          content: [{ type: 'text', text: JSON.stringify(cachedData, null, 2) }],
        });
        expect(global.fetch).not.toHaveBeenCalled();
      });

      it('should execute tool and cache result on cache miss', async () => {
        const responseData = { projects: ['project1', 'project2'] };
        vi.mocked(global.fetch).mockResolvedValueOnce(
          mockFetchResponse({ result: responseData })
        );

        const handler = handlers.get('CallToolRequestSchema');
        const result = await handler(request);

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/mcp-manual',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token',
            },
            body: expect.stringContaining('project_list'),
          })
        );

        expect(mockCacheManager.set).toHaveBeenCalledWith(
          'project_list',
          { limit: 10 },
          responseData
        );

        expect(result).toEqual({
          content: [{ type: 'text', text: JSON.stringify(responseData, null, 2) }],
        });
      });

      it('should throw error for unknown tool', async () => {
        const handler = handlers.get('CallToolRequestSchema');
        const badRequest = {
          params: { name: 'unknown_tool', arguments: {} },
        };

        await expect(handler(badRequest)).rejects.toThrow('Tool not found: unknown_tool');
      });

      it('should refresh token on authentication error', async () => {
        // First call fails with auth error
        vi.mocked(global.fetch).mockResolvedValueOnce(
          mockFetchResponse({ error: { message: 'authentication failed' } }, false, 401)
        );

        // Second call after refresh succeeds
        const responseData = { success: true };
        vi.mocked(global.fetch).mockResolvedValueOnce(
          mockFetchResponse({ result: responseData })
        );

        const handler = handlers.get('CallToolRequestSchema');
        const result = await handler(request);

        expect(mockAuthManager.refreshToken).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result.content[0].text).toContain('success');
      });

      it('should handle API errors', async () => {
        vi.mocked(global.fetch).mockResolvedValueOnce({
          ok: false,
          text: vi.fn().mockResolvedValue('API Error'),
        } as any);

        const handler = handlers.get('CallToolRequestSchema');

        await expect(handler(request)).rejects.toThrow('Tool execution failed: API Error');
      });
    });
  });

  describe('start', () => {
    it('should start server and setup stats logging', async () => {
      server = new MCPServer();
      await server.initialize();

      vi.useFakeTimers();

      await server.start();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('MCP server started'));

      // Fast-forward time to trigger stats logging
      vi.advanceTimersByTime(60000);

      expect(mockCacheManager.getStats).toHaveBeenCalled();
      // Cache stats are logged at debug level, which might not show in default log level
      // Just verify that getStats was called
      
      vi.useRealTimers();
    });
  });

  describe('stop', () => {
    it('should close server connection', async () => {
      server = new MCPServer();
      const serverInstance = (server as any).server;
      
      await server.stop();

      expect(serverInstance.close).toHaveBeenCalled();
    });
  });

  describe('executeTool', () => {
    beforeEach(() => {
      server = new MCPServer();
    });

    it('should use environment variable for API URL', async () => {
      process.env.VEAS_API_URL = 'https://api.veas.com';
      
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchResponse({ result: { success: true } })
      );

      const result = await (server as any).executeTool('test_tool', { arg: 'value' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.veas.com/api/mcp-manual',
        expect.any(Object)
      );

      expect(result).toEqual({ success: true });
    });

    it('should handle JSON-RPC error response', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockFetchResponse({ error: { message: 'Invalid parameters' } })
      );

      await expect(
        (server as any).executeTool('test_tool', {})
      ).rejects.toThrow('Invalid parameters');
    });
  });
});