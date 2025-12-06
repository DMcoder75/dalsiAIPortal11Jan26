/**
 * API Keys Management Page
 * View and manage all API keys
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Key,
  Search,
  Loader2,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

const ApiKeysManagement = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [filteredKeys, setFilteredKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchApiKeys();
  }, []);

  useEffect(() => {
    filterKeys();
  }, [searchTerm, statusFilter, apiKeys]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('admin_get_api_keys');

      if (error) throw error;

      // Transform data to match expected structure
      const transformedData = (data || []).map(key => ({
        ...key,
        users: {
          email: key.user_email,
          first_name: key.user_first_name,
          last_name: key.user_last_name
        }
      }));

      setApiKeys(transformedData);
      setFilteredKeys(transformedData);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterKeys = () => {
    let filtered = [...apiKeys];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(key =>
        key.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.key_prefix?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(key => 
        statusFilter === 'active' ? key.is_active : !key.is_active
      );
    }

    setFilteredKeys(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const totalRequests = apiKeys.reduce((sum, key) => sum + (key.total_requests || 0), 0);
  const totalTokens = apiKeys.reduce((sum, key) => sum + (key.total_tokens_used || 0), 0);
  const totalCost = apiKeys.reduce((sum, key) => sum + (parseFloat(key.total_cost_usd) || 0), 0);
  const activeKeys = apiKeys.filter(key => key.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">API Keys Management</h1>
        <p className="text-gray-400">Monitor and manage all API keys</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Keys</p>
                <p className="text-2xl font-bold text-green-400">{activeKeys}</p>
              </div>
              <Key className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-blue-400">{totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Tokens</p>
                <p className="text-2xl font-bold text-purple-400">{totalTokens.toLocaleString()}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Cost</p>
                <p className="text-2xl font-bold text-yellow-400">${totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, prefix, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">
            API Keys ({filteredKeys.length})
          </h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Key</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Requests</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tokens</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Cost</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Last Used</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeys.map((key) => (
                  <tr key={key.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-white">{key.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{key.key_prefix}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {key.users?.email || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      {key.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                        {key.subscription_tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {(key.total_requests || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {(key.total_tokens_used || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      ${parseFloat(key.total_cost_usd || 0).toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {key.last_used_at 
                        ? new Date(key.last_used_at).toLocaleString()
                        : 'Never'}
                    </td>
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

export default ApiKeysManagement;
