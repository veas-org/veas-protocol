/**
 * Veas Communication protocol implementation using MCP
 */

import type { CommunicationProtocol, ListParams, ListResponse, OutputFormat } from '../../protocols/index.js'
import type {
  Workspace,
  CreateWorkspaceData,
  UpdateWorkspaceData,
  WorkspaceFilters,
  Channel,
  CreateChannelData,
  UpdateChannelData,
  ChannelFilters,
  Message,
  CreateMessageData,
  UpdateMessageData,
  MessageFilters,
  Thread,
  Reaction,
  AddReactionData,
  ChannelMember,
  WorkspaceMember,
  MessageSearchResult,
  SearchMessagesParams,
} from '../../protocols/communication/index.js'
import { MCPClient } from './mcp-client.js'

export class VeasCommunicationMCP implements CommunicationProtocol {
  constructor(private client: MCPClient) {}

  // Workspace operations
  async listWorkspaces(params: ListParams & { filters?: WorkspaceFilters } & OutputFormat): Promise<ListResponse<Workspace>> {
    const result = await this.client.callTool('mcp-chat_list_workspaces', params)
    return result as ListResponse<Workspace>
  }

  async getWorkspace(id: string, params?: OutputFormat): Promise<Workspace> {
    const result = await this.client.callTool('mcp-chat_get_workspace', { workspace_id: id, ...params })
    return result as Workspace
  }

  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    const result = await this.client.callTool('mcp-chat_create_workspace', data)
    return result as Workspace
  }

  async updateWorkspace(id: string, data: UpdateWorkspaceData): Promise<Workspace> {
    const result = await this.client.callTool('mcp-chat_update_workspace', { workspace_id: id, ...data })
    return result as Workspace
  }

  async deleteWorkspace(id: string): Promise<void> {
    await this.client.callTool('mcp-chat_delete_workspace', { workspace_id: id })
  }

  // Channel operations
  async listChannels(params: ListParams & { filters?: ChannelFilters } & OutputFormat): Promise<ListResponse<Channel>> {
    const result = await this.client.callTool('mcp-chat_list_channels', params)
    return result as ListResponse<Channel>
  }

  async getChannel(id: string, params?: OutputFormat): Promise<Channel> {
    const result = await this.client.callTool('mcp-chat_get_channel', { channel_id: id, ...params })
    return result as Channel
  }

  async getChannelByContext(contextType: string, contextId: string, workspaceId: string, params?: OutputFormat): Promise<Channel | null> {
    // Special case for project context
    if (contextType === 'project') {
      const result = await this.client.callTool('mcp-chat_get_channel_by_project', {
        project_identifier: contextId,
        workspace_id: workspaceId,
        ...params
      })
      return result as Channel | null
    }
    
    // For other context types, use list with filters
    const response = await this.listChannels({
      filters: {
        contextType: contextType as any,
        contextId,
        workspaceId
      },
      limit: 1,
      ...params
    })
    
    return response.items[0] ?? null
  }

  async createChannel(data: CreateChannelData): Promise<Channel> {
    const result = await this.client.callTool('mcp-chat_create_channel', {
      workspace_id: data.workspaceId,
      name: data.name,
      display_name: data.displayName,
      description: data.description,
      topic: data.topic,
      is_private: data.isPrivate,
      initial_members: data.initialMembers
    })
    return result as Channel
  }

  async updateChannel(id: string, data: UpdateChannelData): Promise<Channel> {
    const result = await this.client.callTool('mcp-chat_update_channel', { 
      channel_id: id,
      display_name: data.displayName,
      description: data.description,
      topic: data.topic,
      is_archived: data.isArchived
    })
    return result as Channel
  }

  async deleteChannel(id: string): Promise<void> {
    await this.client.callTool('mcp-chat_delete_channel', { channel_id: id })
  }

  async archiveChannel(id: string): Promise<void> {
    await this.updateChannel(id, { isArchived: true })
  }

  async unarchiveChannel(id: string): Promise<void> {
    await this.updateChannel(id, { isArchived: false })
  }

  // Message operations
  async listMessages(channelId: string, params: ListParams & { filters?: MessageFilters } & OutputFormat): Promise<ListResponse<Message>> {
    const result = await this.client.callTool('mcp-chat_get_messages', {
      channel_id: channelId,
      limit: params.limit,
      thread_ts: params.filters?.threadTs,
      before_ts: params.filters?.beforeTs,
      after_ts: params.filters?.afterTs,
      include_reactions: params.filters?.hasReactions,
      include_thread_info: true,
      output_format: params.outputFormat
    })
    
    // Transform result to ListResponse format
    if (Array.isArray(result)) {
      return {
        items: result as Message[],
        total: result.length
      } as ListResponse<Message>
    }
    
    return result as ListResponse<Message>
  }

  async getMessage(id: string, params?: OutputFormat): Promise<Message> {
    const result = await this.client.callTool('mcp-chat_get_message', { message_id: id, ...params })
    return result as Message
  }

  async getMessagesByIssue(channelId: string, issueId: string, params?: ListParams & OutputFormat): Promise<ListResponse<Message>> {
    const result = await this.client.callTool('mcp-chat_get_messages_by_issue', {
      channel_id: channelId,
      issue_identifier: issueId,
      limit: params?.limit,
      include_replies: true,
      output_format: params?.outputFormat
    })
    
    // Transform result to ListResponse format
    if (Array.isArray(result)) {
      return {
        items: result as Message[],
        total: result.length
      } as ListResponse<Message>
    }
    
    return result as ListResponse<Message>
  }

  async sendMessage(data: CreateMessageData): Promise<Message> {
    const result = await this.client.callTool('mcp-chat_send_message', {
      channel_id: data.channelId,
      text: data.text,
      title: data.title,
      thread_ts: data.threadTs,
      message_type: data.type
    })
    
    // Extract the message from the response
    if (result && typeof result === 'object' && 'message' in result) {
      return (result as any).message as Message
    }
    
    return result as Message
  }

  async updateMessage(id: string, data: UpdateMessageData): Promise<Message> {
    const result = await this.client.callTool('mcp-chat_update_message', { 
      message_id: id,
      text: data.text,
      title: data.title
    })
    return result as Message
  }

  async deleteMessage(id: string): Promise<void> {
    await this.client.callTool('mcp-chat_delete_message', { message_id: id })
  }

  // Thread operations
  async getThread(messageId: string, params?: OutputFormat): Promise<Thread> {
    const result = await this.client.callTool('mcp-chat_get_thread', { message_id: messageId, ...params })
    return result as Thread
  }

  async listThreadReplies(threadTs: string, params?: ListParams & OutputFormat): Promise<ListResponse<Message>> {
    return this.listMessages(threadTs, {
      filters: { threadTs },
      ...params
    })
  }

  // Reaction operations
  async addReaction(data: AddReactionData): Promise<Reaction> {
    const result = await this.client.callTool('mcp-chat_add_reaction', {
      message_id: data.messageId,
      emoji: data.emoji
    })
    return result as Reaction
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    await this.client.callTool('mcp-chat_remove_reaction', {
      message_id: messageId,
      emoji
    })
  }

  async listReactions(messageId: string, params?: OutputFormat): Promise<Reaction[]> {
    const result = await this.client.callTool('mcp-chat_list_reactions', { 
      message_id: messageId,
      ...params
    })
    return result as Reaction[]
  }

  // Member operations
  async listChannelMembers(channelId: string, params?: ListParams & OutputFormat): Promise<ListResponse<ChannelMember>> {
    const result = await this.client.callTool('mcp-chat_list_channel_members', {
      channel_id: channelId,
      limit: params?.limit,
      offset: params?.offset,
      output_format: params?.outputFormat
    })
    return result as ListResponse<ChannelMember>
  }

  async joinChannel(channelId: string): Promise<ChannelMember> {
    const result = await this.client.callTool('mcp-chat_join_channel', { channel_id: channelId })
    return result as ChannelMember
  }

  async leaveChannel(channelId: string): Promise<void> {
    await this.client.callTool('mcp-chat_leave_channel', { channel_id: channelId })
  }

  async inviteToChannel(channelId: string, userIds: string[]): Promise<ChannelMember[]> {
    const result = await this.client.callTool('mcp-chat_invite_to_channel', {
      channel_id: channelId,
      user_ids: userIds
    })
    return result as ChannelMember[]
  }

  async removeFromChannel(channelId: string, userId: string): Promise<void> {
    await this.client.callTool('mcp-chat_remove_from_channel', {
      channel_id: channelId,
      user_id: userId
    })
  }

  // Workspace member operations
  async listWorkspaceMembers(workspaceId: string, params?: ListParams & OutputFormat): Promise<ListResponse<WorkspaceMember>> {
    const result = await this.client.callTool('mcp-chat_list_workspace_members', {
      workspace_id: workspaceId,
      limit: params?.limit,
      offset: params?.offset,
      output_format: params?.outputFormat
    })
    return result as ListResponse<WorkspaceMember>
  }

  async addWorkspaceMember(workspaceId: string, userId: string, role?: string): Promise<WorkspaceMember> {
    const result = await this.client.callTool('mcp-chat_add_workspace_member', {
      workspace_id: workspaceId,
      user_id: userId,
      role: role || 'member'
    })
    return result as WorkspaceMember
  }

  async updateWorkspaceMember(workspaceId: string, userId: string, updates: Partial<WorkspaceMember>): Promise<WorkspaceMember> {
    const result = await this.client.callTool('mcp-chat_update_workspace_member', {
      workspace_id: workspaceId,
      user_id: userId,
      ...updates
    })
    return result as WorkspaceMember
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
    await this.client.callTool('mcp-chat_remove_workspace_member', {
      workspace_id: workspaceId,
      user_id: userId
    })
  }

  // Search operations
  async searchMessages(params: SearchMessagesParams & ListParams & OutputFormat): Promise<ListResponse<MessageSearchResult>> {
    const result = await this.client.callTool('mcp-chat_search_messages', {
      query: params.query,
      workspace_id: params.workspaceId,
      filters: {
        channel_ids: params.channelIds,
        from_user_id: params.userIds?.[0], // API supports single user
        message_types: params.messageTypes,
        before_date: params.beforeDate?.toISOString(),
        after_date: params.afterDate?.toISOString(),
        has_files: params.hasAttachments,
        has_reactions: params.hasReactions,
        in_thread: params.inThread
      },
      limit: params.limit,
      offset: params.offset,
      output_format: params.outputFormat
    })
    return result as ListResponse<MessageSearchResult>
  }
}