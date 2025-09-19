'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, User, Clock, Activity } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AuditLog {
  _id: string;
  userId: string;
  userName: string;
  action: string;
  sampleId?: string;
  details: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check user role and redirect if not admin
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.user) {
          router.push('/login');
          return;
        }
        if (data.user.role !== 'admin') {
          // Redirect non-admin users to their appropriate page
          if (data.user.role === 'analyst') {
            router.push('/data-input');
          } else if (data.user.role === 'viewer') {
            router.push('/reports');
          }
          return;
        }
        loadLogs();
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

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
                Recent system activities (showing 10 most recent actions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Activity Log */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.map((log) => (
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

                {logs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No recent activity found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}