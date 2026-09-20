type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

type LogHandler = (entry: LogEntry) => void;

class AppLogger {
  private isDevelopment: boolean;
  private handlers: LogHandler[] = [];

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  public addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };

    for (const handler of this.handlers) {
      try {
        handler(entry);
      } catch {
        // Suppress handler errors to prevent crashing the host application
      }
    }
  }

  public debug(message: string, context?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
}

export const logger = new AppLogger();
export type { LogLevel, LogEntry, LogHandler };
