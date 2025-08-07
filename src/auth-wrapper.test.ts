import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBestAuthToken, prepareMCPHeaders, type AuthToken } from './auth-wrapper.js';

// Mock the AuthManager
vi.mock('../auth/auth-manager.js', () => ({
  AuthManager: {
    getInstance: vi.fn(() => ({
      getToken: vi.fn()
    }))
  }
}));

// Import AuthManager after mocking
import { AuthManager } from '../auth/auth-manager.js';

describe('auth-wrapper', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.VEAS_PAT;
    delete process.env.PAT;
    delete process.env.MCP_TOKEN;
    vi.clearAllMocks();
  });

  describe('getBestAuthToken', () => {
    it('should prioritize VEAS_PAT from environment', async () => {
      process.env.VEAS_PAT = 'mya_test_pat_token';
      
      const result = await getBestAuthToken();
      
      expect(result).toEqual({
        token: 'mya_test_pat_token',
        type: 'pat'
      });
    });

    it('should use PAT from environment as second priority', async () => {
      process.env.PAT = 'mya_another_pat';
      
      const result = await getBestAuthToken();
      
      expect(result).toEqual({
        token: 'mya_another_pat',
        type: 'pat'
      });
    });

    it('should use MCP_TOKEN from environment as third priority', async () => {
      process.env.MCP_TOKEN = 'mya_mcp_token';
      
      const result = await getBestAuthToken();
      
      expect(result).toEqual({
        token: 'mya_mcp_token',
        type: 'pat'
      });
    });

    it('should detect non-PAT tokens correctly', async () => {
      process.env.MCP_TOKEN = 'some_other_token';
      
      const result = await getBestAuthToken();
      
      expect(result).toEqual({
        token: 'some_other_token',
        type: 'unknown'
      });
    });

    it('should fall back to CLI token', async () => {
      const mockAuthManager = AuthManager.getInstance();
      (mockAuthManager.getToken as any).mockResolvedValue('cli_jwt_token');
      
      const result = await getBestAuthToken();
      
      expect(result).toEqual({
        token: 'cli_jwt_token',
        type: 'cli'
      });
    });

    it('should throw error if no token available', async () => {
      const mockAuthManager = AuthManager.getInstance();
      (mockAuthManager.getToken as any).mockResolvedValue(null);
      
      await expect(getBestAuthToken()).rejects.toThrow(
        'No authentication token available. Please run "veas login" or set VEAS_PAT environment variable.'
      );
    });
  });

  describe('prepareMCPHeaders', () => {
    it('should prepare headers for PAT token', () => {
      const authToken: AuthToken = {
        token: 'mya_test_token',
        type: 'pat'
      };
      
      const headers = prepareMCPHeaders(authToken);
      
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-MCP-Token': 'mya_test_token',
        'Authorization': 'Bearer mya_test_token',
        'X-Token-Type': 'pat'
      });
    });

    it('should prepare headers for CLI token', () => {
      const authToken: AuthToken = {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        type: 'cli'
      };
      
      const headers = prepareMCPHeaders(authToken);
      
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-MCP-Token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'X-Token-Type': 'cli'
      });
    });

    it('should prepare headers for unknown token type', () => {
      const authToken: AuthToken = {
        token: 'some_custom_token',
        type: 'unknown'
      };
      
      const headers = prepareMCPHeaders(authToken);
      
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-MCP-Token': 'some_custom_token',
        'Authorization': 'Bearer some_custom_token',
        'X-Token-Type': 'unknown'
      });
    });
  });
});