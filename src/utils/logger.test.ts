import { describe, it, expect, beforeEach, vi, afterEach, beforeAll, afterAll } from 'vitest';
import { Logger, LogLevel, logger } from './logger.js';

// Mock console methods
let mockConsoleLog: any;
let mockConsoleError: any;

beforeAll(() => {
  mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
  mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  mockConsoleLog.mockRestore();
  mockConsoleError.mockRestore();
});

describe('Logger', () => {
  let testLogger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    // Reset environment variable
    delete process.env.VEAS_LOG_LEVEL;
    // Reset singleton
    (Logger as any).instance = undefined;
    // Create new instance for testing
    testLogger = Logger.getInstance();
  });

  afterEach(() => {
    // Just clear mocks, don't restore since we do that in afterAll
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  describe('log levels', () => {
    it('should default to INFO level', () => {
      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      expect(mockConsoleLog).toHaveBeenCalledTimes(2); // info and warn
      expect(mockConsoleError).toHaveBeenCalledTimes(1); // error
    });

    it('should respect DEBUG level', () => {
      testLogger.setLevel(LogLevel.DEBUG);

      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      expect(mockConsoleLog).toHaveBeenCalledTimes(3); // debug, info, warn
      expect(mockConsoleError).toHaveBeenCalledTimes(1); // error
    });

    it('should respect WARN level', () => {
      testLogger.setLevel(LogLevel.WARN);

      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      expect(mockConsoleLog).toHaveBeenCalledTimes(1); // warn only
      expect(mockConsoleError).toHaveBeenCalledTimes(1); // error
    });

    it('should respect ERROR level', () => {
      testLogger.setLevel(LogLevel.ERROR);

      testLogger.debug('debug message');
      testLogger.info('info message');
      testLogger.warn('warn message');
      testLogger.error('error message');

      expect(mockConsoleLog).toHaveBeenCalledTimes(0);
      expect(mockConsoleError).toHaveBeenCalledTimes(1); // error only
    });
  });

  describe('environment variable', () => {
    it('should read log level from environment', () => {
      process.env.VEAS_LOG_LEVEL = 'DEBUG';
      // Reset singleton to pick up env var
      (Logger as any).instance = undefined;
      const envLogger = Logger.getInstance();

      envLogger.debug('debug message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle invalid environment value', () => {
      process.env.VEAS_LOG_LEVEL = 'INVALID';
      // Reset singleton to pick up env var
      (Logger as any).instance = undefined;
      const envLogger = Logger.getInstance();

      // Should default to INFO
      envLogger.debug('debug message');
      envLogger.info('info message');

      expect(mockConsoleLog).toHaveBeenCalledTimes(1); // Only info
    });
  });

  describe('log formatting', () => {
    it('should format debug messages with prefix', () => {
      testLogger.setLevel(LogLevel.DEBUG);
      testLogger.debug('test message');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'test message'
      );
    });

    it('should format warn messages with prefix', () => {
      testLogger.warn('warning message');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]'),
        'warning message'
      );
    });

    it('should format error messages with prefix', () => {
      testLogger.error('error message');

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'error message'
      );
    });

    it('should pass info messages without prefix', () => {
      testLogger.info('info message');

      expect(mockConsoleLog).toHaveBeenCalledWith('info message');
    });
  });

  describe('debugSensitive', () => {
    beforeEach(() => {
      testLogger.setLevel(LogLevel.DEBUG);
    });

    it('should not log sensitive data when not in debug mode', () => {
      testLogger.setLevel(LogLevel.INFO);
      testLogger.debugSensitive('Sensitive:', 'secret-token-12345');

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should sanitize string tokens', () => {
      testLogger.debugSensitive('Token:', 'abcdefghijklmnopqrstuvwxyz123456');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Token:',
        'abcdefghij...3456'
      );
    });

    it('should handle short strings without sanitization', () => {
      testLogger.debugSensitive('Short:', 'short-value');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Short:',
        'short-value'
      );
    });

    it('should sanitize object with sensitive keys', () => {
      const sensitiveData = {
        username: 'john',
        password: 'secret123',
        token: 'bearer-token-12345',
        api_secret: 'api-secret-value',
        normal_field: 'visible',
      };

      testLogger.debugSensitive('Data:', sensitiveData);

      const logCall = mockConsoleLog.mock.calls[0];
      const loggedData = logCall[2];

      expect(loggedData).toEqual({
        username: 'john',
        password: '[REDACTED]',
        token: '[REDACTED]',
        api_secret: '[REDACTED]',
        normal_field: 'visible',
      });
    });

    it('should handle nested objects', () => {
      const nestedData = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret',
            token: 'token123',
          },
        },
      };

      testLogger.debugSensitive('Nested:', nestedData);

      const logCall = mockConsoleLog.mock.calls[0];
      const loggedData = logCall[2];

      expect(loggedData).toEqual({
        user: {
          name: 'John',
          credentials: {
            password: '[REDACTED]',
            token: '[REDACTED]',
          },
        },
      });
    });

    it('should handle null values in sensitive fields', () => {
      const dataWithNulls = {
        token: null,
        password: undefined,
        secret: '',
      };

      testLogger.debugSensitive('Nulls:', dataWithNulls);

      const logCall = mockConsoleLog.mock.calls[0];
      const loggedData = logCall[2];

      expect(loggedData).toEqual({
        token: null,
        password: null,
        secret: null,
      });
    });
  });

  describe('multiple arguments', () => {
    it('should handle multiple arguments', () => {
      testLogger.info('Message:', { data: 'value' }, 'extra');

      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Message:',
        { data: 'value' },
        'extra'
      );
    });

    it('should handle error objects', () => {
      const error = new Error('Test error');
      testLogger.error('Error occurred:', error);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        'Error occurred:',
        error
      );
    });
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should export a singleton instance', () => {
      // Just check they're both Logger instances
      expect(logger).toBeInstanceOf(Logger);
      expect(Logger.getInstance()).toBeInstanceOf(Logger);
    });
  });
});