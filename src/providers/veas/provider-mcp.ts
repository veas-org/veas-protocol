/**
 * Veas MCP protocol provider implementation
 */

import type { ProtocolProvider, ProviderConfig, AuthCredentials, AuthContext } from '../../protocols'
import { VeasAuthProvider } from './auth'
import { VeasProjectManagementMCPProvider } from './project-management-mcp'
import { VeasKnowledgeBaseMCPProvider } from './knowledge-base-mcp'

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
  
  constructor(public config: VeasMCPProviderConfig) {
    this.auth = new VeasAuthProvider({ apiUrl: config.apiUrl || config.mcpEndpoint })
    this._projectManagement = new VeasProjectManagementMCPProvider(config)
    this._knowledgeBase = new VeasKnowledgeBaseMCPProvider(config)
  }
  
  async authenticate(credentials: AuthCredentials): Promise<AuthContext> {
    const context = await this.auth.authenticate(credentials)
    
    // Share auth context with sub-providers
    await this._projectManagement.authenticate(credentials)
    await this._knowledgeBase.authenticate(credentials)
    
    return context
  }
  
  get projectManagement() {
    return this._projectManagement
  }
  
  get knowledgeBase() {
    return this._knowledgeBase
  }
  
  isConnected(): boolean {
    return this.auth.isAuthenticated()
  }
  
  async disconnect(): Promise<void> {
    this.auth.disconnect()
  }
}