/**
 * Veas provider authentication implementation
 */

import type { AuthContext, AuthCredentials as ProtocolAuthCredentials } from '../../protocols/common/auth'

// Re-export the protocol's AuthCredentials for consistency
export type AuthCredentials = ProtocolAuthCredentials

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
    if (credentials.type === 'token' && credentials.token) {
      const response = await fetch(`${apiUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${credentials.token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as any
      this.authContext = {
        userId: data.user?.id || data.userId,
        organizationId: data.user?.organizationId || data.organizationId,
        scopes: data.scopes || [],
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      }

      return this.authContext
    }

    // Handle API key credentials (OAuth client credentials)
    if (credentials.type === 'oauth' && credentials.clientId && credentials.clientSecret) {
      const response = await fetch(`${apiUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': credentials.clientSecret,
        },
      })

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as any
      this.authContext = {
        userId: data.user?.id || data.userId,
        organizationId: data.user?.organizationId || data.organizationId,
        scopes: data.scopes || [],
      }

      return this.authContext
    }

    // Handle username/password credentials
    if (credentials.type === 'basic' && credentials.username && credentials.password) {
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

      const data = (await response.json()) as any
      this.authContext = {
        userId: data.user?.id || data.userId,
        organizationId: data.user?.organizationId || data.organizationId,
        scopes: data.scopes || [],
      }

      return this.authContext
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
