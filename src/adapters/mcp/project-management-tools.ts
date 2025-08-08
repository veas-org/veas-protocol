/**
 * MCP tools for Project Management protocol
 */

import type { ProjectManagementProtocol } from '../../protocols/project-management/index.js'
import type { AuthContext } from '../../protocols/common/index.js'
import type { MCPTool } from './types.js'
import { createToolName, formatMCPResponse, formatMCPError, getOutputFormat } from './utils.js'

export function createProjectManagementTools(
  protocol: ProjectManagementProtocol,
  toolPrefix: string,
  getAuthContext: () => AuthContext | null, // Reserved for future context-aware operations
): MCPTool[] {
  const domain = 'projects'
  // Validate auth context is available
  const hasAuth = !!getAuthContext
  if (!hasAuth) {
    console.warn('Project management tools created without auth context provider')
  }
  
  return [
    // Project tools
    {
      name: createToolName(toolPrefix, domain, 'list_projects'),
      description: 'List all projects with optional filtering',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum number of projects to return' },
          offset: { type: 'number', description: 'Number of projects to skip' },
          sortBy: { type: 'string', description: 'Field to sort by' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
          filters: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['active', 'archived', 'draft'] },
              visibility: { type: 'string', enum: ['public', 'private', 'organization'] },
              ownerId: { type: 'string' },
              organizationId: { type: 'string' },
              search: { type: 'string' },
            },
          },
          outputFormat: { type: 'string', enum: ['json', 'markdown'] },
        },
      },
      handler: async (params) => {
        try {
          // Auth context available via getAuthContext() for future use
          const result = await protocol.listProjects(params)
          return formatMCPResponse(result, getOutputFormat(params))
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    {
      name: createToolName(toolPrefix, domain, 'get_project'),
      description: 'Get a project by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Project ID' },
          outputFormat: { type: 'string', enum: ['json', 'markdown'] },
        },
        required: ['id'],
      },
      handler: async (params) => {
        try {
          const result = await protocol.getProject(params.id, params)
          return formatMCPResponse(result, getOutputFormat(params))
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    {
      name: createToolName(toolPrefix, domain, 'create_project'),
      description: 'Create a new project',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
          key: { type: 'string', description: 'Project key (uppercase letters and numbers)' },
          description: { type: 'string', description: 'Project description' },
          status: { type: 'string', enum: ['active', 'archived', 'draft'] },
          visibility: { type: 'string', enum: ['public', 'private', 'organization'] },
          templateId: { type: 'string', description: 'Template ID to use' },
        },
        required: ['name'],
      },
      handler: async (params) => {
        try {
          const result = await protocol.createProject(params)
          return formatMCPResponse(result, 'json')
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    // Issue tools
    {
      name: createToolName(toolPrefix, domain, 'list_issues'),
      description: 'List issues with optional filtering',
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
              projectId: { type: 'string' },
              type: { 
                oneOf: [
                  { type: 'string', enum: ['epic', 'story', 'task', 'bug', 'feature', 'custom'] },
                  { type: 'array', items: { type: 'string', enum: ['epic', 'story', 'task', 'bug', 'feature', 'custom'] } },
                ],
              },
              status: {
                oneOf: [
                  { type: 'string', enum: ['todo', 'in_progress', 'done', 'cancelled', 'custom'] },
                  { type: 'array', items: { type: 'string', enum: ['todo', 'in_progress', 'done', 'cancelled', 'custom'] } },
                ],
              },
              priority: {
                oneOf: [
                  { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  { type: 'array', items: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] } },
                ],
              },
              assigneeId: { type: 'string' },
              reporterId: { type: 'string' },
              search: { type: 'string' },
            },
          },
          outputFormat: { type: 'string', enum: ['json', 'markdown'] },
        },
      },
      handler: async (params) => {
        try {
          const result = await protocol.listIssues(params)
          return formatMCPResponse(result, getOutputFormat(params))
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    {
      name: createToolName(toolPrefix, domain, 'create_issue'),
      description: 'Create a new issue',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          title: { type: 'string', description: 'Issue title' },
          description: { type: 'string', description: 'Issue description' },
          type: { type: 'string', enum: ['epic', 'story', 'task', 'bug', 'feature', 'custom'] },
          status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'cancelled', 'custom'] },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          assigneeId: { type: 'string' },
          labels: { type: 'array', items: { type: 'string' } },
        },
        required: ['projectId', 'title', 'type'],
      },
      handler: async (params) => {
        try {
          const result = await protocol.createIssue(params)
          return formatMCPResponse(result, 'json')
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    // Sprint tools
    {
      name: createToolName(toolPrefix, domain, 'list_sprints'),
      description: 'List sprints for a project',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          limit: { type: 'number' },
          offset: { type: 'number' },
          outputFormat: { type: 'string', enum: ['json', 'markdown'] },
        },
        required: ['projectId'],
      },
      handler: async (params) => {
        try {
          const { projectId, ...listParams } = params
          const result = await protocol.listSprints(projectId, listParams)
          return formatMCPResponse(result, getOutputFormat(params))
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    {
      name: createToolName(toolPrefix, domain, 'create_sprint'),
      description: 'Create a new sprint',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          name: { type: 'string', description: 'Sprint name' },
          goal: { type: 'string', description: 'Sprint goal' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
        },
        required: ['projectId', 'name', 'startDate', 'endDate'],
      },
      handler: async (params) => {
        try {
          const data = {
            ...params,
            startDate: new Date(params.startDate),
            endDate: new Date(params.endDate),
          }
          const result = await protocol.createSprint(data)
          return formatMCPResponse(result, 'json')
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
    
    // Comment tools
    {
      name: createToolName(toolPrefix, domain, 'add_comment'),
      description: 'Add a comment to an issue',
      inputSchema: {
        type: 'object',
        properties: {
          issueId: { type: 'string', description: 'Issue ID' },
          content: { type: 'string', description: 'Comment content' },
        },
        required: ['issueId', 'content'],
      },
      handler: async (params) => {
        try {
          const result = await protocol.createComment(params)
          return formatMCPResponse(result, 'json')
        } catch (error) {
          return formatMCPError(error)
        }
      },
    },
  ]
}