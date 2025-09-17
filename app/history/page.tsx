'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { History, Search, User, Clock, Activity } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AuditLog {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  sampleId?: string;
  details: any;
  timestamp: string;
  ipAddress?: string;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/audit-logs');
      const result = await response.json();
      setLogs(result.logs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />;
      case 'report_generated':
      case 'lcm_generated':
        return <Activity className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login':
        return 'text-green-600 bg-green-50';
      case 'logout':
        return 'text-red-600 bg-red-50';
      case 'report_generated':
        return 'text-blue-600 bg-blue-50';
      case 'lcm_generated':
        return 'text-purple-600 bg-purple-50';
      case 'data_uploaded':
        return 'text-orange-600 bg-orange-50';
      case 'config_changed':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.sampleId && log.sampleId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Audit History</h1>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                System Activity Log
              </CardTitle>
              <CardDescription>
                Complete audit trail of all system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by user, sample, or action..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 bg-white"
                >
                  <option value="all">All Actions</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="data_uploaded">Data Uploaded</option>
                  <option value="report_generated">Report Generated</option>
                  <option value="lcm_generated">LCM Generated</option>
                  <option value="config_changed">Config Changed</option>
                </select>
              </div>

              {/* Activity Log */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredLogs.map((log) => (
                  <div key={log._id} className="flex items-start space-x-4 p-4 bg-white border rounded-lg">
                    <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {log.userName}
                        </h3>
                        <time className="text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600">
                        {formatAction(log.action)}
                        {log.sampleId && ` • Sample: ${log.sampleId}`}
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {Object.entries(log.details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                      {log.ipAddress && (
                        <p className="text-xs text-gray-400 mt-1">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {filteredLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No activity found matching your criteria
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {logs.filter(l => l.action === 'login').length}
                  </div>
                  <div className="text-sm text-gray-600">Logins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {logs.filter(l => l.action === 'data_uploaded').length}
                  </div>
                  <div className="text-sm text-gray-600">Data Uploads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {logs.filter(l => l.action === 'report_generated').length}
                  </div>
                  <div className="text-sm text-gray-600">Reports</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {logs.filter(l => l.action === 'lcm_generated').length}
                  </div>
                  <div className="text-sm text-gray-600">LCM Files</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}