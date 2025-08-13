/**
 * MCP adapter type definitions
 */

import type { ProtocolProvider } from '../../protocols/index.js'

export interface MCPAdapterConfig {
  /**
   * Protocol provider instance
   */
  provider: ProtocolProvider
  
  /**
   * Tool name prefix (e.g., 'mcp_veas')
   */
  toolPrefix?: string
  
  /**
   * Default output format
   */
  defaultOutputFormat?: 'json' | 'markdown'
  
  /**
   * Enable debug logging
   */
  debug?: boolean
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: object
  handler: (params: any, context: any) => Promise<any>
}

export interface MCPToolCollection {
  tools: MCPTool[]
  namespace: string
}

export interface MCPRequest {
  method: string
  params?: Record<string, unknown>
}

export interface MCPResponse {
  tools?: Array<{
    name: string
    description: string
    inputSchema: object
  }>
  result?: unknown
  error?: string
}