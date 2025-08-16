import { describe, it, expect } from 'vitest'
import type { ListResponse, ListParams, OutputFormat, SortOrder } from './response'

describe('Response Types', () => {
  describe('ListResponse', () => {
    it('should create a valid list response', () => {
      const response: ListResponse<{ id: string; name: string }> = {
        items: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
        total: 10,
        limit: 2,
        offset: 0,
      }

      expect(response.items).toHaveLength(2)
      expect(response.total).toBe(10)
      expect(response.limit).toBe(2)
      expect(response.offset).toBe(0)
    })

    it('should handle optional hasMore field', () => {
      const response: ListResponse<string> = {
        items: ['a', 'b', 'c'],
        total: 5,
        hasMore: true,
      }

      expect(response.hasMore).toBe(true)
      expect(response.limit).toBeUndefined()
      expect(response.offset).toBeUndefined()
    })

    it('should handle optional nextCursor field', () => {
      const response: ListResponse<number> = {
        items: [1, 2, 3],
        total: 100,
        nextCursor: 'next-page-token',
      }

      expect(response.nextCursor).toBe('next-page-token')
    })

    it('should handle empty list response', () => {
      const response: ListResponse<any> = {
        items: [],
        total: 0,
      }

      expect(response.items).toHaveLength(0)
      expect(response.total).toBe(0)
    })
  })

  describe('ListParams', () => {
    it('should create valid list params with all fields', () => {
      const params: ListParams = {
        limit: 10,
        offset: 20,
        cursor: 'cursor-token',
        sortBy: 'created_at',
        sortOrder: 'desc',
      }

      expect(params.limit).toBe(10)
      expect(params.offset).toBe(20)
      expect(params.cursor).toBe('cursor-token')
      expect(params.sortBy).toBe('created_at')
      expect(params.sortOrder).toBe('desc')
    })

    it('should handle minimal list params', () => {
      const params: ListParams = {}

      expect(params.limit).toBeUndefined()
      expect(params.offset).toBeUndefined()
      expect(params.cursor).toBeUndefined()
      expect(params.sortBy).toBeUndefined()
      expect(params.sortOrder).toBeUndefined()
    })

    it('should handle pagination with limit and offset', () => {
      const params: ListParams = {
        limit: 50,
        offset: 100,
      }

      expect(params.limit).toBe(50)
      expect(params.offset).toBe(100)
    })

    it('should handle cursor-based pagination', () => {
      const params: ListParams = {
        limit: 25,
        cursor: 'eyJpZCI6MTAwfQ==',
      }

      expect(params.limit).toBe(25)
      expect(params.cursor).toBe('eyJpZCI6MTAwfQ==')
    })
  })

  describe('OutputFormat', () => {
    it('should handle json output format', () => {
      const format: OutputFormat = {
        outputFormat: 'json',
      }

      expect(format.outputFormat).toBe('json')
    })

    it('should handle markdown output format', () => {
      const format: OutputFormat = {
        outputFormat: 'markdown',
      }

      expect(format.outputFormat).toBe('markdown')
    })

    it('should handle undefined output format', () => {
      const format: OutputFormat = {}

      expect(format.outputFormat).toBeUndefined()
    })
  })

  describe('SortOrder', () => {
    it('should handle ascending sort order', () => {
      const order: SortOrder = 'asc'
      expect(order).toBe('asc')
    })

    it('should handle descending sort order', () => {
      const order: SortOrder = 'desc'
      expect(order).toBe('desc')
    })
  })
})
