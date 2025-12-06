/**
 * Friction Management
 * View and manage friction events and conversion tracking with user filter
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Zap,
  Search,
  Loader2,
  TrendingUp,
  Users,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';

const FrictionManagement = () => {
  const [frictionEvents, setFrictionEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedUser, setSelectedUser] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    fetchUsers();
    fetchFrictionEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [selectedUser, searchTerm, eventTypeFilter, tierFilter, frictionEvents]);

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

  const fetchFrictionEvents = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('admin_get_friction_events', {
        p_limit: 500,
        p_user_id: null
      });

      if (error) throw error;

      // Transform data to match expected structure
      const transformedData = (data || []).map(event => ({
        ...event,
        users: {
          email: event.user_email,
          first_name: event.user_first_name,
          last_name: event.user_last_name,
          subscription_tier: event.user_subscription_tier
        }
      }));

      setFrictionEvents(transformedData);
      setFilteredEvents(transformedData);
    } catch (error) {
      console.error('Error fetching friction events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...frictionEvents];

    // User filter
    if (selectedUser !== 'all') {
      filtered = filtered.filter(event => event.user_id === selectedUser);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.trigger_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.session_id?.includes(searchTerm)
      );
    }

    // Event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.event_type === eventTypeFilter);
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(event => event.friction_tier === tierFilter);
    }

    setFilteredEvents(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const totalEvents = frictionEvents.length;
  const conversions = frictionEvents.filter(e => e.converted).length;
  const conversionRate = totalEvents > 0 ? (conversions / totalEvents) * 100 : 0;
  const uniqueUsers = new Set(frictionEvents.map(e => e.user_id)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Friction Management</h1>
        <p className="text-gray-400">Monitor friction events and conversion tracking</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Events</p>
                <p className="text-2xl font-bold text-white">{totalEvents}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Conversions</p>
                <p className="text-2xl font-bold text-green-400">{conversions}</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-blue-400">{conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Unique Users</p>
                <p className="text-2xl font-bold text-purple-400">{uniqueUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
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

            {/* Event Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Event Type
              </label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="all">All Types</option>
                <option value="limit_reached">Limit Reached</option>
                <option value="feature_locked">Feature Locked</option>
                <option value="upgrade_prompt">Upgrade Prompt</option>
              </select>
            </div>

            {/* Tier Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Friction Tier
              </label>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="all">All Tiers</option>
                <option value="soft">Soft</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">
            Friction Events ({filteredEvents.length})
          </h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Event Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Friction Tier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Trigger Reason</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User Action</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Converted</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">User Tier</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-sm text-gray-400">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {event.users?.email || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                        {event.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        event.friction_tier === 'hard'
                          ? 'bg-red-500/20 text-red-400'
                          : event.friction_tier === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {event.friction_tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">{event.trigger_reason}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{event.user_action || 'None'}</td>
                    <td className="py-3 px-4">
                      {event.converted ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      {event.users?.subscription_tier || 'free'}
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

export default FrictionManagement;
