import pc from 'picocolors';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static instance: Logger;
  private level: LogLevel = LogLevel.INFO;

  private constructor() {
    // Check for log level from environment
    const envLevel = process.env.VEAS_LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      this.level = LogLevel[envLevel as keyof typeof LogLevel] as unknown as LogLevel;
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(pc.gray('[DEBUG]'), ...args);
    }
  }

  info(...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.log(pc.yellow('[WARN]'), ...args);
    }
  }

  error(...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(pc.red('[ERROR]'), ...args);
    }
  }

  // Utility method to safely log sensitive data in debug mode only
  debugSensitive(message: string, data: any): void {
    if (this.level <= LogLevel.DEBUG) {
      const safeData = this.sanitizeData(data);
      this.debug(message, safeData);
    }
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      // Mask tokens and passwords
      if (data.length > 20) {
        return `${data.substring(0, 10)}...${data.substring(data.length - 4)}`;
      }
      return data;
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const key in data) {
        if (key.toLowerCase().includes('token') || 
            key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('secret')) {
          sanitized[key] = data[key] ? '[REDACTED]' : null;
        } else {
          sanitized[key] = this.sanitizeData(data[key]);
        }
      }
      return sanitized;
    }
    
    return data;
  }
}

export const logger = Logger.getInstance();