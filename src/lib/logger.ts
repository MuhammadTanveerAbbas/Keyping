type LogLevel = "info" | "warn" | "error" | "debug";

type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  userId?: string;
  requestId?: string;
  data?: Record<string, unknown>;
};

const isProduction = import.meta.env.PROD;

function createEntry(level: LogLevel, message: string, data?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    const entry = createEntry("info", message, data);
    if (isProduction) {
      console.log(JSON.stringify(entry));
    } else {
      console.log(`[INFO] ${message}`, data ?? "");
    }
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    const entry = createEntry("warn", message, data);
    if (isProduction) {
      console.warn(JSON.stringify(entry));
    } else {
      console.warn(`[WARN] ${message}`, data ?? "");
    }
  },

  error: (message: string, data?: Record<string, unknown>) => {
    const entry = createEntry("error", message, data);
    if (isProduction) {
      console.error(JSON.stringify(entry));
    } else {
      console.error(`[ERROR] ${message}`, data ?? "");
    }
  },

  debug: (message: string, data?: Record<string, unknown>) => {
    if (isProduction) return;
    const entry = createEntry("debug", message, data);
    console.debug(`[DEBUG] ${message}`, data ?? "");
  },
};
