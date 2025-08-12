/**
 * MCP Client for communicating with MCP servers
 */

import type { AuthContext } from '../../protocols/common/index.js'

export interface MCPRequest {
  jsonrpc: '2.0'
  method: string
  params: any
  id: string | number
}

export interface MCPResponse {
  jsonrpc: '2.0'
  result?: any
  error?: MCPError
  id: string | number
}

export interface MCPError {
  code: number
  message: string
  data?: any
}

export interface MCPClientConfig {
  endpoint: string
  headers?: Record<string, string>
}

export class MCPClient {
  private requestId = 1
  
  constructor(private config: MCPClientConfig) {
    if (!config || !config.endpoint) {
      throw new Error('Endpoint is required')
    }
  }
  
  async callTool(toolName: string, args: any, authContext?: AuthContext): Promise<any> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        ...(args !== undefined && Object.keys(args).length > 0 ? { arguments: args } : {}),
      },
      id: this.requestId++,
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    }
    
    if (authContext) {
      headers['X-User-Id'] = authContext.userId
      headers['X-Scopes'] = authContext.scopes.join(',')
    }
    
    const response = await (globalThis.fetch || fetch)(this.config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })
    
    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.statusText}`)
    }
    
    const result = await response.json() as MCPResponse
    
    if (result.error) {
      throw new Error(`MCP error ${result.error.code}: ${result.error.message}`)
    }
    
    // Extract data from MCP response format
    if (result.result?.content?.[0]) {
      const content = result.result.content[0]
      if (content.type === 'json' && content.data) {
        return content.data
      } else if (content.type === 'text' && content.text) {
        // Try to parse as JSON if possible
        try {
          return JSON.parse(content.text)
        } catch {
          return content.text
        }
      }
    }
    
    return result.result
  }
  
  async listTools(): Promise<any[]> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
      id: this.requestId++,
    }
    
    const response = await (globalThis.fetch || fetch)(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify(request),
    })
    
    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.statusText}`)
    }
    
    const result = await response.json() as MCPResponse
    
    if (result.error) {
      throw new Error(`MCP error ${result.error.code}: ${result.error.message}`)
    }
    
    return result.result?.tools || []
  }
}