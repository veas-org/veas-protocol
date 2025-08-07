# Veas Protocol Specification v1.0

## Abstract

The Veas Protocol defines a standardized interface for knowledge management and project tracking systems. This specification enables interoperability between different platforms, tools, and AI assistants by providing a common language for operations on knowledge bases, projects, and related entities.

## 1. Introduction

### 1.1 Purpose

This document specifies the Veas Protocol, a universal protocol for:
- Knowledge base management systems
- Project and issue tracking systems  
- AI assistant integrations via Model Context Protocol (MCP)
- Future extensibility to additional domains

### 1.2 Design Principles

1. **Platform Agnostic**: Works with any underlying storage or platform
2. **Type Safe**: Strongly typed interfaces with TypeScript definitions
3. **Extensible**: New domains and operations can be added without breaking changes
4. **AI-First**: Designed for seamless AI assistant integration
5. **RESTful**: Follows REST principles for predictable behavior

### 1.3 Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## 2. Protocol Architecture

### 2.1 Core Components

```
Protocol Provider (Interface)
├── Authentication
├── Protocol Domains
│   ├── Knowledge Base Protocol
│   └── Project Management Protocol
└── Connection Management
```

### 2.2 Protocol Provider Interface

Every protocol implementation MUST implement the `ProtocolProvider` interface:

```typescript
interface ProtocolProvider {
  name: string;                    // Unique identifier
  version: string;                  // Semantic version
  description?: string;             // Human-readable description
  config?: ProviderConfig;          // Provider configuration
  
  // Core methods
  authenticate(credentials: AuthCredentials): Promise<AuthContext>;
  isConnected(): boolean;
  disconnect(): Promise<void>;
  
  // Protocol domains (optional based on capabilities)
  knowledgeBase?: KnowledgeBaseProtocol;
  projectManagement?: ProjectManagementProtocol;
}
```

## 3. Common Types

### 3.1 Entity

All protocol entities MUST extend the base `Entity` type:

```typescript
interface Entity {
  id: string;           // Unique identifier
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
  createdBy?: string;   // User ID who created
  updatedBy?: string;   // User ID who last updated
}
```

### 3.2 List Operations

All list operations MUST support pagination and filtering:

```typescript
interface ListParams {
  limit?: number;       // Max items to return (default: 20, max: 100)
  offset?: number;      // Number of items to skip
  sortBy?: string;      // Field to sort by
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

interface ListResponse<T> {
  items: T[];          // Array of items
  total: number;       // Total count (without pagination)
  limit: number;       // Applied limit
  offset: number;      // Applied offset
}
```

### 3.3 Authentication

```typescript
interface AuthCredentials {
  type: 'pat' | 'bearer' | 'oauth' | 'api-key';
  token: string;
  refreshToken?: string;
  expiresAt?: Date;
}

interface AuthContext {
  userId: string;
  organizationId?: string;
  permissions: string[];
  metadata?: Record<string, any>;
}
```

## 4. Knowledge Base Protocol

### 4.1 Overview

The Knowledge Base Protocol defines operations for content management systems.

### 4.2 Interface

```typescript
interface KnowledgeBaseProtocol {
  // Article operations
  listArticles(params: ListParams): Promise<ListResponse<Article>>;
  getArticle(id: string): Promise<Article>;
  getArticleBySlug(slug: string): Promise<Article>;
  createArticle(data: CreateArticleData): Promise<Article>;
  updateArticle(id: string, data: UpdateArticleData): Promise<Article>;
  deleteArticle(id: string): Promise<void>;
  publishArticle(id: string): Promise<Article>;
  unpublishArticle(id: string): Promise<Article>;
  searchArticles(query: string, params?: ListParams): Promise<ListResponse<Article>>;
  
  // Folder operations
  listFolders(params: ListParams): Promise<ListResponse<Folder>>;
  getFolder(id: string): Promise<Folder>;
  createFolder(data: CreateFolderData): Promise<Folder>;
  updateFolder(id: string, data: UpdateFolderData): Promise<Folder>;
  deleteFolder(id: string): Promise<void>;
  moveFolderContents(fromId: string, toId: string): Promise<void>;
  
  // Tag operations
  listTags(params: ListParams): Promise<ListResponse<Tag>>;
  getTag(id: string): Promise<Tag>;
  createTag(data: CreateTagData): Promise<Tag>;
  updateTag(id: string, data: UpdateTagData): Promise<Tag>;
  deleteTag(id: string): Promise<void>;
  mergeT tags(fromId: string, toId: string): Promise<void>;
}
```

### 4.3 Article Entity

```typescript
interface Article extends Entity {
  title: string;              // Article title
  slug: string;               // URL-friendly identifier
  content: string;            // Content (Markdown/HTML)
  excerpt?: string;           // Short summary
  status: 'draft' | 'published' | 'archived';
  authorId: string;           // Author user ID
  publicationId?: string;     // Publication/workspace ID
  folderId?: string;          // Parent folder ID
  tags?: Tag[];               // Associated tags
  publishedAt?: Date;         // Publication date
  metadata?: {
    readTime?: number;        // Estimated read time (minutes)
    wordCount?: number;       // Word count
    views?: number;           // View count
    likes?: number;           // Like count
    featuredImage?: string;   // Featured image URL
    seoTitle?: string;        // SEO title
    seoDescription?: string;  // SEO description
    customData?: Record<string, any>;
  };
}
```

## 5. Project Management Protocol

### 5.1 Overview

The Project Management Protocol defines operations for project and issue tracking systems.

### 5.2 Interface

```typescript
interface ProjectManagementProtocol {
  // Project operations
  listProjects(params: ListParams): Promise<ListResponse<Project>>;
  getProject(id: string): Promise<Project>;
  createProject(data: CreateProjectData): Promise<Project>;
  updateProject(id: string, data: UpdateProjectData): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  archiveProject(id: string): Promise<Project>;
  
  // Issue operations
  listIssues(params: ListParams): Promise<ListResponse<Issue>>;
  getIssue(id: string): Promise<Issue>;
  createIssue(data: CreateIssueData): Promise<Issue>;
  updateIssue(id: string, data: UpdateIssueData): Promise<Issue>;
  deleteIssue(id: string): Promise<void>;
  moveIssue(id: string, projectId: string): Promise<Issue>;
  
  // Sprint operations
  listSprints(params: ListParams): Promise<ListResponse<Sprint>>;
  getSprint(id: string): Promise<Sprint>;
  createSprint(data: CreateSprintData): Promise<Sprint>;
  updateSprint(id: string, data: UpdateSprintData): Promise<Sprint>;
  deleteSprint(id: string): Promise<void>;
  startSprint(id: string): Promise<Sprint>;
  completeSprint(id: string): Promise<Sprint>;
  
  // Team operations
  listTeamMembers(params: ListParams): Promise<ListResponse<TeamMember>>;
  addTeamMember(data: AddTeamMemberData): Promise<TeamMember>;
  updateTeamMember(id: string, data: UpdateTeamMemberData): Promise<TeamMember>;
  removeTeamMember(id: string): Promise<void>;
}
```

### 5.3 Project Entity

```typescript
interface Project extends Entity {
  name: string;                      // Project name
  key: string;                       // Short identifier (e.g., "PROJ")
  description?: string;              // Project description
  status: 'active' | 'archived' | 'draft';
  visibility: 'public' | 'private' | 'organization';
  ownerId: string;                   // Owner user ID
  organizationId?: string;           // Organization ID
  metadata?: Record<string, any>;    // Custom metadata
}
```

### 5.4 Issue Entity

```typescript
interface Issue extends Entity {
  projectId: string;                 // Parent project ID
  key: string;                       // Issue key (e.g., "PROJ-123")
  title: string;                     // Issue title
  description?: string;              // Issue description
  type: 'bug' | 'feature' | 'task' | 'epic' | 'story';
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;               // Assigned user ID
  reporterId: string;                // Reporter user ID
  parentId?: string;                 // Parent issue ID (for subtasks)
  sprintId?: string;                 // Current sprint ID
  labels?: string[];                 // Issue labels
  estimate?: number;                 // Effort estimate (points/hours)
  timeSpent?: number;                // Time spent (hours)
  dueDate?: Date;                    // Due date
  attachments?: Attachment[];        // File attachments
  comments?: Comment[];              // Issue comments
  metadata?: Record<string, any>;    // Custom metadata
}
```

## 6. Error Handling

### 6.1 Error Response Format

All errors MUST follow this format:

```typescript
interface ProtocolError {
  code: string;         // Machine-readable error code
  message: string;      // Human-readable message
  details?: any;        // Additional error details
  timestamp: Date;      // Error timestamp
  traceId?: string;     // Request trace ID for debugging
}
```

### 6.2 Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `AUTH_FAILED` | 401 | Authentication failed |
| `PERMISSION_DENIED` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `ALREADY_EXISTS` | 409 | Resource already exists |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMIT` | 429 | Rate limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |

## 7. Protocol Versioning

### 7.1 Version Format

The protocol follows Semantic Versioning 2.0.0:
- MAJOR: Incompatible API changes
- MINOR: Backward-compatible functionality additions
- PATCH: Backward-compatible bug fixes

### 7.2 Version Negotiation

Providers MUST:
1. Advertise their supported protocol version
2. Accept requests with compatible versions
3. Return version in response headers

```typescript
// Request header
"X-Protocol-Version": "1.0"

// Response header
"X-Protocol-Version": "1.0"
```

## 8. Extensibility

### 8.1 Custom Fields

Implementations MAY add custom fields to entities using the `metadata` field. Custom fields:
- MUST NOT conflict with standard fields
- SHOULD be prefixed with vendor identifier
- MUST be documented by the implementation

### 8.2 Custom Operations

Implementations MAY add custom operations beyond the protocol specification. Custom operations:
- MUST NOT override standard operations
- SHOULD follow protocol conventions
- MUST be clearly documented as extensions

## 9. Compliance

### 9.1 Compliance Levels

1. **Core Compliance**: Implements all required operations
2. **Full Compliance**: Implements all operations including optional ones
3. **Extended Compliance**: Adds custom extensions while maintaining core compliance

### 9.2 Certification

Implementations can be certified as protocol-compliant through:
1. Automated test suite validation
2. Manual compliance review
3. Community certification program

## 10. Security Considerations

### 10.1 Authentication

Implementations MUST:
- Support at least one authentication method
- Validate all authentication credentials
- Implement rate limiting on authentication endpoints

### 10.2 Authorization

Implementations SHOULD:
- Implement fine-grained permissions
- Support role-based access control (RBAC)
- Audit all write operations

### 10.3 Data Protection

Implementations MUST:
- Encrypt sensitive data in transit (TLS 1.2+)
- Sanitize all user inputs
- Implement CSRF protection for web interfaces

## Appendix A: Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01 | Initial specification |

## Appendix B: References

- [Model Context Protocol](https://modelcontextprotocol.io)
- [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt) - Key words for use in RFCs
- [Semantic Versioning 2.0.0](https://semver.org)
- [REST API Design](https://restfulapi.net)

## Appendix C: Contributors

This specification is developed and maintained by the Veas Protocol community. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute.

---

**Copyright © 2024 Veas Protocol Contributors. Licensed under MIT.**