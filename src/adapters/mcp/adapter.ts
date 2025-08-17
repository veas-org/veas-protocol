/**
 * MCP adapter implementation
 *
 * Converts protocol interfaces to MCP tools
 */

import type { AuthContext, AuthCredentials } from '../../protocols/common/index.js'
import { generateCommunicationTools } from './communication-tools.js'
import { createKnowledgeBaseTools } from './knowledge-base-tools.js'
import { createProjectManagementTools } from './project-management-tools.js'
import type { MCPAdapterConfig, MCPAdapterRequest, MCPAdapterResponse, MCPTool } from './types.js'

export class MCPAdapter {
  private tools: MCPTool[] = []
  private authContext: AuthContext | null = null

  constructor(private config: MCPAdapterConfig) {
    this.initialize()
  }

  /**
   * Initialize the adapter and register tools
   */
  private initialize(): void {
    const { provider, toolPrefix = 'mcp_veas' } = this.config

    // Register project management tools if available
    if (provider.projectManagement) {
      const pmTools = createProjectManagementTools(provider.projectManagement, toolPrefix, () => this.authContext)
      this.tools.push(...pmTools)
    }

    // Register knowledge base tools if available
    if (provider.knowledgeBase) {
      const kbTools = createKnowledgeBaseTools(provider.knowledgeBase, toolPrefix, () => this.authContext)
      this.tools.push(...kbTools)
    }

    // Register communication tools if available
    if (provider.communication) {
      const commTools = generateCommunicationTools(provider.communication)
      this.tools.push(...commTools)
    }

    if (this.config.debug) {
      // MCPAdapter: Registered tools count: this.tools.length
    }
  }

  /**
   * Set authentication context
   */
  async authenticate(credentials: AuthCredentials): Promise<void> {
    this.authContext = await this.config.provider.authenticate(credentials)
  }

  /**
   * Get all registered tools
   */
  getTools(): MCPTool[] {
    return this.tools
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.find(tool => tool.name === name)
  }

  /**
   * Execute a tool by name
   */
  async executeTool(name: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.getTool(name)
    if (!tool) {
      throw new Error(`Tool '${name}' not found`)
    }

    return tool.handler(params, this.authContext)
  }

  /**
   * List all available tools (MCP format)
   */
  listTools(): MCPAdapterResponse {
    return {
      tools: this.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }
  }

  /**
   * Handle MCP request
   */
  async handleRequest(request: MCPAdapterRequest): Promise<MCPAdapterResponse> {
    const { method, params } = request

    switch (method) {
      case 'tools/list':
        return this.listTools()

      case 'tools/call': {
        if (!params?.name) {
          throw new Error('Tool name is required')
        }
        const result = await this.executeTool(params.name, params.arguments || {})
        // The executeTool already returns the properly formatted response
        return result as MCPAdapterResponse
      }

      default:
        throw new Error(`Unsupported method: ${method}`)
    }
  }

  /**
   * Serve the MCP adapter (for stdio or other transports)
   */
  async serve(options?: { transport?: 'stdio' | 'http' }): Promise<void> {
    const transport = options?.transport || 'stdio'

    if (transport === 'stdio') {
      // For stdio transport, we would normally set up stdin/stdout handling
      // This is a placeholder implementation for testing
      return Promise.resolve()
    }

    // For HTTP or other transports, additional implementation would go here
    return Promise.resolve()
  }
}
