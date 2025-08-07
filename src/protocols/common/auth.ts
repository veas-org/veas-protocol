/**
 * Authentication protocol interfaces
 */

export interface AuthCredentials {
  type: 'token' | 'oauth' | 'basic'
  token?: string
  clientId?: string
  clientSecret?: string
  username?: string
  password?: string
}

export interface AuthContext {
  userId: string
  organizationId?: string
  scopes: string[]
  expiresAt?: Date
}

export interface AuthProvider {
  authenticate(credentials: AuthCredentials): Promise<AuthContext>
  refresh?(context: AuthContext): Promise<AuthContext>
  revoke?(context: AuthContext): Promise<void>
}