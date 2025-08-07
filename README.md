# Veas Protocol

[![npm version](https://img.shields.io/npm/v/@veas/protocol.svg)](https://www.npmjs.com/package/@veas/protocol)
[![npm downloads](https://img.shields.io/npm/dm/@veas/protocol.svg)](https://www.npmjs.com/package/@veas/protocol)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Protocol Version](https://img.shields.io/badge/protocol-v1.0-blue)](SPECIFICATION.md)

**Universal Protocol for Knowledge & Project Management Systems**

A standardized, open-source protocol that enables seamless interoperability between knowledge bases, project management tools, and AI assistants. Build once, integrate everywhere.

## 🎯 Why This Protocol?

The modern workspace is fragmented across dozens of tools - Notion for documentation, Jira for project management, Confluence for knowledge bases, GitHub for code, and countless others. Each tool has its own API, data format, and integration requirements. This creates:

- **Integration Complexity**: Every tool needs custom integrations with every other tool
- **Data Silos**: Information is locked within individual platforms
- **AI Limitations**: AI assistants need separate implementations for each platform
- **Vendor Lock-in**: Switching tools means losing integrations and automation

**Veas Protocol** solves this by providing a universal language that any tool can speak, enabling:

- ✅ **Write Once, Integrate Everywhere**: Implement the protocol once, work with any compatible tool
- ✅ **AI-Native**: Built with AI assistants in mind, following the Model Context Protocol (MCP) standard
- ✅ **Data Portability**: Move your data between platforms without losing functionality
- ✅ **Future-Proof**: As new tools emerge, they can adopt the protocol and instantly work with existing integrations

## 🏗️ Protocol Architecture

```
                        AI Assistants
                    (Claude, GPT, Copilot)
                             │
                             ▼
                    ┌─────────────────┐
                    │   MCP Adapter   │
                    └────────┬────────┘
                             │
┌────────────────────────────┼────────────────────────────┐
│                     Veas Protocol                        │
├───────────────────────────────────────────────────────────┤
│  📚 Knowledge Base  │  📋 Project Management  │  🔜 More  │
│  • Articles         │  • Projects             │  • CRM     │
│  • Folders          │  • Issues               │  • Calendar│
│  • Tags             │  • Sprints              │  • Chat    │
│  • Search           │  • Teams                │  • Files   │
└────────────┬───────────────┴───────────────┬────────────┘
             │                                │
             ▼                                ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   Protocol Providers    │     │   Protocol Consumers     │
│  (Implement Protocol)   │     │  (Use Protocol via SDK)  │
└─────────────────────────┘     └─────────────────────────┘
             │                                │
    ┌────────┼────────┬──────────┬──────────┼────────┐
    ▼        ▼        ▼          ▼          ▼        ▼
┌────────┐┌──────┐┌──────┐  ┌────────┐┌────────┐┌──────┐
│ Notion ││GitHub││ Jira │  │Your App││ CLI    ││  API │
└────────┘└──────┘└──────┘  └────────┘└────────┘└──────┘
```

## 📦 Protocol Domains

### Knowledge Base Protocol
Standardized operations for content management systems:
- **Articles**: Create, read, update, delete, publish
- **Folders**: Hierarchical organization
- **Tags**: Flexible categorization
- **Search**: Full-text and metadata search
- **Versioning**: Track changes over time

### Project Management Protocol
Unified interface for project tracking systems:
- **Projects**: Multi-tenant project spaces
- **Issues**: Tasks, bugs, features with full lifecycle
- **Sprints**: Time-boxed iterations
- **Teams**: User and permission management
- **Workflows**: Customizable state machines

### Coming Soon
- **CRM Protocol**: Customer relationship management
- **Calendar Protocol**: Event and scheduling systems
- **Communication Protocol**: Chat and messaging platforms
- **File Storage Protocol**: Document and asset management

## 🚀 Quick Start

### For Implementers (Building a Compatible Tool)

```typescript
import { ProtocolProvider, KnowledgeBaseProtocol } from '@veas/protocol';

class MyKnowledgeBase implements KnowledgeBaseProtocol {
  async listArticles(params) {
    // Your implementation
    return { items: [...], total: 100 };
  }
  
  async createArticle(data) {
    // Your implementation
    return { id: '...', ...data };
  }
  
  // Implement other protocol methods...
}

// Register your implementation
const provider: ProtocolProvider = {
  name: 'my-knowledge-base',
  version: '1.0.0',
  knowledgeBase: new MyKnowledgeBase(),
  authenticate: async (credentials) => { /* ... */ },
  isConnected: () => true,
  disconnect: async () => { /* ... */ }
};
```

### For Consumers (Using Protocol-Compatible Tools)

```typescript
import { ProtocolProvider } from '@veas/protocol';

// Connect to any protocol-compatible tool
const provider = await connectToProvider('notion'); // or 'obsidian', 'confluence', etc.

// Use the same API regardless of the underlying tool
const articles = await provider.knowledgeBase.listArticles({
  limit: 10,
  filters: { status: 'published' }
});
```

### For AI Assistants (MCP Server)

```typescript
import { MCPAdapter } from '@veas/protocol/adapters/mcp';
import { YourProvider } from './your-provider';

// Create your protocol provider
const provider = new YourProvider();
await provider.authenticate({ /* credentials */ });

// Create MCP adapter
const adapter = new MCPAdapter(provider, {
  name: 'your-knowledge-base',
  description: 'Access your knowledge base via MCP'
});

// Start for Claude Desktop (stdio transport)
await adapter.serve({ transport: 'stdio' });

// Or start as HTTP server for web-based assistants
await adapter.serve({ 
  transport: 'http',
  port: 3000 
});
```

Configure in Claude Desktop (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "your-kb": {
      "command": "node",
      "args": ["/path/to/mcp-server.js"]
    }
  }
}
```

## 📋 Implementation Status

| Platform | Knowledge Base | Project Management | Status |
|----------|:--------------:|:------------------:|:------:|
| Veas Cloud | ✅ | ✅ | Production |
| Notion | 🚧 | 🚧 | In Progress |
| Obsidian | 📋 | - | Planned |
| Confluence | 📋 | - | Planned |
| Jira | - | 📋 | Planned |
| Linear | - | 📋 | Planned |
| GitHub | 📋 | ✅ | Partial |

Legend: ✅ Complete | 🚧 In Progress | 📋 Planned | - Not Applicable

## 🔧 For AI/MCP Integration

The protocol is designed to work seamlessly with AI assistants through the Model Context Protocol (MCP):

```typescript
import { MCPAdapter } from '@veas/protocol/adapters/mcp';

// Expose any protocol provider as an MCP server
const adapter = new MCPAdapter(provider);

// Start MCP server for Claude Desktop
await adapter.serve({ transport: 'stdio' });

// AI assistants can now:
// - Browse and search knowledge bases
// - Create and manage projects
// - Update issues and track progress
// - Access any protocol-compatible tool
```

**📘 See the complete [MCP Integration Guide](MCP_INTEGRATION.md) for:**
- Setting up MCP servers with different transports (stdio, WebSocket, SSE)
- Configuring Claude Desktop and other AI assistants
- Advanced patterns like multi-provider aggregation
- Authentication and security best practices
- Troubleshooting and performance optimization

## 📚 Documentation

- **[Protocol Specification](SPECIFICATION.md)** - Formal protocol definition
- **[Implementation Guide](IMPLEMENTATION_GUIDE.md)** - Step-by-step implementation instructions
- **[MCP Integration Guide](MCP_INTEGRATION.md)** - Complete guide for AI assistant integration
- **[API Reference](https://docs.veas.org/protocol/api)** - Complete API documentation
- **[Examples](EXAMPLES.md)** - Real-world implementation examples
- **[Migration Guide](MIGRATION.md)** - Migrate from proprietary APIs

## 🤝 Community & Governance

Veas Protocol is an open standard developed by the community:

- **Protocol Evolution**: Changes are proposed through VIPs (Veas Improvement Proposals)
- **Compatibility**: Semantic versioning ensures backward compatibility
- **Certification**: Tools can be certified as protocol-compliant
- **Working Groups**: Domain-specific groups drive protocol development

### Contributing

We welcome contributions from everyone! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- How to propose protocol changes
- Implementation guidelines
- Testing requirements
- Code of conduct

## 🛠️ Installation

```bash
# NPM
npm install @veas/protocol

# Yarn
yarn add @veas/protocol

# PNPM
pnpm add @veas/protocol
```

## 📦 What's Included

```
@veas/protocol
├── /protocols      # Protocol definitions and interfaces
│   ├── /knowledge-base    # Knowledge management protocol
│   ├── /project-management # Project tracking protocol
│   └── /common            # Shared types and utilities
├── /adapters       # Protocol adapters
│   └── /mcp              # Model Context Protocol adapter
├── /providers      # Reference implementations
│   └── /veas             # Veas cloud provider
└── /sdk           # Helper libraries for implementers
```

## 🌟 Use Cases

### For Organizations
- **Tool Migration**: Switch between platforms without losing integrations
- **Multi-Tool Workflows**: Seamlessly work across different tools
- **Custom Integrations**: Build once, work with all protocol-compatible tools

### For Tool Developers
- **Instant Ecosystem**: Immediately compatible with all protocol tools
- **Reduced Development**: No need to build individual integrations
- **AI-Ready**: Automatic compatibility with AI assistants

### For AI/Automation
- **Universal Access**: One protocol to access all tools
- **Consistent Interface**: Same operations across different platforms
- **Rich Capabilities**: Full CRUD operations, search, and more

## 🎯 Roadmap

### Phase 1: Foundation (Current)
- ✅ Knowledge Base Protocol v1.0
- ✅ Project Management Protocol v1.0
- ✅ MCP Adapter
- ✅ Reference Implementation (Veas)

### Phase 2: Ecosystem (Q1 2025)
- 🚧 Notion Provider
- 📋 Obsidian Provider
- 📋 Confluence Provider
- 📋 Protocol Certification Program

### Phase 3: Expansion (Q2 2025)
- 📋 CRM Protocol
- 📋 Calendar Protocol
- 📋 File Storage Protocol
- 📋 Communication Protocol

## 📄 License

MIT © Veas Protocol Contributors

---

<div align="center">

**[Documentation](https://docs.veas.org/protocol)** • **[API Reference](https://docs.veas.org/protocol/api)** • **[Discord Community](https://discord.gg/veas)** • **[GitHub](https://github.com/veas-org/veas-protocol)**

Built with ❤️ by the open-source community

</div>