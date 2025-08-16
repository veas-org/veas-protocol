/**
 * Veas Protocol - Formal interfaces for provider-agnostic MCP servers
 *
 * @packageDocumentation
 */

// Export all protocol interfaces and types
export * from './protocols/index.js'

// Export adapters
export * from './adapters/mcp/index.js'

// Export providers
export * from './providers/veas/index.js'

// Convenience exports
export { VeasProtocolProvider } from './providers/veas/index.js'
export { MCPAdapter } from './adapters/mcp/index.js'
