/**
 * Veas Protocol - Formal interfaces for provider-agnostic MCP servers
 * 
 * @packageDocumentation
 */

// Export all protocol interfaces and types
export * from './protocols'

// Export adapters
export * from './adapters/mcp'

// Export providers
export * from './providers/veas'

// Convenience exports
export { VeasProtocolProvider } from './providers/veas'
export { MCPAdapter } from './adapters/mcp'