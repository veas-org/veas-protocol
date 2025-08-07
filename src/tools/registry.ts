import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { prepareMCPHeaders, type AuthToken, getBestAuthToken } from './auth-wrapper.js';

export async function getMCPTools(tokenOrAuthToken?: string | AuthToken): Promise<Tool[]> {
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
  
  // Add timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    // Use the correct MCP endpoint
    const mcpUrl = `${apiUrl}/api/mcp/mcp`;
    console.log(`[getMCPTools] Fetching from ${mcpUrl}`);
    console.log(`[getMCPTools] Using ${authToken.type} token: ${authToken.token.substring(0, 20)}...`);
    
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: prepareMCPHeaders(authToken),
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        params: {},
        id: 'list-tools',
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    console.log(`[getMCPTools] Response status: ${response.status} ${response.statusText}`);
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log(`[getMCPTools] Response headers:`, headers);

    if (!response.ok) {
      const body = await response.text();
      console.log(`[getMCPTools] Error response body: ${body.substring(0, 500)}`);
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
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - MCP server took too long to respond');
    }
    throw error;
  }
}