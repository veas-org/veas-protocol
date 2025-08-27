/**
 * MCP tool generation for Communication protocol
 */

import type { CommunicationProtocol } from '../../protocols/communication/interfaces'
import type { MCPTool } from './types'
import { createPaginatedTool, createTool } from './utils'

export function generateCommunicationTools(protocol: CommunicationProtocol): MCPTool[] {
  const tools: MCPTool[] = []

  // Channel tools
  tools.push(
    createPaginatedTool({
      name: 'mcp-chat_list_channels',
      description: 'List chat channels with optional filtering',
      handler: async params => protocol.listChannels(params),
      inputSchema: {
        filters: {
          type: 'object',
          properties: {
            workspace_id: { type: 'string', description: 'Filter by workspace ID' },
            name_contains: { type: 'string', description: 'Filter by name containing text' },
            type: { type: 'string', enum: ['public', 'private', 'direct_message', 'group_direct_message', 'shared'] },
            is_private: { type: 'boolean', description: 'Filter by privacy status' },
            is_archived: { type: 'boolean', description: 'Include archived channels' },
            context_type: { type: 'string', enum: ['project', 'issue', 'article', 'team', 'general'] },
            context_id: { type: 'string', description: 'Filter by context ID' },
            user_is_member: { type: 'boolean', description: 'Only show channels user is member of' },
          },
        },
        limit: { type: 'number', description: 'Maximum number of items to return' },
        offset: { type: 'number', description: 'Number of items to skip' },
        sort_by: { type: 'string', enum: ['name', 'created_at', 'member_count'] },
        sort_order: { type: 'string', enum: ['asc', 'desc'] },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
    }),
  )

  tools.push(
    createTool({
      name: 'mcp-chat_get_channel',
      description: 'Get details of a specific channel',
      handler: async params => protocol.getChannel(params.channel_id, params),
      inputSchema: {
        channel_id: { type: 'string', description: 'Channel ID' },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
    }),
  )

  tools.push(
    createTool({
      name: 'mcp-chat_get_channel_by_project',
      description: 'Get the chat channel associated with a project',
      handler: async params =>
        protocol.getChannelByContext('project', params.project_identifier, params.workspace_id, params),
      inputSchema: {
        project_identifier: { type: 'string', description: 'Project ID or key' },
        workspace_id: { type: 'string', description: 'Workspace ID' },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
    }),
  )

  tools.push(
    createTool({
      name: 'mcp-chat_create_channel',
      description: 'Create a new chat channel',
      handler: async params =>
        protocol.createChannel({
          workspaceId: params.workspace_id,
          name: params.name,
          displayName: params.display_name,
          description: params.description,
          topic: params.topic,
          isPrivate: params.is_private,
          initialMembers: params.initial_members,
        }),
      inputSchema: {
        workspace_id: { type: 'string', description: 'Workspace ID' },
        name: { type: 'string', description: 'Channel name (lowercase, no spaces)' },
        display_name: { type: 'string', description: 'Display name' },
        description: { type: 'string', description: 'Channel description' },
        topic: { type: 'string', description: 'Channel topic' },
        is_private: { type: 'boolean', description: 'Whether channel is private' },
        initial_members: {
          type: 'array',
          items: { type: 'string' },
          description: 'User IDs to add as initial members',
        },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
      required: ['workspace_id', 'name'],
    }),
  )

  tools.push(
    createTool({
      name: 'mcp-chat_join_channel',
      description: 'Join a chat channel',
      handler: async params => protocol.joinChannel(params.channel_id),
      inputSchema: {
        channel_id: { type: 'string', description: 'Channel ID' },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
      required: ['channel_id'],
    }),
  )

  tools.push(
    createTool({
      name: 'mcp-chat_leave_channel',
      description: 'Leave a chat channel',
      handler: async params => protocol.leaveChannel(params.channel_id),
      inputSchema: {
        channel_id: { type: 'string', description: 'Channel ID' },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
      required: ['channel_id'],
    }),
  )

  // Message tools
  tools.push(
    createTool({
      name: 'mcp-chat_send_message',
      description: 'Send a message to a chat channel',
      handler: async params => {
        const message = await protocol.sendMessage({
          channelId: params.channel_id,
          text: params.text,
          title: params.title,
          type: params.message_type,
          threadTs: params.thread_ts,
        })
        // Return in the expected format with success flag
        return {
          message,
          success: true,
        }
      },
      inputSchema: {
        channel_id: { type: 'string', description: 'Channel ID' },
        text: { type: 'string', description: 'Message text' },
        title: { type: 'string', description: 'Optional message title' },
        message_type: {
          type: 'string',
          enum: ['text', 'code', 'bot', 'app_message'],
          description: 'Type of message',
        },
        thread_ts: { type: 'string', description: 'Parent message ID for thread replies' },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
      required: ['channel_id', 'text'],
    }),
  )

  tools.push(
    createTool({
      name: 'mcp-chat_get_messages',
      description: 'Get messages from a chat channel',
      handler: async params => {
        const response = await protocol.listMessages(params.channel_id, {
          limit: params.limit,
          filters: {
            threadTs: params.thread_ts,
            beforeTs: params.before_ts,
            afterTs: params.after_ts,
            hasReactions: params.include_reactions,
          },
          outputFormat: params.output_format,
        })
        // Return items array directly for backward compatibility
        return response.items
      },
      inputSchema: {
        channel_id: { type: 'string', description: 'Channel ID' },
        limit: { type: 'number', description: 'Maximum number of messages' },
        thread_ts: { type: 'string', description: 'Get only messages in this thread' },
        before_ts: { type: 'string', description: 'Get messages before this timestamp' },
        after_ts: { type: 'string', description: 'Get messages after this timestamp' },
        include_reactions: { type: 'boolean', description: 'Include reaction data' },
        include_thread_info: { type: 'boolean', description: 'Include thread metadata' },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
      required: ['channel_id'],
    }),
  )

  tools.push(
    createTool({
      name: 'mcp-chat_get_messages_by_issue',
      description: 'Get messages related to a specific issue',
      handler: async params => {
        const response = await protocol.getMessagesByIssue(params.channel_id, params.issue_identifier, {
          limit: params.limit,
          outputFormat: params.output_format,
        })
        // Return items array directly for backward compatibility
        return response.items
      },
      inputSchema: {
        channel_id: { type: 'string', description: 'Channel ID' },
        issue_identifier: { type: 'string', description: 'Issue ID or key' },
        limit: { type: 'number', description: 'Maximum number of messages' },
        include_replies: { type: 'boolean', description: 'Include thread replies' },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
      required: ['channel_id', 'issue_identifier'],
    }),
  )

  tools.push(
    createPaginatedTool({
      name: 'mcp-chat_search_messages',
      description: 'Search for messages across channels',
      handler: async params =>
        protocol.searchMessages({
          query: params.query,
          workspaceId: params.workspace_id,
          channelIds: params.filters?.channel_ids,
          userIds: params.filters?.from_user_id ? [params.filters.from_user_id] : undefined,
          messageTypes: params.filters?.message_types,
          beforeDate: params.filters?.before_date ? new Date(params.filters.before_date) : undefined,
          afterDate: params.filters?.after_date ? new Date(params.filters.after_date) : undefined,
          hasAttachments: params.filters?.has_files,
          hasReactions: params.filters?.has_reactions,
          inThread: params.filters?.in_thread,
          limit: params.limit,
          offset: params.offset,
          outputFormat: params.output_format,
        }),
      inputSchema: {
        query: { type: 'string', description: 'Search query text' },
        workspace_id: { type: 'string', description: 'Workspace to search within' },
        filters: {
          type: 'object',
          properties: {
            channel_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Limit search to specific channels',
            },
            from_user_id: { type: 'string', description: 'Filter by message sender' },
            message_types: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by message types',
            },
            before_date: { type: 'string', description: 'Messages before this date' },
            after_date: { type: 'string', description: 'Messages after this date' },
            has_files: { type: 'boolean', description: 'Only messages with attachments' },
            has_reactions: { type: 'boolean', description: 'Only messages with reactions' },
            in_thread: { type: 'boolean', description: 'Search only in thread replies' },
          },
        },
        limit: { type: 'number', description: 'Maximum results to return' },
        offset: { type: 'number', description: 'Number of results to skip' },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
      required: ['query', 'workspace_id'],
    }),
  )

  // Reaction tools
  tools.push(
    createTool({
      name: 'mcp-chat_add_reaction',
      description: 'Add an emoji reaction to a message',
      handler: async params =>
        protocol.addReaction({
          messageId: params.message_id,
          emoji: params.emoji,
        }),
      inputSchema: {
        message_id: { type: 'string', description: 'Message ID' },
        emoji: { type: 'string', description: 'Emoji to react with' },
        output_format: { type: 'string', enum: ['json', 'markdown'] },
      },
      required: ['message_id', 'emoji'],
    }),
  )

  return tools
}
