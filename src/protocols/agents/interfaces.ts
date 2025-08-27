/**
 * Agents protocol interfaces
 */

import type { ListParams, ListResponse, OutputFormat } from '../common/types'
import type {
  Agent,
  AgentExecution,
  AgentExecutionFilters,
  AgentFilters,
  AgentSchedule,
  AgentTask,
  AgentTaskFilters,
  CreateAgentData,
  CreateAgentScheduleData,
  CreateAgentTaskData,
  ExecuteAgentTaskData,
  UpdateAgentData,
  UpdateAgentScheduleData,
  UpdateAgentTaskData,
} from './types'

export interface AgentsProtocol {
  // Agent operations
  listAgents(params?: ListParams & { filters?: AgentFilters } & OutputFormat): Promise<ListResponse<Agent>>
  getAgent(id: string, params?: OutputFormat): Promise<Agent>
  createAgent(data: CreateAgentData): Promise<Agent>
  updateAgent(id: string, data: UpdateAgentData): Promise<Agent>
  deleteAgent(id: string): Promise<void>

  // Task operations
  listTasks(params?: ListParams & { filters?: AgentTaskFilters } & OutputFormat): Promise<ListResponse<AgentTask>>
  getTask(id: string, params?: OutputFormat): Promise<AgentTask>
  createTask(data: CreateAgentTaskData): Promise<AgentTask>
  updateTask(id: string, data: UpdateAgentTaskData): Promise<AgentTask>
  deleteTask(id: string): Promise<void>

  // Task execution
  executeTask(data: ExecuteAgentTaskData): Promise<AgentExecution>

  // Schedule operations
  listSchedules(taskId?: string, params?: ListParams & OutputFormat): Promise<ListResponse<AgentSchedule>>
  getSchedule(id: string, params?: OutputFormat): Promise<AgentSchedule>
  createSchedule(data: CreateAgentScheduleData): Promise<AgentSchedule>
  updateSchedule(id: string, data: UpdateAgentScheduleData): Promise<AgentSchedule>
  deleteSchedule(id: string): Promise<void>

  // Execution history
  listExecutions(
    params?: ListParams & { filters?: AgentExecutionFilters } & OutputFormat,
  ): Promise<ListResponse<AgentExecution>>
  getExecution(id: string, params?: OutputFormat): Promise<AgentExecution>
  cancelExecution(id: string): Promise<void>
  retryExecution(id: string): Promise<AgentExecution>

  // Bulk operations (optional)
  bulkExecuteTasks?(executions: ExecuteAgentTaskData[]): Promise<AgentExecution[]>
  pauseSchedule?(id: string): Promise<void>
  resumeSchedule?(id: string): Promise<void>

  // Analytics (optional)
  getTaskStatistics?(
    taskId: string,
    params?: OutputFormat,
  ): Promise<{
    totalExecutions: number
    successRate: number
    averageDuration: number
    totalCost: number
    lastExecution?: Date
  }>

  getAgentStatistics?(
    agentId: string,
    params?: OutputFormat,
  ): Promise<{
    totalTasks: number
    activeTasks: number
    totalExecutions: number
    successRate: number
    totalCost: number
  }>
}
