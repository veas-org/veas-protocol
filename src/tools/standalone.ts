import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Standalone MCP tools for offline mode or testing
 */
export const standaloneTools: Tool[] = [
  {
    name: 'mcp_get_user_info',
    description: 'Get information about the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'mcp-project-manager_list_my_projects',
    description: 'List all projects accessible to the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of projects to return',
          default: 10,
        },
        offset: {
          type: 'number',
          description: 'Number of projects to skip',
          default: 0,
        },
      },
      required: [],
    },
  },
  {
    name: 'mcp-project-manager_list_my_issues',
    description: 'List issues assigned to the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Filter by project ID',
        },
        status: {
          type: 'string',
          description: 'Filter by issue status',
          enum: ['todo', 'in_progress', 'done', 'cancelled'],
        },
        limit: {
          type: 'number',
          description: 'Maximum number of issues to return',
          default: 10,
        },
        offset: {
          type: 'number',
          description: 'Number of issues to skip',
          default: 0,
        },
      },
      required: [],
    },
  },
  {
    name: 'mcp-project-manager_create_issue',
    description: 'Create a new issue in a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The project ID to create the issue in',
        },
        summary: {
          type: 'string',
          description: 'Brief summary of the issue',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the issue',
        },
        issue_type: {
          type: 'string',
          description: 'Type of issue',
          enum: ['task', 'bug', 'story', 'epic'],
          default: 'task',
        },
        priority: {
          type: 'string',
          description: 'Priority of the issue',
          enum: ['low', 'medium', 'high', 'urgent'],
          default: 'medium',
        },
        assignee_id: {
          type: 'string',
          description: 'User ID to assign the issue to',
        },
      },
      required: ['project_id', 'summary'],
    },
  },
  {
    name: 'mcp-articles_list_articles',
    description: 'List articles in the knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'Filter by folder ID',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of articles to return',
          default: 10,
        },
        offset: {
          type: 'number',
          description: 'Number of articles to skip',
          default: 0,
        },
      },
      required: [],
    },
  },
  {
    name: 'mcp-chat_send_message',
    description: 'Send a message to a chat channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: {
          type: 'string',
          description: 'The channel ID to send the message to',
        },
        content: {
          type: 'string',
          description: 'The message content',
        },
      },
      required: ['channel_id', 'content'],
    },
  },
  {
    name: 'mcp-project-manager_get_project',
    description: 'Get detailed information about a specific project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The project ID',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'mcp-project-manager_update_issue',
    description: 'Update an existing issue',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: {
          type: 'string',
          description: 'The issue ID to update',
        },
        summary: {
          type: 'string',
          description: 'New summary for the issue',
        },
        description: {
          type: 'string',
          description: 'New description for the issue',
        },
        status: {
          type: 'string',
          description: 'New status for the issue',
          enum: ['todo', 'in_progress', 'done', 'cancelled'],
        },
        priority: {
          type: 'string',
          description: 'New priority for the issue',
          enum: ['low', 'medium', 'high', 'urgent'],
        },
      },
      required: ['issue_id'],
    },
  },
  {
    name: 'mcp-articles_create_article',
    description: 'Create a new article in the knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the article',
        },
        content: {
          type: 'string',
          description: 'Content of the article (Markdown supported)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for the article',
        },
        folder_id: {
          type: 'string',
          description: 'Folder ID to place the article in',
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'mcp-project-manager_create_sprint',
    description: 'Create a new sprint in a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'The project ID',
        },
        name: {
          type: 'string',
          description: 'Name of the sprint',
        },
        goal: {
          type: 'string',
          description: 'Goal of the sprint',
        },
        start_date: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        end_date: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
      },
      required: ['project_id', 'name', 'start_date', 'end_date'],
    },
  },
];

/**
 * Execute a standalone tool (mock implementation)
 */
export async function executeStandaloneTool(name: string, args: any): Promise<any> {
  // Mock implementations for testing
  switch (name) {
    case 'mcp_get_user_info':
      return {
        user: {
          id: '1c2a49a3-e736-49b7-9abe-c8079c343c59',
          email: 'test@local.dev',
          name: 'Test User',
          organizations: ['Startup'],
        },
      };

    case 'mcp-project-manager_list_my_projects':
      return {
        projects: [
          {
            id: 'proj_1',
            name: 'Web Platform',
            key: 'WEB',
            description: 'Main web application platform',
          },
          {
            id: 'proj_2',
            name: 'Mobile App',
            key: 'MOB',
            description: 'Mobile application for iOS and Android',
          },
        ],
        total: 2,
      };

    case 'mcp-project-manager_list_my_issues':
      return {
        issues: [
          {
            id: 'issue_1',
            project_id: 'proj_1',
            summary: 'Implement user authentication',
            status: 'in_progress',
            priority: 'high',
            assignee: {
              id: '1c2a49a3-e736-49b7-9abe-c8079c343c59',
              name: 'Test User',
            },
          },
          {
            id: 'issue_2',
            project_id: 'proj_1',
            summary: 'Fix login redirect bug',
            status: 'todo',
            priority: 'medium',
            assignee: {
              id: '1c2a49a3-e736-49b7-9abe-c8079c343c59',
              name: 'Test User',
            },
          },
        ],
        total: 2,
      };

    case 'mcp-project-manager_get_project':
      return {
        project: {
          id: args.project_id || 'proj_1',
          name: 'Web Platform',
          key: 'WEB',
          description: 'Main web application platform',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
          organization_id: 'org_1',
          settings: {
            features: {
              sprints: true,
              epics: true,
              timeTracking: false,
            },
          },
        },
      };

    case 'mcp-project-manager_update_issue':
      return {
        issue: {
          id: args.issue_id,
          summary: args.summary || 'Updated issue',
          description: args.description || 'Updated description',
          status: args.status || 'in_progress',
          priority: args.priority || 'medium',
          updated_at: new Date().toISOString(),
        },
        success: true,
      };

    case 'mcp-project-manager_create_issue':
      return {
        issue: {
          id: `issue_${Date.now()}`,
          project_id: args.project_id,
          summary: args.summary,
          description: args.description || '',
          issue_type: args.issue_type || 'task',
          priority: args.priority || 'medium',
          status: 'todo',
          created_at: new Date().toISOString(),
          assignee: args.assignee_id ? {
            id: args.assignee_id,
            name: 'Assigned User',
          } : null,
        },
        success: true,
      };

    case 'mcp-articles_create_article':
      return {
        article: {
          id: `article_${Date.now()}`,
          title: args.title,
          content: args.content,
          tags: args.tags || [],
          folder_id: args.folder_id || null,
          created_at: new Date().toISOString(),
          author: {
            id: '1c2a49a3-e736-49b7-9abe-c8079c343c59',
            name: 'Test User',
          },
        },
        success: true,
      };

    case 'mcp-project-manager_create_sprint':
      return {
        sprint: {
          id: `sprint_${Date.now()}`,
          project_id: args.project_id,
          name: args.name,
          goal: args.goal || '',
          start_date: args.start_date,
          end_date: args.end_date,
          status: 'planned',
          created_at: new Date().toISOString(),
        },
        success: true,
      };

    case 'mcp-chat_send_message':
      return {
        message: {
          id: `msg_${Date.now()}`,
          channel_id: args.channel_id,
          content: args.content,
          author: {
            id: '1c2a49a3-e736-49b7-9abe-c8079c343c59',
            name: 'Test User',
          },
          created_at: new Date().toISOString(),
        },
        success: true,
      };

    default:
      throw new Error(`Tool not implemented: ${name}`);
  }
}
