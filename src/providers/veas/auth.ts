/**
 * Veas provider authentication implementation
 */

import type { AuthContext } from '../../protocols/common/index.js'
import { AuthenticationError } from '../../protocols/common/index.js'

interface TokenCredentials {
  token: string
}

interface ApiKeyCredentials {
  apiKey: string
}

interface UsernamePasswordCredentials {
  username: string
  password: string
}

type AuthCredentials = TokenCredentials | ApiKeyCredentials | UsernamePasswordCredentials

export class VeasAuthProvider {
  private authContext: AuthContext | null = null
  
  constructor(private config: { apiUrl: string }) {}
  
  async authenticate(credentials: AuthCredentials): Promise<AuthContext> {
    // Check cached auth context first
    if (this.authContext) {
      return this.authContext
    }
    
    let apiUrl = this.config.apiUrl
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1)
    }
    
    // Handle token credentials
    if ('token' in credentials) {
      try {
        const response = await fetch(`${apiUrl}/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${credentials.token}`,
          },
        })
        
        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        this.authContext = {
          userId: data.user?.id || data.userId,
          organizationId: data.user?.organizationId || data.organizationId,
          scopes: data.scopes || [],
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        }
        
        return this.authContext
      } catch (error: any) {
        throw error
      }
    }
    
    // Handle API key credentials
    if ('apiKey' in credentials) {
      try {
        const response = await fetch(`${apiUrl}/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': credentials.apiKey,
          },
        })
        
        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        this.authContext = {
          userId: data.user?.id || data.userId,
          organizationId: data.user?.organizationId || data.organizationId,
          scopes: data.scopes || [],
        }
        
        return this.authContext
      } catch (error: any) {
        throw error
      }
    }
    
    // Handle username/password credentials
    if ('username' in credentials && 'password' in credentials) {
      try {
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
        })
        
        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        this.authContext = {
          userId: data.user?.id || data.userId,
          scopes: data.scopes || [],
          metadata: {
            token: data.token,
          },
        }
        
        return this.authContext
      } catch (error: any) {
        throw error
      }
    }
    
    throw new Error('Unsupported authentication method')
  }
  
  getAuthContext(): AuthContext | null {
    return this.authContext
  }
  
  isAuthenticated(): boolean {
    return this.authContext !== null
  }
  
  disconnect(): void {
    this.authContext = null
  }
}