/**
 * Tests for Knowledge Base Protocol interface
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { KnowledgeBaseProtocol } from '../../src'
import { NotFoundError } from '../../src'
import { createMockKnowledgeBase } from '../utils/mock-knowledge-base'

describe('KnowledgeBaseProtocol', () => {
  let protocol: KnowledgeBaseProtocol

  beforeEach(() => {
    protocol = createMockKnowledgeBase()
  })

  describe('Article Operations', () => {
    it('should list articles with pagination', async () => {
      const result = await protocol.listArticles({ limit: 10, offset: 0 })

      expect(result).toHaveProperty('items')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('hasMore')
      expect(result.items).toBeInstanceOf(Array)
      expect(result.items.length).toBeLessThanOrEqual(10)
    })

    it('should filter articles by status', async () => {
      // Create articles with different statuses
      await protocol.createArticle({
        title: 'Published Article',
        content: 'Content',
        status: 'published',
      })

      await protocol.createArticle({
        title: 'Draft Article',
        content: 'Content',
        status: 'draft',
      })

      const published = await protocol.listArticles({
        filters: { status: 'published' },
      })

      expect(published.items.every((a) => a.status === 'published')).toBe(true)
    })

    it('should get an article by ID', async () => {
      const article = await protocol.getArticle('1')

      expect(article).toHaveProperty('id', '1')
      expect(article).toHaveProperty('title')
      expect(article).toHaveProperty('slug')
      expect(article).toHaveProperty('content')
      expect(article).toHaveProperty('status')
      expect(article).toHaveProperty('createdAt')
    })

    it('should get an article by slug', async () => {
      const article = await protocol.getArticleBySlug('test-article')

      expect(article).toHaveProperty('slug', 'test-article')
      expect(article).toHaveProperty('title')
    })

    it('should throw NotFoundError for non-existent article', async () => {
      await expect(protocol.getArticle('999')).rejects.toThrow(NotFoundError)
      await expect(protocol.getArticleBySlug('non-existent')).rejects.toThrow(NotFoundError)
    })

    it('should create a new article', async () => {
      const data = {
        title: 'New Article',
        content: 'Article content here',
        excerpt: 'Short summary',
        tags: ['tag1', 'tag2'],
      }

      const article = await protocol.createArticle(data)

      expect(article).toHaveProperty('id')
      expect(article.title).toBe(data.title)
      expect(article.content).toBe(data.content)
      expect(article.excerpt).toBe(data.excerpt)
      expect(article.status).toBe('draft')
      expect(article).toHaveProperty('slug')
    })

    it('should auto-generate slug from title', async () => {
      const article = await protocol.createArticle({
        title: 'This Is A Test Article!',
        content: 'Content',
      })

      expect(article.slug).toBe('this-is-a-test-article')
    })

    it('should update an article', async () => {
      const updates = {
        title: 'Updated Title',
        status: 'published' as const,
      }

      const article = await protocol.updateArticle('1', updates)

      expect(article.id).toBe('1')
      expect(article.title).toBe(updates.title)
      expect(article.status).toBe(updates.status)
    })

    it('should publish and unpublish articles', async () => {
      // Publish
      const published = await protocol.publishArticle('1')
      expect(published.status).toBe('published')
      expect(published).toHaveProperty('publishedAt')

      // Unpublish
      const unpublished = await protocol.unpublishArticle('1')
      expect(unpublished.status).toBe('draft')
      expect(unpublished.publishedAt).toBeUndefined()
    })

    it('should delete an article', async () => {
      await expect(protocol.deleteArticle('1')).resolves.toBeUndefined()
      await expect(protocol.getArticle('1')).rejects.toThrow(NotFoundError)
    })

    it('should search articles', async () => {
      // Create searchable articles
      await protocol.createArticle({
        title: 'TypeScript Tutorial',
        content: 'Learn TypeScript basics',
      })

      const result = await protocol.searchArticles('typescript')

      expect(result).toHaveProperty('items')
      expect(
        result.items.some(
          (a) => a.title.toLowerCase().includes('typescript') || a.content.toLowerCase().includes('typescript'),
        ),
      ).toBe(true)
    })
  })

  describe('Folder Operations', () => {
    it('should list folders', async () => {
      const result = await protocol.listFolders({})

      expect(result).toHaveProperty('items')
      expect(result.items).toBeInstanceOf(Array)
    })

    it('should create a folder', async () => {
      const data = {
        name: 'Documentation',
        description: 'Project documentation',
      }

      const folder = await protocol.createFolder(data)

      expect(folder).toHaveProperty('id')
      expect(folder.name).toBe(data.name)
      expect(folder.description).toBe(data.description)
      expect(folder).toHaveProperty('slug', 'documentation')
    })

    it('should create nested folders', async () => {
      const parent = await protocol.createFolder({
        name: 'Parent Folder',
      })

      const child = await protocol.createFolder({
        name: 'Child Folder',
        parentId: parent.id,
      })

      expect(child.parentId).toBe(parent.id)

      // List only children of parent
      const children = await protocol.listFolders({
        filters: { parentId: parent.id },
      })

      expect(children.items).toContainEqual(child)
    })

    it('should update a folder', async () => {
      const folder = await protocol.updateFolder('1', {
        name: 'Updated Folder Name',
      })

      expect(folder.id).toBe('1')
      expect(folder.name).toBe('Updated Folder Name')
      expect(folder.slug).toBe('updated-folder-name')
    })

    it('should delete a folder', async () => {
      await expect(protocol.deleteFolder('1')).resolves.toBeUndefined()
    })
  })

  describe('Tag Operations', () => {
    it('should list tags', async () => {
      const result = await protocol.listTags({})

      expect(result).toHaveProperty('items')
      expect(result.items).toBeInstanceOf(Array)
    })

    it('should filter tags by article count', async () => {
      // Create tags with different article counts
      await protocol.createTag({
        name: 'Popular Tag',
      })

      const result = await protocol.listTags({
        filters: { minArticleCount: 5 },
      })

      expect(result.items.every((t) => (t.articleCount || 0) >= 5)).toBe(true)
    })

    it('should get a tag by ID and slug', async () => {
      const tagById = await protocol.getTag('1')
      expect(tagById).toHaveProperty('id', '1')

      const tagBySlug = await protocol.getTagBySlug('test-tag')
      expect(tagBySlug).toHaveProperty('slug', 'test-tag')
    })

    it('should create a tag', async () => {
      const data = {
        name: 'JavaScript',
        description: 'JavaScript related content',
        color: '#f7df1e',
      }

      const tag = await protocol.createTag(data)

      expect(tag).toHaveProperty('id')
      expect(tag.name).toBe(data.name)
      expect(tag.description).toBe(data.description)
      expect(tag.color).toBe(data.color)
      expect(tag.slug).toBe('javascript')
      expect(tag.articleCount).toBe(0)
    })

    it('should update a tag', async () => {
      const tag = await protocol.updateTag('1', {
        name: 'Updated Tag',
        color: '#ff0000',
      })

      expect(tag.id).toBe('1')
      expect(tag.name).toBe('Updated Tag')
      expect(tag.color).toBe('#ff0000')
    })

    it('should delete a tag', async () => {
      await expect(protocol.deleteTag('1')).resolves.toBeUndefined()
      await expect(protocol.getTag('1')).rejects.toThrow(NotFoundError)
    })

    it('should search tags if implemented', async () => {
      if (protocol.searchTags) {
        const result = await protocol.searchTags('test')

        expect(result).toHaveProperty('items')
        expect(result.items).toBeInstanceOf(Array)
      }
    })
  })

  describe('Statistics Operations', () => {
    it('should get article statistics if implemented', async () => {
      if (protocol.getArticleStatistics) {
        const stats = await protocol.getArticleStatistics('1')

        expect(stats).toHaveProperty('views')
        expect(stats).toHaveProperty('likes')
        expect(stats).toHaveProperty('comments')
        expect(stats).toHaveProperty('shares')
        expect(stats).toHaveProperty('readTime')
        expect(stats).toHaveProperty('wordCount')
        expect(typeof stats.views).toBe('number')
      }
    })

    it('should get tag statistics if implemented', async () => {
      if (protocol.getTagStatistics) {
        const stats = await protocol.getTagStatistics('1')

        expect(stats).toHaveProperty('articleCount')
        expect(stats).toHaveProperty('totalViews')
        expect(stats).toHaveProperty('popularArticles')
        expect(stats.popularArticles).toBeInstanceOf(Array)
      }
    })
  })

  describe('Bulk Operations', () => {
    it('should bulk update articles if implemented', async () => {
      if (protocol.bulkUpdateArticles) {
        const updates = [{ id: '1', data: { status: 'published' as const } }]

        const results = await protocol.bulkUpdateArticles(updates)

        expect(results).toBeInstanceOf(Array)
        expect(results[0]?.status).toBe('published')
      }
    })

    it('should move articles to folder if implemented', async () => {
      if (protocol.moveArticlesToFolder) {
        const folder = await protocol.createFolder({ name: 'Target Folder' })

        await expect(protocol.moveArticlesToFolder(['1'], folder.id)).resolves.toBeUndefined()
      }
    })
  })
})
