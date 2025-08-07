/**
 * Mock data generators for testing
 */

import type {
  Project,
  Issue,
  Sprint,
  Comment,
  Article,
  Folder,
  Tag,
  Publication,
  EditorCommand,
} from '../../src'

export const mockProject = (overrides?: Partial<Project>): Project => ({
  id: '1',
  key: 'PROJ-1',
  name: 'Test Project',
  description: 'A test project',
  status: 'active',
  visibility: 'private',
  ownerId: 'user-123',
  organizationId: 'org-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockIssue = (overrides?: Partial<Issue>): Issue => ({
  id: '1',
  projectId: '1',
  key: 'PROJ-1',
  title: 'Test Issue',
  description: 'A test issue',
  type: 'task',
  status: 'todo',
  priority: 'medium',
  reporterId: 'user-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockSprint = (overrides?: Partial<Sprint>): Sprint => ({
  id: '1',
  projectId: '1',
  name: 'Sprint 1',
  goal: 'Complete initial features',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-14'),
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockComment = (overrides?: Partial<Comment>): Comment => ({
  id: '1',
  issueId: '1',
  authorId: 'user-123',
  content: 'Test comment',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockArticle = (overrides?: Partial<Article>): Article => ({
  id: '1',
  title: 'Test Article',
  slug: 'test-article',
  content: 'Test article content',
  excerpt: 'Test excerpt',
  status: 'draft',
  authorId: 'user-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockFolder = (overrides?: Partial<Folder>): Folder => ({
  id: '1',
  name: 'Test Folder',
  slug: 'test-folder',
  description: 'A test folder',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockTag = (overrides?: Partial<Tag>): Tag => ({
  id: '1',
  name: 'Test Tag',
  slug: 'test-tag',
  description: 'A test tag',
  color: '#0080ff',
  articleCount: 5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockPublication = (overrides?: Partial<Publication>): Publication => ({
  id: '1',
  name: 'Test Publication',
  slug: 'test-publication',
  description: 'A test publication',
  ownerId: 'user-123',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockEditorCommand = (overrides?: Partial<EditorCommand>): EditorCommand => ({
  id: '1',
  name: 'Bold',
  description: 'Make text bold',
  command: 'bold',
  shortcut: 'Ctrl+B',
  category: 'formatting',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

export const mockListResponse = <T>(items: T[], total?: number) => ({
  items,
  total: total ?? items.length,
  hasMore: false,
})