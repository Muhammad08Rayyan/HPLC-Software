'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Users, Database, FileText } from 'lucide-react';

interface Configuration {
  peakConfig: {
    defaultCount: number;
    minCount: number;
    maxCount: number;
    enableRange: boolean;
  };
  fieldConfig: {
    enableArea: boolean;
    enableHeight: boolean;
    enableConcentration: boolean;
    areaLabel: string;
    heightLabel: string;
    concentrationLabel: string;
  };
  detectorSettings: {
    wavelength?: number;
    flowRate?: number;
    temperature?: number;
  };
  reportTemplate: {
    title: string;
    includeSystemSuitability: boolean;
    includePeakTable: boolean;
    includeGraph: boolean;
  };
}

export default function AdminPage() {
  const [config, setConfig] = useState<Configuration>({
    peakConfig: {
      defaultCount: 5,
      minCount: 1,
      maxCount: 20,
      enableRange: true
    },
    fieldConfig: {
      enableArea: true,
      enableHeight: true,
      enableConcentration: true,
      areaLabel: 'Area',
      heightLabel: 'Height',
      concentrationLabel: 'Concentration'
    },
    detectorSettings: {
      wavelength: 254,
      flowRate: 1.0,
      temperature: 30
    },
    reportTemplate: {
      title: 'Analysis Report',
      includeSystemSuitability: true,
      includePeakTable: true,
      includeGraph: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'analyst',
    department: ''
  });

  useEffect(() => {
    // Load current configuration
    fetch('/api/config')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch config');
        }
        return res.json();
      })
      .then(data => {
        // Merge with default config to ensure all fields exist
        setConfig(prev => ({
          peakConfig: { ...prev.peakConfig, ...data.peakConfig },
          fieldConfig: { ...prev.fieldConfig, ...data.fieldConfig },
          detectorSettings: { ...prev.detectorSettings, ...data.detectorSettings },
          reportTemplate: { ...prev.reportTemplate, ...data.reportTemplate }
        }));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load config:', error);
        setMessage('Failed to load configuration. Using defaults.');
        setLoading(false);
      });

    // Load users
    fetch('/api/admin/users')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }
        return res.json();
      })
      .then(data => setUsers(data.users || []))
      .catch(error => {
        console.error('Failed to load users:', error);
        setUsers([]);
      });
  }, []);

  const saveConfiguration = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage('Configuration saved successfully!');
      } else {
        setMessage('Failed to save configuration');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  };

  const createUser = async () => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setMessage('User created successfully!');
        setNewUser({
          email: '',
          password: '',
          name: '',
          role: 'analyst',
          department: ''
        });
        // Refresh users list
        fetch('/api/admin/users')
          .then(res => res.json())
          .then(data => setUsers(data.users || []));
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to create user');
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Report Configuration
                </CardTitle>
                <CardDescription>
                  Configure default settings for HPLC reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Peak Configuration */}
                <div>
                  <h4 className="font-medium mb-3">Peak Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Default Count</label>
                      <Input
                        type="number"
                        value={config?.peakConfig?.defaultCount || 5}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          peakConfig: { ...prev.peakConfig, defaultCount: parseInt(e.target.value) || 5 }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Count</label>
                      <Input
                        type="number"
                        value={config?.peakConfig?.maxCount || 20}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          peakConfig: { ...prev.peakConfig, maxCount: parseInt(e.target.value) || 20 }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Field Configuration */}
                <div>
                  <h4 className="font-medium mb-3">Peak Data Fields</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config?.fieldConfig?.enableArea ?? true}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          fieldConfig: { ...prev.fieldConfig, enableArea: e.target.checked }
                        }))}
                        className="rounded w-4 h-4"
                      />
                      <div className="flex-1">
                        <Input
                          value={config?.fieldConfig?.areaLabel || 'Area'}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            fieldConfig: { ...prev.fieldConfig, areaLabel: e.target.value }
                          }))}
                          placeholder="Area field label"
                          disabled={!config?.fieldConfig?.enableArea}
                        />
                        <p className="text-xs text-gray-500 mt-1">Label for peak area field</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config?.fieldConfig?.enableHeight ?? true}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          fieldConfig: { ...prev.fieldConfig, enableHeight: e.target.checked }
                        }))}
                        className="rounded w-4 h-4"
                      />
                      <div className="flex-1">
                        <Input
                          value={config?.fieldConfig?.heightLabel || 'Height'}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            fieldConfig: { ...prev.fieldConfig, heightLabel: e.target.value }
                          }))}
                          placeholder="Height field label"
                          disabled={!config?.fieldConfig?.enableHeight}
                        />
                        <p className="text-xs text-gray-500 mt-1">Label for peak height field</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config?.fieldConfig?.enableConcentration ?? true}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          fieldConfig: { ...prev.fieldConfig, enableConcentration: e.target.checked }
                        }))}
                        className="rounded w-4 h-4"
                      />
                      <div className="flex-1">
                        <Input
                          value={config?.fieldConfig?.concentrationLabel || 'Concentration'}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            fieldConfig: { ...prev.fieldConfig, concentrationLabel: e.target.value }
                          }))}
                          placeholder="Concentration field label"
                          disabled={!config?.fieldConfig?.enableConcentration}
                        />
                        <p className="text-xs text-gray-500 mt-1">Label for concentration field</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detector Settings */}
                <div>
                  <h4 className="font-medium mb-3">Default Instrument Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Detection Wavelength (nm)</label>
                      <Input
                        type="number"
                        value={config?.detectorSettings?.wavelength || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          detectorSettings: { ...prev.detectorSettings, wavelength: parseFloat(e.target.value) || undefined }
                        }))}
                        placeholder="254"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Flow Rate (mL/min)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={config?.detectorSettings?.flowRate || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          detectorSettings: { ...prev.detectorSettings, flowRate: parseFloat(e.target.value) || undefined }
                        }))}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Column Temperature (°C)</label>
                      <Input
                        type="number"
                        value={config?.detectorSettings?.temperature || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          detectorSettings: { ...prev.detectorSettings, temperature: parseFloat(e.target.value) || undefined }
                        }))}
                        placeholder="30"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">These will be pre-filled in the data input form</p>
                </div>

                {/* Report Template */}
                <div>
                  <h4 className="font-medium mb-3">Report Configuration</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Report Title</label>
                      <Input
                        value={config?.reportTemplate?.title || 'Analysis Report'}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          reportTemplate: { ...prev.reportTemplate, title: e.target.value }
                        }))}
                        placeholder="Analysis Report"
                      />
                      <p className="text-xs text-gray-500 mt-1">Default title for generated reports</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Report Sections</label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">Peak Table</span>
                            <p className="text-xs text-gray-600">Show detailed peak data table</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={config?.reportTemplate?.includePeakTable ?? true}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              reportTemplate: { ...prev.reportTemplate, includePeakTable: e.target.checked }
                            }))}
                            className="rounded w-4 h-4"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">Chromatogram</span>
                            <p className="text-xs text-gray-600">Include chromatogram visualization</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={config?.reportTemplate?.includeGraph ?? true}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              reportTemplate: { ...prev.reportTemplate, includeGraph: e.target.checked }
                            }))}
                            className="rounded w-4 h-4"
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium">System Suitability</span>
                            <p className="text-xs text-gray-600">Show system suitability parameters</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={config?.reportTemplate?.includeSystemSuitability ?? true}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              reportTemplate: { ...prev.reportTemplate, includeSystemSuitability: e.target.checked }
                            }))}
                            className="rounded w-4 h-4"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={saveConfiguration} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Create and manage user accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create New User */}
                <div>
                  <h4 className="font-medium mb-3">Create New User</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <Input
                      placeholder="Full Name"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                        className="rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="analyst">Analyst</option>
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <Input
                        placeholder="Department"
                        value={newUser.department}
                        onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                      />
                    </div>
                    <Button onClick={createUser} className="w-full">
                      Create User
                    </Button>
                  </div>
                </div>

                {/* Existing Users */}
                <div>
                  <h4 className="font-medium mb-3">Existing Users</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {users.map((user: any, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {message && (
            <div className={`mt-6 p-4 rounded-md ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}