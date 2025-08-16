import { describe, it, expect } from 'vitest'
import {
  WorkspaceSettingsSchema,
  CreateWorkspaceSchema,
  // UpdateWorkspaceSchema,
  CreateChannelSchema,
  // UpdateChannelSchema,
  CreateMessageSchema,
  // UpdateMessageSchema,
  AddReactionSchema,
  // ChannelFiltersSchema,
  // MessageFiltersSchema,
  SearchMessagesSchema,
  ListChannelsSchema,
  ListMessagesSchema,
} from './schemas'

describe('Communication Schemas', () => {
  describe('WorkspaceSettingsSchema', () => {
    it('should validate valid workspace settings', () => {
      const settings = {
        allowPublicChannels: true,
        allowPrivateChannels: false,
        allowDirectMessages: true,
        allowThreads: true,
        allowReactions: false,
        maxMessageLength: 10000,
      }

      const result = WorkspaceSettingsSchema.safeParse(settings)
      expect(result.success).toBe(true)
    })

    it('should allow partial settings', () => {
      const settings = {
        allowPublicChannels: true,
        maxMessageLength: 5000,
      }

      const result = WorkspaceSettingsSchema.safeParse(settings)
      expect(result.success).toBe(true)
    })

    it('should reject invalid message length', () => {
      const settings = {
        maxMessageLength: -100,
      }

      const result = WorkspaceSettingsSchema.safeParse(settings)
      expect(result.success).toBe(false)
    })
  })

  describe('CreateWorkspaceSchema', () => {
    it('should validate valid workspace creation data', () => {
      const data = {
        name: 'test-workspace',
        displayName: 'Test Workspace',
        description: 'A test workspace',
        organizationId: 'org-123',
        settings: {
          allowPublicChannels: true,
        },
        metadata: {
          customField: 'value',
        },
      }

      const result = CreateWorkspaceSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should require name and organizationId', () => {
      const data = {
        displayName: 'Test',
      }

      const result = CreateWorkspaceSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject empty name', () => {
      const data = {
        name: '',
        organizationId: 'org-123',
      }

      const result = CreateWorkspaceSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 100 characters', () => {
      const data = {
        name: 'a'.repeat(101),
        organizationId: 'org-123',
      }

      const result = CreateWorkspaceSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('CreateChannelSchema', () => {
    it('should validate valid channel creation data', () => {
      const data = {
        workspaceId: 'ws-123',
        name: 'general-chat',
        displayName: 'General Chat',
        description: 'General discussion channel',
        topic: 'All topics welcome',
        type: 'public' as const,
        isPrivate: false,
        contextType: 'general' as const,
        contextId: 'ctx-456',
        initialMembers: ['user-1', 'user-2'],
        metadata: { custom: 'data' },
      }

      const result = CreateChannelSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate channel name format', () => {
      const validNames = ['general', 'team-chat', 'project_123', 'test-123-abc']

      validNames.forEach((name) => {
        const result = CreateChannelSchema.safeParse({
          workspaceId: 'ws-123',
          name,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid channel names', () => {
      const invalidNames = [
        'General', // uppercase
        'general chat', // space
        'general@chat', // special char
        '', // empty
        'a'.repeat(22), // too long
      ]

      invalidNames.forEach((name) => {
        const result = CreateChannelSchema.safeParse({
          workspaceId: 'ws-123',
          name,
        })
        expect(result.success).toBe(false)
      })
    })

    it('should validate channel types', () => {
      const validTypes = ['public', 'private', 'direct_message', 'group_direct_message', 'shared']

      validTypes.forEach((type) => {
        const result = CreateChannelSchema.safeParse({
          workspaceId: 'ws-123',
          name: 'test',
          type,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should validate context types', () => {
      const validContextTypes = ['project', 'issue', 'article', 'team', 'general']

      validContextTypes.forEach((contextType) => {
        const result = CreateChannelSchema.safeParse({
          workspaceId: 'ws-123',
          name: 'test',
          contextType,
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('CreateMessageSchema', () => {
    it('should validate valid message creation data', () => {
      const data = {
        channelId: 'ch-123',
        text: 'Hello, world!',
        title: 'Greeting',
        type: 'text' as const,
        threadTs: 'msg-456',
        mentions: ['user-1', 'user-2'],
        attachments: [
          {
            filename: 'document.pdf',
            mimeType: 'application/pdf',
            size: 1024000,
            url: 'https://example.com/doc.pdf',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          },
        ],
        metadata: { custom: 'field' },
      }

      const result = CreateMessageSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should require channelId and text', () => {
      const data = {
        title: 'Test',
      }

      const result = CreateMessageSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject empty text', () => {
      const data = {
        channelId: 'ch-123',
        text: '',
      }

      const result = CreateMessageSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject text longer than 40000 characters', () => {
      const data = {
        channelId: 'ch-123',
        text: 'a'.repeat(40001),
      }

      const result = CreateMessageSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should validate message types', () => {
      const validTypes = ['text', 'code', 'bot', 'app_message', 'system']

      validTypes.forEach((type) => {
        const result = CreateMessageSchema.safeParse({
          channelId: 'ch-123',
          text: 'test',
          type,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should validate attachment structure', () => {
      const data = {
        channelId: 'ch-123',
        text: 'test',
        attachments: [
          {
            filename: 'test.txt',
            mimeType: 'text/plain',
            size: 100,
            url: 'https://example.com/test.txt',
          },
        ],
      }

      const result = CreateMessageSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid attachment URLs', () => {
      const data = {
        channelId: 'ch-123',
        text: 'test',
        attachments: [
          {
            filename: 'test.txt',
            mimeType: 'text/plain',
            size: 100,
            url: 'not-a-url',
          },
        ],
      }

      const result = CreateMessageSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('AddReactionSchema', () => {
    it('should validate valid reaction data', () => {
      const data = {
        messageId: 'msg-123',
        emoji: '👍',
      }

      const result = AddReactionSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept emoji shortcodes', () => {
      const data = {
        messageId: 'msg-123',
        emoji: ':thumbsup:',
      }

      const result = AddReactionSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject empty emoji', () => {
      const data = {
        messageId: 'msg-123',
        emoji: '',
      }

      const result = AddReactionSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject emoji longer than 50 characters', () => {
      const data = {
        messageId: 'msg-123',
        emoji: 'a'.repeat(51),
      }

      const result = AddReactionSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('SearchMessagesSchema', () => {
    it('should validate valid search parameters', () => {
      const data = {
        query: 'search term',
        workspaceId: 'ws-123',
        channelIds: ['ch-1', 'ch-2'],
        userIds: ['user-1', 'user-2'],
        messageTypes: ['text', 'code'] as any,
        beforeDate: new Date('2024-12-31'),
        afterDate: new Date('2024-01-01'),
        hasAttachments: true,
        hasReactions: false,
        inThread: true,
        limit: 50,
        offset: 10,
      }

      const result = SearchMessagesSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should require query', () => {
      const data = {
        workspaceId: 'ws-123',
      }

      const result = SearchMessagesSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject query shorter than 2 characters', () => {
      const data = {
        query: 'a',
      }

      const result = SearchMessagesSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should validate limit bounds', () => {
      const validLimits = [1, 50, 100]

      validLimits.forEach((limit) => {
        const result = SearchMessagesSchema.safeParse({
          query: 'test',
          limit,
        })
        expect(result.success).toBe(true)
      })

      const invalidLimits = [0, 101, -1]

      invalidLimits.forEach((limit) => {
        const result = SearchMessagesSchema.safeParse({
          query: 'test',
          limit,
        })
        expect(result.success).toBe(false)
      })
    })
  })

  describe('ListChannelsSchema', () => {
    it('should validate valid list parameters', () => {
      const data = {
        filters: {
          workspaceId: 'ws-123',
          name: 'general',
          type: 'public' as const,
          isPrivate: false,
          isArchived: false,
          contextType: 'project' as const,
          contextId: 'ctx-123',
          userIsMember: true,
        },
        limit: 25,
        offset: 0,
        sortBy: 'name' as const,
        sortOrder: 'asc' as const,
        outputFormat: 'json' as const,
      }

      const result = ListChannelsSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept empty filters', () => {
      const data = {
        filters: {},
        limit: 10,
      }

      const result = ListChannelsSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should validate sort options', () => {
      const validSortBy = ['name', 'created_at', 'member_count']

      validSortBy.forEach((sortBy) => {
        const result = ListChannelsSchema.safeParse({ sortBy })
        expect(result.success).toBe(true)
      })
    })

    it('should validate output formats', () => {
      const validFormats = ['json', 'markdown']

      validFormats.forEach((outputFormat) => {
        const result = ListChannelsSchema.safeParse({ outputFormat })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('ListMessagesSchema', () => {
    it('should validate valid list parameters', () => {
      const data = {
        channelId: 'ch-123',
        filters: {
          userId: 'user-123',
          type: 'text' as const,
          threadTs: 'msg-456',
          beforeTs: 'ts-before',
          afterTs: 'ts-after',
          hasReactions: true,
          hasAttachments: false,
          search: 'keyword',
        },
        limit: 100,
        offset: 50,
        sortBy: 'created_at' as const,
        sortOrder: 'desc' as const,
        outputFormat: 'markdown' as const,
      }

      const result = ListMessagesSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should require channelId', () => {
      const data = {
        filters: {},
        limit: 10,
      }

      const result = ListMessagesSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should validate limit bounds for messages', () => {
      const data = {
        channelId: 'ch-123',
        limit: 1000, // max allowed
      }

      const result = ListMessagesSchema.safeParse(data)
      expect(result.success).toBe(true)

      const invalidData = {
        channelId: 'ch-123',
        limit: 1001, // exceeds max
      }

      const invalidResult = ListMessagesSchema.safeParse(invalidData)
      expect(invalidResult.success).toBe(false)
    })
  })
})
