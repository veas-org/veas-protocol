import { beforeEach, describe, expect, it, vi } from 'vitest'
// Importing types for testing - currently unused but may be needed for future test assertions
import type {
  // Workspace,
  // Channel,
  // Message,
  // Thread,
  // Reaction,
  // ChannelMember,
  // WorkspaceMember,
  // MessageSearchResult,
} from '../../protocols/communication/types'
import { VeasCommunicationMCP } from './communication-mcp'
import { MCPClient } from './mcp-client'

vi.mock('./mcp-client.js')

describe('VeasCommunicationMCP', () => {
  let client: MCPClient
  let communication: VeasCommunicationMCP

  beforeEach(() => {
    client = new MCPClient({ endpoint: 'http://test' })
    communication = new VeasCommunicationMCP(client)
    vi.clearAllMocks()
  })

  describe('Workspace operations', () => {
    it('should list workspaces', async () => {
      const mockResponse = {
        items: [{ id: '1', name: 'Test Workspace' }],
        total: 1,
      }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockResponse)

      const result = await communication.listWorkspaces({
        limit: 10,
        offset: 0,
        outputFormat: 'json',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_list_workspaces', {
        limit: 10,
        offset: 0,
        outputFormat: 'json',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should get a workspace', async () => {
      const mockWorkspace = { id: '1', name: 'Test Workspace' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockWorkspace)

      const result = await communication.getWorkspace('1', { outputFormat: 'json' })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_get_workspace', {
        workspace_id: '1',
        outputFormat: 'json',
      })
      expect(result).toEqual(mockWorkspace)
    })

    it('should create a workspace', async () => {
      const mockWorkspace = { id: '1', name: 'New Workspace' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockWorkspace)

      const result = await communication.createWorkspace({
        name: 'New Workspace',
        description: 'Test workspace',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_create_workspace', {
        name: 'New Workspace',
        description: 'Test workspace',
      })
      expect(result).toEqual(mockWorkspace)
    })

    it('should update a workspace', async () => {
      const mockWorkspace = { id: '1', name: 'Updated Workspace' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockWorkspace)

      const result = await communication.updateWorkspace('1', {
        name: 'Updated Workspace',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_update_workspace', {
        workspace_id: '1',
        name: 'Updated Workspace',
      })
      expect(result).toEqual(mockWorkspace)
    })

    it('should delete a workspace', async () => {
      vi.spyOn(client, 'callTool').mockResolvedValue(undefined)

      await communication.deleteWorkspace('1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_delete_workspace', {
        workspace_id: '1',
      })
    })
  })

  describe('Channel operations', () => {
    it('should list channels', async () => {
      const mockResponse = {
        items: [{ id: '1', name: 'general' }],
        total: 1,
      }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockResponse)

      const result = await communication.listChannels({
        limit: 10,
        offset: 0,
        outputFormat: 'json',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_list_channels', {
        limit: 10,
        offset: 0,
        outputFormat: 'json',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should get a channel', async () => {
      const mockChannel = { id: '1', name: 'general' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockChannel)

      const result = await communication.getChannel('1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_get_channel', {
        channel_id: '1',
      })
      expect(result).toEqual(mockChannel)
    })

    it('should get channel by project context', async () => {
      const mockChannel = { id: '1', name: 'project-channel' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockChannel)

      const result = await communication.getChannelByContext('project', 'proj-123', 'workspace-1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_get_channel_by_project', {
        project_identifier: 'proj-123',
        workspace_id: 'workspace-1',
      })
      expect(result).toEqual(mockChannel)
    })

    it('should get channel by other context types', async () => {
      const mockResponse = {
        items: [{ id: '1', name: 'team-channel' }],
        total: 1,
      }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockResponse)

      const result = await communication.getChannelByContext('team', 'team-123', 'workspace-1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_list_channels', {
        filters: {
          contextType: 'team',
          contextId: 'team-123',
          workspaceId: 'workspace-1',
        },
        limit: 1,
      })
      expect(result).toEqual(mockResponse.items[0])
    })

    it('should return null when no channel found by context', async () => {
      const mockResponse = {
        items: [],
        total: 0,
      }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockResponse)

      const result = await communication.getChannelByContext('team', 'nonexistent', 'workspace-1')

      expect(result).toBeNull()
    })

    it('should create a channel', async () => {
      const mockChannel = { id: '1', name: 'new-channel' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockChannel)

      const result = await communication.createChannel({
        workspaceId: 'workspace-1',
        name: 'new-channel',
        displayName: 'New Channel',
        description: 'Test channel',
        topic: 'Testing',
        isPrivate: false,
        initialMembers: ['user-1', 'user-2'],
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_create_channel', {
        workspace_id: 'workspace-1',
        name: 'new-channel',
        display_name: 'New Channel',
        description: 'Test channel',
        topic: 'Testing',
        is_private: false,
        initial_members: ['user-1', 'user-2'],
      })
      expect(result).toEqual(mockChannel)
    })

    it('should update a channel', async () => {
      const mockChannel = { id: '1', name: 'updated-channel' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockChannel)

      const result = await communication.updateChannel('1', {
        displayName: 'Updated Channel',
        description: 'Updated description',
        topic: 'New topic',
        isArchived: false,
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_update_channel', {
        channel_id: '1',
        display_name: 'Updated Channel',
        description: 'Updated description',
        topic: 'New topic',
        is_archived: false,
      })
      expect(result).toEqual(mockChannel)
    })

    it('should delete a channel', async () => {
      vi.spyOn(client, 'callTool').mockResolvedValue(undefined)

      await communication.deleteChannel('1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_delete_channel', {
        channel_id: '1',
      })
    })

    it('should archive a channel', async () => {
      const mockChannel = { id: '1', isArchived: true }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockChannel)

      await communication.archiveChannel('1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_update_channel', {
        channel_id: '1',
        display_name: undefined,
        description: undefined,
        topic: undefined,
        is_archived: true,
      })
    })

    it('should unarchive a channel', async () => {
      const mockChannel = { id: '1', isArchived: false }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockChannel)

      await communication.unarchiveChannel('1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_update_channel', {
        channel_id: '1',
        display_name: undefined,
        description: undefined,
        topic: undefined,
        is_archived: false,
      })
    })
  })

  describe('Message operations', () => {
    it('should list messages', async () => {
      const mockMessages = [
        { id: '1', text: 'Message 1' },
        { id: '2', text: 'Message 2' },
      ]
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMessages)

      const result = await communication.listMessages('channel-1', {
        limit: 10,
        outputFormat: 'json',
        filters: {
          threadTs: 'thread-1',
          beforeTs: '2024-01-01',
          afterTs: '2023-01-01',
          hasReactions: true,
        },
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_get_messages', {
        channel_id: 'channel-1',
        limit: 10,
        thread_ts: 'thread-1',
        before_ts: '2024-01-01',
        after_ts: '2023-01-01',
        include_reactions: true,
        include_thread_info: true,
        output_format: 'json',
      })
      expect(result).toEqual({
        items: mockMessages,
        total: 2,
      })
    })

    it('should handle ListResponse format for messages', async () => {
      const mockResponse = {
        items: [{ id: '1', text: 'Message 1' }],
        total: 1,
      }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockResponse)

      const result = await communication.listMessages('channel-1', {
        limit: 10,
        outputFormat: 'json',
      })

      expect(result).toEqual(mockResponse)
    })

    it('should get a message', async () => {
      const mockMessage = { id: '1', text: 'Test message' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMessage)

      const result = await communication.getMessage('1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_get_message', {
        message_id: '1',
      })
      expect(result).toEqual(mockMessage)
    })

    it('should get messages by issue', async () => {
      const mockMessages = [
        { id: '1', text: 'Issue message 1' },
        { id: '2', text: 'Issue message 2' },
      ]
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMessages)

      const result = await communication.getMessagesByIssue('channel-1', 'issue-123', {
        limit: 10,
        outputFormat: 'json',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_get_messages_by_issue', {
        channel_id: 'channel-1',
        issue_identifier: 'issue-123',
        limit: 10,
        include_replies: true,
        output_format: 'json',
      })
      expect(result).toEqual({
        items: mockMessages,
        total: 2,
      })
    })

    it('should send a message', async () => {
      const mockMessage = { id: '1', text: 'New message' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMessage)

      const result = await communication.sendMessage({
        channelId: 'channel-1',
        text: 'New message',
        title: 'Message title',
        threadTs: 'thread-1',
        type: 'text',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_send_message', {
        channel_id: 'channel-1',
        text: 'New message',
        title: 'Message title',
        thread_ts: 'thread-1',
        message_type: 'text',
      })
      expect(result).toEqual(mockMessage)
    })

    it('should extract message from response object', async () => {
      const mockResponse = {
        message: { id: '1', text: 'New message' },
        success: true,
      }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockResponse)

      const result = await communication.sendMessage({
        channelId: 'channel-1',
        text: 'New message',
      })

      expect(result).toEqual(mockResponse.message)
    })

    it('should update a message', async () => {
      const mockMessage = { id: '1', text: 'Updated message' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMessage)

      const result = await communication.updateMessage('1', {
        text: 'Updated message',
        title: 'Updated title',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_update_message', {
        message_id: '1',
        text: 'Updated message',
        title: 'Updated title',
      })
      expect(result).toEqual(mockMessage)
    })

    it('should delete a message', async () => {
      vi.spyOn(client, 'callTool').mockResolvedValue(undefined)

      await communication.deleteMessage('1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_delete_message', {
        message_id: '1',
      })
    })
  })

  describe('Thread operations', () => {
    it('should get a thread', async () => {
      const mockThread = { messageId: '1', replyCount: 5 }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockThread)

      const result = await communication.getThread('1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_get_thread', {
        message_id: '1',
      })
      expect(result).toEqual(mockThread)
    })

    it('should list thread replies', async () => {
      const mockMessages = [
        { id: '1', text: 'Reply 1' },
        { id: '2', text: 'Reply 2' },
      ]
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMessages)

      await communication.listThreadReplies('thread-1', {
        limit: 10,
        outputFormat: 'json',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_get_messages', {
        channel_id: 'thread-1',
        limit: 10,
        thread_ts: 'thread-1',
        before_ts: undefined,
        after_ts: undefined,
        include_reactions: undefined,
        include_thread_info: true,
        output_format: 'json',
      })
    })
  })

  describe('Reaction operations', () => {
    it('should add a reaction', async () => {
      const mockReaction = { emoji: '👍', count: 1 }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockReaction)

      const result = await communication.addReaction({
        messageId: '1',
        emoji: '👍',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_add_reaction', {
        message_id: '1',
        emoji: '👍',
      })
      expect(result).toEqual(mockReaction)
    })

    it('should remove a reaction', async () => {
      vi.spyOn(client, 'callTool').mockResolvedValue(undefined)

      await communication.removeReaction('1', '👍')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_remove_reaction', {
        message_id: '1',
        emoji: '👍',
      })
    })

    it('should list reactions', async () => {
      const mockReactions = [
        { emoji: '👍', count: 2 },
        { emoji: '❤️', count: 1 },
      ]
      vi.spyOn(client, 'callTool').mockResolvedValue(mockReactions)

      const result = await communication.listReactions('1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_list_reactions', {
        message_id: '1',
      })
      expect(result).toEqual(mockReactions)
    })
  })

  describe('Member operations', () => {
    it('should list channel members', async () => {
      const mockResponse = {
        items: [{ userId: 'user-1', role: 'member' }],
        total: 1,
      }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockResponse)

      const result = await communication.listChannelMembers('channel-1', {
        limit: 10,
        offset: 0,
        outputFormat: 'json',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_list_channel_members', {
        channel_id: 'channel-1',
        limit: 10,
        offset: 0,
        output_format: 'json',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should join a channel', async () => {
      const mockMember = { userId: 'user-1', role: 'member' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMember)

      const result = await communication.joinChannel('channel-1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_join_channel', {
        channel_id: 'channel-1',
      })
      expect(result).toEqual(mockMember)
    })

    it('should leave a channel', async () => {
      vi.spyOn(client, 'callTool').mockResolvedValue(undefined)

      await communication.leaveChannel('channel-1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_leave_channel', {
        channel_id: 'channel-1',
      })
    })

    it('should invite users to channel', async () => {
      const mockMembers = [
        { userId: 'user-1', role: 'member' },
        { userId: 'user-2', role: 'member' },
      ]
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMembers)

      const result = await communication.inviteToChannel('channel-1', ['user-1', 'user-2'])

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_invite_to_channel', {
        channel_id: 'channel-1',
        user_ids: ['user-1', 'user-2'],
      })
      expect(result).toEqual(mockMembers)
    })

    it('should remove user from channel', async () => {
      vi.spyOn(client, 'callTool').mockResolvedValue(undefined)

      await communication.removeFromChannel('channel-1', 'user-1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_remove_from_channel', {
        channel_id: 'channel-1',
        user_id: 'user-1',
      })
    })
  })

  describe('Workspace member operations', () => {
    it('should list workspace members', async () => {
      const mockResponse = {
        items: [{ userId: 'user-1', role: 'admin' }],
        total: 1,
      }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockResponse)

      const result = await communication.listWorkspaceMembers('workspace-1', {
        limit: 10,
        offset: 0,
        outputFormat: 'json',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_list_workspace_members', {
        workspace_id: 'workspace-1',
        limit: 10,
        offset: 0,
        output_format: 'json',
      })
      expect(result).toEqual(mockResponse)
    })

    it('should add workspace member', async () => {
      const mockMember = { userId: 'user-1', role: 'admin' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMember)

      const result = await communication.addWorkspaceMember('workspace-1', 'user-1', 'admin')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_add_workspace_member', {
        workspace_id: 'workspace-1',
        user_id: 'user-1',
        role: 'admin',
      })
      expect(result).toEqual(mockMember)
    })

    it('should add workspace member with default role', async () => {
      const mockMember = { userId: 'user-1', role: 'member' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMember)

      const result = await communication.addWorkspaceMember('workspace-1', 'user-1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_add_workspace_member', {
        workspace_id: 'workspace-1',
        user_id: 'user-1',
        role: 'member',
      })
      expect(result).toEqual(mockMember)
    })

    it('should update workspace member', async () => {
      const mockMember = { userId: 'user-1', role: 'admin', status: 'active' }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockMember)

      const result = await communication.updateWorkspaceMember('workspace-1', 'user-1', {
        role: 'admin',
        status: 'active',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_update_workspace_member', {
        workspace_id: 'workspace-1',
        user_id: 'user-1',
        role: 'admin',
        status: 'active',
      })
      expect(result).toEqual(mockMember)
    })

    it('should remove workspace member', async () => {
      vi.spyOn(client, 'callTool').mockResolvedValue(undefined)

      await communication.removeWorkspaceMember('workspace-1', 'user-1')

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_remove_workspace_member', {
        workspace_id: 'workspace-1',
        user_id: 'user-1',
      })
    })
  })

  describe('Search operations', () => {
    it('should search messages', async () => {
      const mockResponse = {
        items: [{ id: '1', text: 'Found message', score: 0.95 }],
        total: 1,
      }
      vi.spyOn(client, 'callTool').mockResolvedValue(mockResponse)

      const result = await communication.searchMessages({
        query: 'test query',
        workspaceId: 'workspace-1',
        channelIds: ['channel-1', 'channel-2'],
        userIds: ['user-1'],
        messageTypes: ['text', 'code'],
        beforeDate: new Date('2024-01-01'),
        afterDate: new Date('2023-01-01'),
        hasAttachments: true,
        hasReactions: true,
        inThread: false,
        limit: 10,
        offset: 0,
        outputFormat: 'json',
      })

      expect(client.callTool).toHaveBeenCalledWith('mcp-chat_search_messages', {
        query: 'test query',
        workspace_id: 'workspace-1',
        filters: {
          channel_ids: ['channel-1', 'channel-2'],
          from_user_id: 'user-1',
          message_types: ['text', 'code'],
          before_date: '2024-01-01T00:00:00.000Z',
          after_date: '2023-01-01T00:00:00.000Z',
          has_files: true,
          has_reactions: true,
          in_thread: false,
        },
        limit: 10,
        offset: 0,
        output_format: 'json',
      })
      expect(result).toEqual(mockResponse)
    })
  })
})
