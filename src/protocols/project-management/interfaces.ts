/**
 * Project Management protocol interfaces
 */

import type { ListParams, ListResponse, OutputFormat } from '../common/index.js'
import type {
  Project,
  CreateProjectData,
  UpdateProjectData,
  ProjectFilters,
  Issue,
  CreateIssueData,
  UpdateIssueData,
  IssueFilters,
  Sprint,
  CreateSprintData,
  UpdateSprintData,
  Comment,
  CreateCommentData,
  UpdateCommentData,
} from './types.js'

export interface ProjectManagementProtocol {
  // Project operations
  listProjects(params: ListParams & { filters?: ProjectFilters } & OutputFormat): Promise<ListResponse<Project>>
  getProject(id: string, params?: OutputFormat): Promise<Project>
  createProject(data: CreateProjectData): Promise<Project>
  updateProject(id: string, data: UpdateProjectData): Promise<Project>
  deleteProject(id: string): Promise<void>

  // Issue operations
  listIssues(params: ListParams & { filters?: IssueFilters } & OutputFormat): Promise<ListResponse<Issue>>
  getIssue(id: string, params?: OutputFormat): Promise<Issue>
  createIssue(data: CreateIssueData): Promise<Issue>
  updateIssue(id: string, data: UpdateIssueData): Promise<Issue>
  deleteIssue(id: string): Promise<void>

  // Sprint operations
  listSprints(projectId: string, params?: ListParams & OutputFormat): Promise<ListResponse<Sprint>>
  getSprint(id: string, params?: OutputFormat): Promise<Sprint>
  createSprint(data: CreateSprintData): Promise<Sprint>
  updateSprint(id: string, data: UpdateSprintData): Promise<Sprint>
  deleteSprint(id: string): Promise<void>

  // Comment operations
  listComments(issueId: string, params?: ListParams & OutputFormat): Promise<ListResponse<Comment>>
  createComment(data: CreateCommentData): Promise<Comment>
  updateComment(id: string, data: UpdateCommentData): Promise<Comment>
  deleteComment(id: string): Promise<void>

  // Bulk operations (optional)
  bulkUpdateIssues?(updates: Array<{ id: string; data: UpdateIssueData }>): Promise<Issue[]>
  moveIssuesToSprint?(issueIds: string[], sprintId: string): Promise<void>

  // Search operations (optional)
  searchProjects?(query: string, params?: ListParams & OutputFormat): Promise<ListResponse<Project>>
  searchIssues?(
    query: string,
    params?: ListParams & { filters?: IssueFilters } & OutputFormat,
  ): Promise<ListResponse<Issue>>
}
