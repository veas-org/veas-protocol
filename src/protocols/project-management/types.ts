/**
 * Project Management protocol type definitions
 */

import type { Entity } from '../common/index.js'

// Project types
export interface Project extends Entity {
  name: string
  key: string
  description?: string
  status: ProjectStatus
  visibility: ProjectVisibility
  ownerId: string
  organizationId?: string
  metadata?: Record<string, unknown>
}

export type ProjectStatus = 'active' | 'archived' | 'draft'
export type ProjectVisibility = 'public' | 'private' | 'organization'

export interface CreateProjectData {
  name: string
  key?: string
  description?: string
  status?: ProjectStatus
  visibility?: ProjectVisibility
  templateId?: string
  metadata?: Record<string, unknown>
}

export interface UpdateProjectData {
  name?: string
  description?: string
  status?: ProjectStatus
  visibility?: ProjectVisibility
  metadata?: Record<string, unknown>
}

// Issue types
export interface Issue extends Entity {
  projectId: string
  key: string
  title: string
  description?: string
  type: IssueType
  status: IssueStatus
  priority: IssuePriority
  assigneeId?: string
  reporterId: string
  parentId?: string
  labels?: string[]
  estimate?: number
  timeSpent?: number
  dueDate?: Date
  metadata?: Record<string, unknown>
}

export type IssueType = 'epic' | 'story' | 'task' | 'bug' | 'feature' | 'custom'
export type IssueStatus = 'todo' | 'in_progress' | 'done' | 'cancelled' | 'custom'
export type IssuePriority = 'critical' | 'high' | 'medium' | 'low'

export interface CreateIssueData {
  projectId: string
  title: string
  description?: string
  type: IssueType
  status?: IssueStatus
  priority?: IssuePriority
  assigneeId?: string
  parentId?: string
  labels?: string[]
  estimate?: number
  dueDate?: Date
  metadata?: Record<string, unknown>
}

export interface UpdateIssueData {
  title?: string
  description?: string
  type?: IssueType
  status?: IssueStatus
  priority?: IssuePriority
  assigneeId?: string
  labels?: string[]
  estimate?: number
  timeSpent?: number
  dueDate?: Date
  metadata?: Record<string, unknown>
}

// Sprint types
export interface Sprint extends Entity {
  projectId: string
  name: string
  goal?: string
  startDate: Date
  endDate: Date
  status: SprintStatus
}

export type SprintStatus = 'planned' | 'active' | 'completed' | 'cancelled'

export interface CreateSprintData {
  projectId: string
  name: string
  goal?: string
  startDate: Date
  endDate: Date
}

export interface UpdateSprintData {
  name?: string
  goal?: string
  startDate?: Date
  endDate?: Date
  status?: SprintStatus
}

// Comment types
export interface Comment extends Entity {
  issueId: string
  authorId: string
  content: string
  editedAt?: Date
}

export interface CreateCommentData {
  issueId: string
  content: string
}

export interface UpdateCommentData {
  content: string
}

// Filter types
export interface ProjectFilters {
  status?: ProjectStatus
  visibility?: ProjectVisibility
  ownerId?: string
  organizationId?: string
  search?: string
}

export interface IssueFilters {
  projectId?: string
  type?: IssueType | IssueType[]
  status?: IssueStatus | IssueStatus[]
  priority?: IssuePriority | IssuePriority[]
  assigneeId?: string
  reporterId?: string
  parentId?: string
  labels?: string[]
  search?: string
  includeSubtasks?: boolean
}
