/**
 * Mock project management implementation for testing
 */

import type {
  ProjectManagementProtocol,
  Project,
  CreateProjectData,
  UpdateProjectData,
  Issue,
  CreateIssueData,
  UpdateIssueData,
  Sprint,
  CreateSprintData,
  UpdateSprintData,
  Comment,
  CreateCommentData,
  UpdateCommentData,
} from '../../src'
import type { ListParams, ListResponse } from '../../src'
import { NotFoundError } from '../../src'
import {
  mockProject,
  mockIssue,
  mockSprint,
  mockComment,
  mockListResponse,
} from './mock-data'

export function createMockProjectManagement(): ProjectManagementProtocol {
  const projects = new Map<string, Project>()
  const issues = new Map<string, Issue>()
  const sprints = new Map<string, Sprint>()
  const comments = new Map<string, Comment>()
  
  // Add some initial data
  projects.set('1', mockProject())
  issues.set('1', mockIssue())
  sprints.set('1', mockSprint())
  comments.set('1', mockComment())
  
  let nextId = 2
  
  return {
    // Project operations
    async listProjects(params) {
      const allProjects = Array.from(projects.values())
      const start = params.offset || 0
      const limit = params.limit || 10
      const items = allProjects.slice(start, start + limit)
      
      return mockListResponse(items, allProjects.length)
    },
    
    async getProject(id) {
      const project = projects.get(id)
      if (!project) {
        throw new NotFoundError(`Project with id '${id}' not found`, { resource: 'Project', id })
      }
      return project
    },
    
    async createProject(data) {
      const id = String(nextId++)
      const project: Project = {
        ...mockProject({ id }),
        ...data,
        key: data.key || `PROJ-${id}`,
        status: data.status || 'active',
        visibility: data.visibility || 'private',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      projects.set(id, project)
      return project
    },
    
    async updateProject(id, data) {
      const project = projects.get(id)
      if (!project) {
        throw new NotFoundError(`Project with id '${id}' not found`, { resource: 'Project', id })
      }
      const updated = { ...project, ...data, updatedAt: new Date() }
      projects.set(id, updated)
      return updated
    },
    
    async deleteProject(id) {
      if (!projects.has(id)) {
        throw new NotFoundError(`Project with id '${id}' not found`, { resource: 'Project', id })
      }
      projects.delete(id)
    },
    
    // Issue operations
    async listIssues(params) {
      let allIssues = Array.from(issues.values())
      
      // Apply filters
      if (params.filters?.projectId) {
        allIssues = allIssues.filter(i => i.projectId === params.filters!.projectId)
      }
      if (params.filters?.type) {
        const types = Array.isArray(params.filters.type) ? params.filters.type : [params.filters.type]
        allIssues = allIssues.filter(i => types.includes(i.type))
      }
      if (params.filters?.status) {
        const statuses = Array.isArray(params.filters.status) ? params.filters.status : [params.filters.status]
        allIssues = allIssues.filter(i => statuses.includes(i.status))
      }
      
      const start = params.offset || 0
      const limit = params.limit || 10
      const items = allIssues.slice(start, start + limit)
      
      return mockListResponse(items, allIssues.length)
    },
    
    async getIssue(id) {
      const issue = issues.get(id)
      if (!issue) {
        throw new NotFoundError(`Issue with id '${id}' not found`, { resource: 'Issue', id })
      }
      return issue
    },
    
    async createIssue(data) {
      const id = String(nextId++)
      const issue: Issue = {
        ...mockIssue({ id }),
        ...data,
        key: `PROJ-${id}`,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      issues.set(id, issue)
      return issue
    },
    
    async updateIssue(id, data) {
      const issue = issues.get(id)
      if (!issue) {
        throw new NotFoundError(`Issue with id '${id}' not found`, { resource: 'Issue', id })
      }
      const updated = { ...issue, ...data, updatedAt: new Date() }
      issues.set(id, updated)
      return updated
    },
    
    async deleteIssue(id) {
      if (!issues.has(id)) {
        throw new NotFoundError(`Issue with id '${id}' not found`, { resource: 'Issue', id })
      }
      issues.delete(id)
    },
    
    // Sprint operations
    async listSprints(projectId, params) {
      const projectSprints = Array.from(sprints.values()).filter(s => s.projectId === projectId)
      const start = params?.offset || 0
      const limit = params?.limit || 10
      const items = projectSprints.slice(start, start + limit)
      
      return mockListResponse(items, projectSprints.length)
    },
    
    async getSprint(id) {
      const sprint = sprints.get(id)
      if (!sprint) {
        throw new NotFoundError(`Sprint with id '${id}' not found`, { resource: 'Sprint', id })
      }
      return sprint
    },
    
    async createSprint(data) {
      const id = String(nextId++)
      const sprint: Sprint = {
        ...mockSprint({ id }),
        ...data,
        status: 'planned',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      sprints.set(id, sprint)
      return sprint
    },
    
    async updateSprint(id, data) {
      const sprint = sprints.get(id)
      if (!sprint) {
        throw new NotFoundError(`Sprint with id '${id}' not found`, { resource: 'Sprint', id })
      }
      const updated = { ...sprint, ...data, updatedAt: new Date() }
      sprints.set(id, updated)
      return updated
    },
    
    async deleteSprint(id) {
      if (!sprints.has(id)) {
        throw new NotFoundError(`Sprint with id '${id}' not found`, { resource: 'Sprint', id })
      }
      sprints.delete(id)
    },
    
    // Comment operations
    async listComments(issueId, params) {
      const issueComments = Array.from(comments.values()).filter(c => c.issueId === issueId)
      const start = params?.offset || 0
      const limit = params?.limit || 10
      const items = issueComments.slice(start, start + limit)
      
      return mockListResponse(items, issueComments.length)
    },
    
    async createComment(data) {
      const id = String(nextId++)
      const comment: Comment = {
        ...mockComment({ id }),
        ...data,
        authorId: 'mock-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      comments.set(id, comment)
      return comment
    },
    
    async updateComment(id, data) {
      const comment = comments.get(id)
      if (!comment) {
        throw new NotFoundError(`Comment with id '${id}' not found`, { resource: 'Comment', id })
      }
      const updated = { ...comment, ...data, updatedAt: new Date(), editedAt: new Date() }
      comments.set(id, updated)
      return updated
    },
    
    async deleteComment(id) {
      if (!comments.has(id)) {
        throw new NotFoundError(`Comment with id '${id}' not found`, { resource: 'Comment', id })
      }
      comments.delete(id)
    },
    
    // Optional operations
    async searchProjects(query, params) {
      const filtered = Array.from(projects.values()).filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      )
      const start = params?.offset || 0
      const limit = params?.limit || 10
      const items = filtered.slice(start, start + limit)
      
      return mockListResponse(items, filtered.length)
    },
    
    async searchIssues(query, params) {
      const filtered = Array.from(issues.values()).filter(i =>
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.description?.toLowerCase().includes(query.toLowerCase())
      )
      const start = params?.offset || 0
      const limit = params?.limit || 10
      const items = filtered.slice(start, start + limit)
      
      return mockListResponse(items, filtered.length)
    },
  }
}