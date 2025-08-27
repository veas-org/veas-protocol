import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotFoundError } from '../../protocols/common/types'
import { VeasKnowledgeBaseMCPProvider } from './knowledge-base-mcp'

describe('VeasKnowledgeBaseMCPProvider', () => {
  let provider: VeasKnowledgeBaseMCPProvider
  let mockCallMCPTool: ReturnType<typeof vi.fn>
  let mockRequireScopes: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockCallMCPTool = vi.fn()
    mockRequireScopes = vi.fn()

    provider = new VeasKnowledgeBaseMCPProvider({
      mcpEndpoint: 'http://test',
    })

    // Mock the protected methods
    ;(provider as any).callMCPTool = mockCallMCPTool
    ;(provider as any).requireScopes = mockRequireScopes
  })

  describe('Article operations', () => {
    it('should list articles', async () => {
      const mockArticles = [
        { id: '1', title: 'Article 1' },
        { id: '2', title: 'Article 2' },
      ]
      mockCallMCPTool.mockResolvedValue({
        articles: mockArticles,
        total: 2,
        hasMore: false,
      })

      const result = await provider.listArticles({
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        filters: { status: 'published' },
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_list_articles', {
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        output_format: 'json',
        filters: { status: 'published' },
      })
      expect(result).toEqual({
        items: mockArticles,
        total: 2,
        hasMore: false,
      })
    })

    it('should handle empty article list', async () => {
      mockCallMCPTool.mockResolvedValue({
        total: 0,
        hasMore: false,
      })

      const result = await provider.listArticles({
        limit: 10,
        outputFormat: 'json',
      })

      expect(result).toEqual({
        items: [],
        total: 0,
        hasMore: false,
      })
    })

    it('should get an article by id', async () => {
      const mockArticle = { id: '1', title: 'Test Article' }
      mockCallMCPTool.mockResolvedValue({ article: mockArticle })

      const result = await provider.getArticle('1', { outputFormat: 'markdown' })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_get_article', {
        id: '1',
        output_format: 'markdown',
      })
      expect(result).toEqual(mockArticle)
    })

    it('should throw NotFoundError when article not found', async () => {
      mockCallMCPTool.mockResolvedValue(null)

      await expect(provider.getArticle('nonexistent')).rejects.toThrow(new NotFoundError('Article', 'nonexistent'))
    })

    it('should get article by slug', async () => {
      const mockArticle = { id: '1', slug: 'test-article' }
      mockCallMCPTool.mockResolvedValue({ article: mockArticle })

      const result = await provider.getArticleBySlug('test-article')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_get_article_by_slug', {
        slug: 'test-article',
        output_format: undefined,
      })
      expect(result).toEqual(mockArticle)
    })

    it('should throw NotFoundError when article not found by slug', async () => {
      mockCallMCPTool.mockResolvedValue({})

      await expect(provider.getArticleBySlug('nonexistent')).rejects.toThrow(
        new NotFoundError('Article', 'nonexistent'),
      )
    })

    it('should create an article', async () => {
      const mockArticle = { id: '1', title: 'New Article' }
      mockCallMCPTool.mockResolvedValue({ article: mockArticle })

      const result = await provider.createArticle({
        title: 'New Article',
        content: 'Content',
        publicationId: 'pub-1',
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_create_article', {
        title: 'New Article',
        content: 'Content',
        publicationId: 'pub-1',
      })
      expect(result).toEqual(mockArticle)
    })

    it('should update an article', async () => {
      const mockArticle = { id: '1', title: 'Updated Article' }
      mockCallMCPTool.mockResolvedValue({ article: mockArticle })

      const result = await provider.updateArticle('1', {
        title: 'Updated Article',
        content: 'Updated content',
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_update_article', {
        id: '1',
        title: 'Updated Article',
        content: 'Updated content',
      })
      expect(result).toEqual(mockArticle)
    })

    it('should delete an article', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.deleteArticle('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_delete_article', { id: '1' })
    })

    it('should publish an article', async () => {
      const mockArticle = { id: '1', status: 'published' }
      mockCallMCPTool.mockResolvedValue({ article: mockArticle })

      const result = await provider.publishArticle('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_publish_article', { id: '1' })
      expect(result).toEqual(mockArticle)
    })

    it('should unpublish an article', async () => {
      const mockArticle = { id: '1', status: 'draft' }
      mockCallMCPTool.mockResolvedValue({ article: mockArticle })

      const result = await provider.unpublishArticle('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_unpublish_article', { id: '1' })
      expect(result).toEqual(mockArticle)
    })
  })

  describe('Folder operations', () => {
    it('should list folders', async () => {
      const mockFolders = [
        { id: '1', name: 'Folder 1' },
        { id: '2', name: 'Folder 2' },
      ]
      mockCallMCPTool.mockResolvedValue({
        folders: mockFolders,
        total: 2,
        hasMore: false,
      })

      const result = await provider.listFolders({
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        filters: { parentId: 'parent-1' },
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_list_folders', {
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        output_format: 'json',
        filters: { parentId: 'parent-1' },
      })
      expect(result).toEqual({
        items: mockFolders,
        total: 2,
        hasMore: false,
      })
    })

    it('should get a folder', async () => {
      const mockFolder = { id: '1', name: 'Test Folder' }
      mockCallMCPTool.mockResolvedValue({ folder: mockFolder })

      const result = await provider.getFolder('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_get_folder', {
        id: '1',
        output_format: undefined,
      })
      expect(result).toEqual(mockFolder)
    })

    it('should throw NotFoundError when folder not found', async () => {
      mockCallMCPTool.mockResolvedValue(null)

      await expect(provider.getFolder('nonexistent')).rejects.toThrow(new NotFoundError('Folder', 'nonexistent'))
    })

    it('should create a folder', async () => {
      const mockFolder = { id: '1', name: 'New Folder' }
      mockCallMCPTool.mockResolvedValue({ folder: mockFolder })

      const result = await provider.createFolder({
        name: 'New Folder',
        publicationId: 'pub-1',
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_create_folder', {
        name: 'New Folder',
        publicationId: 'pub-1',
      })
      expect(result).toEqual(mockFolder)
    })

    it('should update a folder', async () => {
      const mockFolder = { id: '1', name: 'Updated Folder' }
      mockCallMCPTool.mockResolvedValue({ folder: mockFolder })

      const result = await provider.updateFolder('1', {
        name: 'Updated Folder',
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_update_folder', {
        id: '1',
        name: 'Updated Folder',
      })
      expect(result).toEqual(mockFolder)
    })

    it('should delete a folder', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.deleteFolder('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_delete_folder', { id: '1' })
    })
  })

  describe('Tag operations', () => {
    it('should list tags', async () => {
      const mockTags = [
        { id: '1', name: 'Tag 1' },
        { id: '2', name: 'Tag 2' },
      ]
      mockCallMCPTool.mockResolvedValue({
        tags: mockTags,
        total: 2,
        hasMore: false,
      })

      const result = await provider.listTags({
        limit: 10,
        offset: 0,
        outputFormat: 'json',
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_list_tags', {
        limit: 10,
        offset: 0,
        outputFormat: 'json',
        output_format: 'json',
      })
      expect(result).toEqual({
        items: mockTags,
        total: 2,
        hasMore: false,
      })
    })

    it('should get a tag', async () => {
      const mockTag = { id: '1', name: 'Test Tag' }
      mockCallMCPTool.mockResolvedValue({ tag: mockTag })

      const result = await provider.getTag('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_get_tag', {
        id: '1',
        output_format: undefined,
      })
      expect(result).toEqual(mockTag)
    })

    it('should throw NotFoundError when tag not found', async () => {
      mockCallMCPTool.mockResolvedValue({})

      await expect(provider.getTag('nonexistent')).rejects.toThrow(new NotFoundError('Tag', 'nonexistent'))
    })

    it('should get tag by slug', async () => {
      const mockTag = { id: '1', slug: 'test-tag' }
      mockCallMCPTool.mockResolvedValue({ tag: mockTag })

      const result = await provider.getTagBySlug('test-tag')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_get_tag_by_slug', {
        slug: 'test-tag',
        output_format: undefined,
      })
      expect(result).toEqual(mockTag)
    })

    it('should create a tag', async () => {
      const mockTag = { id: '1', name: 'New Tag' }
      mockCallMCPTool.mockResolvedValue({ tag: mockTag })

      const result = await provider.createTag({
        name: 'New Tag',
        publicationId: 'pub-1',
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_create_tag', {
        name: 'New Tag',
        publicationId: 'pub-1',
      })
      expect(result).toEqual(mockTag)
    })

    it('should update a tag', async () => {
      const mockTag = { id: '1', name: 'Updated Tag' }
      mockCallMCPTool.mockResolvedValue({ tag: mockTag })

      const result = await provider.updateTag('1', {
        name: 'Updated Tag',
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_update_tag', {
        id: '1',
        name: 'Updated Tag',
      })
      expect(result).toEqual(mockTag)
    })

    it('should delete a tag', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.deleteTag('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_delete_tag', { id: '1' })
    })
  })

  describe('Search operations', () => {
    it('should search articles', async () => {
      const mockArticles = [{ id: '1', title: 'Search Result 1' }]
      mockCallMCPTool.mockResolvedValue({
        articles: mockArticles,
        total: 1,
        hasMore: false,
      })

      const result = await provider.searchArticles('test query', {
        limit: 10,
        outputFormat: 'json',
        filters: { status: 'published' },
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_search_articles', {
        query: 'test query',
        limit: 10,
        outputFormat: 'json',
        output_format: 'json',
        filters: { status: 'published' },
      })
      expect(result).toEqual({
        items: mockArticles,
        total: 1,
        hasMore: false,
      })
    })

    it('should search tags', async () => {
      const mockTags = [{ id: '1', name: 'Search Tag' }]
      mockCallMCPTool.mockResolvedValue({
        tags: mockTags,
        total: 1,
        hasMore: false,
      })

      const result = await provider.searchTags?.('test query', {
        limit: 10,
        outputFormat: 'json',
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_search_tags', {
        query: 'test query',
        limit: 10,
        outputFormat: 'json',
        output_format: 'json',
      })
      expect(result).toEqual({
        items: mockTags,
        total: 1,
        hasMore: false,
      })
    })
  })

  describe('Optional operations', () => {
    it('should list publications', async () => {
      const mockPublications = [{ id: '1', name: 'Publication 1' }]
      mockCallMCPTool.mockResolvedValue({
        publications: mockPublications,
        total: 1,
        hasMore: false,
      })

      const result = await provider.listPublications?.({
        limit: 10,
        outputFormat: 'json',
      })

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_list_publications', {
        limit: 10,
        outputFormat: 'json',
        output_format: 'json',
      })
      expect(result).toEqual({
        items: mockPublications,
        total: 1,
        hasMore: false,
      })
    })

    it('should get a publication', async () => {
      const mockPublication = { id: '1', name: 'Test Publication' }
      mockCallMCPTool.mockResolvedValue({ publication: mockPublication })

      const result = await provider.getPublication?.('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_get_publication', {
        id: '1',
        output_format: undefined,
      })
      expect(result).toEqual(mockPublication)
    })

    it('should throw NotFoundError when publication not found', async () => {
      mockCallMCPTool.mockResolvedValue(null)

      await expect(provider.getPublication?.('nonexistent')).rejects.toThrow(
        new NotFoundError('Publication', 'nonexistent'),
      )
    })

    it('should list editor commands', async () => {
      const mockCommands = [{ id: '1', name: 'Command 1' }]
      mockCallMCPTool.mockResolvedValue({
        commands: mockCommands,
        total: 1,
        hasMore: false,
      })

      const result = await provider.listEditorCommands?.({
        limit: 10,
        outputFormat: 'json',
      })

      expect(result).toEqual({
        items: mockCommands,
        total: 1,
        hasMore: false,
      })
    })

    it('should create editor command', async () => {
      const mockCommand = { id: '1', name: 'New Command' }
      mockCallMCPTool.mockResolvedValue({ command: mockCommand })

      const result = await provider.createEditorCommand?.({
        name: 'New Command',
        command: 'test-command',
      })

      expect(result).toEqual(mockCommand)
    })

    it('should update editor command', async () => {
      const mockCommand = { id: '1', name: 'Updated Command' }
      mockCallMCPTool.mockResolvedValue({ command: mockCommand })

      const result = await provider.updateEditorCommand?.('1', {
        name: 'Updated Command',
      })

      expect(result).toEqual(mockCommand)
    })

    it('should delete editor command', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.deleteEditorCommand?.('1')

      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_delete_editor_command', { id: '1' })
    })
  })

  describe('Statistics operations', () => {
    it('should get article statistics', async () => {
      const mockStats = { views: 100, likes: 10 }
      mockCallMCPTool.mockResolvedValue({ statistics: mockStats })

      const result = await provider.getArticleStatistics?.('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_get_article_statistics', { id: '1' })
      expect(result).toEqual(mockStats)
    })

    it('should get tag statistics', async () => {
      const mockStats = { articleCount: 50 }
      mockCallMCPTool.mockResolvedValue({ statistics: mockStats })

      const result = await provider.getTagStatistics?.('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_get_tag_statistics', { id: '1' })
      expect(result).toEqual(mockStats)
    })

    it('should get publication statistics', async () => {
      const mockStats = { totalArticles: 100, totalViews: 1000 }
      mockCallMCPTool.mockResolvedValue({ statistics: mockStats })

      const result = await provider.getPublicationStatistics?.('1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:read'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_get_publication_statistics', { id: '1' })
      expect(result).toEqual(mockStats)
    })
  })

  describe('Bulk operations', () => {
    it('should bulk update articles', async () => {
      const mockArticles = [
        { id: '1', title: 'Updated 1' },
        { id: '2', title: 'Updated 2' },
      ]
      mockCallMCPTool.mockResolvedValue({ articles: mockArticles })

      const result = await provider.bulkUpdateArticles?.([
        { id: '1', data: { title: 'Updated 1' } },
        { id: '2', data: { title: 'Updated 2' } },
      ])

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_bulk_update_articles', {
        updates: [
          { id: '1', data: { title: 'Updated 1' } },
          { id: '2', data: { title: 'Updated 2' } },
        ],
      })
      expect(result).toEqual(mockArticles)
    })

    it('should bulk add tags', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.bulkAddTags?.(['article-1', 'article-2'], ['tag-1', 'tag-2'])

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_bulk_add_tags', {
        article_ids: ['article-1', 'article-2'],
        tag_ids: ['tag-1', 'tag-2'],
      })
    })

    it('should bulk remove tags', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.bulkRemoveTags?.(['article-1', 'article-2'], ['tag-1', 'tag-2'])

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_bulk_remove_tags', {
        article_ids: ['article-1', 'article-2'],
        tag_ids: ['tag-1', 'tag-2'],
      })
    })

    it('should move articles to folder', async () => {
      mockCallMCPTool.mockResolvedValue(undefined)

      await provider.moveArticlesToFolder?.(['article-1', 'article-2'], 'folder-1')

      expect(mockRequireScopes).toHaveBeenCalledWith(['articles:write'])
      expect(mockCallMCPTool).toHaveBeenCalledWith('mcp-articles_move_articles_to_folder', {
        article_ids: ['article-1', 'article-2'],
        folder_id: 'folder-1',
      })
    })
  })
})
