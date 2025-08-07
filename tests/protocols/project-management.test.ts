/**
 * Tests for Project Management Protocol interface
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { ProjectManagementProtocol } from '../../src'
import { NotFoundError } from '../../src'
import { createMockProjectManagement } from '../utils/mock-project-management'

describe('ProjectManagementProtocol', () => {
  let protocol: ProjectManagementProtocol
  
  beforeEach(() => {
    protocol = createMockProjectManagement()
  })
  
  describe('Project Operations', () => {
    it('should list projects with pagination', async () => {
      const result = await protocol.listProjects({ limit: 10, offset: 0 })
      
      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('hasMore')
      expect(result.items).toBeInstanceOf(Array)
      expect(result.items.length).toBeLessThanOrEqual(10)
    })
    
    it('should get a project by ID', async () => {
      const project = await protocol.getProject('1')
      
      expect(project).toHaveProperty('id', '1')
      expect(project).toHaveProperty('name')
      expect(project).toHaveProperty('key')
      expect(project).toHaveProperty('status')
      expect(project).toHaveProperty('createdAt')
      expect(project).toHaveProperty('updatedAt')
    })
    
    it('should throw NotFoundError for non-existent project', async () => {
      await expect(protocol.getProject('999')).rejects.toThrow(NotFoundError)
    })
    
    it('should create a new project', async () => {
      const data = {
        name: 'New Project',
        description: 'Test project creation',
      }
      
      const project = await protocol.createProject(data)
      
      expect(project).toHaveProperty('id')
      expect(project.name).toBe(data.name)
      expect(project.description).toBe(data.description)
      expect(project.status).toBe('active')
      expect(project.visibility).toBe('private')
    })
    
    it('should update a project', async () => {
      const updates = {
        name: 'Updated Project',
        status: 'archived' as const,
      }
      
      const project = await protocol.updateProject('1', updates)
      
      expect(project.id).toBe('1')
      expect(project.name).toBe(updates.name)
      expect(project.status).toBe(updates.status)
    })
    
    it('should delete a project', async () => {
      await expect(protocol.deleteProject('1')).resolves.toBeUndefined()
      await expect(protocol.getProject('1')).rejects.toThrow(NotFoundError)
    })
    
    it('should search projects if implemented', async () => {
      if (protocol.searchProjects) {
        const result = await protocol.searchProjects('test')
        
        expect(result).toHaveProperty('items')
        expect(result.items).toBeInstanceOf(Array)
      }
    })
  })
  
  describe('Issue Operations', () => {
    it('should list issues with filters', async () => {
      // Create some issues first
      await protocol.createIssue({
        projectId: '1',
        title: 'Bug Issue',
        type: 'bug',
        status: 'todo',
      })
      
      await protocol.createIssue({
        projectId: '1',
        title: 'Feature Issue',
        type: 'feature',
        status: 'in_progress',
      })
      
      // Test filtering by type
      const bugs = await protocol.listIssues({
        filters: { type: 'bug' },
      })
      
      expect(bugs.items.every(i => i.type === 'bug')).toBe(true)
      
      // Test filtering by status
      const inProgress = await protocol.listIssues({
        filters: { status: 'in_progress' },
      })
      
      expect(inProgress.items.every(i => i.status === 'in_progress')).toBe(true)
    })
    
    it('should create an issue', async () => {
      const data = {
        projectId: '1',
        title: 'Test Issue',
        description: 'Test issue description',
        type: 'task' as const,
        priority: 'high' as const,
      }
      
      const issue = await protocol.createIssue(data)
      
      expect(issue).toHaveProperty('id')
      expect(issue.projectId).toBe(data.projectId)
      expect(issue.title).toBe(data.title)
      expect(issue.type).toBe(data.type)
      expect(issue.priority).toBe(data.priority)
      expect(issue.status).toBe('todo')
    })
    
    it('should update issue status', async () => {
      const issue = await protocol.updateIssue('1', {
        status: 'done',
      })
      
      expect(issue.id).toBe('1')
      expect(issue.status).toBe('done')
    })
    
    it('should handle bulk update if implemented', async () => {
      if (protocol.bulkUpdateIssues) {
        const updates = [
          { id: '1', data: { status: 'done' as const } },
        ]
        
        const results = await protocol.bulkUpdateIssues(updates)
        
        expect(results).toBeInstanceOf(Array)
        expect(results[0]?.status).toBe('done')
      }
    })
  })
  
  describe('Sprint Operations', () => {
    it('should list sprints for a project', async () => {
      const result = await protocol.listSprints('1')
      
      expect(result).toHaveProperty('items')
      expect(result.items).toBeInstanceOf(Array)
    })
    
    it('should create a sprint', async () => {
      const data = {
        projectId: '1',
        name: 'Sprint 2',
        goal: 'Complete feature X',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-02-14'),
      }
      
      const sprint = await protocol.createSprint(data)
      
      expect(sprint).toHaveProperty('id')
      expect(sprint.projectId).toBe(data.projectId)
      expect(sprint.name).toBe(data.name)
      expect(sprint.goal).toBe(data.goal)
      expect(sprint.status).toBe('planned')
    })
    
    it('should update sprint status', async () => {
      const sprint = await protocol.updateSprint('1', {
        status: 'active',
      })
      
      expect(sprint.id).toBe('1')
      expect(sprint.status).toBe('active')
    })
    
    it('should move issues to sprint if implemented', async () => {
      if (protocol.moveIssuesToSprint) {
        await expect(
          protocol.moveIssuesToSprint(['1'], '1')
        ).resolves.toBeUndefined()
      }
    })
  })
  
  describe('Comment Operations', () => {
    it('should list comments for an issue', async () => {
      const result = await protocol.listComments('1')
      
      expect(result).toHaveProperty('items')
      expect(result.items).toBeInstanceOf(Array)
    })
    
    it('should create a comment', async () => {
      const data = {
        issueId: '1',
        content: 'This is a test comment',
      }
      
      const comment = await protocol.createComment(data)
      
      expect(comment).toHaveProperty('id')
      expect(comment.issueId).toBe(data.issueId)
      expect(comment.content).toBe(data.content)
      expect(comment).toHaveProperty('authorId')
    })
    
    it('should update a comment', async () => {
      const comment = await protocol.updateComment('1', {
        content: 'Updated comment content',
      })
      
      expect(comment.id).toBe('1')
      expect(comment.content).toBe('Updated comment content')
      expect(comment).toHaveProperty('editedAt')
    })
    
    it('should delete a comment', async () => {
      await expect(protocol.deleteComment('1')).resolves.toBeUndefined()
    })
  })
})