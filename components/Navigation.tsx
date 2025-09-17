'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  FlaskConical,
  Settings,
  Upload,
  FileText,
  Download,
  History,
  LogOut,
  User
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'analyst' | 'viewer';
  email: string;
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <FlaskConical className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">HPLC Reports</span>
            </Link>

            <div className="hidden md:flex space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>

              {(user.role === 'admin' || user.role === 'analyst') && (
                <>
                  <Link href="/data-input">
                    <Button variant="ghost" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Data Input
                    </Button>
                  </Link>
                  <Link href="/reports">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Reports
                    </Button>
                  </Link>
                </>
              )}

              <Link href="/history">
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              </Link>

              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{user.name}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {user.role}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}