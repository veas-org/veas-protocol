/**
 * Communication protocol interfaces
 */

import type { ListParams, ListResponse, OutputFormat } from '../common/index.js'
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
} from './types.js'

export interface CommunicationProtocol {
  // Workspace operations
  listWorkspaces(params: ListParams & { filters?: WorkspaceFilters } & OutputFormat): Promise<ListResponse<Workspace>>
  getWorkspace(id: string, params?: OutputFormat): Promise<Workspace>
  createWorkspace(data: CreateWorkspaceData): Promise<Workspace>
  updateWorkspace(id: string, data: UpdateWorkspaceData): Promise<Workspace>
  deleteWorkspace(id: string): Promise<void>
  
  // Channel operations
  listChannels(params: ListParams & { filters?: ChannelFilters } & OutputFormat): Promise<ListResponse<Channel>>
  getChannel(id: string, params?: OutputFormat): Promise<Channel>
  getChannelByContext(contextType: string, contextId: string, workspaceId: string, params?: OutputFormat): Promise<Channel | null>
  createChannel(data: CreateChannelData): Promise<Channel>
  updateChannel(id: string, data: UpdateChannelData): Promise<Channel>
  deleteChannel(id: string): Promise<void>
  archiveChannel(id: string): Promise<void>
  unarchiveChannel(id: string): Promise<void>
  
  // Message operations
  listMessages(channelId: string, params: ListParams & { filters?: MessageFilters } & OutputFormat): Promise<ListResponse<Message>>
  getMessage(id: string, params?: OutputFormat): Promise<Message>
  getMessagesByIssue(channelId: string, issueId: string, params?: ListParams & OutputFormat): Promise<ListResponse<Message>>
  sendMessage(data: CreateMessageData): Promise<Message>
  updateMessage(id: string, data: UpdateMessageData): Promise<Message>
  deleteMessage(id: string): Promise<void>
  
  // Thread operations
  getThread(messageId: string, params?: OutputFormat): Promise<Thread>
  listThreadReplies(threadTs: string, params?: ListParams & OutputFormat): Promise<ListResponse<Message>>
  lockThread?(threadTs: string): Promise<void>
  unlockThread?(threadTs: string): Promise<void>
  
  // Reaction operations
  addReaction(data: AddReactionData): Promise<Reaction>
  removeReaction(messageId: string, emoji: string): Promise<void>
  listReactions(messageId: string, params?: OutputFormat): Promise<Reaction[]>
  
  // Member operations
  listChannelMembers(channelId: string, params?: ListParams & OutputFormat): Promise<ListResponse<ChannelMember>>
  joinChannel(channelId: string): Promise<ChannelMember>
  leaveChannel(channelId: string): Promise<void>
  inviteToChannel(channelId: string, userIds: string[]): Promise<ChannelMember[]>
  removeFromChannel(channelId: string, userId: string): Promise<void>
  
  // Workspace member operations
  listWorkspaceMembers(workspaceId: string, params?: ListParams & OutputFormat): Promise<ListResponse<WorkspaceMember>>
  addWorkspaceMember(workspaceId: string, userId: string, role?: string): Promise<WorkspaceMember>
  updateWorkspaceMember(workspaceId: string, userId: string, updates: Partial<WorkspaceMember>): Promise<WorkspaceMember>
  removeWorkspaceMember(workspaceId: string, userId: string): Promise<void>
  
  // Search operations
  searchMessages(params: SearchMessagesParams & ListParams & OutputFormat): Promise<ListResponse<MessageSearchResult>>
  searchChannels?(query: string, workspaceId: string, params?: ListParams & OutputFormat): Promise<ListResponse<Channel>>
  
  // Bulk operations (optional)
  bulkDeleteMessages?(messageIds: string[]): Promise<void>
  bulkAddReactions?(reactions: AddReactionData[]): Promise<Reaction[]>
  
  // Real-time operations (optional)
  subscribeToChannel?(channelId: string, callback: (message: Message) => void): () => void
  subscribeToThread?(threadTs: string, callback: (message: Message) => void): () => void
  markAsRead?(channelId: string, timestamp: string): Promise<void>
  
  // Typing indicators (optional)
  sendTypingIndicator?(channelId: string): Promise<void>
  
  // File operations (optional)
  uploadFile?(channelId: string, file: File): Promise<string>
  deleteFile?(fileId: string): Promise<void>
}