/**
 * Veas MCP provider implementation for Project Management protocol
 */

import type { ListParams, ListResponse, OutputFormat } from '../../protocols/common/index.js'
import { NotFoundError } from '../../protocols/common/index.js'
import type {
  Comment,
  CreateCommentData,
  CreateIssueData,
  CreateProjectData,
  CreateSprintData,
  Issue,
  IssueFilters,
  Project,
  ProjectFilters,
  ProjectManagementProtocol,
  Sprint,
  UpdateCommentData,
  UpdateIssueData,
  UpdateProjectData,
  UpdateSprintData,
} from '../../protocols/project-management/index.js'
import { BaseMCPProvider } from './base-mcp-provider.js'

export class VeasProjectManagementMCPProvider extends BaseMCPProvider implements ProjectManagementProtocol {
  // Project operations
  async listProjects(params: ListParams & { filters?: ProjectFilters } & OutputFormat): Promise<ListResponse<Project>> {
    this.requireScopes(['projects:read'])

    const result = await this.callMCPTool<any>('mcp-project-manager_list_my_projects', {
      ...params,
      output_format: params.outputFormat,
    })

    return {
      items: result.projects || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async getProject(id: string, params?: OutputFormat): Promise<Project> {
    this.requireScopes(['projects:read'])

    const result = await this.callMCPTool<any>('mcp-project-manager_get_project', {
      id,
      output_format: params?.outputFormat,
    })

    if (!result || !result.project) {
      throw new NotFoundError('Project', id)
    }

    return result.project
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    this.requireScopes(['projects:write'])

    const result = await this.callMCPTool<any>('mcp-project-manager_create_project', data)
    return result.project
  }

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    this.requireScopes(['projects:write'])

    const result = await this.callMCPTool<any>('mcp-project-manager_update_project', {
      id,
      ...data,
    })
    return result.project
  }

  async deleteProject(id: string): Promise<void> {
    this.requireScopes(['projects:write'])

    await this.callMCPTool('mcp-project-manager_delete_project', { id })
  }

  // Issue operations
  async listIssues(params: ListParams & { filters?: IssueFilters } & OutputFormat): Promise<ListResponse<Issue>> {
    this.requireScopes(['projects:read'])

    const result = await this.callMCPTool<any>('mcp-project-manager_list_issues', {
      ...params,
      output_format: params.outputFormat,
    })

    return {
      items: result.issues || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async getIssue(id: string, params?: OutputFormat): Promise<Issue> {
    this.requireScopes(['projects:read'])

    const result = await this.callMCPTool<any>('mcp-project-manager_get_issue', {
      id,
      output_format: params?.outputFormat,
    })

    if (!result || !result.issue) {
      throw new NotFoundError('Issue', id)
    }

    return result.issue
  }

  async createIssue(data: CreateIssueData): Promise<Issue> {
    this.requireScopes(['projects:write'])

    const result = await this.callMCPTool<any>('mcp-project-manager_create_issue', data)
    return result.issue
  }

  async updateIssue(id: string, data: UpdateIssueData): Promise<Issue> {
    this.requireScopes(['projects:write'])

    const result = await this.callMCPTool<any>('mcp-project-manager_update_issue', {
      id,
      ...data,
    })
    return result.issue
  }

  async deleteIssue(id: string): Promise<void> {
    this.requireScopes(['projects:write'])

    await this.callMCPTool('mcp-project-manager_delete_issue', { id })
  }

  // Sprint operations
  async listSprints(projectId: string, params?: ListParams & OutputFormat): Promise<ListResponse<Sprint>> {
    this.requireScopes(['projects:read'])

    const result = await this.callMCPTool<any>('mcp-project-manager_list_sprints', {
      project_id: projectId,
      ...params,
      output_format: params?.outputFormat,
    })

    return {
      items: result.sprints || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async getSprint(id: string, params?: OutputFormat): Promise<Sprint> {
    this.requireScopes(['projects:read'])

    const result = await this.callMCPTool<any>('mcp-project-manager_get_sprint', {
      id,
      output_format: params?.outputFormat,
    })

    if (!result || !result.sprint) {
      throw new NotFoundError('Sprint', id)
    }

    return result.sprint
  }

  async createSprint(data: CreateSprintData): Promise<Sprint> {
    this.requireScopes(['projects:write'])

    const result = await this.callMCPTool<any>('mcp-project-manager_create_sprint', {
      project_id: data.projectId,
      name: data.name,
      goal: data.goal,
      start_date: data.startDate.toISOString(),
      end_date: data.endDate.toISOString(),
    })
    return result.sprint
  }

  async updateSprint(id: string, data: UpdateSprintData): Promise<Sprint> {
    this.requireScopes(['projects:write'])

    const result = await this.callMCPTool<any>('mcp-project-manager_update_sprint', {
      id,
      ...data,
      start_date: data.startDate?.toISOString(),
      end_date: data.endDate?.toISOString(),
    })
    return result.sprint
  }

  async deleteSprint(id: string): Promise<void> {
    this.requireScopes(['projects:write'])

    await this.callMCPTool('mcp-project-manager_delete_sprint', { id })
  }

  // Comment operations
  async listComments(issueId: string, params?: ListParams & OutputFormat): Promise<ListResponse<Comment>> {
    this.requireScopes(['projects:read'])

    const result = await this.callMCPTool<any>('mcp-project-manager_list_comments', {
      issue_id: issueId,
      ...params,
      output_format: params?.outputFormat,
    })

    return {
      items: result.comments || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async createComment(data: CreateCommentData): Promise<Comment> {
    this.requireScopes(['projects:write'])

    const result = await this.callMCPTool<any>('mcp-project-manager_comment_issue', {
      issue_id: data.issueId,
      content: data.content,
    })
    return result.comment
  }

  async updateComment(id: string, data: UpdateCommentData): Promise<Comment> {
    this.requireScopes(['projects:write'])

    const result = await this.callMCPTool<any>('mcp-project-manager_update_comment', {
      id,
      content: data.content,
    })
    return result.comment
  }

  async deleteComment(id: string): Promise<void> {
    this.requireScopes(['projects:write'])

    await this.callMCPTool('mcp-project-manager_delete_comment', { id })
  }

  // Optional bulk operations
  async bulkUpdateIssues?(updates: Array<{ id: string; data: UpdateIssueData }>): Promise<Issue[]> {
    this.requireScopes(['projects:write'])

    const result = await this.callMCPTool<any>('mcp-project-manager_bulk_update_issues', {
      updates,
    })

    return result.issues || []
  }

  async moveIssuesToSprint?(issueIds: string[], sprintId: string): Promise<void> {
    this.requireScopes(['projects:write'])

    await this.callMCPTool('mcp-project-manager_move_issues_to_sprint', {
      issue_ids: issueIds,
      sprint_id: sprintId,
    })
  }

  // Search operations
  async searchProjects?(query: string, params?: ListParams & OutputFormat): Promise<ListResponse<Project>> {
    this.requireScopes(['projects:read'])

    const result = await this.callMCPTool<any>('mcp-project-manager_search_projects', {
      query,
      ...params,
      output_format: params?.outputFormat,
    })

    return {
      items: result.projects || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async searchIssues?(
    query: string,
    params?: ListParams & { filters?: IssueFilters } & OutputFormat,
  ): Promise<ListResponse<Issue>> {
    this.requireScopes(['projects:read'])

    const result = await this.callMCPTool<any>('mcp-project-manager_search_issues', {
      query,
      ...params,
      output_format: params?.outputFormat,
    })

    return {
      items: result.issues || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }
}
