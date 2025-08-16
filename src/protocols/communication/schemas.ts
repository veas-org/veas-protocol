/**
 * Communication protocol validation schemas
 */

import { z } from 'zod'

// Workspace schemas
export const WorkspaceSettingsSchema = z.object({
  allowPublicChannels: z.boolean().optional(),
  allowPrivateChannels: z.boolean().optional(),
  allowDirectMessages: z.boolean().optional(),
  allowThreads: z.boolean().optional(),
  allowReactions: z.boolean().optional(),
  maxMessageLength: z.number().positive().optional(),
})

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  organizationId: z.string(),
  settings: WorkspaceSettingsSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const UpdateWorkspaceSchema = z.object({
  displayName: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  settings: WorkspaceSettingsSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Channel schemas
export const ChannelTypeSchema = z.enum(['public', 'private', 'direct_message', 'group_direct_message', 'shared'])
export const ChannelContextTypeSchema = z.enum(['project', 'issue', 'article', 'team', 'general'])

export const CreateChannelSchema = z.object({
  workspaceId: z.string(),
  name: z
    .string()
    .min(1)
    .max(21)
    .regex(/^[a-z0-9-_]+$/, 'Channel name must be lowercase alphanumeric with hyphens or underscores'),
  displayName: z.string().max(100).optional(),
  description: z.string().max(250).optional(),
  topic: z.string().max(250).optional(),
  type: ChannelTypeSchema.optional(),
  isPrivate: z.boolean().optional(),
  contextType: ChannelContextTypeSchema.optional(),
  contextId: z.string().optional(),
  initialMembers: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const UpdateChannelSchema = z.object({
  displayName: z.string().max(100).optional(),
  description: z.string().max(250).optional(),
  topic: z.string().max(250).optional(),
  isArchived: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Message schemas
export const MessageTypeSchema = z.enum(['text', 'code', 'bot', 'app_message', 'system'])

export const CreateAttachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  size: z.number().positive(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
})

export const CreateMessageSchema = z.object({
  channelId: z.string(),
  text: z.string().min(1).max(40000), // Slack's limit
  title: z.string().max(255).optional(),
  type: MessageTypeSchema.optional(),
  threadTs: z.string().optional(), // Parent message ID for thread replies
  mentions: z.array(z.string()).optional(),
  attachments: z.array(CreateAttachmentSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const UpdateMessageSchema = z.object({
  text: z.string().min(1).max(40000).optional(),
  title: z.string().max(255).optional(),
  mentions: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Reaction schemas
export const AddReactionSchema = z.object({
  messageId: z.string(),
  emoji: z.string().min(1).max(50), // Unicode or :shortcode:
})

// Member schemas
export const MemberRoleSchema = z.enum(['owner', 'admin', 'member', 'guest'])
export const MemberStatusSchema = z.enum(['active', 'inactive', 'suspended'])
export const NotificationPreferenceSchema = z.enum(['all', 'mentions', 'none'])

// Filter schemas
export const ChannelFiltersSchema = z.object({
  workspaceId: z.string().optional(),
  name: z.string().optional(),
  type: ChannelTypeSchema.optional(),
  isPrivate: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  contextType: ChannelContextTypeSchema.optional(),
  contextId: z.string().optional(),
  userIsMember: z.boolean().optional(),
})

export const MessageFiltersSchema = z.object({
  channelId: z.string().optional(),
  userId: z.string().optional(),
  type: MessageTypeSchema.optional(),
  threadTs: z.string().optional(),
  beforeTs: z.string().optional(),
  afterTs: z.string().optional(),
  hasReactions: z.boolean().optional(),
  hasAttachments: z.boolean().optional(),
  search: z.string().optional(),
})

export const WorkspaceFiltersSchema = z.object({
  organizationId: z.string().optional(),
  name: z.string().optional(),
})

// Search schemas
export const SearchMessagesSchema = z.object({
  query: z.string().min(2),
  workspaceId: z.string().optional(),
  channelIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  messageTypes: z.array(MessageTypeSchema).optional(),
  beforeDate: z.date().optional(),
  afterDate: z.date().optional(),
  hasAttachments: z.boolean().optional(),
  hasReactions: z.boolean().optional(),
  inThread: z.boolean().optional(),
  // List params
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
})

// List params schemas
export const ListChannelsSchema = z.object({
  filters: ChannelFiltersSchema.optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  sortBy: z.enum(['name', 'created_at', 'member_count']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  outputFormat: z.enum(['json', 'markdown']).optional(),
})

export const ListMessagesSchema = z.object({
  channelId: z.string(),
  filters: MessageFiltersSchema.optional(),
  limit: z.number().min(1).max(1000).optional(),
  offset: z.number().min(0).optional(),
  sortBy: z.enum(['created_at', 'updated_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  outputFormat: z.enum(['json', 'markdown']).optional(),
})

export const ListWorkspacesSchema = z.object({
  filters: WorkspaceFiltersSchema.optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  sortBy: z.enum(['name', 'created_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  outputFormat: z.enum(['json', 'markdown']).optional(),
})
