import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPServer } from './server/index.js';
import type { AuthProvider } from './auth/types.js';
import { getBestAuthToken } from './auth/wrapper.js';

// Mock dependencies  
vi.mock('./cache/cache-manager.js');
vi.mock('./tools/standalone.js', () => ({
  standaloneTools: [],
  executeStandaloneTool: vi.fn()
}));

// Mock auth wrapper
vi.mock('./auth/wrapper.js');
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

describe('MCPServer', () => {
  let server: MCPServer;
  let mockAuthProvider: AuthProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup auth provider mock
    mockAuthProvider = {
      isAuthenticated: vi.fn().mockResolvedValue(true),
      getToken: vi.fn().mockResolvedValue('test-token'),
      getSession: vi.fn().mockResolvedValue({ patToken: 'test-pat' })
    };

    // Mock getBestAuthToken
    vi.mocked(getBestAuthToken).mockResolvedValue({
      token: 'test-pat-token',
      type: 'pat'
    });

    // Mock environment variables
    process.env.VEAS_PAT = 'test-pat-token';
    
    // Mock fetch for tools loading
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        result: { tools: mockTools }
      })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.VEAS_PAT;
  });

  describe('constructor', () => {
    it('should create server with default options', () => {
      server = new MCPServer();
      expect(server).toBeDefined();
    });

    it('should create server with custom options', () => {
      const options = {
        port: 4000,
        cacheOptions: { enabled: true, ttl: 600 },
        authProvider: mockAuthProvider
      };

      server = new MCPServer(options);
      expect(server).toBeDefined();
    });
  });

  describe('initialize', () => {
    beforeEach(() => {
      server = new MCPServer({ authProvider: mockAuthProvider });
    });

    it('should initialize successfully with PAT', async () => {
      await server.initialize();
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/mcp-simple'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
          })
        })
      );
    });

    it('should throw error when not authenticated and no PAT', async () => {
      delete process.env.VEAS_PAT;
      mockAuthProvider.isAuthenticated = vi.fn().mockResolvedValue(false);
      
      const serverWithoutAuth = new MCPServer({ authProvider: mockAuthProvider });
      
      await expect(serverWithoutAuth.initialize()).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should handle fetch error gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(server.initialize()).rejects.toThrow('Failed to connect to MCP server');
    });
  });

  describe('start', () => {
    beforeEach(async () => {
      server = new MCPServer({ authProvider: mockAuthProvider });
      await server.initialize();
    });

    it('should start server successfully', async () => {
      // Mock stdout.isTTY to avoid console output in tests
      const originalTTY = process.stdout.isTTY;
      process.stdout.isTTY = false;
      
      await server.start();
      
      process.stdout.isTTY = originalTTY;
    });
  });

  describe('standalone mode', () => {
    beforeEach(() => {
      process.env.VEAS_OFFLINE_MODE = 'true';
    });

    afterEach(() => {
      delete process.env.VEAS_OFFLINE_MODE;
    });

    it('should use standalone tools in offline mode', async () => {
      server = new MCPServer({ authProvider: mockAuthProvider });
      await server.initialize();
      
      // Should not call fetch in offline mode
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});