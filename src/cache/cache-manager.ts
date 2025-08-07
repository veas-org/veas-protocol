import NodeCache from 'node-cache';
import * as crypto from 'crypto';

export interface CacheOptions {
  ttl?: number;
  enabled?: boolean;
}

export class CacheManager {
  private cache: NodeCache;
  private enabled: boolean;

  constructor(options: CacheOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.ttl || 300,
      checkperiod: 120,
      useClones: false,
    });
    this.enabled = options.enabled !== false;
  }

  private generateKey(method: string, params: any): string {
    const keyData = JSON.stringify({ method, params });
    return crypto.createHash('md5').update(keyData).digest('hex');
  }

  async get<T>(method: string, params: any): Promise<T | null> {
    if (!this.enabled) return null;

    const key = this.generateKey(method, params);
    const cached = this.cache.get<T>(key);
    
    if (cached !== undefined) {
      console.log(`[Cache] Hit for ${method}`);
      return cached;
    }

    console.log(`[Cache] Miss for ${method}`);
    return null;
  }

  async set<T>(method: string, params: any, value: T): Promise<void> {
    if (!this.enabled) return;

    const key = this.generateKey(method, params);
    this.cache.set(key, value);
    console.log(`[Cache] Stored ${method}`);
  }

  async invalidate(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.flushAll();
      console.log('[Cache] Flushed all entries');
      return;
    }

    const keys = this.cache.keys();
    const toDelete = keys.filter(key => key.includes(pattern));
    
    if (toDelete.length > 0) {
      this.cache.del(toDelete);
      console.log(`[Cache] Invalidated ${toDelete.length} entries`);
    }
  }

  getStats() {
    return this.cache.getStats();
  }
}