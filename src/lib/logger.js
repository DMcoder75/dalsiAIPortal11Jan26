/**
 * Centralized Logging Service
 * Captures all logs across the application and stores them in localStorage
 * Provides methods for console logging with automatic storage
 */

const LOG_STORAGE_KEY = 'app_logs';
const MAX_LOGS = 1000; // Maximum number of logs to store
const LOG_LEVEL = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

class Logger {
  constructor() {
    this.logs = this.loadLogs();
    this.interceptConsole();
  }

  /**
   * Load logs from localStorage
   */
  loadLogs() {
    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load logs from localStorage:', e);
      return [];
    }
  }

  /**
   * Save logs to localStorage
   */
  saveLogs() {
    try {
      // Keep only the last MAX_LOGS entries
      const logsToStore = this.logs.slice(-MAX_LOGS);
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logsToStore));
    } catch (e) {
      console.error('Failed to save logs to localStorage:', e);
    }
  }

  /**
   * Add a log entry
   */
  addLog(level, args, source = 'console') {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');

    const logEntry = {
      timestamp,
      level,
      message,
      source,
      url: window.location.href
    };

    this.logs.push(logEntry);
    this.saveLogs();
  }

  /**
   * Intercept console methods to capture all logs
   */
  interceptConsole() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    console.log = (...args) => {
      this.addLog(LOG_LEVEL.DEBUG, args, 'console.log');
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      this.addLog(LOG_LEVEL.WARN, args, 'console.warn');
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      this.addLog(LOG_LEVEL.ERROR, args, 'console.error');
      originalError.apply(console, args);
    };

    console.info = (...args) => {
      this.addLog(LOG_LEVEL.INFO, args, 'console.info');
      originalInfo.apply(console, args);
    };
  }

  /**
   * Log a debug message
   */
  debug(...args) {
    this.addLog(LOG_LEVEL.DEBUG, args, 'logger.debug');
    console.log('[DEBUG]', ...args);
  }

  /**
   * Log an info message
   */
  info(...args) {
    this.addLog(LOG_LEVEL.INFO, args, 'logger.info');
    console.info('[INFO]', ...args);
  }

  /**
   * Log a warning message
   */
  warn(...args) {
    this.addLog(LOG_LEVEL.WARN, args, 'logger.warn');
    console.warn('[WARN]', ...args);
  }

  /**
   * Log an error message
   */
  error(...args) {
    this.addLog(LOG_LEVEL.ERROR, args, 'logger.error');
    console.error('[ERROR]', ...args);
  }

  /**
   * Log with custom prefix (for feature-specific logging)
   */
  logWithPrefix(prefix, level, ...args) {
    const message = `[${prefix}] ${args.join(' ')}`;
    this.addLog(level, [message], `logger.${prefix}`);
    console.log(message);
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by source
   */
  getLogsBySource(source) {
    return this.logs.filter(log => log.source.includes(source));
  }

  /**
   * Get logs from the last N minutes
   */
  getRecentLogs(minutes = 5) {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.filter(log => new Date(log.timestamp) > cutoffTime);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem(LOG_STORAGE_KEY);
    console.log('All logs cleared');
  }

  /**
   * Export logs as JSON
   */
  exportLogsAsJSON() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `app-logs-${new Date().toISOString().slice(0, 19)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export logs as CSV
   */
  exportLogsAsCSV() {
    const headers = ['Timestamp', 'Level', 'Source', 'URL', 'Message'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.level,
      log.source,
      log.url,
      `"${log.message.replace(/"/g, '""')}"` // Escape quotes for CSV
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `app-logs-${new Date().toISOString().slice(0, 19)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Get summary statistics
   */
  getStats() {
    const stats = {
      totalLogs: this.logs.length,
      byLevel: {},
      bySource: {},
      oldestLog: this.logs[0]?.timestamp,
      newestLog: this.logs[this.logs.length - 1]?.timestamp
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1;
    });

    return stats;
  }

  /**
   * Search logs by keyword
   */
  searchLogs(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return this.logs.filter(log =>
      log.message.toLowerCase().includes(lowerKeyword) ||
      log.source.toLowerCase().includes(lowerKeyword)
    );
  }
}

// Create singleton instance
const logger = new Logger();

// Expose to window for debugging
window.__logger = logger;

export default logger;
