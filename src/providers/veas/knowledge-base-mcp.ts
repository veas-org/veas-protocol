/**
 * Veas MCP provider implementation for Knowledge Base protocol
 */

import type { ListParams, ListResponse, OutputFormat } from '../../protocols/common/index.js'
import { NotFoundError } from '../../protocols/common/index.js'
import type {
  Article,
  ArticleFilters,
  ArticleStatistics,
  CreateArticleData,
  CreateEditorCommandData,
  CreateFolderData,
  CreateTagData,
  EditorCommand,
  Folder,
  FolderFilters,
  KnowledgeBaseProtocol,
  Publication,
  PublicationStatistics,
  Tag,
  TagFilters,
  TagStatistics,
  UpdateArticleData,
  UpdateEditorCommandData,
  UpdateFolderData,
  UpdateTagData,
} from '../../protocols/knowledge-base/index.js'
import { BaseMCPProvider } from './base-mcp-provider.js'

export class VeasKnowledgeBaseMCPProvider extends BaseMCPProvider implements KnowledgeBaseProtocol {
  // Article operations
  async listArticles(params: ListParams & { filters?: ArticleFilters } & OutputFormat): Promise<ListResponse<Article>> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_list_articles', {
      ...params,
      output_format: params.outputFormat,
    })

    return {
      items: result.articles || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async getArticle(id: string, params?: OutputFormat): Promise<Article> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_get_article', {
      id,
      output_format: params?.outputFormat,
    })

    if (!result || !result.article) {
      throw new NotFoundError('Article', id)
    }

    return result.article
  }

  async getArticleBySlug(slug: string, params?: OutputFormat): Promise<Article> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_get_article_by_slug', {
      slug,
      output_format: params?.outputFormat,
    })

    if (!result || !result.article) {
      throw new NotFoundError('Article', slug)
    }

    return result.article
  }

  async createArticle(data: CreateArticleData): Promise<Article> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_create_article', data)
    return result.article
  }

  async updateArticle(id: string, data: UpdateArticleData): Promise<Article> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_update_article', {
      id,
      ...data,
    })
    return result.article
  }

  async deleteArticle(id: string): Promise<void> {
    this.requireScopes(['articles:write'])

    await this.callMCPTool('mcp-articles_delete_article', { id })
  }

  async publishArticle(id: string): Promise<Article> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_publish_article', { id })
    return result.article
  }

  async unpublishArticle(id: string): Promise<Article> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_unpublish_article', { id })
    return result.article
  }

  // Folder operations
  async listFolders(params: ListParams & { filters?: FolderFilters } & OutputFormat): Promise<ListResponse<Folder>> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_list_folders', {
      ...params,
      output_format: params.outputFormat,
    })

    return {
      items: result.folders || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async getFolder(id: string, params?: OutputFormat): Promise<Folder> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_get_folder', {
      id,
      output_format: params?.outputFormat,
    })

    if (!result || !result.folder) {
      throw new NotFoundError('Folder', id)
    }

    return result.folder
  }

  async createFolder(data: CreateFolderData): Promise<Folder> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_create_folder', data)
    return result.folder
  }

  async updateFolder(id: string, data: UpdateFolderData): Promise<Folder> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_update_folder', {
      id,
      ...data,
    })
    return result.folder
  }

  async deleteFolder(id: string): Promise<void> {
    this.requireScopes(['articles:write'])

    await this.callMCPTool('mcp-articles_delete_folder', { id })
  }

  // Tag operations
  async listTags(params: ListParams & { filters?: TagFilters } & OutputFormat): Promise<ListResponse<Tag>> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_list_tags', {
      ...params,
      output_format: params.outputFormat,
    })

    return {
      items: result.tags || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async getTag(id: string, params?: OutputFormat): Promise<Tag> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_get_tag', {
      id,
      output_format: params?.outputFormat,
    })

    if (!result || !result.tag) {
      throw new NotFoundError('Tag', id)
    }

    return result.tag
  }

  async getTagBySlug(slug: string, params?: OutputFormat): Promise<Tag> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_get_tag_by_slug', {
      slug,
      output_format: params?.outputFormat,
    })

    if (!result || !result.tag) {
      throw new NotFoundError('Tag', slug)
    }

    return result.tag
  }

  async createTag(data: CreateTagData): Promise<Tag> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_create_tag', data)
    return result.tag
  }

  async updateTag(id: string, data: UpdateTagData): Promise<Tag> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_update_tag', {
      id,
      ...data,
    })
    return result.tag
  }

  async deleteTag(id: string): Promise<void> {
    this.requireScopes(['articles:write'])

    await this.callMCPTool('mcp-articles_delete_tag', { id })
  }

  // Search operations
  async searchArticles(
    query: string,
    params?: ListParams & { filters?: ArticleFilters } & OutputFormat,
  ): Promise<ListResponse<Article>> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_search_articles', {
      query,
      ...params,
      output_format: params?.outputFormat,
    })

    return {
      items: result.articles || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async searchTags?(query: string, params?: ListParams & OutputFormat): Promise<ListResponse<Tag>> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_search_tags', {
      query,
      ...params,
      output_format: params?.outputFormat,
    })

    return {
      items: result.tags || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  // Optional operations - these would need corresponding MCP tools to be implemented
  async listPublications?(params?: ListParams & OutputFormat): Promise<ListResponse<Publication>> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_list_publications', {
      ...params,
      output_format: params?.outputFormat,
    })

    return {
      items: result.publications || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async getPublication?(id: string, params?: OutputFormat): Promise<Publication> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_get_publication', {
      id,
      output_format: params?.outputFormat,
    })

    if (!result || !result.publication) {
      throw new NotFoundError('Publication', id)
    }

    return result.publication
  }

  async listEditorCommands?(params?: ListParams & OutputFormat): Promise<ListResponse<EditorCommand>> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_list_editor_commands', {
      ...params,
      output_format: params?.outputFormat,
    })

    return {
      items: result.commands || [],
      total: result.total,
      hasMore: result.hasMore,
    }
  }

  async createEditorCommand?(data: CreateEditorCommandData): Promise<EditorCommand> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_create_editor_command', data)
    return result.command
  }

  async updateEditorCommand?(id: string, data: UpdateEditorCommandData): Promise<EditorCommand> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_update_editor_command', {
      id,
      ...data,
    })
    return result.command
  }

  async deleteEditorCommand?(id: string): Promise<void> {
    this.requireScopes(['articles:write'])

    await this.callMCPTool('mcp-articles_delete_editor_command', { id })
  }

  // Statistics operations
  async getArticleStatistics?(id: string): Promise<ArticleStatistics> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_get_article_statistics', { id })
    return result.statistics
  }

  async getTagStatistics?(id: string): Promise<TagStatistics> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_get_tag_statistics', { id })
    return result.statistics
  }

  async getPublicationStatistics?(id: string): Promise<PublicationStatistics> {
    this.requireScopes(['articles:read'])

    const result = await this.callMCPTool<any>('mcp-articles_get_publication_statistics', { id })
    return result.statistics
  }

  // Bulk operations
  async bulkUpdateArticles?(updates: Array<{ id: string; data: UpdateArticleData }>): Promise<Article[]> {
    this.requireScopes(['articles:write'])

    const result = await this.callMCPTool<any>('mcp-articles_bulk_update_articles', {
      updates,
    })

    return result.articles || []
  }

  async bulkAddTags?(articleIds: string[], tagIds: string[]): Promise<void> {
    this.requireScopes(['articles:write'])

    await this.callMCPTool('mcp-articles_bulk_add_tags', {
      article_ids: articleIds,
      tag_ids: tagIds,
    })
  }

  async bulkRemoveTags?(articleIds: string[], tagIds: string[]): Promise<void> {
    this.requireScopes(['articles:write'])

    await this.callMCPTool('mcp-articles_bulk_remove_tags', {
      article_ids: articleIds,
      tag_ids: tagIds,
    })
  }

  async moveArticlesToFolder?(articleIds: string[], folderId: string): Promise<void> {
    this.requireScopes(['articles:write'])

    await this.callMCPTool('mcp-articles_move_articles_to_folder', {
      article_ids: articleIds,
      folder_id: folderId,
    })
  }
}
