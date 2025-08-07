/**
 * Knowledge Base protocol interfaces
 */

import type { ListParams, ListResponse, OutputFormat } from '../common'
import type {
  Article,
  CreateArticleData,
  UpdateArticleData,
  ArticleFilters,
  Folder,
  CreateFolderData,
  UpdateFolderData,
  FolderFilters,
  Tag,
  CreateTagData,
  UpdateTagData,
  TagFilters,
  Publication,
  EditorCommand,
  CreateEditorCommandData,
  UpdateEditorCommandData,
} from './types'

export interface KnowledgeBaseProtocol {
  // Article operations
  listArticles(params: ListParams & { filters?: ArticleFilters } & OutputFormat): Promise<ListResponse<Article>>
  getArticle(id: string, params?: OutputFormat): Promise<Article>
  getArticleBySlug(slug: string, params?: OutputFormat): Promise<Article>
  createArticle(data: CreateArticleData): Promise<Article>
  updateArticle(id: string, data: UpdateArticleData): Promise<Article>
  deleteArticle(id: string): Promise<void>
  publishArticle(id: string): Promise<Article>
  unpublishArticle(id: string): Promise<Article>
  
  // Folder operations
  listFolders(params: ListParams & { filters?: FolderFilters } & OutputFormat): Promise<ListResponse<Folder>>
  getFolder(id: string, params?: OutputFormat): Promise<Folder>
  createFolder(data: CreateFolderData): Promise<Folder>
  updateFolder(id: string, data: UpdateFolderData): Promise<Folder>
  deleteFolder(id: string): Promise<void>
  
  // Tag operations
  listTags(params: ListParams & { filters?: TagFilters } & OutputFormat): Promise<ListResponse<Tag>>
  getTag(id: string, params?: OutputFormat): Promise<Tag>
  getTagBySlug(slug: string, params?: OutputFormat): Promise<Tag>
  createTag(data: CreateTagData): Promise<Tag>
  updateTag(id: string, data: UpdateTagData): Promise<Tag>
  deleteTag(id: string): Promise<void>
  
  // Publication operations (optional)
  listPublications?(params?: ListParams & OutputFormat): Promise<ListResponse<Publication>>
  getPublication?(id: string, params?: OutputFormat): Promise<Publication>
  
  // Editor command operations (optional)
  listEditorCommands?(params?: ListParams & OutputFormat): Promise<ListResponse<EditorCommand>>
  createEditorCommand?(data: CreateEditorCommandData): Promise<EditorCommand>
  updateEditorCommand?(id: string, data: UpdateEditorCommandData): Promise<EditorCommand>
  deleteEditorCommand?(id: string): Promise<void>
  
  // Search operations
  searchArticles(query: string, params?: ListParams & { filters?: ArticleFilters } & OutputFormat): Promise<ListResponse<Article>>
  searchTags?(query: string, params?: ListParams & OutputFormat): Promise<ListResponse<Tag>>
  
  // Bulk operations (optional)
  bulkUpdateArticles?(updates: Array<{ id: string; data: UpdateArticleData }>): Promise<Article[]>
  bulkAddTags?(articleIds: string[], tagIds: string[]): Promise<void>
  bulkRemoveTags?(articleIds: string[], tagIds: string[]): Promise<void>
  moveArticlesToFolder?(articleIds: string[], folderId: string): Promise<void>
  
  // Statistics operations (optional)
  getArticleStatistics?(id: string): Promise<ArticleStatistics>
  getTagStatistics?(id: string): Promise<TagStatistics>
  getPublicationStatistics?(id: string): Promise<PublicationStatistics>
}

// Statistics types
export interface ArticleStatistics {
  views: number
  likes: number
  comments: number
  shares: number
  readTime: number
  wordCount: number
}

export interface TagStatistics {
  articleCount: number
  totalViews: number
  popularArticles: Article[]
}

export interface PublicationStatistics {
  totalArticles: number
  totalViews: number
  totalLikes: number
  topArticles: Article[]
  topTags: Tag[]
}