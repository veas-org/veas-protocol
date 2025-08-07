/**
 * Main protocol provider interface
 */

import type { AuthContext, AuthCredentials } from './common'
import type { ProjectManagementProtocol } from './project-management'
import type { KnowledgeBaseProtocol } from './knowledge-base'

export * from './common'
export * from './project-management'
export * from './knowledge-base'

/**
 * Protocol provider interface
 * 
 * A provider implements one or more protocol domains and handles
 * authentication and connection management.
 */
export interface ProtocolProvider {
  /**
   * Unique identifier for the provider
   */
  name: string
  
  /**
   * Provider version
   */
  version: string
  
  /**
   * Human-readable description
   */
  description?: string
  
  /**
   * Provider configuration
   */
  config?: ProviderConfig
  
  /**
   * Authenticate with the provider
   */
  authenticate(credentials: AuthCredentials): Promise<AuthContext>
  
  /**
   * Project management protocol implementation
   */
  projectManagement?: ProjectManagementProtocol
  
  /**
   * Knowledge base protocol implementation
   */
  knowledgeBase?: KnowledgeBaseProtocol
  
  /**
   * Check if provider is connected and authenticated
   */
  isConnected(): boolean
  
  /**
   * Disconnect from the provider
   */
  disconnect(): Promise<void>
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /**
   * Base URL for API requests
   */
  baseUrl?: string
  
  /**
   * Request timeout in milliseconds
   */
  timeout?: number
  
  /**
   * Custom headers for all requests
   */
  headers?: Record<string, string>
  
  /**
   * Enable debug logging
   */
  debug?: boolean
  
  /**
   * Custom configuration options
   */
  [key: string]: unknown
}