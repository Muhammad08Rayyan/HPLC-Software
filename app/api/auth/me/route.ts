import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}