import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from './cache-manager';

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create cache with default options', () => {
      cacheManager = new CacheManager();
      expect(cacheManager).toBeDefined();
      expect((cacheManager as any).enabled).toBe(true);
    });

    it('should create cache with custom TTL', () => {
      cacheManager = new CacheManager({ ttl: 600 });
      const cache = (cacheManager as any).cache;
      expect(cache.options.stdTTL).toBe(600);
    });

    it('should create disabled cache', () => {
      cacheManager = new CacheManager({ enabled: false });
      expect((cacheManager as any).enabled).toBe(false);
    });
  });

  describe('generateKey', () => {
    it('should generate consistent keys for same input', () => {
      cacheManager = new CacheManager();
      const method = 'testMethod';
      const params = { id: 1, name: 'test' };

      const key1 = (cacheManager as any).generateKey(method, params);
      const key2 = (cacheManager as any).generateKey(method, params);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^[a-f0-9]{32}$/); // MD5 hash format
    });

    it('should generate different keys for different inputs', () => {
      cacheManager = new CacheManager();
      
      const key1 = (cacheManager as any).generateKey('method1', { id: 1 });
      const key2 = (cacheManager as any).generateKey('method2', { id: 1 });
      const key3 = (cacheManager as any).generateKey('method1', { id: 2 });

      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });
  });

  describe('get', () => {
    it('should return cached value on hit', async () => {
      cacheManager = new CacheManager();
      const method = 'testMethod';
      const params = { id: 1 };
      const value = { data: 'test' };

      // Manually set cache value
      const key = (cacheManager as any).generateKey(method, params);
      (cacheManager as any).cache.set(key, value);

      const result = await cacheManager.get(method, params);

      expect(result).toEqual(value);
      expect(console.log).toHaveBeenCalledWith('[Cache] Hit for testMethod');
    });

    it('should return null on miss', async () => {
      cacheManager = new CacheManager();
      const method = 'testMethod';
      const params = { id: 1 };

      const result = await cacheManager.get(method, params);

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith('[Cache] Miss for testMethod');
    });

    it('should return null when cache is disabled', async () => {
      cacheManager = new CacheManager({ enabled: false });
      const method = 'testMethod';
      const params = { id: 1 };

      const result = await cacheManager.get(method, params);

      expect(result).toBeNull();
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should store value in cache', async () => {
      cacheManager = new CacheManager();
      const method = 'testMethod';
      const params = { id: 1 };
      const value = { data: 'test' };

      await cacheManager.set(method, params, value);

      const key = (cacheManager as any).generateKey(method, params);
      const stored = (cacheManager as any).cache.get(key);

      expect(stored).toEqual(value);
      expect(console.log).toHaveBeenCalledWith('[Cache] Stored testMethod');
    });

    it('should not store when cache is disabled', async () => {
      cacheManager = new CacheManager({ enabled: false });
      const method = 'testMethod';
      const params = { id: 1 };
      const value = { data: 'test' };

      await cacheManager.set(method, params, value);

      const key = (cacheManager as any).generateKey(method, params);
      const stored = (cacheManager as any).cache.get(key);

      expect(stored).toBeUndefined();
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('invalidate', () => {
    beforeEach(() => {
      cacheManager = new CacheManager();
      // Add some test data
      (cacheManager as any).cache.set('key1-project', 'value1');
      (cacheManager as any).cache.set('key2-project', 'value2');
      (cacheManager as any).cache.set('key3-user', 'value3');
    });

    it('should flush all entries when no pattern provided', async () => {
      await cacheManager.invalidate();

      const keys = (cacheManager as any).cache.keys();
      expect(keys).toHaveLength(0);
      expect(console.log).toHaveBeenCalledWith('[Cache] Flushed all entries');
    });

    it('should invalidate entries matching pattern', async () => {
      await cacheManager.invalidate('project');

      const keys = (cacheManager as any).cache.keys();
      expect(keys).toHaveLength(1);
      expect(keys).toContain('key3-user');
      expect(console.log).toHaveBeenCalledWith('[Cache] Invalidated 2 entries');
    });

    it('should handle no matches for pattern', async () => {
      await cacheManager.invalidate('nonexistent');

      const keys = (cacheManager as any).cache.keys();
      expect(keys).toHaveLength(3);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cacheManager = new CacheManager();
      
      // Trigger some cache operations
      const key = 'test-key';
      (cacheManager as any).cache.set(key, 'value');
      (cacheManager as any).cache.get(key); // hit
      (cacheManager as any).cache.get('nonexistent'); // miss

      const stats = cacheManager.getStats();

      expect(stats).toHaveProperty('hits', 1);
      expect(stats).toHaveProperty('misses', 1);
      expect(stats).toHaveProperty('keys', 1);
    });
  });

  describe('TTL behavior', () => {
    it('should expire cached values after TTL', async () => {
      cacheManager = new CacheManager({ ttl: 0.1 }); // 100ms TTL
      const method = 'testMethod';
      const params = { id: 1 };
      const value = { data: 'test' };

      await cacheManager.set(method, params, value);
      
      // Value should exist immediately
      let result = await cacheManager.get(method, params);
      expect(result).toEqual(value);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Value should be expired
      result = await cacheManager.get(method, params);
      expect(result).toBeNull();
    });
  });
});