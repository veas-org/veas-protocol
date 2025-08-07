# Veas Protocol

MCP (Model Context Protocol) implementation for AI tool integration.

## Overview

Veas Protocol provides a complete implementation of the Model Context Protocol (MCP), enabling seamless integration between AI models and external tools. This package is designed to be framework-agnostic and can be used in various environments.

## Features

- 🚀 **MCP Server** - Full-featured MCP server implementation with stdio transport
- 🔌 **MCP Client** - Flexible client for connecting to MCP servers
- 🛠️ **Standalone Tools** - Built-in tools for common operations
- 🔐 **Authentication** - Support for multiple auth methods (PAT, Bearer tokens)
- 💾 **Caching** - Built-in cache manager for improved performance
- 🔄 **SSE Support** - Server-Sent Events for real-time communication

## Installation

```bash
npm install @veas-org/veas-protocol
```

## Quick Start

### Setting up an MCP Server

```typescript
import { MCPServer } from '@veas-org/veas-protocol/server';

const server = new MCPServer({
  port: 3000,
  cacheOptions: {
    enabled: true,
    ttl: 300 // 5 minutes
  }
});

await server.start();
```

### Using the MCP Client

```typescript
import { MCPClient } from '@veas-org/veas-protocol/client';

const client = new MCPClient('http://localhost:3000', 'your-auth-token');

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.call('tool-name', {
  param1: 'value1',
  param2: 'value2'
});
```

### Direct Server Mode

For scenarios where you need direct tool execution:

```typescript
import { DirectMCPServer } from '@veas-org/veas-protocol/server';

const directServer = new DirectMCPServer();
await directServer.initialize();
await directServer.start();
```

## Architecture

```
@veas-org/veas-protocol
├── server/          # MCP server implementations
├── client/          # MCP client implementations
├── tools/           # Tool definitions and registry
├── auth/            # Authentication helpers
├── cache/           # Cache management
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Authentication

The protocol supports multiple authentication methods:

1. **Personal Access Tokens (PAT)**
   ```typescript
   const client = new MCPClient(url, patToken);
   ```

2. **Bearer Tokens**
   ```typescript
   const client = new MCPClient(url, bearerToken);
   ```

3. **Environment Variables**
   - `VEAS_PAT` - Personal Access Token
   - `VEAS_API_URL` - API endpoint URL

## Tools

### Built-in Tools

The protocol includes several built-in tools:

- `cache-get` - Retrieve cached values
- `cache-set` - Store values in cache
- `cache-clear` - Clear cache entries
- `system-info` - Get system information

### Custom Tools

You can register custom tools:

```typescript
import { registerTool } from '@veas-org/veas-protocol/tools';

registerTool({
  name: 'my-custom-tool',
  description: 'Description of your tool',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string' }
    }
  },
  handler: async (params) => {
    // Tool implementation
    return { result: 'success' };
  }
});
```

## Configuration

### Server Configuration

```typescript
interface MCPServerOptions {
  port?: number;
  cacheOptions?: {
    enabled?: boolean;
    ttl?: number; // Time to live in seconds
  };
}
```

### Client Configuration

```typescript
interface MCPClientOptions {
  timeout?: number; // Request timeout in milliseconds
  retries?: number; // Number of retry attempts
}
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

## API Reference

### MCPServer

Main server class for handling MCP requests.

```typescript
class MCPServer {
  constructor(options?: MCPServerOptions)
  start(): Promise<void>
  stop(): Promise<void>
}
```

### MCPClient

Client for interacting with MCP servers.

```typescript
class MCPClient {
  constructor(baseUrl: string, token: string)
  call(method: string, params?: any): Promise<any>
  listTools(): Promise<Tool[]>
}
```

## Error Handling

The protocol uses typed errors for better error handling:

```typescript
try {
  const result = await client.call('tool-name', params);
} catch (error) {
  if (error.code === 'TOOL_NOT_FOUND') {
    // Handle tool not found
  } else if (error.code === 'AUTH_FAILED') {
    // Handle authentication failure
  }
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © Veas Team

## Support

- 📧 Email: support@veas.org
- 💬 Discord: [Join our community](https://discord.gg/veas)
- 📚 Documentation: [docs.veas.org](https://docs.veas.org)
- 🐛 Issues: [GitHub Issues](https://github.com/veas-org/veas-protocol/issues)