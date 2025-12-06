/**
 * API Logs Viewer
 * View and filter API usage logs with user selection
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  FileText,
  Search,
  Filter,
  Loader2,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

const ApiLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedUser, setSelectedUser] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [endpointFilter, setEndpointFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [selectedUser, searchTerm, statusFilter, endpointFilter, logs]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .order('email');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('admin_get_api_logs', {
        p_limit: 500,
        p_user_id: null
      });

      if (error) throw error;

      // Transform data to match expected structure
      const transformedData = (data || []).map(log => ({
        ...log,
        users: {
          email: log.user_email,
          first_name: log.user_first_name,
          last_name: log.user_last_name
        }
      }));

      setLogs(transformedData);
      setFilteredLogs(transformedData);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(log => log.user_id === selectedUser);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.endpoint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'success') {
        filtered = filtered.filter(log => log.status_code >= 200 && log.status_code < 300);
      } else if (statusFilter === 'error') {
        filtered = filtered.filter(log => log.status_code >= 400);
      }
    }

    // Endpoint filter
    if (endpointFilter !== 'all') {
      filtered = filtered.filter(log => log.endpoint === endpointFilter);
    }

    setFilteredLogs(filtered);
  };

  const uniqueEndpoints = [...new Set(logs.map(log => log.endpoint))].sort();

  const exportLogs = () => {
    const csv = [
      ['User', 'Endpoint', 'Method', 'Status', 'Response Time (ms)', 'Tokens', 'Cost', 'IP', 'Timestamp'].join(','),
      ...filteredLogs.map(log => [
        log.users?.email || 'Unknown',
        log.endpoint,
        log.method,
        log.status_code,
        log.response_time_ms,
        log.tokens_used,
        log.cost_usd,
        log.ip_address,
        log.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Logs</h1>
          <p className="text-gray-400">Monitor API requests and responses</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={fetchLogs}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={exportLogs}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Total Logs</p>
            <p className="text-2xl font-bold text-white">{filteredLogs.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Success Rate</p>
            <p className="text-2xl font-bold text-green-400">
              {filteredLogs.length > 0
                ? ((filteredLogs.filter(l => l.status_code < 400).length / filteredLogs.length) * 100).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Avg Response Time</p>
            <p className="text-2xl font-bold text-blue-400">
              {filteredLogs.length > 0
                ? Math.round(filteredLogs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / filteredLogs.length)
                : 0}ms
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Total Cost</p>
            <p className="text-2xl font-bold text-yellow-400">
              ${filteredLogs.reduce((sum, l) => sum + parseFloat(l.cost_usd || 0), 0).toFixed(4)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter by User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="all">ALL USERS</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.email} {user.first_name ? `(${user.first_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="all">All Status</option>
                <option value="success">Success (2xx)</option>
                <option value="error">Error (4xx, 5xx)</option>
              </select>
            </div>

            {/* Endpoint Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Endpoint
              </label>
              <select
                value={endpointFilter}
                onChange={(e) => setEndpointFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="all">All Endpoints</option>
                {uniqueEndpoints.map(endpoint => (
                  <option key={endpoint} value={endpoint}>{endpoint}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">
            API Logs ({filteredLogs.length})
          </h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Endpoint</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Response</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tokens</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Cost</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {log.users?.email || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300 font-mono">{log.endpoint}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{log.method}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        log.status_code < 300
                          ? 'bg-green-500/20 text-green-400'
                          : log.status_code < 400
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {log.status_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">{log.response_time_ms}ms</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{log.tokens_used}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      ${parseFloat(log.cost_usd || 0).toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400 font-mono">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiLogs;
