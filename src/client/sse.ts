import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { prepareMCPHeaders, type AuthToken, getBestAuthToken } from './auth-wrapper.js';

/**
 * Get MCP tools using SSE transport
 * Currently simplified to use direct HTTP endpoint
 */
export async function getMCPToolsViaSSE(tokenOrAuthToken?: string | AuthToken): Promise<Tool[]> {
  const apiUrl = process.env.VEAS_API_URL || 'https://veas.app';
  
  // Get auth token if not provided
  let authToken: AuthToken;
  if (typeof tokenOrAuthToken === 'string') {
    // Legacy support - convert string token to AuthToken
    authToken = {
      token: tokenOrAuthToken,
      type: tokenOrAuthToken.includes('_') ? 'pat' : 'cli'
    };
  } else if (tokenOrAuthToken) {
    authToken = tokenOrAuthToken;
  } else {
    authToken = await getBestAuthToken();
  }
  
  // Use the MCP streamable HTTP endpoint
  const mcpUrl = `${apiUrl}/api/mcp/mcp`;
  console.log(`[getMCPToolsViaSSE] Fetching from ${mcpUrl}`);
  console.log(`[getMCPToolsViaSSE] Using ${authToken.type} token: ${authToken.token.substring(0, 20)}...`);
  
  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: prepareMCPHeaders(authToken),
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/list',
      params: {},
      id: 'list-tools',
    }),
  });

  console.log(`[getMCPToolsViaSSE] Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const body = await response.text();
    console.log(`[getMCPToolsViaSSE] Error response body: ${body.substring(0, 500)}`);
    throw new Error(`Failed to fetch tools: ${response.status} ${response.statusText} - ${body.substring(0, 200)}`);
  }

  // Handle response based on content type
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  
  let result: any;
  
  // Check if it's an event stream response
  if (contentType.includes('text/event-stream') || text.startsWith('event:')) {
    // Parse SSE format
    const lines = text.split('\n');
    const dataLine = lines.find(line => line.startsWith('data: '));
    if (dataLine) {
      const jsonData = dataLine.substring(6);
      result = JSON.parse(jsonData);
    } else {
      throw new Error('Invalid SSE response: no data line found');
    }
  } else {
    // Regular JSON response
    result = JSON.parse(text);
  }
  
  if (result?.error) {
    throw new Error(`Failed to list tools: ${result.error.message}`);
  }

  // Handle different response structures
  if (result?.result?.tools) {
    return result.result.tools;
  } else if (result?.tools) {
    return result.tools;
  } else if (Array.isArray(result)) {
    return result;
  }
  
  return [];
}

/**
 * Execute MCP tool using SSE transport
 * Currently simplified to use direct HTTP endpoint
 */
export async function executeMCPToolViaSSE(
  name: string, 
  args: any, 
  tokenOrAuthToken?: string | AuthToken
): Promise<any> {
  const apiUrl = process.env.VEAS_API_URL || 'https://veas.app';
  
  // Get auth token if not provided
  let authToken: AuthToken;
  if (typeof tokenOrAuthToken === 'string') {
    // Legacy support - convert string token to AuthToken
    authToken = {
      token: tokenOrAuthToken,
      type: tokenOrAuthToken.includes('_') ? 'pat' : 'cli'
    };
  } else if (tokenOrAuthToken) {
    authToken = tokenOrAuthToken;
  } else {
    authToken = await getBestAuthToken();
  }
  
  // Use the MCP streamable HTTP endpoint
  const mcpUrl = `${apiUrl}/api/mcp/mcp`;
  console.log(`[executeMCPToolViaSSE] Calling tool: ${name}`);
  console.log(`[executeMCPToolViaSSE] URL: ${mcpUrl}`);
  console.log(`[executeMCPToolViaSSE] Args:`, JSON.stringify(args));
  console.log(`[executeMCPToolViaSSE] Using ${authToken.type} token: ${authToken.token.substring(0, 20)}...`);
  
  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: prepareMCPHeaders(authToken),
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
      id: Date.now().toString(),
    }),
  });

  console.log(`[executeMCPToolViaSSE] Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const error = await response.text();
    console.log(`[executeMCPToolViaSSE] Error response: ${error.substring(0, 500)}`);
    throw new Error(`Tool execution failed (${response.status}): ${error.substring(0, 200)}`);
  }

  // Handle response based on content type
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  
  let result: any;
  
  // Check if it's an event stream response
  if (contentType.includes('text/event-stream') || text.startsWith('event:')) {
    // Parse SSE format
    const lines = text.split('\n');
    const dataLine = lines.find(line => line.startsWith('data: '));
    if (dataLine) {
      const jsonData = dataLine.substring(6);
      result = JSON.parse(jsonData);
    } else {
      throw new Error('Invalid SSE response: no data line found');
    }
  } else {
    // Regular JSON response
    result = JSON.parse(text);
  }
  
  if (result?.error) {
    throw new Error(result.error.message);
  }

  // Return the result content
  if (result?.result) {
    return result.result;
  } else if (result?.content) {
    return result.content;
  }
  
  return result;
}