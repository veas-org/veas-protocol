/**
 * Veas MCP protocol provider implementation
 */

import type { ProtocolProvider, ProviderConfig, AuthCredentials, AuthContext } from '../../protocols/index.js'
import { VeasAuthProvider } from './auth.js'
import { VeasProjectManagementMCPProvider } from './project-management-mcp.js'
import { VeasKnowledgeBaseMCPProvider } from './knowledge-base-mcp.js'
import { VeasCommunicationMCP } from './communication-mcp.js'
import { MCPClient } from './mcp-client.js'

export interface VeasMCPProviderConfig extends ProviderConfig {
  /**
   * MCP endpoint URL (e.g., http://localhost:3000/api/mcp/http)
   */
  mcpEndpoint: string
  
  /**
   * Optional API URL for authentication (defaults to mcpEndpoint)
   */
  apiUrl?: string
}

export class VeasMCPProtocolProvider implements ProtocolProvider {
  name = 'veas-mcp'
  version = '1.0.0'
  description = 'Official Veas MCP protocol provider implementation'
  
  private auth: VeasAuthProvider
  private _projectManagement: VeasProjectManagementMCPProvider
  private _knowledgeBase: VeasKnowledgeBaseMCPProvider
  private _communication: VeasCommunicationMCP | undefined
  private mcpClient: MCPClient | undefined
  
  constructor(public config: VeasMCPProviderConfig) {
    this.auth = new VeasAuthProvider({ apiUrl: config.apiUrl || config.mcpEndpoint })
    this._projectManagement = new VeasProjectManagementMCPProvider(config, this.auth)
    this._knowledgeBase = new VeasKnowledgeBaseMCPProvider(config, this.auth)
  }
  
  async authenticate(credentials: AuthCredentials): Promise<AuthContext> {
    const context = await this.auth.authenticate(credentials)
    
    // Sub-providers now share the same auth instance, no need to authenticate separately
    
    // Initialize communication protocol with MCP client
    if ('token' in credentials) {
      this.mcpClient = new MCPClient({
        endpoint: this.config.mcpEndpoint,
        headers: {
          'Authorization': `Bearer ${credentials.token}`
        }
      })
      this._communication = new VeasCommunicationMCP(this.mcpClient)
    }
    
    return context
  }
  
  get projectManagement() {
    return this._projectManagement
  }
  
  get knowledgeBase() {
    return this._knowledgeBase
  }
  
  get communication() {
    return this._communication
  }
  
  isConnected(): boolean {
    return this.auth.isAuthenticated()
  }
  
  async disconnect(): Promise<void> {
    this.auth.disconnect()
  }
}