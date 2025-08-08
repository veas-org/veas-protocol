/**
 * Knowledge Base protocol type definitions
 */

import type { Entity } from '../common/index.js'

// Article types
export interface Article extends Entity {
  title: string
  slug: string
  content: string
  excerpt?: string
  status: ArticleStatus
  authorId: string
  publicationId?: string
  folderId?: string
  tags?: Tag[]
  publishedAt?: Date
  metadata?: ArticleMetadata
}

export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface ArticleMetadata {
  readTime?: number
  wordCount?: number
  views?: number
  likes?: number
  featuredImage?: string
  seoTitle?: string
  seoDescription?: string
  customData?: Record<string, unknown>
}

export interface CreateArticleData {
  title: string
  slug?: string
  content: string
  excerpt?: string
  status?: ArticleStatus
  publicationId?: string
  folderId?: string
  tags?: string[]
  metadata?: Partial<ArticleMetadata>
}

export interface UpdateArticleData {
  title?: string
  slug?: string
  content?: string
  excerpt?: string
  status?: ArticleStatus
  folderId?: string
  tags?: string[]
  metadata?: Partial<ArticleMetadata>
}

// Folder types
export interface Folder extends Entity {
  name: string
  slug: string
  description?: string
  parentId?: string
  publicationId?: string
  order?: number
  metadata?: Record<string, unknown>
}

export interface CreateFolderData {
  name: string
  slug?: string
  description?: string
  parentId?: string
  publicationId?: string
  order?: number
  metadata?: Record<string, unknown>
}

export interface UpdateFolderData {
  name?: string
  slug?: string
  description?: string
  parentId?: string
  order?: number
  metadata?: Record<string, unknown>
}

// Tag types
export interface Tag extends Entity {
  name: string
  slug: string
  description?: string
  color?: string
  publicationId?: string
  articleCount?: number
}

export interface CreateTagData {
  name: string
  slug?: string
  description?: string
  color?: string
  publicationId?: string
}

export interface UpdateTagData {
  name?: string
  slug?: string
  description?: string
  color?: string
}

// Publication types
export interface Publication extends Entity {
  name: string
  slug: string
  description?: string
  ownerId: string
  settings?: PublicationSettings
}

export interface PublicationSettings {
  theme?: string
  domain?: string
  analytics?: Record<string, unknown>
  customCss?: string
  customJs?: string
}

// Editor command types
export interface EditorCommand extends Entity {
  name: string
  description?: string
  command: string
  shortcut?: string
  category?: string
  isActive: boolean
  publicationId?: string
}

export interface CreateEditorCommandData {
  name: string
  description?: string
  command: string
  shortcut?: string
  category?: string
  isActive?: boolean
  publicationId?: string
}

export interface UpdateEditorCommandData {
  name?: string
  description?: string
  command?: string
  shortcut?: string
  category?: string
  isActive?: boolean
}

// Filter types
export interface ArticleFilters {
  publicationId?: string
  folderId?: string
  status?: ArticleStatus | ArticleStatus[]
  authorId?: string
  tags?: string[]
  search?: string
  publishedAfter?: Date
  publishedBefore?: Date
}

export interface FolderFilters {
  publicationId?: string
  parentId?: string
  search?: string
}

export interface TagFilters {
  publicationId?: string
  search?: string
  minArticleCount?: number
}