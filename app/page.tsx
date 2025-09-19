'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in and redirect based on role
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          router.push('/login');
          return null;
        }
      })
      .then(data => {
        if (data?.user) {
          const role = data.user.role;
          if (role === 'admin') {
            router.push('/dashboard');
          } else if (role === 'analyst') {
            router.push('/data-input');
          } else if (role === 'viewer') {
            router.push('/reports');
          }
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}
