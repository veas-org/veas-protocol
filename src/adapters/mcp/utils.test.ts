import { describe, it, expect } from 'vitest'
import {
  formatMCPError,
  formatMCPResponse,
  getOutputFormat,
  createToolName,
  createTool,
  createPaginatedTool
} from './utils'
import { ProtocolError, ValidationError } from '../../protocols/common/errors'

describe('MCP Utils', () => {
  describe('formatMCPError', () => {
    it('should format a ProtocolError', () => {
      const error = new ProtocolError('Test error', 'TEST_CODE', { field: 'test' })
      const result = formatMCPError(error)
      
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('❌ Test error')
    })

    it('should format a ValidationError', () => {
      const error = new ValidationError('Invalid input', { field: 'email' })
      const result = formatMCPError(error)
      
      expect(result.content[0].text).toContain('❌ Invalid input')
    })

    it('should format a regular Error', () => {
      const error = new Error('Regular error')
      const result = formatMCPError(error)
      
      expect(result.content[0].text).toContain('❌ Regular error')
    })

    it('should handle unknown error types', () => {
      const result = formatMCPError('string error')
      
      expect(result.content[0].text).toBe('❌ An unknown error occurred')
    })

    it('should handle null/undefined errors', () => {
      const result = formatMCPError(null)
      
      expect(result.content[0].text).toBe('❌ An unknown error occurred')
    })
  })

  describe('formatMCPResponse', () => {
    it('should format response as JSON by default', () => {
      const data = { id: '123', name: 'Test' }
      const result = formatMCPResponse(data)
      
      expect(result.content).toHaveLength(1)
      expect(result.content[0].type).toBe('json')
      expect(result.content[0].data).toEqual(data)
    })

    it('should format response as JSON when specified', () => {
      const data = { id: '123', name: 'Test' }
      const result = formatMCPResponse(data, 'json')
      
      expect(result.content[0].type).toBe('json')
      expect(result.content[0].data).toEqual(data)
    })

    it('should format response as markdown when specified', () => {
      const data = { id: '123', name: 'Test' }
      const result = formatMCPResponse(data, 'markdown')
      
      expect(result.content[0].type).toBe('markdown')
      expect(result.content[0].text).toContain('**Id**: 123')
      expect(result.content[0].text).toContain('**Name**: Test')
    })

    it('should format array response as markdown', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ]
      const result = formatMCPResponse(data, 'markdown')
      
      expect(result.content[0].type).toBe('markdown')
      expect(result.content[0].text).toContain('### Item 1')
      expect(result.content[0].text).toContain('### Item 2')
    })

    it('should format ListResponse as markdown', () => {
      const data = {
        items: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' }
        ],
        total: 2,
        limit: 10,
        offset: 0
      }
      const result = formatMCPResponse(data, 'markdown')
      
      expect(result.content[0].type).toBe('markdown')
      expect(result.content[0].text).toContain('## Results')
      expect(result.content[0].text).toContain('Found 2 items')
      expect(result.content[0].text).toContain('### Item 1')
    })

    it('should handle empty array in markdown', () => {
      const data: any[] = []
      const result = formatMCPResponse(data, 'markdown')
      
      expect(result.content[0].text).toContain('*No items found*')
    })

    it('should handle null/undefined values in markdown', () => {
      const data = { id: '123', name: null, description: undefined }
      const result = formatMCPResponse(data, 'markdown')
      
      expect(result.content[0].text).toContain('**Id**: 123')
      expect(result.content[0].text).not.toContain('Name')
      expect(result.content[0].text).not.toContain('Description')
    })

    it('should handle nested objects in markdown', () => {
      const data = {
        id: '123',
        metadata: {
          created: '2024-01-01',
          author: 'Test User'
        }
      }
      const result = formatMCPResponse(data, 'markdown')
      
      expect(result.content[0].text).toContain('**Metadata**:')
      expect(result.content[0].text).toContain('**Created**: 2024-01-01')
      expect(result.content[0].text).toContain('**Author**: Test User')
    })

    it('should handle primitive values', () => {
      const result = formatMCPResponse('Simple string', 'markdown')
      
      expect(result.content[0].text).toBe('Simple string')
    })

    it('should handle numbers', () => {
      const result = formatMCPResponse(42, 'markdown')
      
      expect(result.content[0].text).toBe('42')
    })

    it('should handle booleans', () => {
      const result = formatMCPResponse(true, 'markdown')
      
      expect(result.content[0].text).toBe('true')
    })
  })

  describe('getOutputFormat', () => {
    it('should get outputFormat from params', () => {
      const params = { outputFormat: 'markdown' as const }
      expect(getOutputFormat(params)).toBe('markdown')
    })

    it('should get output_format from params (snake_case)', () => {
      const params = { output_format: 'json' as const }
      expect(getOutputFormat(params)).toBe('json')
    })

    it('should prefer outputFormat over output_format', () => {
      const params = { 
        outputFormat: 'markdown' as const,
        output_format: 'json' as const 
      }
      expect(getOutputFormat(params)).toBe('markdown')
    })

    it('should return undefined for missing format', () => {
      const params = {}
      expect(getOutputFormat(params)).toBeUndefined()
    })

    it('should handle null/undefined params', () => {
      expect(getOutputFormat(null)).toBeUndefined()
      expect(getOutputFormat(undefined)).toBeUndefined()
    })
  })

  describe('createToolName', () => {
    it('should create a tool name with all parts', () => {
      const name = createToolName('mcp', 'articles', 'create')
      expect(name).toBe('mcp_articles_create')
    })

    it('should handle different prefixes', () => {
      const name = createToolName('veas', 'projects', 'list')
      expect(name).toBe('veas_projects_list')
    })

    it('should handle empty strings', () => {
      const name = createToolName('', '', '')
      expect(name).toBe('__')
    })
  })

  describe('createTool', () => {
    it('should create a basic MCP tool', () => {
      const tool = createTool({
        name: 'test_tool',
        description: 'Test tool description',
        handler: async (params) => ({ result: params.input }),
        inputSchema: {
          input: { type: 'string', description: 'Input value' }
        }
      })
      
      expect(tool.name).toBe('test_tool')
      expect(tool.description).toBe('Test tool description')
      expect(tool.inputSchema.type).toBe('object')
      expect(tool.inputSchema.properties.input).toEqual({
        type: 'string',
        description: 'Input value'
      })
      expect(tool.inputSchema.required).toEqual([])
      expect(tool.inputSchema.additionalProperties).toBe(false)
    })

    it('should include required fields', () => {
      const tool = createTool({
        name: 'test_tool',
        description: 'Test tool',
        handler: async () => ({}),
        inputSchema: {
          field1: { type: 'string' },
          field2: { type: 'number' }
        },
        required: ['field1']
      })
      
      expect(tool.inputSchema.required).toEqual(['field1'])
    })

    it('should handle async handler', async () => {
      const tool = createTool({
        name: 'async_tool',
        description: 'Async tool',
        handler: async (params: any) => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return { doubled: params.value * 2 }
        },
        inputSchema: {
          value: { type: 'number' }
        }
      })
      
      const result = await tool.handler({ value: 5 })
      expect(result).toEqual({ doubled: 10 })
    })

    it('should handle complex input schemas', () => {
      const tool = createTool({
        name: 'complex_tool',
        description: 'Complex tool',
        handler: async () => ({}),
        inputSchema: {
          text: { type: 'string', minLength: 1, maxLength: 100 },
          count: { type: 'number', minimum: 0, maximum: 100 },
          enabled: { type: 'boolean' },
          options: { 
            type: 'array',
            items: { type: 'string' }
          },
          metadata: {
            type: 'object',
            properties: {
              key: { type: 'string' }
            }
          }
        },
        required: ['text', 'count']
      })
      
      expect(tool.inputSchema.properties.text).toHaveProperty('minLength', 1)
      expect(tool.inputSchema.properties.count).toHaveProperty('minimum', 0)
      expect(tool.inputSchema.properties.options).toHaveProperty('items')
      expect(tool.inputSchema.required).toEqual(['text', 'count'])
    })
  })

  describe('createPaginatedTool', () => {
    it('should create a paginated tool (same as createTool)', () => {
      const tool = createPaginatedTool({
        name: 'list_tool',
        description: 'List tool',
        handler: async (params) => ({ 
          items: [], 
          total: 0,
          limit: params.limit || 10,
          offset: params.offset || 0
        }),
        inputSchema: {
          limit: { type: 'number' },
          offset: { type: 'number' }
        }
      })
      
      expect(tool.name).toBe('list_tool')
      expect(tool.inputSchema.properties.limit).toBeDefined()
      expect(tool.inputSchema.properties.offset).toBeDefined()
    })
  })
})