/**
 * Agents protocol type definitions
 */

import type { Entity } from '../common/index.js'

// Agent type enums
export type AgentType = 'system' | 'user' | 'organization' | 'template'

// Task enums
export type TaskType = 'workflow' | 'single' | 'batch' | 'report' | 'monitoring' | 'integration' | 'custom'
export type TaskStatus = 'active' | 'inactive' | 'archived' | 'draft'

// Schedule enums
export type ScheduleType = 'cron' | 'webhook' | 'event' | 'manual' | 'interval' | 'once'

// Execution enums
export type ExecutionStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'retrying'
  | 'skipped'
export type ExecutionTrigger = 'manual' | 'scheduled' | 'webhook' | 'event' | 'api' | 'retry' | 'test'

// Agent definition
export interface Agent extends Entity {
  organizationId?: string
  createdBy: string
  name: string
  description?: string
  avatarUrl?: string
  agentType: AgentType
  capabilities?: Record<string, unknown>
  tools?: string[]
  modelPreferences?: Record<string, unknown>
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  isActive: boolean
  tags?: string[]
}

// Agent task
export interface AgentTask extends Entity {
  organizationId: string
  agentId?: string
  createdBy: string
  name: string
  description?: string
  taskType: TaskType
  status: TaskStatus
  configuration?: Record<string, unknown>
  tools?: unknown[]
  parameters?: Record<string, unknown>
  workflow?: unknown[]
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  webhookSecret?: string
  allowedIps?: string[]
  requireAuth?: boolean
  maxRetries?: number
  timeoutSeconds?: number
  maxExecutionsPerDay?: number
  estimatedCostCents?: number
  maxCostCents?: number
  tags?: string[]
  version?: number
  isPublic?: boolean
  executionCount?: number
  successCount?: number
  failureCount?: number
  avgDurationMs?: number
  lastExecutedAt?: Date
}

// Agent schedule
export interface AgentSchedule extends Entity {
  taskId: string
  scheduleType: ScheduleType
  cronExpression?: string
  webhookPath?: string
  eventName?: string
  intervalSeconds?: number
  isEnabled: boolean
  timezone?: string
  startDate?: Date
  endDate?: Date
  nextRunAt?: Date
  lastRunAt?: Date
  runCount?: number
  consecutiveFailures?: number
  retryPolicy?: RetryPolicy
  alertOnFailure?: boolean
  alertEmail?: string
  alertWebhookUrl?: string
}

// Agent execution
export interface AgentExecution extends Entity {
  taskId: string
  scheduleId?: string
  executedBy?: string
  status: ExecutionStatus
  trigger: ExecutionTrigger
  startedAt?: Date
  completedAt?: Date
  durationMs?: number
  input?: unknown
  output?: unknown
  error?: string
  logs?: ExecutionLog[]
  costCents?: number
  retryCount?: number
  parentExecutionId?: string
}

// Supporting types
export interface RetryPolicy {
  maxAttempts?: number
  backoffSeconds?: number
  backoffMultiplier?: number
}

export interface ExecutionLog {
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  metadata?: Record<string, unknown>
}

// Create/Update data types
export interface CreateAgentData {
  organizationId?: string
  name: string
  description?: string
  avatarUrl?: string
  agentType?: AgentType
  capabilities?: Record<string, unknown>
  tools?: string[]
  modelPreferences?: Record<string, unknown>
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  isActive?: boolean
  tags?: string[]
}

export interface UpdateAgentData {
  name?: string
  description?: string
  avatarUrl?: string
  capabilities?: Record<string, unknown>
  tools?: string[]
  modelPreferences?: Record<string, unknown>
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  isActive?: boolean
  tags?: string[]
}

export interface CreateAgentTaskData {
  organizationId: string
  agentId?: string
  name: string
  description?: string
  taskType?: TaskType
  status?: TaskStatus
  configuration?: Record<string, unknown>
  tools?: unknown[]
  parameters?: Record<string, unknown>
  workflow?: unknown[]
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  webhookSecret?: string
  allowedIps?: string[]
  requireAuth?: boolean
  maxRetries?: number
  timeoutSeconds?: number
  maxExecutionsPerDay?: number
  estimatedCostCents?: number
  maxCostCents?: number
  tags?: string[]
  isPublic?: boolean
}

export interface UpdateAgentTaskData {
  agentId?: string
  name?: string
  description?: string
  taskType?: TaskType
  status?: TaskStatus
  configuration?: Record<string, unknown>
  tools?: unknown[]
  parameters?: Record<string, unknown>
  workflow?: unknown[]
  inputSchema?: Record<string, unknown>
  outputSchema?: Record<string, unknown>
  webhookSecret?: string
  allowedIps?: string[]
  requireAuth?: boolean
  maxRetries?: number
  timeoutSeconds?: number
  maxExecutionsPerDay?: number
  estimatedCostCents?: number
  maxCostCents?: number
  tags?: string[]
  version?: number
  isPublic?: boolean
}

export interface CreateAgentScheduleData {
  taskId: string
  scheduleType: ScheduleType
  cronExpression?: string
  webhookPath?: string
  eventName?: string
  intervalSeconds?: number
  isEnabled?: boolean
  timezone?: string
  startDate?: Date
  endDate?: Date
  retryPolicy?: RetryPolicy
  alertOnFailure?: boolean
  alertEmail?: string
  alertWebhookUrl?: string
}

export interface UpdateAgentScheduleData {
  scheduleType?: ScheduleType
  cronExpression?: string
  webhookPath?: string
  eventName?: string
  intervalSeconds?: number
  isEnabled?: boolean
  timezone?: string
  startDate?: Date
  endDate?: Date
  retryPolicy?: RetryPolicy
  alertOnFailure?: boolean
  alertEmail?: string
  alertWebhookUrl?: string
}

export interface ExecuteAgentTaskData {
  taskId: string
  input?: unknown
  trigger?: ExecutionTrigger
  webhookSecret?: string
}

// Filter types
export interface AgentFilters {
  organizationId?: string
  agentType?: AgentType | AgentType[]
  isActive?: boolean
  tags?: string[]
  search?: string
}

export interface AgentTaskFilters {
  organizationId?: string
  agentId?: string
  taskType?: TaskType | TaskType[]
  status?: TaskStatus | TaskStatus[]
  isPublic?: boolean
  tags?: string[]
  search?: string
}

export interface AgentExecutionFilters {
  taskId?: string
  scheduleId?: string
  status?: ExecutionStatus | ExecutionStatus[]
  trigger?: ExecutionTrigger | ExecutionTrigger[]
  executedBy?: string
  startedAfter?: Date
  startedBefore?: Date
  completedAfter?: Date
  completedBefore?: Date
}
