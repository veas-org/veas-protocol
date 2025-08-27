/**
 * Protocol provider interfaces
 */

import type { AuthContext, AuthCredentials } from './auth'
import type { AgentsProtocol } from '../agents/interfaces'
import type { CommunicationProtocol } from '../communication/interfaces'
import type { KnowledgeBaseProtocol } from '../knowledge-base/interfaces'
import type { ProjectManagementProtocol } from '../project-management/interfaces'

export interface ProviderConfig {
  debug?: boolean
  [key: string]: unknown
}

export interface ProtocolProvider {
  readonly name: string
  readonly version: string
  readonly description: string

  // Protocol implementations (optional, depending on provider capabilities)
  projectManagement?: ProjectManagementProtocol
  knowledgeBase?: KnowledgeBaseProtocol
  communication?: CommunicationProtocol
  agents?: AgentsProtocol

  // Connection management
  authenticate(credentials: AuthCredentials): Promise<AuthContext>
  isConnected(): boolean
  disconnect(): Promise<void>
}

// Error types used in protocols
export type { ProtocolError } from './errors'
export type { ListResponse } from './types'
