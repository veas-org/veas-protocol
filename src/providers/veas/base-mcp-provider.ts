/**
 * Base MCP provider class with common functionality
 */

import type { AuthContext } from '../../protocols/common/auth'
import { AuthenticationError, AuthorizationError } from '../../protocols/common/errors'
import { type AuthCredentials, VeasAuthProvider } from './auth'
import { MCPClient } from './mcp-client'

export abstract class BaseMCPProvider {
  protected auth: VeasAuthProvider
  protected mcpClient: MCPClient

  constructor(
    protected config: { mcpEndpoint: string; apiUrl?: string },
    sharedAuth?: VeasAuthProvider,
  ) {
    this.auth = sharedAuth || new VeasAuthProvider({ apiUrl: config.apiUrl || config.mcpEndpoint })
    this.mcpClient = new MCPClient({ endpoint: config.mcpEndpoint })
  }

  /**
   * Authenticate with credentials
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthContext> {
    return this.auth.authenticate(credentials)
  }

  /**
   * Get current auth context, throwing if not authenticated
   */
  protected getAuthContext(): AuthContext {
    const context = this.auth.getAuthContext()
    if (!context) {
      throw new AuthenticationError()
    }
    return context
  }

  /**
   * Check if user has required scopes
   */
  protected requireScopes(scopes: string[]): void {
    const context = this.getAuthContext()
    const hasScopes = scopes.every(scope => context.scopes.includes(scope))
    if (!hasScopes) {
      throw new AuthorizationError(`Missing required scopes: ${scopes.join(', ')}`)
    }
  }

  /**
   * Call an MCP tool with authentication
   */
  protected async callMCPTool<T>(toolName: string, args: any): Promise<T> {
    const context = this.getAuthContext()
    return this.mcpClient.callTool(toolName, args, context)
  }
}
