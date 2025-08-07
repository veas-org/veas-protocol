# Real-World Implementation Examples

This document provides practical examples of implementing the Veas Protocol for various platforms and use cases.

## Table of Contents

1. [Quick MCP Server Setup](#quick-mcp-server-setup)
2. [Notion Provider](#notion-provider)
3. [GitHub Provider](#github-provider)
4. [Local Markdown Files Provider](#local-markdown-files-provider)
5. [Multi-Provider Aggregator](#multi-provider-aggregator)
6. [AI Assistant Integration](#ai-assistant-integration)
7. [Custom Business Application](#custom-business-application)

## Quick MCP Server Setup

The fastest way to create an MCP server for Claude Desktop:

```typescript
#!/usr/bin/env node
// mcp-server.js

import { MCPAdapter } from '@veas/protocol/adapters/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create a minimal protocol provider
const provider = {
  name: 'my-tools',
  version: '1.0.0',
  
  async authenticate() {
    return { userId: 'user', permissions: ['all'] };
  },
  
  isConnected() { return true; },
  async disconnect() {},
  
  // Implement knowledge base protocol
  knowledgeBase: {
    async listArticles(params) {
      // Your implementation here
      return {
        items: [
          {
            id: '1',
            title: 'Sample Article',
            content: 'This is a sample article',
            status: 'published',
            slug: 'sample-article',
            authorId: 'user',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ],
        total: 1,
        limit: params.limit || 20,
        offset: params.offset || 0
      };
    },
    
    async searchArticles(query) {
      // Implement search
      return { items: [], total: 0, limit: 20, offset: 0 };
    },
    
    // ... implement other required methods
  }
};

// Create and start MCP server
async function main() {
  const adapter = new MCPAdapter(provider);
  const transport = new StdioServerTransport();
  await adapter.connect(transport);
  console.error('MCP Server running');
}

main().catch(console.error);
```

Add to Claude Desktop config:
```json
{
  "mcpServers": {
    "my-tools": {
      "command": "node",
      "args": ["/path/to/mcp-server.js"]
    }
  }
}
```

## Notion Provider

A complete example of implementing the protocol for Notion.

### Provider Implementation

```typescript
import { Client as NotionClient } from '@notionhq/client';
import { 
  ProtocolProvider,
  KnowledgeBaseProtocol,
  Article,
  CreateArticleData,
  ListParams,
  ListResponse
} from '@veas/protocol';

export class NotionProvider implements ProtocolProvider {
  name = 'notion';
  version = '1.0.0';
  description = 'Notion Protocol Provider';
  
  private notion: NotionClient;
  private databaseId: string;
  knowledgeBase: KnowledgeBaseProtocol;
  
  constructor(config: { apiKey: string; databaseId: string }) {
    this.notion = new NotionClient({ auth: config.apiKey });
    this.databaseId = config.databaseId;
    this.knowledgeBase = new NotionKnowledgeBase(this.notion, this.databaseId);
  }
  
  async authenticate(credentials) {
    // Notion uses API key, already authenticated in constructor
    return {
      userId: 'notion-user',
      permissions: ['read', 'write']
    };
  }
  
  isConnected() {
    return true;
  }
  
  async disconnect() {
    // Clean up if needed
  }
}

class NotionKnowledgeBase implements KnowledgeBaseProtocol {
  constructor(
    private notion: NotionClient,
    private databaseId: string
  ) {}
  
  async listArticles(params: ListParams): Promise<ListResponse<Article>> {
    const response = await this.notion.databases.query({
      database_id: this.databaseId,
      page_size: params.limit || 20,
      start_cursor: params.offset ? String(params.offset) : undefined,
      filter: this.buildFilter(params.filters),
      sorts: this.buildSorts(params.sortBy, params.sortOrder)
    });
    
    const articles = response.results.map(page => 
      this.notionPageToArticle(page)
    );
    
    return {
      items: articles,
      total: articles.length, // Notion doesn't provide total count
      limit: params.limit || 20,
      offset: params.offset || 0
    };
  }
  
  async createArticle(data: CreateArticleData): Promise<Article> {
    const page = await this.notion.pages.create({
      parent: { database_id: this.databaseId },
      properties: {
        Title: { title: [{ text: { content: data.title } }] },
        Status: { select: { name: data.status || 'draft' } },
        Tags: { 
          multi_select: data.tags?.map(tag => ({ name: tag })) || []
        }
      },
      children: this.contentToBlocks(data.content)
    });
    
    return this.notionPageToArticle(page);
  }
  
  async getArticle(id: string): Promise<Article> {
    const page = await this.notion.pages.retrieve({ page_id: id });
    const blocks = await this.notion.blocks.children.list({ 
      block_id: id 
    });
    
    return this.notionPageToArticle(page, blocks.results);
  }
  
  private notionPageToArticle(page: any, blocks?: any[]): Article {
    const properties = page.properties;
    
    return {
      id: page.id,
      title: this.getTitle(properties.Title),
      slug: this.getSlug(properties.Slug) || this.generateSlug(this.getTitle(properties.Title)),
      content: blocks ? this.blocksToMarkdown(blocks) : '',
      status: this.getSelect(properties.Status) as Article['status'],
      authorId: page.created_by.id,
      tags: this.getMultiSelect(properties.Tags),
      createdAt: new Date(page.created_time),
      updatedAt: new Date(page.last_edited_time),
      metadata: {
        url: page.url,
        icon: page.icon,
        cover: page.cover
      }
    };
  }
  
  private contentToBlocks(content: string) {
    // Convert markdown/HTML to Notion blocks
    const lines = content.split('\n');
    return lines.map(line => {
      if (line.startsWith('# ')) {
        return {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ type: 'text', text: { content: line.slice(2) } }]
          }
        };
      }
      // ... handle other markdown elements
      return {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: line } }]
        }
      };
    });
  }
  
  private blocksToMarkdown(blocks: any[]): string {
    return blocks.map(block => {
      switch (block.type) {
        case 'heading_1':
          return `# ${this.getRichText(block.heading_1.rich_text)}`;
        case 'heading_2':
          return `## ${this.getRichText(block.heading_2.rich_text)}`;
        case 'paragraph':
          return this.getRichText(block.paragraph.rich_text);
        case 'bulleted_list_item':
          return `- ${this.getRichText(block.bulleted_list_item.rich_text)}`;
        // ... handle other block types
        default:
          return '';
      }
    }).join('\n');
  }
  
  // Helper methods
  private getTitle(property: any): string {
    return property?.title?.[0]?.plain_text || '';
  }
  
  private getRichText(richText: any[]): string {
    return richText?.map(t => t.plain_text).join('') || '';
  }
  
  // ... implement remaining methods
}

// Usage
const notion = new NotionProvider({
  apiKey: process.env.NOTION_API_KEY,
  databaseId: process.env.NOTION_DATABASE_ID
});

await notion.authenticate({ type: 'api-key', token: process.env.NOTION_API_KEY });
const articles = await notion.knowledgeBase.listArticles({ limit: 10 });
```

## GitHub Provider

Implementation for GitHub Issues and Projects.

```typescript
import { Octokit } from '@octokit/rest';
import { 
  ProtocolProvider,
  ProjectManagementProtocol,
  Project,
  Issue,
  CreateIssueData
} from '@veas/protocol';

export class GitHubProvider implements ProtocolProvider {
  name = 'github';
  version = '1.0.0';
  projectManagement: ProjectManagementProtocol;
  
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  
  constructor(config: { token: string; owner: string; repo: string }) {
    this.octokit = new Octokit({ auth: config.token });
    this.owner = config.owner;
    this.repo = config.repo;
    this.projectManagement = new GitHubProjectManagement(
      this.octokit,
      this.owner,
      this.repo
    );
  }
  
  // ... implement required methods
}

class GitHubProjectManagement implements ProjectManagementProtocol {
  constructor(
    private octokit: Octokit,
    private owner: string,
    private repo: string
  ) {}
  
  async listProjects(params): Promise<ListResponse<Project>> {
    const { data: projects } = await this.octokit.projects.listForRepo({
      owner: this.owner,
      repo: this.repo,
      per_page: params.limit || 20,
      page: Math.floor((params.offset || 0) / (params.limit || 20)) + 1
    });
    
    return {
      items: projects.map(p => ({
        id: String(p.id),
        name: p.name,
        key: p.number ? `GH-${p.number}` : p.name,
        description: p.body || undefined,
        status: p.state === 'open' ? 'active' : 'archived',
        visibility: 'public',
        ownerId: String(p.creator.id),
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at)
      })),
      total: projects.length,
      limit: params.limit || 20,
      offset: params.offset || 0
    };
  }
  
  async createIssue(data: CreateIssueData): Promise<Issue> {
    const { data: issue } = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: data.title,
      body: data.description,
      labels: data.labels,
      assignees: data.assigneeId ? [data.assigneeId] : undefined,
      milestone: data.sprintId ? Number(data.sprintId) : undefined
    });
    
    return this.githubIssueToProtocol(issue);
  }
  
  async listIssues(params): Promise<ListResponse<Issue>> {
    const { data: issues } = await this.octokit.issues.listForRepo({
      owner: this.owner,
      repo: this.repo,
      state: params.filters?.status === 'done' ? 'closed' : 'open',
      labels: params.filters?.labels?.join(','),
      per_page: params.limit || 20,
      page: Math.floor((params.offset || 0) / (params.limit || 20)) + 1,
      sort: params.sortBy || 'created',
      direction: params.sortOrder || 'desc'
    });
    
    return {
      items: issues.map(this.githubIssueToProtocol),
      total: issues.length,
      limit: params.limit || 20,
      offset: params.offset || 0
    };
  }
  
  private githubIssueToProtocol(issue: any): Issue {
    return {
      id: String(issue.id),
      projectId: this.repo,
      key: `#${issue.number}`,
      title: issue.title,
      description: issue.body || undefined,
      type: this.detectIssueType(issue.labels),
      status: issue.state === 'closed' ? 'done' : 'todo',
      priority: this.detectPriority(issue.labels),
      assigneeId: issue.assignee?.login,
      reporterId: issue.user.login,
      labels: issue.labels?.map((l: any) => l.name) || [],
      createdAt: new Date(issue.created_at),
      updatedAt: new Date(issue.updated_at),
      metadata: {
        url: issue.html_url,
        reactions: issue.reactions,
        comments: issue.comments
      }
    };
  }
  
  private detectIssueType(labels: any[]): Issue['type'] {
    const labelNames = labels?.map(l => l.name.toLowerCase()) || [];
    if (labelNames.includes('bug')) return 'bug';
    if (labelNames.includes('feature')) return 'feature';
    if (labelNames.includes('epic')) return 'epic';
    return 'task';
  }
  
  private detectPriority(labels: any[]): Issue['priority'] {
    const labelNames = labels?.map(l => l.name.toLowerCase()) || [];
    if (labelNames.includes('critical') || labelNames.includes('urgent')) 
      return 'critical';
    if (labelNames.includes('high')) return 'high';
    if (labelNames.includes('low')) return 'low';
    return 'medium';
  }
  
  // ... implement remaining methods
}
```

## Local Markdown Files Provider

A provider for local markdown files, perfect for Obsidian-like systems.

```typescript
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';

export class LocalMarkdownProvider implements ProtocolProvider {
  name = 'local-markdown';
  version = '1.0.0';
  knowledgeBase: KnowledgeBaseProtocol;
  
  constructor(private basePath: string) {
    this.knowledgeBase = new LocalMarkdownKnowledgeBase(basePath);
  }
  
  // ... implement required methods
}

class LocalMarkdownKnowledgeBase implements KnowledgeBaseProtocol {
  constructor(private basePath: string) {}
  
  async listArticles(params): Promise<ListResponse<Article>> {
    const files = await glob('**/*.md', { 
      cwd: this.basePath,
      ignore: ['node_modules/**', '.git/**']
    });
    
    const articles = await Promise.all(
      files.map(file => this.fileToArticle(file))
    );
    
    // Apply filters
    let filtered = articles;
    if (params.filters) {
      if (params.filters.status) {
        filtered = filtered.filter(a => a.status === params.filters.status);
      }
      if (params.filters.tags) {
        filtered = filtered.filter(a => 
          params.filters.tags.some(tag => a.tags?.includes(tag))
        );
      }
    }
    
    // Sort
    if (params.sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[params.sortBy];
        const bVal = b[params.sortBy];
        const order = params.sortOrder === 'desc' ? -1 : 1;
        return aVal > bVal ? order : -order;
      });
    }
    
    // Paginate
    const start = params.offset || 0;
    const end = start + (params.limit || 20);
    const paginated = filtered.slice(start, end);
    
    return {
      items: paginated,
      total: filtered.length,
      limit: params.limit || 20,
      offset: params.offset || 0
    };
  }
  
  async getArticle(id: string): Promise<Article> {
    const filePath = path.join(this.basePath, id);
    return this.fileToArticle(filePath);
  }
  
  async createArticle(data: CreateArticleData): Promise<Article> {
    const filename = `${data.slug || this.slugify(data.title)}.md`;
    const filePath = path.join(
      this.basePath,
      data.folderId || '',
      filename
    );
    
    const frontmatter = {
      title: data.title,
      status: data.status || 'draft',
      tags: data.tags || [],
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    const content = matter.stringify(data.content, frontmatter);
    await fs.writeFile(filePath, content, 'utf-8');
    
    return this.fileToArticle(filePath);
  }
  
  async updateArticle(id: string, data: UpdateArticleData): Promise<Article> {
    const filePath = path.join(this.basePath, id);
    const existing = await this.fileToArticle(filePath);
    
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    
    const frontmatter = {
      title: updated.title,
      status: updated.status,
      tags: updated.tags,
      created: existing.createdAt.toISOString(),
      updated: updated.updatedAt.toISOString()
    };
    
    const content = matter.stringify(updated.content, frontmatter);
    await fs.writeFile(filePath, content, 'utf-8');
    
    return updated;
  }
  
  private async fileToArticle(filePath: string): Promise<Article> {
    const content = await fs.readFile(
      path.join(this.basePath, filePath),
      'utf-8'
    );
    const { data: frontmatter, content: body } = matter(content);
    const stats = await fs.stat(path.join(this.basePath, filePath));
    
    return {
      id: filePath,
      title: frontmatter.title || path.basename(filePath, '.md'),
      slug: path.basename(filePath, '.md'),
      content: body,
      excerpt: frontmatter.excerpt || body.substring(0, 200),
      status: frontmatter.status || 'published',
      authorId: frontmatter.author || 'unknown',
      tags: frontmatter.tags || [],
      createdAt: frontmatter.created 
        ? new Date(frontmatter.created) 
        : stats.birthtime,
      updatedAt: frontmatter.updated 
        ? new Date(frontmatter.updated) 
        : stats.mtime,
      metadata: {
        wordCount: body.split(/\s+/).length,
        readTime: Math.ceil(body.split(/\s+/).length / 200),
        ...frontmatter
      }
    };
  }
  
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  
  // ... implement remaining methods
}
```

## Multi-Provider Aggregator

Aggregate multiple providers into a single interface.

```typescript
export class AggregatedProvider implements ProtocolProvider {
  name = 'aggregated';
  version = '1.0.0';
  knowledgeBase: KnowledgeBaseProtocol;
  projectManagement: ProjectManagementProtocol;
  
  private providers: ProtocolProvider[] = [];
  
  async addProvider(provider: ProtocolProvider) {
    this.providers.push(provider);
    
    // Initialize aggregated protocols
    if (!this.knowledgeBase && provider.knowledgeBase) {
      this.knowledgeBase = new AggregatedKnowledgeBase(this.providers);
    }
    if (!this.projectManagement && provider.projectManagement) {
      this.projectManagement = new AggregatedProjectManagement(this.providers);
    }
  }
  
  // ... implement required methods
}

class AggregatedKnowledgeBase implements KnowledgeBaseProtocol {
  constructor(private providers: ProtocolProvider[]) {}
  
  async listArticles(params): Promise<ListResponse<Article>> {
    // Fetch from all providers in parallel
    const results = await Promise.all(
      this.providers
        .filter(p => p.knowledgeBase)
        .map(p => p.knowledgeBase!.listArticles(params))
    );
    
    // Merge results
    const allArticles = results.flatMap(r => r.items);
    const total = results.reduce((sum, r) => sum + r.total, 0);
    
    // Add source metadata
    const articlesWithSource = allArticles.map((article, index) => ({
      ...article,
      metadata: {
        ...article.metadata,
        source: this.providers[Math.floor(index / (params.limit || 20))].name
      }
    }));
    
    return {
      items: articlesWithSource,
      total,
      limit: params.limit || 20,
      offset: params.offset || 0
    };
  }
  
  async searchArticles(query: string, params?): Promise<ListResponse<Article>> {
    // Search across all providers
    const searchPromises = this.providers
      .filter(p => p.knowledgeBase)
      .map(p => p.knowledgeBase!.searchArticles(query, params));
    
    const results = await Promise.allSettled(searchPromises);
    
    // Combine successful results
    const articles = results
      .filter(r => r.status === 'fulfilled')
      .flatMap((r: any) => r.value.items);
    
    // Rank by relevance (simple example)
    articles.sort((a, b) => {
      const aScore = this.calculateRelevance(a, query);
      const bScore = this.calculateRelevance(b, query);
      return bScore - aScore;
    });
    
    return {
      items: articles.slice(0, params?.limit || 20),
      total: articles.length,
      limit: params?.limit || 20,
      offset: params?.offset || 0
    };
  }
  
  private calculateRelevance(article: Article, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    if (article.title.toLowerCase().includes(queryLower)) score += 10;
    if (article.content.toLowerCase().includes(queryLower)) score += 5;
    if (article.excerpt?.toLowerCase().includes(queryLower)) score += 3;
    
    return score;
  }
  
  // ... implement remaining methods
}

// Usage
const aggregated = new AggregatedProvider();

// Add multiple providers
await aggregated.addProvider(new NotionProvider({ ... }));
await aggregated.addProvider(new GitHubProvider({ ... }));
await aggregated.addProvider(new LocalMarkdownProvider('/docs'));

// Search across all providers
const results = await aggregated.knowledgeBase.searchArticles('protocol');
```

## AI Assistant Integration

Complete MCP server for AI assistants.

```typescript
import { MCPAdapter } from '@veas/protocol/adapters/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create a combined provider for AI assistant
class AIAssistantProvider implements ProtocolProvider {
  name = 'ai-assistant';
  version = '1.0.0';
  
  knowledgeBase: KnowledgeBaseProtocol;
  projectManagement: ProjectManagementProtocol;
  
  constructor() {
    // Initialize with multiple backends
    this.knowledgeBase = new CombinedKnowledgeBase([
      new NotionKnowledgeBase(),
      new LocalMarkdownKnowledgeBase(),
      new ConfluenceKnowledgeBase()
    ]);
    
    this.projectManagement = new CombinedProjectManagement([
      new GitHubProjectManagement(),
      new JiraProjectManagement(),
      new LinearProjectManagement()
    ]);
  }
  
  // Add AI-specific enhancements
  async searchWithContext(query: string, context: any) {
    // Use context to improve search
    const enrichedQuery = this.enrichQuery(query, context);
    const results = await this.knowledgeBase.searchArticles(enrichedQuery);
    
    // Rank by relevance to context
    return this.rankByContext(results.items, context);
  }
  
  async suggestNextActions(currentTask: Issue) {
    // AI-powered suggestions
    const relatedIssues = await this.findRelatedIssues(currentTask);
    const blockers = await this.findBlockers(currentTask);
    
    return {
      nextSteps: this.generateNextSteps(currentTask, relatedIssues),
      blockers,
      recommendations: this.generateRecommendations(currentTask)
    };
  }
}

// Create MCP server
async function startMCPServer() {
  const provider = new AIAssistantProvider();
  const adapter = new MCPAdapter(provider, {
    name: 'ai-workspace',
    description: 'Unified workspace for AI assistants',
    version: '1.0.0',
    
    // Custom tools for AI
    customTools: [
      {
        name: 'search_with_context',
        description: 'Search with AI context awareness',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            context: { type: 'object' }
          }
        },
        handler: async (params) => {
          return provider.searchWithContext(params.query, params.context);
        }
      },
      {
        name: 'suggest_next_actions',
        description: 'Get AI-powered task suggestions',
        inputSchema: {
          type: 'object',
          properties: {
            issueId: { type: 'string' }
          }
        },
        handler: async (params) => {
          const issue = await provider.projectManagement.getIssue(params.issueId);
          return provider.suggestNextActions(issue);
        }
      }
    ]
  });
  
  // Start with stdio transport for Claude Desktop
  const transport = new StdioServerTransport();
  await adapter.connect(transport);
  
  console.error('MCP Server running on stdio');
}

// Run the server
if (require.main === module) {
  startMCPServer().catch(console.error);
}
```

## Custom Business Application

Example of a custom business application using the protocol.

```typescript
// Custom CRM implementation
class CRMProvider implements ProtocolProvider {
  name = 'custom-crm';
  version = '1.0.0';
  
  // Extend with custom protocol
  knowledgeBase: KnowledgeBaseProtocol;
  customerManagement: CustomerManagementProtocol; // Custom extension
  
  constructor(private api: CRMAPIClient) {
    this.knowledgeBase = new CRMKnowledgeBase(api);
    this.customerManagement = new CRMCustomerManagement(api);
  }
}

// Map CRM entities to knowledge base articles
class CRMKnowledgeBase implements KnowledgeBaseProtocol {
  constructor(private api: CRMAPIClient) {}
  
  async listArticles(params): Promise<ListResponse<Article>> {
    // Map customer records to articles
    const customers = await this.api.getCustomers(params);
    
    const articles = customers.map(customer => ({
      id: customer.id,
      title: customer.companyName,
      slug: customer.slug,
      content: this.customerToMarkdown(customer),
      status: customer.active ? 'published' : 'archived',
      authorId: customer.accountManager,
      tags: [customer.industry, customer.segment],
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      metadata: {
        customerId: customer.id,
        revenue: customer.annualRevenue,
        employees: customer.employeeCount,
        website: customer.website
      }
    }));
    
    return {
      items: articles,
      total: customers.total,
      limit: params.limit || 20,
      offset: params.offset || 0
    };
  }
  
  private customerToMarkdown(customer: any): string {
    return `
# ${customer.companyName}

## Overview
- **Industry**: ${customer.industry}
- **Segment**: ${customer.segment}
- **Annual Revenue**: $${customer.annualRevenue.toLocaleString()}
- **Employees**: ${customer.employeeCount}
- **Website**: [${customer.website}](${customer.website})

## Contact Information
- **Primary Contact**: ${customer.primaryContact.name}
- **Email**: ${customer.primaryContact.email}
- **Phone**: ${customer.primaryContact.phone}

## Account Details
- **Account Manager**: ${customer.accountManager}
- **Customer Since**: ${customer.customerSince}
- **Contract Value**: $${customer.contractValue.toLocaleString()}

## Notes
${customer.notes || 'No notes available.'}

## Recent Interactions
${customer.interactions.map(i => `- ${i.date}: ${i.type} - ${i.summary}`).join('\n')}
    `;
  }
  
  // ... implement remaining methods
}

// Usage in application
class CRMApplication {
  private provider: CRMProvider;
  
  constructor() {
    this.provider = new CRMProvider(new CRMAPIClient());
  }
  
  async generateCustomerReport(customerId: string) {
    // Use protocol to get customer data as article
    const customer = await this.provider.knowledgeBase.getArticle(customerId);
    
    // Generate report
    return {
      summary: customer.excerpt,
      details: customer.content,
      metrics: customer.metadata,
      lastUpdated: customer.updatedAt
    };
  }
  
  async searchCustomers(query: string) {
    // Use protocol's search capabilities
    const results = await this.provider.knowledgeBase.searchArticles(query);
    
    return results.items.map(article => ({
      id: article.metadata.customerId,
      name: article.title,
      revenue: article.metadata.revenue,
      segment: article.tags[1]
    }));
  }
}
```

## Testing Your Implementation

Example test suite for validating protocol compliance:

```typescript
import { describe, it, expect } from 'vitest';
import { ProtocolValidator } from '@veas/protocol/testing';

describe('MyProvider Protocol Compliance', () => {
  const validator = new ProtocolValidator();
  const provider = new MyProvider();
  
  it('should pass knowledge base compliance', async () => {
    const result = await validator.validateKnowledgeBase(provider);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  it('should handle pagination correctly', async () => {
    const page1 = await provider.knowledgeBase.listArticles({ 
      limit: 10, 
      offset: 0 
    });
    const page2 = await provider.knowledgeBase.listArticles({ 
      limit: 10, 
      offset: 10 
    });
    
    expect(page1.items).not.toEqual(page2.items);
    expect(page1.limit).toBe(10);
    expect(page2.offset).toBe(10);
  });
  
  it('should handle errors according to spec', async () => {
    try {
      await provider.knowledgeBase.getArticle('non-existent');
    } catch (error) {
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBeDefined();
      expect(error.timestamp).toBeInstanceOf(Date);
    }
  });
});
```

## Deployment Examples

### Docker Deployment

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "dist/mcp-server.js"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: veas-protocol-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: veas-protocol
  template:
    metadata:
      labels:
        app: veas-protocol
    spec:
      containers:
      - name: protocol-server
        image: your-registry/veas-protocol:latest
        ports:
        - containerPort: 3000
        env:
        - name: NOTION_API_KEY
          valueFrom:
            secretKeyRef:
              name: protocol-secrets
              key: notion-api-key
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: protocol-secrets
              key: github-token
```

## Next Steps

1. Choose a provider example that matches your use case
2. Adapt the code to your platform's API
3. Implement the required protocol methods
4. Add tests to ensure compliance
5. Deploy and integrate with AI assistants
6. Share your implementation with the community

For more examples and support, visit:
- [GitHub Repository](https://github.com/veas-org/veas-protocol)
- [Community Discord](https://discord.gg/veas)
- [Protocol Documentation](https://docs.veas.org/protocol)