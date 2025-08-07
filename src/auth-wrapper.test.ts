import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBestAuthToken, prepareMCPHeaders } from './auth/wrapper.js';
import type { AuthToken, AuthProvider } from './auth/types.js';

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
      process.env.MCP_TOKEN = 'someothertoken';  // No underscore
      
      const result = await getBestAuthToken();
      
      expect(result).toEqual({
        token: 'someothertoken',
        type: 'unknown'  // MCP_TOKEN without underscore is unknown type
      });
    });

    it('should use PAT token from auth provider', async () => {
      const mockAuthProvider: AuthProvider = {
        isAuthenticated: vi.fn().mockResolvedValue(true),
        getToken: vi.fn().mockResolvedValue('provider_token'),
        getSession: vi.fn().mockResolvedValue({ patToken: 'mya_provider_pat' })
      };
      
      const result = await getBestAuthToken(mockAuthProvider);
      
      expect(result).toEqual({
        token: 'mya_provider_pat',
        type: 'pat'
      });
    });

    it('should throw error if no token available', async () => {
      const mockAuthProvider: AuthProvider = {
        isAuthenticated: vi.fn().mockResolvedValue(false),
        getToken: vi.fn().mockResolvedValue(null),
        getSession: vi.fn().mockResolvedValue({})
      };
      
      await expect(getBestAuthToken(mockAuthProvider)).rejects.toThrow(
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
        type: 'bearer'
      };
      
      const headers = prepareMCPHeaders(authToken);
      
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'X-MCP-Token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'X-Token-Type': 'bearer'
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