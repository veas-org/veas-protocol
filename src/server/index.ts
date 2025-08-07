import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CacheManager } from '../cache/cache-manager.js';
import { standaloneTools, executeStandaloneTool } from '../tools/standalone.js';
import { getBestAuthToken } from '../auth/wrapper.js';
import type { AuthProvider } from '../auth/types.js';
import pc from 'picocolors';
import { logger } from '../utils/logger.js';

export interface MCPServerOptions {
  port?: number;
  cacheOptions?: {
    enabled?: boolean;
    ttl?: number;
  };
  authProvider?: AuthProvider;
}

export class MCPServer {
  private server: Server;
  private cache: CacheManager;
  private authProvider?: AuthProvider;
  private tools: Map<string, Tool>;
  private isStandalone: boolean = false;

  constructor(options: MCPServerOptions = {}) {
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

    this.cache = new CacheManager(options.cacheOptions);
    this.authProvider = options.authProvider;
    this.tools = new Map();
  }

  async initialize() {
    // Check for PAT first, then fall back to auth provider
    const pat = process.env.VEAS_PAT;
    if (!pat && this.authProvider) {
      const isAuthenticated = await this.authProvider.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Not authenticated. Please set VEAS_PAT environment variable or provide auth.');
      }
    }

    logger.debug('Loading MCP tools...');
    await this.loadTools();
    logger.debug('Setting up handlers...');
    this.setupHandlers();
    logger.debug('MCP server initialized');
  }

  private async loadTools() {
    const authToken = await getBestAuthToken();
    const { token, type } = authToken;

    logger.info(`Using ${type} token for MCP tools`);
    logger.debug(`Token preview: ${token.substring(0, 20)}...`);
    logger.debug('Fetching MCP tools from server...');
    // Try to fetch from server, fall back to standalone if all fails
    let mcpTools: Tool[] = [];
    let useStandalone = false;
    
    // Check if we're forced to use offline mode
    const forceOffline = process.env.VEAS_OFFLINE_MODE === 'true';
    
    if (forceOffline) {
      logger.info(pc.yellow('Running in offline mode (VEAS_OFFLINE_MODE=true)'));
      mcpTools = standaloneTools;
      useStandalone = true;
    } else {
      try {
        // Try the simple MCP endpoint first
        const apiUrl = process.env.VEAS_API_URL || 'https://veas.app';
        const response = await fetch(`${apiUrl}/api/mcp-simple`, {
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
        
        if (response.ok) {
          const result = await response.json();
          if (result.result?.tools) {
            mcpTools = result.result.tools;
            logger.debug(`Received ${mcpTools.length} tools via simple MCP endpoint`);
            useStandalone = false;
          } else {
            throw new Error('No tools in response');
          }
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      logger.error(`MCP simple endpoint failed: ${(error as Error).message}`);
      logger.error(`API URL: ${process.env.VEAS_API_URL || 'https://veas.app'}/api/mcp-simple`);
      logger.error(`To use offline mode, set VEAS_OFFLINE_MODE=true`);
      throw new Error(`Failed to connect to MCP server: ${(error as Error).message}`);
    }
    }
    
    // Store whether we're in standalone mode
    this.isStandalone = useStandalone;
    
    for (const tool of mcpTools) {
      this.tools.set(tool.name, tool);
    }

    logger.info(pc.green(`Loaded ${this.tools.size} MCP tools${useStandalone ? ' (standalone mode)' : ''}`));
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

      const cached = await this.cache.get(name, args);
      if (cached) {
        return {
          content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }],
        };
      }

      try {
        const token = process.env.VEAS_PAT || await this.authManager.getToken();
        if (!token && !process.env.VEAS_PAT) {
          await this.authManager.refreshToken();
        }

        const result = await this.executeTool(name, args);
        
        await this.cache.set(name, args, result);

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        
        if ((error as any).message?.includes('authentication') && !process.env.VEAS_PAT) {
          await this.authManager.refreshToken();
          const result = await this.executeTool(name, args);
          await this.cache.set(name, args, result);
          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }

        throw error;
      }
    });
  }

  private async executeTool(name: string, args: any): Promise<any> {
    const authToken = await getBestAuthToken();
    const { token, type } = authToken;
    
    logger.debug(`Executing tool ${name} with ${type} token: ${token.substring(0, 20)}...`);

    // Check if we're in standalone mode
    if (this.isStandalone) {
      logger.debug('Executing tool in standalone mode (offline)...');
      logger.warn('⚠️  Using mock data - results are not from real server');
      try {
        const result = await executeStandaloneTool(name, args);
        logger.debug(`Tool executed successfully in standalone mode`);
        return result;
      } catch (error) {
        logger.error(`Standalone execution failed: ${(error as Error).message}`);
        throw error;
      }
    }
    
    // Use the simple MCP endpoint for direct execution
    try {
      logger.debug('Executing tool via mcp-simple endpoint...');
      
      const apiUrl = process.env.VEAS_API_URL || 'https://veas.app';
      
      const response = await fetch(`${apiUrl}/api/mcp-simple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-MCP-Token': token,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            name,
            arguments: args,
          },
          id: Date.now().toString(),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Tool execution failed: ${error}`);
      }

      const result = await response.json();
      
      if (result?.error) {
        logger.debug(`Tool error: ${JSON.stringify(result.error)}`);
        throw new Error(result.error.message);
      }

      logger.debug(`Tool executed successfully via mcp-simple`);
      return result?.result;
    } catch (error: any) {
      logger.error(`MCP simple execution failed: ${error.message}`);
      throw error;
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Only log in non-MCP mode
    if (process.stdout.isTTY) {
      logger.info(pc.green('MCP server started'));
      logger.debug('Cache stats will be logged periodically');
      
      setInterval(() => {
        const stats = this.cache.getStats();
        logger.debug(`[Cache Stats] Hits: ${stats.hits}, Misses: ${stats.misses}, Keys: ${stats.keys}`);
      }, 60000);
    }
  }

  async stop() {
    await this.server.close();
  }
}