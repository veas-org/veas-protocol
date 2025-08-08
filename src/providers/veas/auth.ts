/**
 * Veas provider authentication implementation
 */

import type { AuthContext, AuthCredentials } from '../../protocols/common/index.js'
import { AuthenticationError } from '../../protocols/common/index.js'

export class VeasAuthProvider {
  private authContext: AuthContext | null = null
  
  constructor(private config: { apiUrl: string }) {}
  
  async authenticate(credentials: AuthCredentials): Promise<AuthContext> {
    if (credentials.type !== 'token' || !credentials.token) {
      throw new AuthenticationError('Token authentication required')
    }
    
    // For development tokens (tes_*), create a mock context
    if (credentials.token.startsWith('tes_')) {
      const userId = credentials.token.substring(4)
      this.authContext = {
        userId,
        scopes: ['projects:read', 'projects:write', 'articles:read', 'articles:write'],
      }
      return this.authContext
    }
    
    // For production tokens (mya_*), validate against the API
    if (credentials.token.startsWith('mya_')) {
      try {
        const response = await (globalThis.fetch || fetch)(`${this.config.apiUrl}/api/mcp/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${credentials.token}`,
          },
        })
        
        if (!response.ok) {
          throw new AuthenticationError('Invalid token')
        }
        
        const data = await response.json() as {
          userId: string
          scopes?: string[]
          organizationId?: string
        }
        this.authContext = {
          userId: data.userId,
          scopes: data.scopes || [],
          organizationId: data.organizationId,
        }
        
        return this.authContext
      } catch (error) {
        if (error instanceof AuthenticationError) {
          throw error
        }
        throw new AuthenticationError('Authentication failed')
      }
    }
    
    throw new AuthenticationError('Invalid token format')
  }
  
  getContext(): AuthContext | null {
    return this.authContext
  }
  
  isAuthenticated(): boolean {
    return this.authContext !== null
  }
  
  disconnect(): void {
    this.authContext = null
  }
}