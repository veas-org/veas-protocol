/**
 * Knowledge Base protocol validation schemas
 */

import { z } from 'zod'

// Common schemas
const articleStatusSchema = z.enum(['draft', 'published', 'archived'])
const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')

// Article schemas
export const createArticleSchema = z.object({
  title: z.string().min(1).max(255),
  slug: slugSchema.optional(),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  status: articleStatusSchema.optional(),
  publicationId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).optional(),
  metadata: z.object({
    featuredImage: z.string().url().optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    customData: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
})

export const updateArticleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: slugSchema.optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional(),
  status: articleStatusSchema.optional(),
  folderId: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).optional(),
  metadata: z.object({
    featuredImage: z.string().url().optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(160).optional(),
    customData: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
})

// Folder schemas
export const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  publicationId: z.string().uuid().optional(),
  order: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  parentId: z.string().uuid().optional(),
  order: z.number().int().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  color: colorSchema.optional(),
  publicationId: z.string().uuid().optional(),
})

export const updateTagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: slugSchema.optional(),
  description: z.string().max(500).optional(),
  color: colorSchema.optional(),
})

// Editor command schemas
export const createEditorCommandSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  command: z.string().min(1).max(1000),
  shortcut: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  publicationId: z.string().uuid().optional(),
})

export const updateEditorCommandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  command: z.string().min(1).max(1000).optional(),
  shortcut: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
})

// Filter schemas
export const articleFiltersSchema = z.object({
  publicationId: z.string().uuid().optional(),
  folderId: z.string().uuid().optional(),
  status: z.union([articleStatusSchema, z.array(articleStatusSchema)]).optional(),
  authorId: z.string().uuid().optional(),
  tags: z.array(z.string().uuid()).optional(),
  search: z.string().optional(),
  publishedAfter: z.date().optional(),
  publishedBefore: z.date().optional(),
})

export const folderFiltersSchema = z.object({
  publicationId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  search: z.string().optional(),
})

export const tagFiltersSchema = z.object({
  publicationId: z.string().uuid().optional(),
  search: z.string().optional(),
  minArticleCount: z.number().int().min(0).optional(),
})