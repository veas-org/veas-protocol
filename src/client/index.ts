import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';

export class MCPClient {
  private client: AxiosInstance;
  private requestId: number = 0;

  constructor(baseUrl: string, token: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async call(method: string, params?: any): Promise<any> {
    const id = ++this.requestId;
    
    try {
      logger.debug(`MCP Request [${id}]: ${method}`, params);
      
      const response = await this.client.post('', {
        jsonrpc: '2.0',
        method,
        params: params || {},
        id,
      });

      if (response.data.error) {
        throw new Error(`MCP Error: ${response.data.error.message}`);
      }

      logger.debug(`MCP Response [${id}]:`, response.data.result);
      return response.data.result;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(`MCP call failed: ${message}`);
      }
      throw error;
    }
  }

  async listTools(): Promise<any[]> {
    const result = await this.call('tools/list');
    return result.tools || [];
  }

  async getResourceSchemas(): Promise<any[]> {
    const result = await this.call('resources/list');
    return result.resources || [];
  }
}