import { useState, useEffect } from 'react'
import { X, Download, Trash2, Search, Copy } from 'lucide-react'
import logger from '../lib/logger'

export default function LogViewer({ isOpen, onClose }) {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [stats, setStats] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const updateLogs = () => {
      const allLogs = logger.getLogs()
      setLogs(allLogs)
      setStats(logger.getStats())
    }

    updateLogs()

    // Auto-refresh logs every second if enabled
    const interval = autoRefresh ? setInterval(updateLogs, 1000) : null

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isOpen, autoRefresh])

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = logs

    // Apply level filter
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter(log => log.level === levelFilter)
    }

    // Apply source filter
    if (sourceFilter !== 'ALL') {
      filtered = filtered.filter(log => log.source.includes(sourceFilter))
    }

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, levelFilter, sourceFilter])

  if (!isOpen) return null

  const handleCopyLogs = () => {
    const text = filteredLogs.map(log =>
      `[${log.timestamp}] ${log.level} [${log.source}] ${log.message}`
    ).join('\n')
    navigator.clipboard.writeText(text)
    alert('Logs copied to clipboard!')
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'DEBUG':
        return 'bg-gray-700 text-gray-100'
      case 'INFO':
        return 'bg-blue-700 text-blue-100'
      case 'WARN':
        return 'bg-yellow-700 text-yellow-100'
      case 'ERROR':
        return 'bg-red-700 text-red-100'
      default:
        return 'bg-gray-700 text-gray-100'
    }
  }

  const uniqueSources = [...new Set(logs.map(log => log.source))]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Application Logs</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 p-4 bg-gray-800/50 border-b border-gray-700 text-sm">
            <div>
              <div className="text-gray-400">Total Logs</div>
              <div className="text-2xl font-bold text-white">{stats.totalLogs}</div>
            </div>
            <div>
              <div className="text-gray-400">Errors</div>
              <div className="text-2xl font-bold text-red-400">{stats.byLevel.ERROR || 0}</div>
            </div>
            <div>
              <div className="text-gray-400">Warnings</div>
              <div className="text-2xl font-bold text-yellow-400">{stats.byLevel.WARN || 0}</div>
            </div>
            <div>
              <div className="text-gray-400">Infos</div>
              <div className="text-2xl font-bold text-blue-400">{stats.byLevel.INFO || 0}</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 bg-gray-800/30 border-b border-gray-700 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">All Levels</option>
              <option value="DEBUG">Debug</option>
              <option value="INFO">Info</option>
              <option value="WARN">Warn</option>
              <option value="ERROR">Error</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="ALL">All Sources</option>
              {uniqueSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 rounded text-sm font-medium transition ${
                autoRefresh
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
            </button>
            <button
              onClick={handleCopyLogs}
              className="px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded text-sm font-medium transition flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={() => logger.exportLogsAsJSON()}
              className="px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded text-sm font-medium transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={() => logger.exportLogsAsCSV()}
              className="px-3 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded text-sm font-medium transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => {
                logger.clearLogs()
                setLogs([])
              }}
              className="px-3 py-2 bg-red-700 text-red-100 hover:bg-red-600 rounded text-sm font-medium transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {logs.length === 0 ? 'No logs yet' : 'No logs match the current filters'}
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {filteredLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 hover:bg-gray-800/50 transition border-l-4 border-gray-700"
                  style={{
                    borderLeftColor:
                      log.level === 'ERROR'
                        ? '#dc2626'
                        : log.level === 'WARN'
                        ? '#eab308'
                        : log.level === 'INFO'
                        ? '#3b82f6'
                        : '#6b7280'
                  }}
                >
                  <div className="flex gap-2 mb-1">
                    <span className="text-gray-500">{log.timestamp}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-gray-500">{log.source}</span>
                  </div>
                  <div className="text-gray-300 break-words">{log.message}</div>
                  {log.url && (
                    <div className="text-gray-600 text-xs mt-1">{log.url}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-800/30 border-t border-gray-700 text-xs text-gray-400">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </div>
    </div>
  )
}
