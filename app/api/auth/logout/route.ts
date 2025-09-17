import { NextRequest, NextResponse } from 'next/server';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';
import connectDB from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (user) {
      // Log the logout
      await AuditLog.create({
        userId: user._id,
        userName: user.name,
        action: 'logout',
        details: {},
        ipAddress: request.ip
      });
    }

    const response = NextResponse.json({ message: 'Logged out successfully' });
    response.cookies.delete('auth-token');

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}