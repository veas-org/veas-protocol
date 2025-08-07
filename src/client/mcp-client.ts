import type { MCPResult } from '../types/index.js';
import type { AuthProvider } from '../auth/types.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

/**
 * Direct MCP client that calls the mcp-simple endpoint
 * This bypasses the MCP server's tool loading and standalone fallback
 */
export class LocalMCPClient {
  private authProvider?: AuthProvider;
  private apiUrl: string;

  constructor(apiUrl?: string, authProvider?: AuthProvider) {
    this.apiUrl = apiUrl || process.env.VEAS_API_URL || 'https://veas.app';
    this.authProvider = authProvider;
  }

  /**
   * Call an MCP tool directly via the mcp-simple endpoint
   * This ensures we always get real data from the server
   */
  async callTool(toolName: string, params: any): Promise<MCPResult> {
    let token: string | null = null;
    
    if (this.authProvider) {
      const session = await this.authProvider.getSession();
      token = (session as any)?.patToken || session?.token;
    }
    
    // Fallback to environment variable
    token = token || process.env.VEAS_PAT;
    
    if (!token) {
      throw new Error('Authentication token not found. Please provide auth or set VEAS_PAT.');
    }

    const url = `${this.apiUrl}/api/mcp-simple`;
    const requestBody = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params,
      },
      id: Date.now().toString(),
    };

    logger.debug(`Calling MCP tool: ${toolName}`);
    logger.debug(`API URL: ${url}`);
    logger.debug(`Using token: ${token ? 'Yes' : 'No'} (length: ${token?.length || 0})`);
    logger.debug(`Token type: PAT/Bearer`);

    try {
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-MCP-Token': token,
        },
        timeout: 30000, // 30 second timeout
      });

      const result = response.data;

      if (result.error) {
        logger.debug(`MCP error: ${JSON.stringify(result.error)}`);
        return {
          success: false,
          error: result.error.message || 'Unknown error',
        };
      }

      logger.debug(`MCP response result:`, JSON.stringify(result.result, null, 2));
      
      return {
        success: true,
        data: result.result,
      };
    } catch (error) {
      logger.error(`MCP call failed: ${error}`);
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out after 30 seconds',
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List available MCP tools
   */
  async listTools(): Promise<MCPResult> {
    let token: string | null = null;
    
    if (this.authProvider) {
      const session = await this.authProvider.getSession();
      token = (session as any)?.patToken || session?.token;
    }
    
    token = token || process.env.VEAS_PAT;
    
    if (!token) {
      throw new Error('Authentication token not found.');
    }

    const url = `${process.env.VEAS_API_URL || 'https://veas.app'}/api/mcp-simple`;
    const requestBody = {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: '1',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-MCP-Token': token,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const result = await response.json();
      
      if (result.error) {
        return {
          success: false,
          error: result.error.message || 'Unknown error',
        };
      }

      return {
        success: true,
        data: result.result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Export convenience function
export async function callMCPTool(toolName: string, params: any): Promise<MCPResult> {
  const client = MCPClient.getInstance();
  return client.callTool(toolName, params);
}