/**
 * Communication protocol type definitions
 */

import type { Entity } from '../common/types'

// Workspace types
export interface Workspace extends Entity {
  name: string
  displayName?: string
  description?: string
  organizationId: string
  settings?: WorkspaceSettings
  metadata?: Record<string, unknown>
}

export interface WorkspaceSettings {
  allowPublicChannels?: boolean
  allowPrivateChannels?: boolean
  allowDirectMessages?: boolean
  allowThreads?: boolean
  allowReactions?: boolean
  maxMessageLength?: number
}

export interface CreateWorkspaceData {
  name: string
  displayName?: string
  description?: string
  organizationId: string
  settings?: WorkspaceSettings
  metadata?: Record<string, unknown>
}

export interface UpdateWorkspaceData {
  displayName?: string
  description?: string
  settings?: WorkspaceSettings
  metadata?: Record<string, unknown>
}

// Channel types
export interface Channel extends Entity {
  workspaceId: string
  name: string
  displayName?: string
  description?: string
  topic?: string
  type: ChannelType
  isPrivate: boolean
  isArchived: boolean
  contextType?: ChannelContextType
  contextId?: string
  memberCount?: number
  lastMessageAt?: Date
  metadata?: Record<string, unknown>
}

export type ChannelType = 'public' | 'private' | 'direct_message' | 'group_direct_message' | 'shared'
export type ChannelContextType = 'project' | 'issue' | 'article' | 'team' | 'general'

export interface CreateChannelData {
  workspaceId: string
  name: string
  displayName?: string
  description?: string
  topic?: string
  type?: ChannelType
  isPrivate?: boolean
  contextType?: ChannelContextType
  contextId?: string
  initialMembers?: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateChannelData {
  displayName?: string
  description?: string
  topic?: string
  isArchived?: boolean
  metadata?: Record<string, unknown>
}

// Message types
export interface Message extends Entity {
  channelId: string
  userId: string
  text: string
  title?: string
  type: MessageType
  threadTs?: string
  replyCount?: number
  replyUsers?: string[]
  lastReplyAt?: Date
  mentions?: string[]
  attachments?: MessageAttachment[]
  reactions?: MessageReaction[]
  isEdited: boolean
  editedAt?: Date
  deletedAt?: Date
  metadata?: Record<string, unknown>
}

export type MessageType = 'text' | 'code' | 'bot' | 'app_message' | 'system'

export interface MessageAttachment {
  id: string
  filename: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
}

export interface MessageReaction {
  emoji: string
  users: string[]
  count: number
}

export interface CreateMessageData {
  channelId: string
  text: string
  title?: string
  type?: MessageType
  threadTs?: string
  mentions?: string[]
  attachments?: CreateAttachmentData[]
  metadata?: Record<string, unknown>
}

export interface CreateAttachmentData {
  filename: string
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
}

export interface UpdateMessageData {
  text?: string
  title?: string
  mentions?: string[]
  metadata?: Record<string, unknown>
}

// Thread types
export interface Thread {
  parentMessageId: string
  replyCount: number
  participantCount: number
  participants: string[]
  lastReplyAt: Date
  isLocked: boolean
}

// Reaction types
export interface Reaction {
  messageId: string
  userId: string
  emoji: string
  createdAt: Date
}

export interface AddReactionData {
  messageId: string
  emoji: string
}

// Member types
export interface ChannelMember {
  channelId: string
  userId: string
  role: MemberRole
  joinedAt: Date
  lastReadAt?: Date
  notificationPreference?: NotificationPreference
}

export interface WorkspaceMember {
  workspaceId: string
  userId: string
  role: MemberRole
  joinedAt: Date
  status: MemberStatus
  displayName?: string
  title?: string
}

export type MemberRole = 'owner' | 'admin' | 'member' | 'guest'
export type MemberStatus = 'active' | 'inactive' | 'suspended'
export type NotificationPreference = 'all' | 'mentions' | 'none'

// Filter types
export interface ChannelFilters {
  workspaceId?: string
  name?: string
  type?: ChannelType
  isPrivate?: boolean
  isArchived?: boolean
  contextType?: ChannelContextType
  contextId?: string
  userIsMember?: boolean
}

export interface MessageFilters {
  channelId?: string
  userId?: string
  type?: MessageType
  threadTs?: string
  beforeTs?: string
  afterTs?: string
  hasReactions?: boolean
  hasAttachments?: boolean
  search?: string
}

export interface WorkspaceFilters {
  organizationId?: string
  name?: string
}

// Search types
export interface MessageSearchResult extends Message {
  highlights?: string[]
  score?: number
}

export interface SearchMessagesParams {
  query: string
  workspaceId?: string
  channelIds?: string[]
  userIds?: string[]
  messageTypes?: MessageType[]
  beforeDate?: Date
  afterDate?: Date
  hasAttachments?: boolean
  hasReactions?: boolean
  inThread?: boolean
}

// Destination types
export type DestinationType = 'user' | 'channel' | 'group' | 'workspace' | 'broadcast' | 'webhook'

export interface MessageDestination {
  type: DestinationType
  id: string
  name?: string
  metadata?: Record<string, unknown>
}

export interface DestinationGroup {
  id: string
  name: string
  description?: string
  destinations: MessageDestination[]
  createdAt: Date
  updatedAt: Date
}

export interface RoutingRule {
  id: string
  name: string
  description?: string
  condition: RoutingCondition
  destinations: MessageDestination[]
  priority: number
  isActive: boolean
}

export interface RoutingCondition {
  type: 'message_type' | 'user_role' | 'channel_type' | 'keyword' | 'custom'
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'in' | 'not_in'
  value: string | string[]
  metadata?: Record<string, unknown>
}

export interface DeliveryStatus {
  destinationId: string
  destinationType: DestinationType
  status: 'pending' | 'delivered' | 'failed' | 'retry'
  attempts: number
  lastAttemptAt?: Date
  error?: string
}

export interface MessageDelivery {
  messageId: string
  destinations: MessageDestination[]
  deliveryStatuses: DeliveryStatus[]
  createdAt: Date
  completedAt?: Date
}
