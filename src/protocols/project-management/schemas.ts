/**
 * Project Management protocol validation schemas
 */

import { z } from 'zod'

// Common schemas
const projectStatusSchema = z.enum(['active', 'archived', 'draft'])
const projectVisibilitySchema = z.enum(['public', 'private', 'organization'])
const issueTypeSchema = z.enum(['epic', 'story', 'task', 'bug', 'feature', 'custom'])
const issueStatusSchema = z.enum(['todo', 'in_progress', 'done', 'cancelled', 'custom'])
const issuePrioritySchema = z.enum(['critical', 'high', 'medium', 'low'])
const sprintStatusSchema = z.enum(['planned', 'active', 'completed', 'cancelled'])

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  key: z.string().regex(/^[A-Z][A-Z0-9]*$/).optional(),
  description: z.string().max(1000).optional(),
  status: projectStatusSchema.optional(),
  visibility: projectVisibilitySchema.optional(),
  templateId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: projectStatusSchema.optional(),
  visibility: projectVisibilitySchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Issue schemas
export const createIssueSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(10000).optional(),
  type: issueTypeSchema,
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assigneeId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  labels: z.array(z.string()).optional(),
  estimate: z.number().positive().optional(),
  dueDate: z.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const updateIssueSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional(),
  type: issueTypeSchema.optional(),
  status: issueStatusSchema.optional(),
  priority: issuePrioritySchema.optional(),
  assigneeId: z.string().uuid().optional(),
  labels: z.array(z.string()).optional(),
  estimate: z.number().positive().optional(),
  timeSpent: z.number().positive().optional(),
  dueDate: z.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Sprint schemas
export const createSprintSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  goal: z.string().max(1000).optional(),
  startDate: z.date(),
  endDate: z.date(),
}).refine((data: { startDate: Date; endDate: Date }) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
})

export const updateSprintSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  goal: z.string().max(1000).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: sprintStatusSchema.optional(),
})

// Comment schemas
export const createCommentSchema = z.object({
  issueId: z.string().uuid(),
  content: z.string().min(1).max(10000),
})

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(10000),
})

// Filter schemas
export const projectFiltersSchema = z.object({
  status: projectStatusSchema.optional(),
  visibility: projectVisibilitySchema.optional(),
  ownerId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  search: z.string().optional(),
})

export const issueFiltersSchema = z.object({
  projectId: z.string().uuid().optional(),
  type: z.union([issueTypeSchema, z.array(issueTypeSchema)]).optional(),
  status: z.union([issueStatusSchema, z.array(issueStatusSchema)]).optional(),
  priority: z.union([issuePrioritySchema, z.array(issuePrioritySchema)]).optional(),
  assigneeId: z.string().uuid().optional(),
  reporterId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  labels: z.array(z.string()).optional(),
  search: z.string().optional(),
  includeSubtasks: z.boolean().optional(),
})