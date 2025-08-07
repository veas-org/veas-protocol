# MCP Integration Guide

Complete guide for integrating Veas Protocol with Model Context Protocol (MCP) servers and clients.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Creating MCP Servers](#creating-mcp-servers)
4. [Connecting MCP Clients](#connecting-mcp-clients)
5. [AI Assistant Configuration](#ai-assistant-configuration)
6. [Advanced Patterns](#advanced-patterns)
7. [Troubleshooting](#troubleshooting)

## Overview

The Model Context Protocol (MCP) enables AI assistants like Claude to interact with external tools and data sources. Veas Protocol provides a standardized way to expose any knowledge base or project management system as an MCP server.

```
┌─────────────────┐      MCP Protocol       ┌──────────────────┐
│  AI Assistant   │ ◄──────────────────────► │   MCP Server     │
│  (Claude, GPT)  │                          │  (Veas Adapter)  │
└─────────────────┘                          └────────┬─────────┘
                                                       │
                                              Veas Protocol
                                                       │
                                    ┌──────────────────┼──────────────────┐
                                    ▼                  ▼                  ▼
                              ┌──────────┐      ┌──────────┐      ┌──────────┐
                              │  Notion  │      │  GitHub  │      │   Jira   │
                              └──────────┘      └──────────┘      └──────────┘
```

## Quick Start

### Install Dependencies

```bash
npm install @veas/protocol @modelcontextprotocol/sdk
```

### Basic MCP Server

```typescript
import { MCPAdapter } from '@veas/protocol/adapters/mcp';
import { ProtocolProvider } from '@veas/protocol';

// 1. Create or import your protocol provider
const provider: ProtocolProvider = {
  name: 'my-knowledge-base',
  version: '1.0.0',
  knowledgeBase: myKnowledgeBaseImplementation,
  authenticate: async (creds) => { /* ... */ },
  isConnected: () => true,
  disconnect: async () => { /* ... */ }
};

// 2. Create MCP adapter
const adapter = new MCPAdapter(provider);

// 3. Start MCP server
await adapter.serve({
  transport: 'stdio'  // For Claude Desktop
});
```

## Creating MCP Servers

### Stdio Transport (Claude Desktop)

The stdio transport is used by Claude Desktop and other desktop AI assistants.

```typescript
// mcp-server.ts
import { MCPAdapter } from '@veas/protocol/adapters/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { NotionProvider } from './providers/notion';

async function main() {
  // Initialize your provider
  const provider = new NotionProvider({
    apiKey: process.env.NOTION_API_KEY!,
    databaseId: process.env.NOTION_DATABASE_ID!
  });
  
  // Authenticate
  await provider.authenticate({
    type: 'api-key',
    token: process.env.NOTION_API_KEY!
  });
  
  // Create MCP adapter with custom configuration
  const adapter = new MCPAdapter(provider, {
    name: 'notion-kb',
    description: 'Notion Knowledge Base via MCP',
    version: '1.0.0',
    
    // Optional: Custom tool naming
    toolPrefix: 'notion',
    
    // Optional: Tool filtering
    includeTools: ['list_articles', 'search_articles', 'create_article'],
    
    // Optional: Custom metadata
    metadata: {
      author: 'Your Name',
      homepage: 'https://example.com'
    }
  });
  
  // Start stdio server
  const transport = new StdioServerTransport();
  await adapter.connect(transport);
  
  console.error('MCP Server running on stdio');
}

main().catch(console.error);
```

### HTTP Transport (Web-based AI Assistants)

For web-based AI assistants or remote connections.

```typescript
import { WebSocketServerTransport } from '@modelcontextprotocol/sdk/server/websocket.js';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

async function startHTTPServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  
  const provider = new YourProvider();
  const adapter = new MCPAdapter(provider);
  
  // Handle WebSocket connections
  wss.on('connection', async (ws) => {
    const transport = new WebSocketServerTransport(ws);
    await adapter.connect(transport);
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      provider: provider.name,
      connected: provider.isConnected()
    });
  });
  
  server.listen(3000, () => {
    console.log('MCP Server running on http://localhost:3000');
  });
}
```

### SSE Transport (Server-Sent Events)

For one-way streaming from server to client.

```typescript
import express from 'express';
import { SSEServerTransport } from '@veas/protocol/adapters/mcp/sse-transport';

const app = express();

app.get('/mcp/sse', async (req, res) => {
  const provider = new YourProvider();
  const adapter = new MCPAdapter(provider);
  
  const transport = new SSEServerTransport(res);
  await adapter.connect(transport);
});

app.listen(3000);
```

## Connecting MCP Clients

### JavaScript/TypeScript Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function connectToMCPServer() {
  // Spawn the MCP server process
  const serverProcess = spawn('node', ['./mcp-server.js'], {
    stdio: ['pipe', 'pipe', 'stderr']
  });
  
  // Create client transport
  const transport = new StdioClientTransport({
    stdin: serverProcess.stdin,
    stdout: serverProcess.stdout
  });
  
  // Create MCP client
  const client = new Client({
    name: 'my-mcp-client',
    version: '1.0.0'
  });
  
  // Connect to server
  await client.connect(transport);
  
  // List available tools
  const tools = await client.listTools();
  console.log('Available tools:', tools);
  
  // Call a tool
  const result = await client.callTool('notion_list_articles', {
    limit: 10,
    filters: { status: 'published' }
  });
  
  console.log('Articles:', result);
  
  return client;
}
```

### Python Client

```python
import asyncio
import json
from mcp import Client, StdioClientTransport
import subprocess

async def connect_to_mcp_server():
    # Start the MCP server process
    process = subprocess.Popen(
        ['node', './mcp-server.js'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Create client
    transport = StdioClientTransport(process.stdin, process.stdout)
    client = Client("my-python-client", "1.0.0")
    
    # Connect
    await client.connect(transport)
    
    # List tools
    tools = await client.list_tools()
    print(f"Available tools: {tools}")
    
    # Call a tool
    result = await client.call_tool(
        "notion_list_articles",
        {"limit": 10, "filters": {"status": "published"}}
    )
    
    print(f"Articles: {result}")
    
    return client

# Run the client
asyncio.run(connect_to_mcp_server())
```

## AI Assistant Configuration

### Claude Desktop Configuration

Create or edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "notion-kb": {
      "command": "node",
      "args": ["/path/to/your/mcp-server.js"],
      "env": {
        "NOTION_API_KEY": "your-api-key",
        "NOTION_DATABASE_ID": "your-database-id"
      }
    },
    "github-projects": {
      "command": "node",
      "args": ["/path/to/github-mcp-server.js"],
      "env": {
        "GITHUB_TOKEN": "your-github-token",
        "GITHUB_OWNER": "your-org",
        "GITHUB_REPO": "your-repo"
      }
    },
    "multi-provider": {
      "command": "npx",
      "args": ["@veas/protocol-server", "--config", "/path/to/config.json"]
    }
  }
}
```

### VSCode Extension Configuration

For AI assistants in VSCode:

```json
{
  "ai-assistant.mcpServers": [
    {
      "name": "workspace-kb",
      "command": "${workspaceFolder}/.vscode/mcp-server.js",
      "args": [],
      "env": {
        "WORKSPACE_PATH": "${workspaceFolder}"
      }
    }
  ]
}
```

### Web-based AI Configuration

For web-based AI assistants, configure the WebSocket endpoint:

```javascript
// Client-side configuration
const aiAssistant = new AIAssistant({
  mcpEndpoints: [
    {
      name: 'knowledge-base',
      url: 'wss://your-server.com/mcp',
      auth: {
        type: 'bearer',
        token: 'your-auth-token'
      }
    }
  ]
});
```

## Advanced Patterns

### Multi-Provider MCP Server

Combine multiple providers into a single MCP server:

```typescript
import { MCPAdapter, AggregatedProvider } from '@veas/protocol';

// Create aggregated provider
const aggregated = new AggregatedProvider();

// Add multiple providers
await aggregated.addProvider(new NotionProvider(config));
await aggregated.addProvider(new GitHubProvider(config));
await aggregated.addProvider(new JiraProvider(config));

// Create MCP adapter for all providers
const adapter = new MCPAdapter(aggregated, {
  name: 'unified-workspace',
  description: 'Access all your tools in one place',
  
  // Custom tool organization
  toolGroups: {
    'Knowledge Base': ['list_articles', 'search_articles'],
    'Project Management': ['list_projects', 'create_issue'],
    'Analytics': ['get_metrics', 'generate_report']
  }
});

await adapter.serve({ transport: 'stdio' });
```

### Dynamic Tool Registration

Register tools dynamically based on user permissions:

```typescript
class DynamicMCPAdapter extends MCPAdapter {
  async getUserTools(userId: string) {
    const permissions = await this.getUserPermissions(userId);
    const tools = [];
    
    if (permissions.includes('read:articles')) {
      tools.push(this.createTool({
        name: 'list_articles',
        description: 'List knowledge base articles',
        handler: async (params) => {
          return this.provider.knowledgeBase.listArticles(params);
        }
      }));
    }
    
    if (permissions.includes('write:articles')) {
      tools.push(this.createTool({
        name: 'create_article',
        description: 'Create a new article',
        handler: async (params) => {
          return this.provider.knowledgeBase.createArticle(params);
        }
      }));
    }
    
    return tools;
  }
}
```

### Caching and Performance

Implement caching for better performance:

```typescript
import { CacheManager } from '@veas/protocol/cache';

class CachedMCPAdapter extends MCPAdapter {
  private cache = new CacheManager({ 
    ttl: 300,  // 5 minutes
    maxSize: 100  // Max 100 items
  });
  
  async handleToolCall(tool: string, params: any) {
    const cacheKey = `${tool}:${JSON.stringify(params)}`;
    
    // Check cache for read operations
    if (tool.startsWith('list_') || tool.startsWith('get_')) {
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached;
    }
    
    // Execute tool
    const result = await super.handleToolCall(tool, params);
    
    // Cache successful results
    if (result && !result.error) {
      await this.cache.set(cacheKey, result);
    }
    
    return result;
  }
}
```

### Streaming Responses

For large datasets or real-time updates:

```typescript
class StreamingMCPAdapter extends MCPAdapter {
  async *streamArticles(params: any) {
    let offset = 0;
    const limit = 100;
    
    while (true) {
      const batch = await this.provider.knowledgeBase.listArticles({
        ...params,
        limit,
        offset
      });
      
      if (batch.items.length === 0) break;
      
      for (const article of batch.items) {
        yield article;
      }
      
      offset += limit;
      
      if (batch.items.length < limit) break;
    }
  }
  
  // Register as streaming tool
  getTools() {
    return [
      {
        name: 'stream_articles',
        description: 'Stream all articles',
        streaming: true,
        handler: async function* (params) {
          yield* this.streamArticles(params);
        }
      }
    ];
  }
}
```

### Error Handling and Retry

Robust error handling with retries:

```typescript
class RobustMCPAdapter extends MCPAdapter {
  async handleToolCall(tool: string, params: any, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await super.handleToolCall(tool, params);
      } catch (error) {
        if (attempt === retries) {
          // Final attempt failed
          return {
            error: {
              code: error.code || 'UNKNOWN_ERROR',
              message: error.message,
              details: {
                tool,
                params,
                attempts: retries
              }
            }
          };
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
}
```

### Authentication and Security

Implement secure authentication:

```typescript
class SecureMCPAdapter extends MCPAdapter {
  private sessions = new Map<string, SessionData>();
  
  async authenticate(token: string): Promise<SessionData> {
    // Validate token
    const decoded = await this.verifyJWT(token);
    
    // Create session
    const session = {
      userId: decoded.userId,
      permissions: decoded.permissions,
      expiresAt: new Date(Date.now() + 3600000)  // 1 hour
    };
    
    this.sessions.set(token, session);
    return session;
  }
  
  async handleToolCall(tool: string, params: any, context: any) {
    // Check authentication
    const session = this.sessions.get(context.authToken);
    if (!session || session.expiresAt < new Date()) {
      throw new Error('Authentication required');
    }
    
    // Check permissions
    const requiredPermission = this.getToolPermission(tool);
    if (!session.permissions.includes(requiredPermission)) {
      throw new Error('Permission denied');
    }
    
    // Execute with user context
    return super.handleToolCall(tool, params, {
      ...context,
      userId: session.userId
    });
  }
}
```

## Tool Naming Conventions

Veas Protocol automatically generates MCP tool names following this pattern:

```
[prefix]_[domain]_[action]
```

Examples:
- `notion_articles_list` - List articles from Notion
- `github_projects_create` - Create a GitHub project
- `jira_issues_update` - Update a Jira issue

### Custom Tool Names

Override default naming:

```typescript
const adapter = new MCPAdapter(provider, {
  toolNameFormatter: (domain: string, action: string) => {
    return `${action}_${domain}`.toLowerCase();
  }
});

// Results in: list_articles, create_project, etc.
```

## Resource Handling

MCP also supports resources (documents, data) in addition to tools:

```typescript
class ResourceMCPAdapter extends MCPAdapter {
  async listResources() {
    const articles = await this.provider.knowledgeBase.listArticles({
      limit: 100
    });
    
    return articles.items.map(article => ({
      uri: `article://${article.id}`,
      name: article.title,
      description: article.excerpt,
      mimeType: 'text/markdown'
    }));
  }
  
  async readResource(uri: string) {
    const id = uri.replace('article://', '');
    const article = await this.provider.knowledgeBase.getArticle(id);
    
    return {
      uri,
      mimeType: 'text/markdown',
      content: article.content
    };
  }
}
```

## Monitoring and Logging

Add comprehensive monitoring:

```typescript
import { Logger } from '@veas/protocol/utils';

class MonitoredMCPAdapter extends MCPAdapter {
  private metrics = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    avgResponseTime: 0
  };
  
  async handleToolCall(tool: string, params: any) {
    const startTime = Date.now();
    this.metrics.totalCalls++;
    
    try {
      const result = await super.handleToolCall(tool, params);
      
      this.metrics.successfulCalls++;
      this.updateAvgResponseTime(Date.now() - startTime);
      
      Logger.info('Tool call successful', {
        tool,
        responseTime: Date.now() - startTime,
        userId: params.context?.userId
      });
      
      return result;
    } catch (error) {
      this.metrics.failedCalls++;
      
      Logger.error('Tool call failed', {
        tool,
        error: error.message,
        params
      });
      
      throw error;
    }
  }
  
  getMetrics() {
    return this.metrics;
  }
}
```

## Troubleshooting

### Common Issues

**1. Server not starting**
```bash
# Check if port is in use
lsof -i :3000

# Check environment variables
env | grep NOTION

# Enable debug logging
DEBUG=mcp:* node mcp-server.js
```

**2. Authentication failures**
```typescript
// Add detailed error logging
adapter.on('auth:error', (error) => {
  console.error('Auth failed:', error);
});
```

**3. Tool not found**
```typescript
// List all registered tools
const tools = adapter.getTools();
console.log('Registered tools:', tools.map(t => t.name));
```

**4. Timeout issues**
```typescript
// Increase timeout
const adapter = new MCPAdapter(provider, {
  timeout: 30000  // 30 seconds
});
```

### Debug Mode

Enable comprehensive debugging:

```typescript
const adapter = new MCPAdapter(provider, {
  debug: true,
  onToolCall: (tool, params) => {
    console.log(`Calling ${tool}:`, params);
  },
  onToolResponse: (tool, response) => {
    console.log(`Response from ${tool}:`, response);
  },
  onError: (error) => {
    console.error('MCP Error:', error);
  }
});
```

## Testing MCP Servers

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { MCPAdapter } from '@veas/protocol/adapters/mcp';
import { MockProvider } from '../mocks';

describe('MCP Server', () => {
  it('should list tools correctly', async () => {
    const provider = new MockProvider();
    const adapter = new MCPAdapter(provider);
    
    const tools = adapter.getTools();
    
    expect(tools).toContainEqual(
      expect.objectContaining({
        name: 'mock_articles_list'
      })
    );
  });
  
  it('should handle tool calls', async () => {
    const provider = new MockProvider();
    const adapter = new MCPAdapter(provider);
    
    const result = await adapter.handleToolCall(
      'mock_articles_list',
      { limit: 10 }
    );
    
    expect(result.items).toHaveLength(10);
  });
});
```

### Integration Tests

```typescript
import { Client } from '@modelcontextprotocol/sdk/client';
import { spawn } from 'child_process';

describe('MCP Integration', () => {
  let serverProcess;
  let client;
  
  beforeAll(async () => {
    // Start server
    serverProcess = spawn('node', ['./mcp-server.js']);
    
    // Connect client
    client = new Client();
    await client.connect(/* transport */);
  });
  
  afterAll(() => {
    serverProcess.kill();
  });
  
  it('should communicate via MCP', async () => {
    const tools = await client.listTools();
    expect(tools.length).toBeGreaterThan(0);
  });
});
```

## Performance Optimization

### Batch Operations

```typescript
class BatchMCPAdapter extends MCPAdapter {
  registerBatchTools() {
    return [
      {
        name: 'batch_create_articles',
        description: 'Create multiple articles at once',
        inputSchema: {
          type: 'object',
          properties: {
            articles: {
              type: 'array',
              items: { $ref: '#/definitions/CreateArticleData' }
            }
          }
        },
        handler: async ({ articles }) => {
          const results = await Promise.all(
            articles.map(data => 
              this.provider.knowledgeBase.createArticle(data)
            )
          );
          return { created: results };
        }
      }
    ];
  }
}
```

### Connection Pooling

```typescript
class PooledMCPAdapter extends MCPAdapter {
  private pool: ConnectionPool;
  
  constructor(provider: ProtocolProvider, poolSize = 5) {
    super(provider);
    this.pool = new ConnectionPool(provider, poolSize);
  }
  
  async handleToolCall(tool: string, params: any) {
    const connection = await this.pool.acquire();
    try {
      return await connection.execute(tool, params);
    } finally {
      this.pool.release(connection);
    }
  }
}
```

## Next Steps

1. **Choose your transport**: stdio for desktop, WebSocket for web
2. **Implement your provider**: Follow the Veas Protocol specification
3. **Configure AI assistants**: Add your MCP server to Claude or other assistants
4. **Test thoroughly**: Use the testing patterns above
5. **Monitor and optimize**: Add logging and metrics

## Resources

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [Veas Protocol Docs](https://docs.veas.org/protocol)
- [Example Implementations](https://github.com/veas-org/veas-protocol/examples)
- [Community Discord](https://discord.gg/veas)

---

For more help with MCP integration, join our [Discord community](https://discord.gg/veas) or check the [GitHub discussions](https://github.com/veas-org/veas-protocol/discussions).