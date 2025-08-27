/**
 * MCP adapter utility functions
 */

import type { ListResponse } from '../../protocols/common/types'
import type { ProtocolError } from '../../protocols/common/errors'
import type { MCPTool } from './types'

/**
 * Convert protocol errors to MCP response format
 */
export function formatMCPError(error: unknown): any {
  if (error instanceof Error) {
    const protocolError = error as ProtocolError
    return {
      content: [
        {
          type: 'text',
          text: `❌ ${protocolError.message}`,
        },
      ],
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: '❌ An unknown error occurred',
      },
    ],
  }
}

/**
 * Format protocol response to MCP content format
 */
export function formatMCPResponse(data: unknown, format?: 'json' | 'markdown'): any {
  const outputFormat = format || 'json'

  if (outputFormat === 'markdown') {
    return {
      content: [
        {
          type: 'markdown',
          text: formatAsMarkdown(data),
        },
      ],
    }
  }

  return {
    content: [
      {
        type: 'json',
        data,
      },
    ],
  }
}

/**
 * Format data as markdown
 */
function formatAsMarkdown(data: unknown): string {
  if (Array.isArray(data)) {
    return formatArrayAsMarkdown(data)
  }

  if (isListResponse(data)) {
    return formatListResponseAsMarkdown(data)
  }

  if (typeof data === 'object' && data !== null) {
    return formatObjectAsMarkdown(data)
  }

  return String(data)
}

function isListResponse(data: unknown): data is ListResponse<unknown> {
  return typeof data === 'object' && data !== null && 'items' in data && Array.isArray((data as any).items)
}

function formatListResponseAsMarkdown(response: ListResponse<unknown>): string {
  const { items, total, hasMore } = response
  let markdown = '## Results'

  if (total !== undefined) {
    markdown += `\n\nFound ${total} items`
  } else {
    markdown += ` (${items.length} items`
    if (total !== undefined) {
      markdown += ` of ${total}`
    }
    markdown += ')'
  }

  markdown += '\n\n'
  markdown += formatArrayAsMarkdown(items)

  if (hasMore) {
    markdown += '\n*More results available*'
  }

  return markdown
}

function formatArrayAsMarkdown(items: unknown[]): string {
  if (items.length === 0) {
    return '*No items found*'
  }

  return items
    .map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        return `### Item ${index + 1}\n\n${formatObjectAsMarkdown(item)}`
      }
      return `- ${item}`
    })
    .join('\n\n')
}

function formatObjectAsMarkdown(obj: any): string {
  const lines: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')

    if (value === null || value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      lines.push(`**${formattedKey}**: ${value.join(', ')}`)
    } else if (typeof value === 'object') {
      lines.push(`**${formattedKey}**:\n${formatObjectAsMarkdown(value)}`)
    } else {
      lines.push(`**${formattedKey}**: ${value}`)
    }
  }

  return lines.join('\n')
}

/**
 * Extract output format from params
 */
export function getOutputFormat(params: any): 'json' | 'markdown' | undefined {
  return params?.outputFormat || params?.output_format
}

/**
 * Create a tool name with namespace
 */
export function createToolName(prefix: string, domain: string, operation: string): string {
  return `${prefix}_${domain}_${operation}`
}

/**
 * Create a standard MCP tool
 */
export function createTool(config: {
  name: string
  description: string
  handler: (params: any) => Promise<any>
  inputSchema: Record<string, any>
  required?: string[]
}): MCPTool {
  return {
    name: config.name,
    description: config.description,
    inputSchema: {
      type: 'object',
      properties: config.inputSchema,
      required: config.required || [],
      additionalProperties: false,
    },
    handler: config.handler,
  }
}

/**
 * Create a paginated MCP tool
 */
export function createPaginatedTool(config: {
  name: string
  description: string
  handler: (params: any) => Promise<any>
  inputSchema: Record<string, any>
  required?: string[]
}): MCPTool {
  return createTool(config)
}
