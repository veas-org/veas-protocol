/**
 * Mock knowledge base implementation for testing
 */

import type {
  KnowledgeBaseProtocol,
  Article,
  CreateArticleData as _CreateArticleData,
  UpdateArticleData as _UpdateArticleData,
  Folder,
  CreateFolderData as _CreateFolderData,
  UpdateFolderData as _UpdateFolderData,
  Tag,
  CreateTagData as _CreateTagData,
  UpdateTagData as _UpdateTagData,
  ArticleStatistics,
  TagStatistics,
} from '../../src'
// import type { ListParams, ListResponse } from '../../src'
import { NotFoundError } from '../../src'
import { mockArticle, mockFolder, mockTag, mockListResponse } from './mock-data'

export function createMockKnowledgeBase(): KnowledgeBaseProtocol {
  const articles = new Map<string, Article>()
  const folders = new Map<string, Folder>()
  const tags = new Map<string, Tag>()

  // Add some initial data
  articles.set('1', mockArticle())
  folders.set('1', mockFolder())
  tags.set('1', mockTag())

  let nextId = 2

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  return {
    // Article operations
    async listArticles(params) {
      let allArticles = Array.from(articles.values())

      // Apply filters
      if (params.filters?.status) {
        const statuses = Array.isArray(params.filters.status) ? params.filters.status : [params.filters.status]
        allArticles = allArticles.filter((a) => statuses.includes(a.status))
      }
      if (params.filters?.folderId) {
        allArticles = allArticles.filter((a) => a.folderId === params.filters!.folderId)
      }
      if (params.filters?.authorId) {
        allArticles = allArticles.filter((a) => a.authorId === params.filters!.authorId)
      }

      const start = params.offset || 0
      const limit = params.limit || 10
      const items = allArticles.slice(start, start + limit)

      return mockListResponse(items, allArticles.length)
    },

    async getArticle(id) {
      const article = articles.get(id)
      if (!article) {
        throw new NotFoundError(`Article with id '${id}' not found`, { resource: 'Article', id })
      }
      return article
    },

    async getArticleBySlug(slug) {
      const article = Array.from(articles.values()).find((a) => a.slug === slug)
      if (!article) {
        throw new NotFoundError(`Article with slug '${slug}' not found`, { resource: 'Article', slug })
      }
      return article
    },

    async createArticle(data) {
      const id = String(nextId++)
      const article: Article = {
        ...mockArticle({ id }),
        ...data,
        slug: data.slug || generateSlug(data.title),
        status: data.status || 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      articles.set(id, article)
      return article
    },

    async updateArticle(id, data) {
      const article = articles.get(id)
      if (!article) {
        throw new NotFoundError(`Article with id '${id}' not found`, { resource: 'Article', id })
      }
      const updated = {
        ...article,
        ...data,
        slug: data.slug || (data.title ? generateSlug(data.title) : article.slug),
        updatedAt: new Date(),
      }
      articles.set(id, updated)
      return updated
    },

    async deleteArticle(id) {
      if (!articles.has(id)) {
        throw new NotFoundError(`Article with id '${id}' not found`, { resource: 'Article', id })
      }
      articles.delete(id)
    },

    async publishArticle(id) {
      const article = articles.get(id)
      if (!article) {
        throw new NotFoundError(`Article with id '${id}' not found`, { resource: 'Article', id })
      }
      const published = {
        ...article,
        status: 'published' as const,
        publishedAt: new Date(),
        updatedAt: new Date(),
      }
      articles.set(id, published)
      return published
    },

    async unpublishArticle(id) {
      const article = articles.get(id)
      if (!article) {
        throw new NotFoundError(`Article with id '${id}' not found`, { resource: 'Article', id })
      }
      const unpublished = {
        ...article,
        status: 'draft' as const,
        publishedAt: undefined,
        updatedAt: new Date(),
      }
      articles.set(id, unpublished)
      return unpublished
    },

    // Folder operations
    async listFolders(params) {
      let allFolders = Array.from(folders.values())

      // Apply filters
      if (params.filters?.parentId) {
        allFolders = allFolders.filter((f) => f.parentId === params.filters!.parentId)
      }

      const start = params.offset || 0
      const limit = params.limit || 10
      const items = allFolders.slice(start, start + limit)

      return mockListResponse(items, allFolders.length)
    },

    async getFolder(id) {
      const folder = folders.get(id)
      if (!folder) {
        throw new NotFoundError(`Folder with id '${id}' not found`, { resource: 'Folder', id })
      }
      return folder
    },

    async createFolder(data) {
      const id = String(nextId++)
      const folder: Folder = {
        ...mockFolder({ id }),
        ...data,
        slug: data.slug || generateSlug(data.name),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      folders.set(id, folder)
      return folder
    },

    async updateFolder(id, data) {
      const folder = folders.get(id)
      if (!folder) {
        throw new NotFoundError(`Folder with id '${id}' not found`, { resource: 'Folder', id })
      }
      const updated = {
        ...folder,
        ...data,
        slug: data.slug || (data.name ? generateSlug(data.name) : folder.slug),
        updatedAt: new Date(),
      }
      folders.set(id, updated)
      return updated
    },

    async deleteFolder(id) {
      if (!folders.has(id)) {
        throw new NotFoundError(`Folder with id '${id}' not found`, { resource: 'Folder', id })
      }
      folders.delete(id)
    },

    // Tag operations
    async listTags(params) {
      let allTags = Array.from(tags.values())

      // Apply filters
      if (params.filters?.minArticleCount) {
        allTags = allTags.filter((t) => (t.articleCount || 0) >= params.filters!.minArticleCount!)
      }

      const start = params.offset || 0
      const limit = params.limit || 10
      const items = allTags.slice(start, start + limit)

      return mockListResponse(items, allTags.length)
    },

    async getTag(id) {
      const tag = tags.get(id)
      if (!tag) {
        throw new NotFoundError(`Tag with id '${id}' not found`, { resource: 'Tag', id })
      }
      return tag
    },

    async getTagBySlug(slug) {
      const tag = Array.from(tags.values()).find((t) => t.slug === slug)
      if (!tag) {
        throw new NotFoundError(`Tag with slug '${slug}' not found`, { resource: 'Tag', slug })
      }
      return tag
    },

    async createTag(data) {
      const id = String(nextId++)
      const tag: Tag = {
        ...mockTag({ id }),
        ...data,
        slug: data.slug || generateSlug(data.name),
        color: data.color || '#0080ff',
        articleCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      tags.set(id, tag)
      return tag
    },

    async updateTag(id, data) {
      const tag = tags.get(id)
      if (!tag) {
        throw new NotFoundError(`Tag with id '${id}' not found`, { resource: 'Tag', id })
      }
      const updated = {
        ...tag,
        ...data,
        slug: data.slug || (data.name ? generateSlug(data.name) : tag.slug),
        updatedAt: new Date(),
      }
      tags.set(id, updated)
      return updated
    },

    async deleteTag(id) {
      if (!tags.has(id)) {
        throw new NotFoundError(`Tag with id '${id}' not found`, { resource: 'Tag', id })
      }
      tags.delete(id)
    },

    // Search operations
    async searchArticles(query, params) {
      const filtered = Array.from(articles.values()).filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.content.toLowerCase().includes(query.toLowerCase()) ||
          a.excerpt?.toLowerCase().includes(query.toLowerCase()),
      )
      const start = params?.offset || 0
      const limit = params?.limit || 10
      const items = filtered.slice(start, start + limit)

      return mockListResponse(items, filtered.length)
    },

    async searchTags(query, params) {
      const filtered = Array.from(tags.values()).filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.description?.toLowerCase().includes(query.toLowerCase()),
      )
      const start = params?.offset || 0
      const limit = params?.limit || 10
      const items = filtered.slice(start, start + limit)

      return mockListResponse(items, filtered.length)
    },

    // Statistics operations
    async getArticleStatistics(id): Promise<ArticleStatistics> {
      const article = articles.get(id)
      if (!article) {
        throw new NotFoundError(`Article with id '${id}' not found`, { resource: 'Article', id })
      }

      return {
        views: Math.floor(Math.random() * 10000),
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
        readTime: Math.ceil(article.content.length / 200), // Estimate based on content length
        wordCount: article.content.split(/\s+/).length,
      }
    },

    async getTagStatistics(id): Promise<TagStatistics> {
      const tag = tags.get(id)
      if (!tag) {
        throw new NotFoundError(`Tag with id '${id}' not found`, { resource: 'Tag', id })
      }

      const tagArticles = Array.from(articles.values()).filter((a) => a.tags?.some((t) => t.id === id))

      return {
        articleCount: tagArticles.length,
        totalViews: tagArticles.length * Math.floor(Math.random() * 5000),
        popularArticles: tagArticles.slice(0, 5),
      }
    },
  }
}
