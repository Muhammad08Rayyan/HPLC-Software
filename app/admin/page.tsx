'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Users, Database, FileText, Trash2 } from 'lucide-react';


export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [departmentMessage, setDepartmentMessage] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'analyst',
    department: 'Default'
  });
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: ''
  });
  const [departmentNameExists, setDepartmentNameExists] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<any>(null);

  useEffect(() => {
    // Check user role first
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

        setLoading(false);

        // Load users and departments
        loadUsers();
        loadDepartments();
        ensureDefaultDepartment();
      })
      .catch(() => {
        router.push('/login');
      });
  }, []);


  const createUser = async () => {
    setUserMessage(''); // Clear any previous messages

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setUserMessage('✅ User created successfully!');
        setNewUser({
          email: '',
          password: '',
          name: '',
          role: 'analyst',
          department: 'Default'
        });
        // Refresh users list
        loadUsers();
        setTimeout(() => setUserMessage(''), 3000);
      } else {
        const data = await response.json();
        setUserMessage(`❌ ${data.error || 'Failed to create user'}`);
      }
    } catch (err) {
      setUserMessage('❌ Network error - Please check your connection');
    }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage('User deleted successfully!');
        // Force immediate refresh of users list
        await loadUsers();
        // Clear message after a delay
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to delete user');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setDeletingUserId(null);
    }
  };

  const loadDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const response = await fetch('/api/admin/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      } else {
        setDepartments([]);
      }
    } catch (error) {
      console.error('Failed to load departments:', error);
      setDepartments([]);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const createDepartment = async () => {
    if (!newDepartment.name.trim()) {
      setDepartmentMessage('⚠️ Department name is required');
      return;
    }

    setDepartmentMessage(''); // Clear any previous messages

    try {
      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDepartment)
      });

      if (response.ok) {
        setDepartmentMessage('✅ Department created successfully!');
        setNewDepartment({ name: '', description: '' });
        loadDepartments();
        // Clear success message after 3 seconds
        setTimeout(() => setDepartmentMessage(''), 3000);
      } else {
        const data = await response.json();
        if (data.error === 'Department already exists') {
          setDepartmentMessage(`❌ Department name "${newDepartment.name}" already exists. Please choose a different name.`);
        } else {
          setDepartmentMessage(`❌ ${data.error || 'Failed to create department'}`);
        }
      }
    } catch (err) {
      setDepartmentMessage('❌ Network error - Please check your connection');
    }
  };

  const updateDepartment = async () => {
    setDepartmentMessage(''); // Clear any previous messages

    try {
      const response = await fetch(`/api/admin/departments/${editingDepartment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingDepartment.name,
          description: editingDepartment.description,
          config: editingDepartment.config
        })
      });

      if (response.ok) {
        setDepartmentMessage('✅ Department configuration updated successfully!');
        setEditingDepartment(null);
        loadDepartments();
        // Clear message after a delay
        setTimeout(() => setDepartmentMessage(''), 3000);
      } else {
        const data = await response.json();
        if (data.error === 'Department name already exists') {
          setDepartmentMessage(`❌ Department name "${editingDepartment.name}" already exists. Please choose a different name.`);
        } else {
          setDepartmentMessage(`❌ ${data.error || 'Failed to update department'}`);
        }
      }
    } catch (err) {
      setDepartmentMessage('❌ Network error - Please check your connection');
    }
  };

  const deleteDepartment = async (departmentId: string, departmentName: string) => {
    if (!confirm(`Are you sure you want to delete department "${departmentName}"? This action cannot be undone.`)) {
      return;
    }

    setDepartmentMessage(''); // Clear any previous messages

    try {
      const response = await fetch(`/api/admin/departments/${departmentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDepartmentMessage('✅ Department deleted successfully!');
        loadDepartments();
        setTimeout(() => setDepartmentMessage(''), 3000);
      } else {
        const data = await response.json();
        setDepartmentMessage(`❌ ${data.error || 'Failed to delete department'}`);
      }
    } catch (err) {
      setDepartmentMessage('❌ Network error - Please check your connection');
    }
  };

  const ensureDefaultDepartment = async () => {
    try {
      const response = await fetch('/api/admin/departments/ensure-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        // Refresh departments list after ensuring default exists
        loadDepartments();
      }
    } catch (error) {
      console.error('Failed to ensure default department:', error);
    }
  };

  // Check if department name exists while typing
  const checkDepartmentNameExists = (name: string) => {
    if (!name.trim()) {
      setDepartmentNameExists(false);
      return;
    }

    const exists = departments.some((dept: any) =>
      dept.name.toLowerCase() === name.trim().toLowerCase()
    );
    setDepartmentNameExists(exists);
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

            {/* Department Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Department Settings
                </CardTitle>
                <CardDescription>
                  Manage departments and their report configuration settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create New Department */}
                <div>
                  <h4 className="font-medium mb-3">Create New Department</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        placeholder="Department Name"
                        value={newDepartment.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setNewDepartment(prev => ({ ...prev, name: newName }));
                          checkDepartmentNameExists(newName);
                          setDepartmentMessage(''); // Clear message when typing
                        }}
                        className={departmentNameExists ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {departmentNameExists && (
                        <div className="absolute mt-1 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠️</span>
                          Department name already exists
                        </div>
                      )}
                    </div>
                    <Input
                      placeholder="Description (optional)"
                      value={newDepartment.description}
                      onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <Button
                    onClick={createDepartment}
                    className="mt-3"
                    disabled={departmentNameExists || !newDepartment.name.trim()}
                  >
                    Create Department
                  </Button>

                  {/* Department Error/Success Message */}
                  {departmentMessage && (
                    <div className={`mt-3 p-3 rounded-md border ${
                      departmentMessage.includes('✅')
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      <div className="flex items-center">
                        <div className="text-sm font-medium">
                          {departmentMessage}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Existing Departments */}
                <div>
                  <h4 className="font-medium mb-3">Department Configuration</h4>
                  {departmentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="ml-2 text-gray-600">Loading departments...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {departments.map((department: any) => (
                        <Card key={department._id} className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{department.name}</CardTitle>
                                {department.description && (
                                  <CardDescription>{department.description}</CardDescription>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingDepartment(department)}
                                >
                                  Configure
                                </Button>
                                {department.name !== 'Default' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteDepartment(department._id, department.name)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          {editingDepartment?._id === department._id && (
                            <CardContent className="pt-0">
                              <div className="space-y-4 border-t pt-4">
                                {/* Report Configuration for Department */}
                                <div className="space-y-4">
                                  <h5 className="font-medium text-gray-900">Report Configuration</h5>

                                  {/* Peak Configuration */}
                                  <div>
                                    <h6 className="text-sm font-medium text-gray-700 mb-2">Number of Peaks</h6>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs text-gray-600">Default Count</label>
                                        <Input
                                          type="number"
                                          value={editingDepartment.config?.peakConfig?.defaultCount || 5}
                                          onChange={(e) => setEditingDepartment((prev: any) => ({
                                            ...prev,
                                            config: {
                                              ...prev.config,
                                              peakConfig: { ...prev.config?.peakConfig, defaultCount: parseInt(e.target.value) || 5 }
                                            }
                                          }))}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600">Max Count</label>
                                        <Input
                                          type="number"
                                          value={editingDepartment.config?.peakConfig?.maxCount || 20}
                                          onChange={(e) => setEditingDepartment((prev: any) => ({
                                            ...prev,
                                            config: {
                                              ...prev.config,
                                              peakConfig: { ...prev.config?.peakConfig, maxCount: parseInt(e.target.value) || 20 }
                                            }
                                          }))}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Detector Settings */}
                                  <div>
                                    <h6 className="text-sm font-medium text-gray-700 mb-2">Detector Settings</h6>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs text-gray-600">Detection Wavelength (nm)</label>
                                        <Input
                                          type="number"
                                          value={editingDepartment.config?.detectorSettings?.wavelength || ''}
                                          onChange={(e) => setEditingDepartment((prev: any) => ({
                                            ...prev,
                                            config: {
                                              ...prev.config,
                                              detectorSettings: { ...prev.config?.detectorSettings, wavelength: parseFloat(e.target.value) || undefined }
                                            }
                                          }))}
                                          placeholder="210"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-600">Default Signal Units</label>
                                        <select
                                          value={editingDepartment.config?.detectorSettings?.defaultUnits || 'mV'}
                                          onChange={(e) => setEditingDepartment((prev: any) => ({
                                            ...prev,
                                            config: {
                                              ...prev.config,
                                              detectorSettings: { ...prev.config?.detectorSettings, defaultUnits: e.target.value }
                                            }
                                          }))}
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                                        >
                                          <option value="mV">mV (millivolt)</option>
                                          <option value="AU">AU (absorbance units)</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Field Configuration */}
                                  <div>
                                    <h6 className="text-sm font-medium text-gray-700 mb-2">Data Fields Configuration</h6>
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-3">
                                        <input
                                          type="checkbox"
                                          checked={editingDepartment.config?.fieldConfig?.enableArea ?? true}
                                          onChange={(e) => setEditingDepartment((prev: any) => ({
                                            ...prev,
                                            config: {
                                              ...prev.config,
                                              fieldConfig: { ...prev.config?.fieldConfig, enableArea: e.target.checked }
                                            }
                                          }))}
                                          className="rounded w-4 h-4"
                                        />
                                        <div className="flex-1">
                                          <Input
                                            value={editingDepartment.config?.fieldConfig?.areaLabel || 'Area'}
                                            onChange={(e) => setEditingDepartment((prev: any) => ({
                                              ...prev,
                                              config: {
                                                ...prev.config,
                                                fieldConfig: { ...prev.config?.fieldConfig, areaLabel: e.target.value }
                                              }
                                            }))}
                                            placeholder="Area field label"
                                            disabled={!editingDepartment.config?.fieldConfig?.enableArea}
                                            className="text-sm"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-3">
                                        <input
                                          type="checkbox"
                                          checked={editingDepartment.config?.fieldConfig?.enableHeight ?? true}
                                          onChange={(e) => setEditingDepartment((prev: any) => ({
                                            ...prev,
                                            config: {
                                              ...prev.config,
                                              fieldConfig: { ...prev.config?.fieldConfig, enableHeight: e.target.checked }
                                            }
                                          }))}
                                          className="rounded w-4 h-4"
                                        />
                                        <div className="flex-1">
                                          <Input
                                            value={editingDepartment.config?.fieldConfig?.heightLabel || 'Height'}
                                            onChange={(e) => setEditingDepartment((prev: any) => ({
                                              ...prev,
                                              config: {
                                                ...prev.config,
                                                fieldConfig: { ...prev.config?.fieldConfig, heightLabel: e.target.value }
                                              }
                                            }))}
                                            placeholder="Height field label"
                                            disabled={!editingDepartment.config?.fieldConfig?.enableHeight}
                                            className="text-sm"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex items-center space-x-3">
                                        <input
                                          type="checkbox"
                                          checked={editingDepartment.config?.fieldConfig?.enableConcentration ?? true}
                                          onChange={(e) => setEditingDepartment((prev: any) => ({
                                            ...prev,
                                            config: {
                                              ...prev.config,
                                              fieldConfig: { ...prev.config?.fieldConfig, enableConcentration: e.target.checked }
                                            }
                                          }))}
                                          className="rounded w-4 h-4"
                                        />
                                        <div className="flex-1">
                                          <Input
                                            value={editingDepartment.config?.fieldConfig?.concentrationLabel || 'Conc.'}
                                            onChange={(e) => setEditingDepartment((prev: any) => ({
                                              ...prev,
                                              config: {
                                                ...prev.config,
                                                fieldConfig: { ...prev.config?.fieldConfig, concentrationLabel: e.target.value }
                                              }
                                            }))}
                                            placeholder="Concentration field label"
                                            disabled={!editingDepartment.config?.fieldConfig?.enableConcentration}
                                            className="text-sm"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex space-x-2 pt-4 border-t">
                                  <Button size="sm" onClick={updateDepartment}>Save Configuration</Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingDepartment(null)}>Cancel</Button>
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}

                      {departments.length === 0 && !departmentsLoading && (
                        <div className="text-center py-8 text-gray-500">
                          No departments found. Create a department to get started.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Create and manage user accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Create New User */}
                  <div>
                    <h4 className="font-medium mb-4">Create New User</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
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
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                          <select
                            value={newUser.role}
                            onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                          >
                            <option value="analyst">Analyst</option>
                            <option value="admin">Admin</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                          <select
                            value={newUser.department}
                            onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                            className="w-full rounded-md border border-gray-300 px-3 py-2"
                          >
                            {departments.map((dept: any) => (
                              <option key={dept._id} value={dept.name}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <Button onClick={createUser} className="w-full">
                        Create User
                      </Button>

                      {/* User Error/Success Message */}
                      {userMessage && (
                        <div className={`mt-3 p-3 rounded-md border ${
                          userMessage.includes('✅')
                            ? 'bg-green-50 text-green-800 border-green-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          <div className="flex items-center">
                            <div className="text-sm font-medium">
                              {userMessage}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Existing Users */}
                  <div>
                    <h4 className="font-medium mb-4">Existing Users</h4>
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="ml-2 text-gray-600">Loading users...</span>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {users.map((user: any, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              {user.department && (
                                <p className="text-xs text-gray-500 mt-1">Department: {user.department}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {user.role}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteUser(user._id, user.name)}
                                disabled={deletingUserId === user._id}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
                              >
                                {deletingUserId === user._id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}

                        {users.length === 0 && !usersLoading && (
                          <div className="text-center py-12 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">No other users found</p>
                            <p className="text-sm">Create your first user to get started</p>
                          </div>
                        )}
                      </div>
                    )}
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