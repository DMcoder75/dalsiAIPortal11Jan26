/**
 * Analytics Dashboard
 * Visualize API usage, costs, and trends
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BarChart3,
  TrendingUp,
  Activity,
  DollarSign,
  Loader2,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';

const Analytics = () => {
  const [stats, setStats] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    byEndpoint: [],
    byUser: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, 90days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      const daysAgo = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Fetch logs within date range
      const { data, error} = await supabase.rpc('admin_get_analytics', {
        p_days_ago: daysAgo
      });

      if (error) throw error;

      // Transform data for charts
      const dailyData = {};
      const endpointData = {};
      const userData = {};

      const dailyStats = {};
      const endpointStats = {};
      const userStats = {};

      (data || []).forEach(log => {
        const date = log.created_at.split('T')[0];
        const endpoint = log.endpoint || 'unknown';
        const userEmail = log.user_email || 'Unknown';

        // Daily aggregation
        if (!dailyStats[date]) {
          dailyStats[date] = { date, requests: 0, tokens: 0, cost: 0 };
        }
        dailyStats[date].requests += 1;
        dailyStats[date].tokens += log.tokens_used || 0;
        dailyStats[date].cost += parseFloat(log.cost_usd) || 0;

        // Endpoint aggregation
        if (!endpointStats[endpoint]) {
          endpointStats[endpoint] = { endpoint, requests: 0, tokens: 0, cost: 0 };
        }
        endpointStats[endpoint].requests += 1;
        endpointStats[endpoint].tokens += log.tokens_used || 0;
        endpointStats[endpoint].cost += parseFloat(log.cost_usd) || 0;

        // User aggregation
        if (!userStats[userEmail]) {
          userStats[userEmail] = { email: userEmail, requests: 0, tokens: 0, cost: 0 };
        }
        userStats[userEmail].requests += 1;
        userStats[userEmail].tokens += log.tokens_used || 0;
        userStats[userEmail].cost += parseFloat(log.cost_usd) || 0;
      });

      setStats({
        daily: Object.values(dailyStats),
        byEndpoint: Object.values(endpointStats).sort((a, b) => b.requests - a.requests),
        byUser: Object.values(userStats).sort((a, b) => b.requests - a.requests)
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const totalRequests = stats.daily.reduce((sum, day) => sum + day.requests, 0);
  const totalTokens = stats.daily.reduce((sum, day) => sum + day.tokens, 0);
  const totalCost = stats.daily.reduce((sum, day) => sum + day.cost, 0);
  const avgRequestsPerDay = stats.daily.length > 0 ? totalRequests / stats.daily.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">API usage trends and statistics</p>
        </div>

        {/* Time Range Selector */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-blue-400">{totalRequests.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {avgRequestsPerDay.toFixed(0)}/day
                </p>
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
              <TrendingUp className="w-8 h-8 text-purple-500" />
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

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Cost/Request</p>
                <p className="text-2xl font-bold text-green-400">
                  ${totalRequests > 0 ? (totalCost / totalRequests).toFixed(4) : '0.0000'}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Daily Requests Trend</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.daily.map((day, index) => {
              const maxRequests = Math.max(...stats.daily.map(d => d.requests));
              const width = maxRequests > 0 ? (day.requests / maxRequests) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400 w-24">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 bg-gray-700 rounded-full h-8 relative overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${width}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-sm font-medium text-white">
                      {day.requests} requests
                    </span>
                  </div>
                  <span className="text-sm text-gray-400 w-20 text-right">
                    ${day.cost.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* By Endpoint */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Usage by Endpoint</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Endpoint</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Requests</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tokens</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.byEndpoint.slice(0, 10).map((endpoint, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3 px-4 text-sm text-gray-300 font-mono">{endpoint.endpoint}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{endpoint.requests.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{endpoint.tokens.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">${endpoint.cost.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Top Users by Usage</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Requests</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tokens</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.byUser.slice(0, 10).map((user, index) => (
                  <tr key={index} className="border-b border-gray-700">
                    <td className="py-3 px-4 text-sm text-gray-300">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{user.requests.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{user.tokens.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">${user.cost.toFixed(4)}</td>
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

export default Analytics;
