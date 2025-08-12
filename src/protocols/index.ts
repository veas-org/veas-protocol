/**
 * Main protocol provider interface
 */

import type { AuthContext } from './common/index.js'
import type { ProjectManagementProtocol } from './project-management/index.js'
import type { KnowledgeBaseProtocol } from './knowledge-base/index.js'
import type { CommunicationProtocol } from './communication/index.js'

export * from './common/index.js'
export * from './project-management/index.js'
export * from './knowledge-base/index.js'
export * from './communication/index.js'

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
  authenticate(credentials: any): Promise<AuthContext>
  
  /**
   * Project management protocol implementation
   */
  projectManagement?: ProjectManagementProtocol
  
  /**
   * Knowledge base protocol implementation
   */
  knowledgeBase?: KnowledgeBaseProtocol
  
  /**
   * Communication protocol implementation
   */
  communication?: CommunicationProtocol
  
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