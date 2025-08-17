export { type AuthCredentials as VeasAuthCredentials, VeasAuthProvider } from './auth.js'
export * from './mcp-client.js'
export * from './provider-mcp.js'

// Export the MCP provider as the default Veas provider
export { VeasMCPProtocolProvider as VeasProtocolProvider } from './provider-mcp.js'
