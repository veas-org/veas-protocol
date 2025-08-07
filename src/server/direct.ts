import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { AuthProvider } from '../auth/types.js';
import pc from 'picocolors';
import { logger } from '../utils/logger.js';
// import type { MCPResult } from '../types/mcp.js';

export interface DirectMCPServerOptions {
  port?: number;
  authProvider?: AuthProvider;
}

export class DirectMCPServer {
  private server: Server;
  private authProvider?: AuthProvider;
  private tools: Map<string, Tool>;
  private apiUrl: string;

  constructor(options: DirectMCPServerOptions = {}) {
    this.server = new Server(
      {
        name: 'veas-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.authProvider = options.authProvider;
    this.tools = new Map();
    this.apiUrl = process.env.VEAS_API_URL || 'https://veas.app';
  }

  async initialize() {
    // Check for PAT first, then fall back to auth provider
    const pat = process.env.VEAS_PAT;
    if (!pat && this.authProvider) {
      const session = await this.authProvider.getSession();
      if (!session || !session.token) {
        throw new Error('Not authenticated. Please set VEAS_PAT environment variable or provide auth.');
      }
    }

    logger.debug('Loading MCP tools via direct connection...');
    await this.loadTools();
    logger.debug('Setting up handlers...');
    this.setupHandlers();
    logger.debug('Direct MCP server initialized');
  }

  private async loadTools() {
    const session = this.authProvider ? await this.authProvider.getSession() : null;
    const token = process.env.VEAS_PAT || (session as any)?.patToken || session?.token;
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const tokenType = process.env.VEAS_PAT ? 'PAT (env)' : ((session as any)?.patToken ? 'PAT' : 'device');
    logger.info(`Using ${tokenType} token for MCP tools`);
    logger.debug(`Token preview: ${token.substring(0, 20)}...`);
    
    try {
      logger.debug('Fetching MCP tools from server...');
      const response = await fetch(`${this.apiUrl}/api/mcp-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-MCP-Token': token,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: '1'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`MCP error: ${result.error.message}`);
      }
      
      if (!result.result?.tools) {
        throw new Error('No tools in response');
      }

      const mcpTools = result.result.tools;
      logger.debug(`Received ${mcpTools.length} tools via direct MCP connection`);
      
      for (const tool of mcpTools) {
        this.tools.set(tool.name, tool);
      }

      logger.info(pc.green(`Loaded ${this.tools.size} MCP tools via direct connection`));
    } catch (error) {
      logger.error(`Failed to load MCP tools: ${(error as Error).message}`);
      logger.error(`API URL: ${this.apiUrl}/api/mcp-simple`);
      throw new Error(`Failed to connect to MCP server: ${(error as Error).message}`);
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Array.from(this.tools.values()),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      try {
        const result = await this.executeTool(name, args);
        
        // Format the response
        let responseText: string;
        if (typeof result === 'string') {
          responseText = result;
        } else if (result && typeof result === 'object') {
          responseText = JSON.stringify(result, null, 2);
        } else {
          responseText = String(result);
        }

        return {
          content: [{ type: 'text', text: responseText }],
        };
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        throw error;
      }
    });
  }

  private async executeTool(name: string, args: any): Promise<any> {
    const session = this.authProvider ? await this.authProvider.getSession() : null;
    const token = process.env.VEAS_PAT || (session as any)?.patToken || session?.token;
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const tokenType = process.env.VEAS_PAT ? 'PAT (env)' : ((session as any)?.patToken ? 'PAT' : 'device');
    logger.debug(`Executing tool ${name} with ${tokenType} token`);

    const requestBody = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: name,
        arguments: args,
      },
      id: Date.now().toString(),
    };

    logger.debug(`Request to ${this.apiUrl}/api/mcp-simple`);
    logger.debug(`Request body: ${JSON.stringify(requestBody, null, 2)}`);

    try {
      const response = await fetch(`${this.apiUrl}/api/mcp-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-MCP-Token': token,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      const responseText = await response.text();
      logger.debug(`Response status: ${response.status}`);
      
      if (!response.ok) {
        logger.error(`Response error: ${responseText}`);
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        logger.error(`Failed to parse response: ${responseText}`);
        throw new Error('Invalid JSON response from server');
      }

      if (responseData.error) {
        throw new Error(`MCP error: ${responseData.error.message || JSON.stringify(responseData.error)}`);
      }

      if (!responseData.result) {
        throw new Error('No result in MCP response');
      }

      // Extract the actual result from the MCP response structure
      const result = responseData.result;
      
      // If result has content array with data, extract it
      if (result.content && Array.isArray(result.content) && result.content[0]?.data) {
        return result.content[0].data;
      }
      
      // If result has content array with text, parse it
      if (result.content && Array.isArray(result.content) && result.content[0]?.text) {
        try {
          return JSON.parse(result.content[0].text);
        } catch {
          return result.content[0].text;
        }
      }
      
      // Otherwise return the result as-is
      return result;
    } catch (error) {
      logger.error(`Tool execution failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // The server will now handle JSON-RPC messages via stdio
    logger.debug('Direct MCP server started on stdio transport');
  }

  async stop() {
    // Server cleanup if needed
    logger.debug('Direct MCP server stopped');
  }
}