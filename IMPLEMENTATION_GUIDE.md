# Implementation Guide

This guide walks you through implementing the Veas Protocol for your platform or tool.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Implementation](#basic-implementation)
3. [Knowledge Base Implementation](#knowledge-base-implementation)
4. [Project Management Implementation](#project-management-implementation)
5. [MCP Integration](#mcp-integration)
6. [Testing & Validation](#testing--validation)
7. [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- Node.js 18+ or equivalent runtime
- TypeScript knowledge (recommended)
- Understanding of async/await patterns
- Familiarity with your target platform's API

### Installation

```bash
npm install @veas/protocol
```

### Project Structure

Recommended structure for your implementation:

```
my-protocol-provider/
├── src/
│   ├── provider.ts          # Main ProtocolProvider implementation
│   ├── auth/                # Authentication logic
│   ├── knowledge-base/      # Knowledge base protocol implementation
│   ├── project-management/  # Project management implementation
│   └── utils/               # Helper functions
├── tests/                   # Test files
└── package.json
```

## Basic Implementation

### Step 1: Create Your Provider

```typescript
import { 
  ProtocolProvider, 
  AuthCredentials, 
  AuthContext,
  ProviderConfig 
} from '@veas/protocol';

export class MyPlatformProvider implements ProtocolProvider {
  name = 'my-platform';
  version = '1.0.0';
  description = 'My Platform Protocol Provider';
  
  private authContext?: AuthContext;
  
  constructor(public config?: ProviderConfig) {}
  
  async authenticate(credentials: AuthCredentials): Promise<AuthContext> {
    // Implement your authentication logic
    const response = await fetch(`${this.config?.baseUrl}/auth`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Authentication failed');
    }
    
    const user = await response.json();
    
    this.authContext = {
      userId: user.id,
      organizationId: user.organizationId,
      permissions: user.permissions || []
    };
    
    return this.authContext;
  }
  
  isConnected(): boolean {
    return !!this.authContext;
  }
  
  async disconnect(): Promise<void> {
    this.authContext = undefined;
    // Clean up any resources
  }
}
```

### Step 2: Add Error Handling

```typescript
import { ProtocolError } from '@veas/protocol';

class ProtocolErrorImpl extends Error implements ProtocolError {
  code: string;
  details?: any;
  timestamp: Date;
  traceId?: string;
  
  constructor(code: string, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    this.traceId = crypto.randomUUID();
  }
}

// Use in your methods
async getArticle(id: string): Promise<Article> {
  const response = await fetch(`${this.baseUrl}/articles/${id}`);
  
  if (response.status === 404) {
    throw new ProtocolErrorImpl(
      'NOT_FOUND',
      `Article ${id} not found`
    );
  }
  
  if (!response.ok) {
    throw new ProtocolErrorImpl(
      'SERVER_ERROR',
      'Failed to fetch article',
      { status: response.status }
    );
  }
  
  return response.json();
}
```

## Knowledge Base Implementation

### Step 1: Define Your Knowledge Base Class

```typescript
import { 
  KnowledgeBaseProtocol,
  Article,
  CreateArticleData,
  UpdateArticleData,
  ListParams,
  ListResponse 
} from '@veas/protocol';

export class MyKnowledgeBase implements KnowledgeBaseProtocol {
  constructor(
    private baseUrl: string,
    private getAuthHeaders: () => Record<string, string>
  ) {}
  
  async listArticles(params: ListParams): Promise<ListResponse<Article>> {
    const queryParams = new URLSearchParams({
      limit: String(params.limit || 20),
      offset: String(params.offset || 0),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder })
    });
    
    // Add filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        queryParams.append(`filter[${key}]`, String(value));
      });
    }
    
    const response = await fetch(
      `${this.baseUrl}/articles?${queryParams}`,
      { headers: this.getAuthHeaders() }
    );
    
    if (!response.ok) {
      throw new Error('Failed to list articles');
    }
    
    const data = await response.json();
    
    // Transform your platform's response to protocol format
    return {
      items: data.articles.map(this.transformArticle),
      total: data.total,
      limit: params.limit || 20,
      offset: params.offset || 0
    };
  }
  
  async createArticle(data: CreateArticleData): Promise<Article> {
    const response = await fetch(`${this.baseUrl}/articles`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.transformCreateData(data))
    });
    
    if (!response.ok) {
      throw new Error('Failed to create article');
    }
    
    return this.transformArticle(await response.json());
  }
  
  // Transform platform-specific data to protocol format
  private transformArticle(platformArticle: any): Article {
    return {
      id: platformArticle.id,
      title: platformArticle.title,
      slug: platformArticle.slug || this.generateSlug(platformArticle.title),
      content: platformArticle.content,
      excerpt: platformArticle.excerpt,
      status: this.mapStatus(platformArticle.status),
      authorId: platformArticle.author_id,
      publicationId: platformArticle.publication_id,
      folderId: platformArticle.folder_id,
      tags: platformArticle.tags || [],
      publishedAt: platformArticle.published_at 
        ? new Date(platformArticle.published_at) 
        : undefined,
      createdAt: new Date(platformArticle.created_at),
      updatedAt: new Date(platformArticle.updated_at),
      metadata: {
        readTime: platformArticle.read_time,
        wordCount: platformArticle.word_count,
        views: platformArticle.views,
        customData: platformArticle.custom_fields
      }
    };
  }
  
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  
  private mapStatus(platformStatus: string): Article['status'] {
    const statusMap: Record<string, Article['status']> = {
      'draft': 'draft',
      'published': 'published',
      'archived': 'archived',
      // Map your platform's statuses
      'pending': 'draft',
      'live': 'published',
      'deleted': 'archived'
    };
    
    return statusMap[platformStatus] || 'draft';
  }
  
  // Implement remaining methods...
  async getArticle(id: string): Promise<Article> { /* ... */ }
  async getArticleBySlug(slug: string): Promise<Article> { /* ... */ }
  async updateArticle(id: string, data: UpdateArticleData): Promise<Article> { /* ... */ }
  async deleteArticle(id: string): Promise<void> { /* ... */ }
  async publishArticle(id: string): Promise<Article> { /* ... */ }
  async unpublishArticle(id: string): Promise<Article> { /* ... */ }
  async searchArticles(query: string, params?: ListParams): Promise<ListResponse<Article>> { /* ... */ }
  
  // Folder operations
  async listFolders(params: ListParams): Promise<ListResponse<Folder>> { /* ... */ }
  // ... implement remaining folder operations
  
  // Tag operations
  async listTags(params: ListParams): Promise<ListResponse<Tag>> { /* ... */ }
  // ... implement remaining tag operations
}
```

### Step 2: Connect to Your Provider

```typescript
export class MyPlatformProvider implements ProtocolProvider {
  // ... previous code ...
  
  knowledgeBase?: KnowledgeBaseProtocol;
  
  async authenticate(credentials: AuthCredentials): Promise<AuthContext> {
    // ... authentication logic ...
    
    // Initialize knowledge base after authentication
    this.knowledgeBase = new MyKnowledgeBase(
      this.config?.baseUrl || 'https://api.myplatform.com',
      () => ({
        'Authorization': `Bearer ${credentials.token}`,
        'X-Organization': this.authContext?.organizationId || ''
      })
    );
    
    return this.authContext;
  }
}
```

## Project Management Implementation

### Step 1: Implement Project Management Protocol

```typescript
import {
  ProjectManagementProtocol,
  Project,
  Issue,
  Sprint,
  CreateProjectData,
  CreateIssueData,
  ListParams,
  ListResponse
} from '@veas/protocol';

export class MyProjectManagement implements ProjectManagementProtocol {
  constructor(
    private apiClient: MyPlatformAPIClient
  ) {}
  
  async listProjects(params: ListParams): Promise<ListResponse<Project>> {
    const projects = await this.apiClient.getProjects({
      page: Math.floor((params.offset || 0) / (params.limit || 20)) + 1,
      perPage: params.limit || 20,
      orderBy: params.sortBy,
      order: params.sortOrder
    });
    
    return {
      items: projects.data.map(this.transformProject),
      total: projects.total,
      limit: params.limit || 20,
      offset: params.offset || 0
    };
  }
  
  async createIssue(data: CreateIssueData): Promise<Issue> {
    // Map protocol data to your platform's format
    const platformIssue = {
      project_id: data.projectId,
      title: data.title,
      description: data.description,
      type: this.mapIssueType(data.type),
      priority: this.mapPriority(data.priority),
      assignee_id: data.assigneeId,
      labels: data.labels,
      // ... map other fields
    };
    
    const created = await this.apiClient.createIssue(platformIssue);
    return this.transformIssue(created);
  }
  
  private transformProject(platformProject: any): Project {
    return {
      id: platformProject.id,
      name: platformProject.name,
      key: platformProject.key || platformProject.slug,
      description: platformProject.description,
      status: platformProject.archived ? 'archived' : 'active',
      visibility: this.mapVisibility(platformProject.visibility),
      ownerId: platformProject.owner_id,
      organizationId: platformProject.org_id,
      createdAt: new Date(platformProject.created_at),
      updatedAt: new Date(platformProject.updated_at),
      metadata: platformProject.custom_fields
    };
  }
  
  private transformIssue(platformIssue: any): Issue {
    return {
      id: platformIssue.id,
      projectId: platformIssue.project_id,
      key: platformIssue.key,
      title: platformIssue.title,
      description: platformIssue.description,
      type: this.reverseMapIssueType(platformIssue.type),
      status: this.mapStatus(platformIssue.status),
      priority: this.reverseMapPriority(platformIssue.priority),
      assigneeId: platformIssue.assignee_id,
      reporterId: platformIssue.reporter_id,
      parentId: platformIssue.parent_id,
      sprintId: platformIssue.sprint_id,
      labels: platformIssue.labels || [],
      estimate: platformIssue.estimate,
      timeSpent: platformIssue.time_spent,
      dueDate: platformIssue.due_date ? new Date(platformIssue.due_date) : undefined,
      createdAt: new Date(platformIssue.created_at),
      updatedAt: new Date(platformIssue.updated_at),
      metadata: platformIssue.custom_fields
    };
  }
  
  // Implement remaining methods...
}
```

## MCP Integration

### Step 1: Create MCP Adapter

```typescript
import { MCPAdapter } from '@veas/protocol/adapters/mcp';
import { MyPlatformProvider } from './provider';

// Initialize your provider
const provider = new MyPlatformProvider({
  baseUrl: 'https://api.myplatform.com'
});

// Authenticate
await provider.authenticate({
  type: 'bearer',
  token: process.env.API_TOKEN
});

// Create MCP adapter
const mcpAdapter = new MCPAdapter(provider, {
  name: 'my-platform-mcp',
  description: 'MCP server for My Platform'
});

// Start MCP server
await mcpAdapter.serve({
  transport: 'stdio' // or 'http' for HTTP transport
});
```

### Step 2: Configure for AI Assistants

Create an MCP configuration file:

```json
{
  "mcpServers": {
    "my-platform": {
      "command": "node",
      "args": ["./dist/mcp-server.js"],
      "env": {
        "API_TOKEN": "${MY_PLATFORM_TOKEN}"
      }
    }
  }
}
```

## Testing & Validation

### Step 1: Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyKnowledgeBase } from '../src/knowledge-base';

describe('MyKnowledgeBase', () => {
  let kb: MyKnowledgeBase;
  let mockApiClient: MockApiClient;
  
  beforeEach(() => {
    mockApiClient = new MockApiClient();
    kb = new MyKnowledgeBase(mockApiClient);
  });
  
  describe('listArticles', () => {
    it('should return paginated articles', async () => {
      mockApiClient.setResponse('GET', '/articles', {
        articles: [
          { id: '1', title: 'Test Article', ... }
        ],
        total: 1
      });
      
      const result = await kb.listArticles({ limit: 10, offset: 0 });
      
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].title).toBe('Test Article');
    });
    
    it('should handle filters correctly', async () => {
      const result = await kb.listArticles({
        filters: { status: 'published' }
      });
      
      expect(mockApiClient.lastRequest.url).toContain('filter[status]=published');
    });
  });
});
```

### Step 2: Integration Tests

```typescript
import { ProtocolTestSuite } from '@veas/protocol/testing';
import { MyPlatformProvider } from '../src/provider';

// Use the official test suite
const testSuite = new ProtocolTestSuite({
  provider: () => new MyPlatformProvider({
    baseUrl: process.env.TEST_API_URL
  }),
  credentials: {
    type: 'bearer',
    token: process.env.TEST_API_TOKEN
  }
});

// Run compliance tests
testSuite.runAll();
```

### Step 3: Validate Protocol Compliance

```bash
# Install the protocol validator
npm install -D @veas/protocol-validator

# Run validation
npx veas-protocol validate ./dist/provider.js
```

## Best Practices

### 1. Error Handling

Always map platform errors to protocol error codes:

```typescript
class ErrorMapper {
  static mapError(platformError: any): ProtocolError {
    const errorMap: Record<number, string> = {
      401: 'AUTH_FAILED',
      403: 'PERMISSION_DENIED',
      404: 'NOT_FOUND',
      409: 'ALREADY_EXISTS',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT',
      500: 'SERVER_ERROR'
    };
    
    return new ProtocolErrorImpl(
      errorMap[platformError.status] || 'SERVER_ERROR',
      platformError.message || 'An error occurred',
      platformError
    );
  }
}
```

### 2. Caching

Implement caching for better performance:

```typescript
import { CacheManager } from '@veas/protocol/cache';

class CachedKnowledgeBase extends MyKnowledgeBase {
  private cache = new CacheManager({ ttl: 300 }); // 5 minutes
  
  async getArticle(id: string): Promise<Article> {
    const cacheKey = `article:${id}`;
    
    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    // Fetch from API
    const article = await super.getArticle(id);
    
    // Cache result
    await this.cache.set(cacheKey, article);
    
    return article;
  }
}
```

### 3. Rate Limiting

Respect platform rate limits:

```typescript
import { RateLimiter } from 'limiter';

class RateLimitedProvider {
  private limiter = new RateLimiter({
    tokensPerInterval: 100,
    interval: 'minute'
  });
  
  async makeRequest(url: string, options?: RequestInit) {
    await this.limiter.removeTokens(1);
    return fetch(url, options);
  }
}
```

### 4. Logging

Add comprehensive logging:

```typescript
import { logger } from '@veas/protocol/utils';

class LoggedProvider extends MyPlatformProvider {
  async authenticate(credentials: AuthCredentials) {
    logger.info('Authenticating with platform', { 
      type: credentials.type 
    });
    
    try {
      const result = await super.authenticate(credentials);
      logger.info('Authentication successful', { 
        userId: result.userId 
      });
      return result;
    } catch (error) {
      logger.error('Authentication failed', error);
      throw error;
    }
  }
}
```

### 5. Type Safety

Use TypeScript for type safety:

```typescript
// Define strict types for your platform
interface MyPlatformArticle {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  // ... other fields
}

// Use type guards
function isValidArticle(data: unknown): data is MyPlatformArticle {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data &&
    'content' in data
  );
}
```

## Next Steps

1. **Implement Core Features**: Start with basic CRUD operations
2. **Add Authentication**: Implement your platform's auth method
3. **Test Thoroughly**: Use the protocol test suite
4. **Document Extensions**: Document any custom extensions
5. **Get Certified**: Submit for protocol compliance certification
6. **Share with Community**: Publish your implementation

## Resources

- [Protocol Specification](SPECIFICATION.md)
- [API Reference](https://docs.veas.org/protocol/api)
- [Example Implementations](EXAMPLES.md)
- [Community Discord](https://discord.gg/veas)
- [GitHub Discussions](https://github.com/veas-org/veas-protocol/discussions)

---

Need help? Join our [Discord community](https://discord.gg/veas) or open an issue on [GitHub](https://github.com/veas-org/veas-protocol/issues).