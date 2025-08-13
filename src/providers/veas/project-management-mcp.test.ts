import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VeasProjectManagementMCPProvider } from './project-management-mcp.js'
import { NotFoundError } from '../../protocols/common/index.js'

describe('VeasProjectManagementMCPProvider', () => {
  let provider: VeasProjectManagementMCPProvider
  let mockCallMCPTool: ReturnType<typeof vi.fn>
  let mockRequireScopes: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockCallMCPTool = vi.fn()
    mockRequireScopes = vi.fn()
    
    provider = new VeasProjectManagementMCPProvider({
      mcpEndpoint: 'http://test'
    })
    
    // Mock the protected methods
    ;(provider as any).callMCPTool = mockCallMCPTool
    ;(provider as any).requireScopes = mockRequireScopes
  })

  describe('Project operations', () => {
    it('should list projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1' },
        { id: '2', name: 'Project 2' }
      ]
      mockCallMCPTool.mockResolvedValue({
        projects: mockProjects,
        total: 2,
        hasMore: false
      })

      const result = await provider.listProjects({
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        filters: { status: 'active' }
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_list_my_projects', {
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        output_format: 'json',
        filters: { status: 'active' }
      })
      expect(result).toEqual({
        items: mockProjects,
        total: 2,
        hasMore: false
      })
    })

    it('should handle empty project list', async () => {
      mockCallMCPTool.mockResolvedValue({
        total: 0,
        hasMore: false
      })

      const result = await provider.listProjects({
        limit: 10,
        outputFormat: 'json'
      })

      expect(result).toEqual({
        items: [],
        total: 0,
        hasMore: false
      })
    })

    it('should get a project by id', async () => {
      const mockProject = { id: '1', name: 'Test Project' }
      mockCallMCPTool.mockResolvedValue({ project: mockProject })

      const result = await provider.getProject('1', { outputFormat: 'markdown' })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_get_project', {
        id: '1',
        output_format: 'markdown'
      })
      expect(result).toEqual(mockProject)
    })

    it('should throw NotFoundError when project not found', async () => {
      mockCallMCPTool.mockResolvedValue(null)

      await expect(provider.getProject('nonexistent')).rejects.toThrow(
        new NotFoundError('Project', 'nonexistent')
      )
    })

    it('should throw NotFoundError when project property missing', async () => {
      mockCallMCPTool.mockResolvedValue({})

      await expect(provider.getProject('nonexistent')).rejects.toThrow(
        new NotFoundError('Project', 'nonexistent')
      )
    })

    it('should create a project', async () => {
      const mockProject = { id: '1', name: 'New Project' }
      mockCallMCPTool.mockResolvedValue({ project: mockProject })

      const result = await provider.createProject({
        name: 'New Project',
        description: 'Test project',
        key: 'NP'
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_create_project', {
        name: 'New Project',
        description: 'Test project',
        key: 'NP'
      })
      expect(result).toEqual(mockProject)
    })

    it('should update a project', async () => {
      const mockProject = { id: '1', name: 'Updated Project' }
      mockCallMCPTool.mockResolvedValue({ project: mockProject })

      const result = await provider.updateProject('1', {
        name: 'Updated Project',
        description: 'Updated description'
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_update_project', {
        id: '1',
        name: 'Updated Project',
        description: 'Updated description'
      })
      expect(result).toEqual(mockProject)
    })

    it('should delete a project', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.deleteProject('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_delete_project', { id: '1' })
    })
  })

  describe('Issue operations', () => {
    it('should list issues', async () => {
      const mockIssues = [
        { id: '1', title: 'Issue 1' },
        { id: '2', title: 'Issue 2' }
      ]
      mockCallMCPTool.mockResolvedValue({
        issues: mockIssues,
        total: 2,
        hasMore: false
      })

      const result = await provider.listIssues({
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        filters: { status: 'open', projectId: 'proj-1' }
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_list_issues', {
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        output_format: 'json',
        filters: { status: 'open', projectId: 'proj-1' }
      })
      expect(result).toEqual({
        items: mockIssues,
        total: 2,
        hasMore: false
      })
    })

    it('should handle empty issue list', async () => {
      mockCallMCPTool.mockResolvedValue({
        total: 0,
        hasMore: false
      })

      const result = await provider.listIssues({
        limit: 10,
        outputFormat: 'json'
      })

      expect(result).toEqual({
        items: [],
        total: 0,
        hasMore: false
      })
    })

    it('should get an issue by id', async () => {
      const mockIssue = { id: '1', title: 'Test Issue' }
      mockCallMCPTool.mockResolvedValue({ issue: mockIssue })

      const result = await provider.getIssue('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_get_issue', {
        id: '1',
        output_format: undefined
      })
      expect(result).toEqual(mockIssue)
    })

    it('should throw NotFoundError when issue not found', async () => {
      mockCallMCPTool.mockResolvedValue(null)

      await expect(provider.getIssue('nonexistent')).rejects.toThrow(
        new NotFoundError('Issue', 'nonexistent')
      )
    })

    it('should create an issue', async () => {
      const mockIssue = { id: '1', title: 'New Issue' }
      mockCallMCPTool.mockResolvedValue({ issue: mockIssue })

      const result = await provider.createIssue({
        projectId: 'proj-1',
        title: 'New Issue',
        description: 'Issue description',
        type: 'bug'
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_create_issue', {
        projectId: 'proj-1',
        title: 'New Issue',
        description: 'Issue description',
        type: 'bug'
      })
      expect(result).toEqual(mockIssue)
    })

    it('should update an issue', async () => {
      const mockIssue = { id: '1', title: 'Updated Issue' }
      mockCallMCPTool.mockResolvedValue({ issue: mockIssue })

      const result = await provider.updateIssue('1', {
        title: 'Updated Issue',
        status: 'in_progress'
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_update_issue', {
        id: '1',
        title: 'Updated Issue',
        status: 'in_progress'
      })
      expect(result).toEqual(mockIssue)
    })

    it('should delete an issue', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.deleteIssue('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_delete_issue', { id: '1' })
    })
  })

  describe('Sprint operations', () => {
    it('should list sprints', async () => {
      const mockSprints = [
        { id: '1', name: 'Sprint 1' },
        { id: '2', name: 'Sprint 2' }
      ]
      mockCallMCPTool.mockResolvedValue({
        sprints: mockSprints,
        total: 2,
        hasMore: false
      })

      const result = await provider.listSprints('proj-1', {
        limit: 10,
        offset: 0,
        outputFormat: 'json'
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_list_sprints', {
        project_id: 'proj-1',
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        output_format: 'json'
      })
      expect(result).toEqual({
        items: mockSprints,
        total: 2,
        hasMore: false
      })
    })

    it('should handle empty sprint list', async () => {
      mockCallMCPTool.mockResolvedValue({
        total: 0,
        hasMore: false
      })

      const result = await provider.listSprints('proj-1')

      expect(result).toEqual({
        items: [],
        total: 0,
        hasMore: false
      })
    })

    it('should get a sprint by id', async () => {
      const mockSprint = { id: '1', name: 'Test Sprint' }
      mockCallMCPTool.mockResolvedValue({ sprint: mockSprint })

      const result = await provider.getSprint('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_get_sprint', {
        id: '1',
        output_format: undefined
      })
      expect(result).toEqual(mockSprint)
    })

    it('should throw NotFoundError when sprint not found', async () => {
      mockCallMCPTool.mockResolvedValue({})

      await expect(provider.getSprint('nonexistent')).rejects.toThrow(
        new NotFoundError('Sprint', 'nonexistent')
      )
    })

    it('should create a sprint', async () => {
      const mockSprint = { id: '1', name: 'New Sprint' }
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-14')
      
      mockCallMCPTool.mockResolvedValue({ sprint: mockSprint })

      const result = await provider.createSprint({
        projectId: 'proj-1',
        name: 'New Sprint',
        goal: 'Sprint goal',
        startDate,
        endDate
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_create_sprint', {
        project_id: 'proj-1',
        name: 'New Sprint',
        goal: 'Sprint goal',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
      expect(result).toEqual(mockSprint)
    })

    it('should update a sprint', async () => {
      const mockSprint = { id: '1', name: 'Updated Sprint' }
      const newEndDate = new Date('2024-01-21')
      
      mockCallMCPTool.mockResolvedValue({ sprint: mockSprint })

      const result = await provider.updateSprint('1', {
        name: 'Updated Sprint',
        endDate: newEndDate
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_update_sprint', {
        id: '1',
        name: 'Updated Sprint',
        endDate: newEndDate,
        start_date: undefined,
        end_date: newEndDate.toISOString()
      })
      expect(result).toEqual(mockSprint)
    })

    it('should update sprint with both dates', async () => {
      const mockSprint = { id: '1', name: 'Updated Sprint' }
      const startDate = new Date('2024-02-01')
      const endDate = new Date('2024-02-14')
      
      mockCallMCPTool.mockResolvedValue({ sprint: mockSprint })

      const result = await provider.updateSprint('1', {
        startDate,
        endDate
      })

      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_update_sprint', {
        id: '1',
        startDate,
        endDate,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      })
      expect(result).toEqual(mockSprint)
    })

    it('should delete a sprint', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.deleteSprint('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_delete_sprint', { id: '1' })
    })
  })

  describe('Comment operations', () => {
    it('should list comments', async () => {
      const mockComments = [
        { id: '1', content: 'Comment 1' },
        { id: '2', content: 'Comment 2' }
      ]
      mockCallMCPTool.mockResolvedValue({
        comments: mockComments,
        total: 2,
        hasMore: false
      })

      const result = await provider.listComments('issue-1', {
        limit: 10,
        offset: 0,
        outputFormat: 'json'
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_list_comments', {
        issue_id: 'issue-1',
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        output_format: 'json'
      })
      expect(result).toEqual({
        items: mockComments,
        total: 2,
        hasMore: false
      })
    })

    it('should handle empty comment list', async () => {
      mockCallMCPTool.mockResolvedValue({
        total: 0,
        hasMore: false
      })

      const result = await provider.listComments('issue-1')

      expect(result).toEqual({
        items: [],
        total: 0,
        hasMore: false
      })
    })

    it('should create a comment', async () => {
      const mockComment = { id: '1', content: 'New comment' }
      mockCallMCPTool.mockResolvedValue({ comment: mockComment })

      const result = await provider.createComment({
        issueId: 'issue-1',
        content: 'New comment'
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_comment_issue', {
        issue_id: 'issue-1',
        content: 'New comment'
      })
      expect(result).toEqual(mockComment)
    })

    it('should update a comment', async () => {
      const mockComment = { id: '1', content: 'Updated comment' }
      mockCallMCPTool.mockResolvedValue({ comment: mockComment })

      const result = await provider.updateComment('1', {
        content: 'Updated comment'
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_update_comment', {
        id: '1',
        content: 'Updated comment'
      })
      expect(result).toEqual(mockComment)
    })

    it('should delete a comment', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.deleteComment('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_delete_comment', { id: '1' })
    })
  })

  describe('Bulk operations', () => {
    it('should bulk update issues', async () => {
      const mockIssues = [
        { id: '1', title: 'Updated 1' },
        { id: '2', title: 'Updated 2' }
      ]
      mockCallMCPTool.mockResolvedValue({ issues: mockIssues })

      const result = await provider.bulkUpdateIssues?.([
        { id: '1', data: { title: 'Updated 1' } },
        { id: '2', data: { title: 'Updated 2' } }
      ])

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_bulk_update_issues', {
        updates: [
          { id: '1', data: { title: 'Updated 1' } },
          { id: '2', data: { title: 'Updated 2' } }
        ]
      })
      expect(result).toEqual(mockIssues)
    })

    it('should handle empty bulk update result', async () => {
      mockCallMCPTool.mockResolvedValue({})

      const result = await provider.bulkUpdateIssues?.([
        { id: '1', data: { title: 'Updated 1' } }
      ])

      expect(result).toEqual([])
    })

    it('should move issues to sprint', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.moveIssuesToSprint?.(['issue-1', 'issue-2'], 'sprint-1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_move_issues_to_sprint', {
        issue_ids: ['issue-1', 'issue-2'],
        sprint_id: 'sprint-1'
      })
    })
  })

  describe('Search operations', () => {
    it('should search projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Search Result 1' }
      ]
      mockCallMCPTool.mockResolvedValue({
        projects: mockProjects,
        total: 1,
        hasMore: false
      })

      const result = await provider.searchProjects?.('test query', {
        limit: 10,
        outputFormat: 'json'
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_search_projects', {
        query: 'test query',
        limit: 10,
        outputFormat: 'json',
        output_format: 'json'
      })
      expect(result).toEqual({
        items: mockProjects,
        total: 1,
        hasMore: false
      })
    })

    it('should handle empty search results', async () => {
      mockCallMCPTool.mockResolvedValue({
        total: 0,
        hasMore: false
      })

      const result = await provider.searchProjects?.('nonexistent')

      expect(result).toEqual({
        items: [],
        total: 0,
        hasMore: false
      })
    })

    it('should search issues', async () => {
      const mockIssues = [
        { id: '1', title: 'Search Issue 1' }
      ]
      mockCallMCPTool.mockResolvedValue({
        issues: mockIssues,
        total: 1,
        hasMore: false
      })

      const result = await provider.searchIssues?.('bug', {
        limit: 10,
        outputFormat: 'json',
        filters: { status: 'open' }
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['projects:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-project-manager_search_issues', {
        query: 'bug',
        limit: 10,
        outputFormat: 'json',
        output_format: 'json',
        filters: { status: 'open' }
      })
      expect(result).toEqual({
        items: mockIssues,
        total: 1,
        hasMore: false
      })
    })
  })
})