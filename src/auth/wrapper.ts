/**
 * Authentication wrapper for MCP requests
 * Handles both CLI tokens and PATs
 */

import { logger } from '../utils/logger.js';
import type { AuthProvider, AuthToken } from './types.js';

/**
 * Get the best available authentication token
 * Prioritizes PAT from environment, then falls back to CLI token
 */
export async function getBestAuthToken(authProvider?: AuthProvider): Promise<AuthToken> {
  // Check for PAT in environment
  const envPat = process.env.VEAS_PAT || process.env.PAT;
  if (envPat) {
    logger.debug('Using PAT from environment');
    return {
      token: envPat,
      type: 'pat'
    };
  }

  // Check for MCP_TOKEN in environment (from Claude Desktop)
  const mcpToken = process.env.MCP_TOKEN;
  if (mcpToken) {
    logger.debug('Using MCP_TOKEN from environment');
    return {
      token: mcpToken,
      type: mcpToken.includes('_') ? 'pat' : 'unknown'
    };
  }

  // Check for stored PAT token from auth provider
  if (authProvider) {
    const session = await authProvider.getSession();
    const storedPAT = (session as any)?.patToken || session?.token;
    
    if (storedPAT) {
      logger.debug('Using PAT token from device authentication');
      return {
        token: storedPAT,
        type: 'pat'
      };
    }
  }
  
  // If no token is found, we'll throw an error
  // The authManager should be provided by the consuming application

  throw new Error('No authentication token available. Please run "veas login" or set VEAS_PAT environment variable.');
}

/**
 * Prepare headers for MCP requests based on token type
 */
export function prepareMCPHeaders(authToken: AuthToken): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };

  // Always include both header formats for compatibility
  headers['X-MCP-Token'] = authToken.token;
  headers['Authorization'] = `Bearer ${authToken.token}`;

  // Add token type hint for debugging
  headers['X-Token-Type'] = authToken.type;

  return headers;
}