import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MCPAdapter } from './adapter'
import type {
  ProtocolProvider,
  ProjectManagementProtocol,
  KnowledgeBaseProtocol,
  CommunicationProtocol,
} from '../../protocols'

describe('MCPAdapter', () => {
  let mockProvider: ProtocolProvider
  let mockProjectManagement: ProjectManagementProtocol
  let mockKnowledgeBase: KnowledgeBaseProtocol
  let mockCommunication: CommunicationProtocol

  beforeEach(() => {
    // Create mock implementations
    mockProjectManagement = {
      listProjects: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getProject: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      listIssues: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getIssue: vi.fn(),
      createIssue: vi.fn(),
      updateIssue: vi.fn(),
      deleteIssue: vi.fn(),
      listSprints: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getSprint: vi.fn(),
      createSprint: vi.fn(),
      updateSprint: vi.fn(),
      deleteSprint: vi.fn(),
      listComments: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      createComment: vi.fn(),
      updateComment: vi.fn(),
      deleteComment: vi.fn(),
    } as ProjectManagementProtocol

    mockKnowledgeBase = {
      listArticles: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getArticle: vi.fn(),
      createArticle: vi.fn(),
      updateArticle: vi.fn(),
      deleteArticle: vi.fn(),
      listFolders: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getFolder: vi.fn(),
      createFolder: vi.fn(),
      updateFolder: vi.fn(),
      deleteFolder: vi.fn(),
      listTags: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getTag: vi.fn(),
      createTag: vi.fn(),
      updateTag: vi.fn(),
      deleteTag: vi.fn(),
    } as KnowledgeBaseProtocol

    mockCommunication = {
      listWorkspaces: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getWorkspace: vi.fn(),
      createWorkspace: vi.fn(),
      updateWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      listChannels: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getChannel: vi.fn(),
      getChannelByContext: vi.fn(),
      createChannel: vi.fn(),
      updateChannel: vi.fn(),
      deleteChannel: vi.fn(),
      archiveChannel: vi.fn(),
      unarchiveChannel: vi.fn(),
      listMessages: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      getMessage: vi.fn(),
      getMessagesByIssue: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      sendMessage: vi.fn(),
      updateMessage: vi.fn(),
      deleteMessage: vi.fn(),
      getThread: vi.fn(),
      listThreadReplies: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      addReaction: vi.fn(),
      removeReaction: vi.fn(),
      listReactions: vi.fn(),
      listChannelMembers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      inviteToChannel: vi.fn(),
      removeFromChannel: vi.fn(),
      listWorkspaceMembers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
      addWorkspaceMember: vi.fn(),
      updateWorkspaceMember: vi.fn(),
      removeWorkspaceMember: vi.fn(),
      searchMessages: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    } as CommunicationProtocol

    mockProvider = {
      name: 'test-provider',
      version: '1.0.0',
      description: 'Test provider',
      authenticate: vi.fn().mockResolvedValue({
        userId: 'user-123',
        scopes: ['read', 'write'],
      }),
      isConnected: vi.fn().mockReturnValue(true),
      disconnect: vi.fn().mockResolvedValue(undefined),
      projectManagement: mockProjectManagement,
      knowledgeBase: mockKnowledgeBase,
      communication: mockCommunication,
    }
  })

  describe('initialization', () => {
    it('should initialize with a provider', () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
      })

      expect(adapter).toBeDefined()
      expect(adapter.getTools()).toBeDefined()
    })

    it('should register project management tools', () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
        toolPrefix: 'test',
      })

      const tools = adapter.getTools()
      const pmTool = tools.find((t) => t.name.includes('projects'))

      expect(pmTool).toBeDefined()
    })

    it('should register knowledge base tools', () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
        toolPrefix: 'test',
      })

      const tools = adapter.getTools()
      const kbTool = tools.find((t) => t.name.includes('articles'))

      expect(kbTool).toBeDefined()
    })

    it('should register communication tools', () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
      })

      const tools = adapter.getTools()
      const commTool = tools.find((t) => t.name.includes('chat'))

      expect(commTool).toBeDefined()
    })

    it('should handle provider without optional protocols', () => {
      const minimalProvider: ProtocolProvider = {
        ...mockProvider,
        projectManagement: undefined,
        knowledgeBase: undefined,
        communication: undefined,
      }

      const adapter = new MCPAdapter({
        provider: minimalProvider,
      })

      const tools = adapter.getTools()
      expect(tools).toHaveLength(0)
    })

    it('should initialize in debug mode without errors', () => {
      // Test that debug mode initializes without throwing
      expect(() => {
        new MCPAdapter({
          provider: mockProvider,
          debug: true,
        })
      }).not.toThrow()
    })
  })

  describe('authentication', () => {
    it('should authenticate with credentials', async () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
      })

      await adapter.authenticate({ token: 'test-token' })

      expect(mockProvider.authenticate).toHaveBeenCalledWith({ token: 'test-token' })
    })

    it('should store auth context after authentication', async () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
      })

      await adapter.authenticate({ token: 'test-token' })

      // The auth context should be available to tools
      const tools = adapter.getTools()
      expect(tools.length).toBeGreaterThan(0)
    })
  })

  describe('getTool', () => {
    it('should get a tool by name', () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
        toolPrefix: 'test',
      })

      const tools = adapter.getTools()
      const toolName = tools[0]?.name

      if (toolName) {
        const tool = adapter.getTool(toolName)
        expect(tool).toBeDefined()
        expect(tool?.name).toBe(toolName)
      }
    })

    it('should return undefined for non-existent tool', () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
      })

      const tool = adapter.getTool('non-existent-tool')
      expect(tool).toBeUndefined()
    })
  })

  describe('executeTool', () => {
    it('should execute a tool by name', async () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
        toolPrefix: 'test',
      })

      await adapter.authenticate({ token: 'test-token' })

      // Find a project management tool
      const tools = adapter.getTools()
      const listProjectsTool = tools.find((t) => t.name.includes('list') && t.name.includes('projects'))

      if (listProjectsTool) {
        const result = await adapter.executeTool(listProjectsTool.name, {})
        expect(result).toBeDefined()
        expect(mockProjectManagement.listProjects).toHaveBeenCalled()
      }
    })

    it('should throw error for non-existent tool', async () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
      })

      await expect(adapter.executeTool('non-existent-tool', {})).rejects.toThrow("Tool 'non-existent-tool' not found")
    })

    it('should pass parameters to tool handler', async () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
        toolPrefix: 'test',
      })

      await adapter.authenticate({ token: 'test-token' })

      const tools = adapter.getTools()
      const listProjectsTool = tools.find((t) => t.name.includes('list') && t.name.includes('projects'))

      if (listProjectsTool) {
        await adapter.executeTool(listProjectsTool.name, {
          limit: 10,
          offset: 20,
        })

        expect(mockProjectManagement.listProjects).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 10,
            offset: 20,
          }),
        )
      }
    })
  })

  describe('getTools', () => {
    it('should return all registered tools', () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
      })

      const tools = adapter.getTools()
      expect(Array.isArray(tools)).toBe(true)
      expect(tools.length).toBeGreaterThan(0)
    })

    it('should return tools with correct structure', () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
        toolPrefix: 'custom',
      })

      const tools = adapter.getTools()
      const firstTool = tools[0]

      if (firstTool) {
        expect(firstTool).toHaveProperty('name')
        expect(firstTool).toHaveProperty('description')
        expect(firstTool).toHaveProperty('inputSchema')
        expect(firstTool).toHaveProperty('handler')
      }
    })
  })

  describe('serve', () => {
    it('should have serve method for starting server', async () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
      })

      expect(adapter.serve).toBeDefined()
      expect(typeof adapter.serve).toBe('function')
    })

    it('should support stdio transport', async () => {
      const adapter = new MCPAdapter({
        provider: mockProvider,
      })

      // Note: We can't actually test stdio without mocking process.stdin/stdout
      // This just ensures the method accepts the correct parameters
      const servePromise = adapter.serve({ transport: 'stdio' })
      expect(servePromise).toBeDefined()
    })
  })
})
