/**
 * MCP adapter implementation
 * 
 * Converts protocol interfaces to MCP tools
 */

import type { MCPAdapterConfig, MCPTool } from './types'
import type { AuthContext } from '../../protocols/common'
import { createProjectManagementTools } from './project-management-tools'
import { createKnowledgeBaseTools } from './knowledge-base-tools'

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
      const pmTools = createProjectManagementTools(
        provider.projectManagement,
        toolPrefix,
        () => this.authContext,
      )
      this.tools.push(...pmTools)
    }
    
    // Register knowledge base tools if available
    if (provider.knowledgeBase) {
      const kbTools = createKnowledgeBaseTools(
        provider.knowledgeBase,
        toolPrefix,
        () => this.authContext,
      )
      this.tools.push(...kbTools)
    }
    
    if (this.config.debug) {
      console.log(`MCPAdapter: Registered ${this.tools.length} tools`)
    }
  }
  
  /**
   * Set authentication context
   */
  async authenticate(credentials: any): Promise<void> {
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
  async executeTool(name: string, params: any): Promise<any> {
    const tool = this.getTool(name)
    if (!tool) {
      throw new Error(`Tool '${name}' not found`)
    }
    
    return tool.handler(params, this.authContext)
  }
  
  /**
   * List all available tools (MCP format)
   */
  listTools(): any {
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
  async handleRequest(request: any): Promise<any> {
    const { method, params } = request
    
    switch (method) {
      case 'tools/list':
        return this.listTools()
        
      case 'tools/call':
        const { name, arguments: args } = params
        return this.executeTool(name, args)
        
      default:
        throw new Error(`Unsupported method: ${method}`)
    }
  }
}