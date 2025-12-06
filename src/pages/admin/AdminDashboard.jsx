/**
 * Admin Dashboard
 * Overview of system statistics and recent activity
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Key,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApiKeys: 0,
    totalApiCalls: 0,
    totalCost: 0,
    todayApiCalls: 0,
    todayCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard stats using RPC
      const { data: statsData, error: statsError } = await supabase.rpc('admin_get_dashboard_stats');

      if (statsError) throw statsError;

      if (statsData && statsData.length > 0) {
        const s = statsData[0];
        setStats({
          totalUsers: parseInt(s.total_users) || 0,
          totalApiKeys: parseInt(s.total_api_keys) || 0,
          totalApiCalls: parseInt(s.total_api_calls) || 0,
          totalCost: parseFloat(s.total_cost) || 0,
          todayApiCalls: parseInt(s.today_api_calls) || 0,
          todayCost: parseFloat(s.today_cost) || 0
        });
      }

      // Fetch recent logs using RPC
      const { data: logs, error: logsError } = await supabase.rpc('admin_get_api_logs', {
        p_limit: 10,
        p_user_id: null
      });

      if (logsError) throw logsError;

      setRecentLogs(logs || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className={`text-3xl font-bold text-${color}-500`}>{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 bg-${color}-600/20 rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-500`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your system statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active API Keys"
          value={stats.totalApiKeys.toLocaleString()}
          icon={Key}
          color="green"
        />
        <StatCard
          title="Total API Calls"
          value={stats.totalApiCalls.toLocaleString()}
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Total Cost"
          value={`$${stats.totalCost.toFixed(2)}`}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Today's API Calls</h3>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-500">{stats.todayApiCalls.toLocaleString()}</p>
            <p className="text-sm text-gray-400 mt-2">API requests made today</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Today's Cost</h3>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-yellow-500">${stats.todayCost.toFixed(4)}</p>
            <p className="text-sm text-gray-400 mt-2">Total cost incurred today</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Recent API Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Endpoint</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tokens</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Cost</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {log.user_email || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">{log.endpoint}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        log.status_code === 200 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {log.status_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">{log.tokens_used}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      ${parseFloat(log.cost_usd).toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(log.created_at).toLocaleTimeString()}
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

export default AdminDashboard;
