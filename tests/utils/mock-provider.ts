/**
 * Mock provider for testing
 */

import type {
  ProtocolProvider,
  AuthContext,
  AuthCredentials,
  ProjectManagementProtocol,
  KnowledgeBaseProtocol,
} from '../../src'
import { AuthenticationError } from '../../src'
import { createMockProjectManagement } from './mock-project-management'
import { createMockKnowledgeBase } from './mock-knowledge-base'

export interface MockProviderOptions {
  name?: string
  version?: string
  authContext?: AuthContext
  failAuth?: boolean
}

export class MockProvider implements ProtocolProvider {
  name: string
  version: string
  description = 'Mock provider for testing'
  
  private authContext: AuthContext | null = null
  private failAuth: boolean
  
  projectManagement: ProjectManagementProtocol
  knowledgeBase: KnowledgeBaseProtocol
  
  constructor(options: MockProviderOptions = {}) {
    this.name = options.name || 'mock-provider'
    this.version = options.version || '1.0.0'
    this.failAuth = options.failAuth || false
    this.authContext = options.authContext || null
    
    this.projectManagement = createMockProjectManagement()
    this.knowledgeBase = createMockKnowledgeBase()
  }
  
  async authenticate(_credentials: AuthCredentials): Promise<AuthContext> {
    if (this.failAuth) {
      throw new AuthenticationError('Mock authentication failed')
    }
    
    this.authContext = {
      userId: 'mock-user-123',
      scopes: ['projects:read', 'projects:write', 'articles:read', 'articles:write'],
      organizationId: 'mock-org-123',
    }
    
    return this.authContext
  }
  
  isConnected(): boolean {
    return this.authContext !== null
  }
  
  async disconnect(): Promise<void> {
    this.authContext = null
  }
  
  getAuthContext(): AuthContext | null {
    return this.authContext
  }
}