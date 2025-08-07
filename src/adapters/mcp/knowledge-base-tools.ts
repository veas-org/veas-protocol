/**
 * MCP tools for Knowledge Base protocol
 */

import type { KnowledgeBaseProtocol } from '../../protocols/knowledge-base'
import type { AuthContext } from '../../protocols/common'
import type { MCPTool } from './types'
import { createToolName, formatMCPResponse, formatMCPError, getOutputFormat } from './utils'

export function createKnowledgeBaseTools(
  protocol: KnowledgeBaseProtocol,
  toolPrefix: string,
  getAuthContext: () => AuthContext | null, // Reserved for future context-aware operations
): MCPTool[] {
  const domain = 'articles'
  // Validate auth context is available
  const hasAuth = !!getAuthContext
  if (!hasAuth) {
    console.warn('Knowledge base tools created without auth context provider')
  }
  
  return [
    // Article tools
    {
      name: createToolName(toolPrefix, domain, 'list_articles'),
      description: 'List articles with optional filtering',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          offset: { type: 'number' },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
          filters: {
            type: 'object',
            properties: {
              publicationId: { type: 'string' },
              folderId: { type: 'string' },
              status: {
                oneOf: [
                  { type: 'string', enum: ['draft', 'published', 'archived'] },
                  { type: 'array', items: { type: 'string', enum: ['draft', 'published', 'archived'] } },
                ],
              },
              authorId: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              search: { type: 'string' },
            },
          },
          outputFormat: { type: 'string', enum: ['json', 'markdown'] },
        },
      },
      handler: async (params) => {
        try {
          // Auth context available via getAuthContext() for future use
          const result = await protocol.listArticles(params)
          return formatMCPResponse(result, getOutputFormat(params))
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    {
      name: createToolName(toolPrefix, domain, 'get_article'),
      description: 'Get an article by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Article ID' },
          outputFormat: { type: 'string', enum: ['json', 'markdown'] },
        },
        required: ['id'],
      },
      handler: async (params) => {
        try {
          const result = await protocol.getArticle(params.id, params)
          return formatMCPResponse(result, getOutputFormat(params))
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    {
      name: createToolName(toolPrefix, domain, 'create_article'),
      description: 'Create a new article',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          excerpt: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          publicationId: { type: 'string' },
          folderId: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'content'],
      },
      handler: async (params) => {
        try {
          const result = await protocol.createArticle(params)
          return formatMCPResponse(result, 'json')
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    {
      name: createToolName(toolPrefix, domain, 'update_article'),
      description: 'Update an existing article',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          excerpt: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          folderId: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['id'],
      },
      handler: async (params) => {
        try {
          const { id, ...data } = params
          const result = await protocol.updateArticle(id, data)
          return formatMCPResponse(result, 'json')
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    {
      name: createToolName(toolPrefix, domain, 'search_articles'),
      description: 'Search for articles',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number' },
          offset: { type: 'number' },
          filters: {
            type: 'object',
            properties: {
              publicationId: { type: 'string' },
              status: { type: 'string', enum: ['draft', 'published', 'archived'] },
              authorId: { type: 'string' },
            },
          },
          outputFormat: { type: 'string', enum: ['json', 'markdown'] },
        },
        required: ['query'],
      },
      handler: async (params) => {
        try {
          const { query, ...listParams } = params
          const result = await protocol.searchArticles(query, listParams)
          return formatMCPResponse(result, getOutputFormat(params))
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    // Folder tools
    {
      name: createToolName(toolPrefix, domain, 'list_folders'),
      description: 'List folders',
      inputSchema: {
        type: 'object',
        properties: {
          filters: {
            type: 'object',
            properties: {
              publicationId: { type: 'string' },
              parentId: { type: 'string' },
              search: { type: 'string' },
            },
          },
          outputFormat: { type: 'string', enum: ['json', 'markdown'] },
        },
      },
      handler: async (params) => {
        try {
          const result = await protocol.listFolders(params)
          return formatMCPResponse(result, getOutputFormat(params))
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    {
      name: createToolName(toolPrefix, domain, 'create_folder'),
      description: 'Create a new folder',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          parentId: { type: 'string' },
          publicationId: { type: 'string' },
        },
        required: ['name'],
      },
      handler: async (params) => {
        try {
          const result = await protocol.createFolder(params)
          return formatMCPResponse(result, 'json')
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    // Tag tools
    {
      name: createToolName(toolPrefix, domain, 'list_tags'),
      description: 'List tags',
      inputSchema: {
        type: 'object',
        properties: {
          filters: {
            type: 'object',
            properties: {
              publicationId: { type: 'string' },
              search: { type: 'string' },
              minArticleCount: { type: 'number' },
            },
          },
          outputFormat: { type: 'string', enum: ['json', 'markdown'] },
        },
      },
      handler: async (params) => {
        try {
          const result = await protocol.listTags(params)
          return formatMCPResponse(result, getOutputFormat(params))
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    {
      name: createToolName(toolPrefix, domain, 'create_tag'),
      description: 'Create a new tag',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          publicationId: { type: 'string' },
        },
        required: ['name'],
      },
      handler: async (params) => {
        try {
          const result = await protocol.createTag(params)
          return formatMCPResponse(result, 'json')
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
  ]
}