import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Configuration from '@/models/Configuration';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await Configuration.findOne({
      $or: [
        { userId: user._id },
        { department: user.department }
      ]
    });

    if (!config) {
      // Create default config
      const defaultConfig = await Configuration.create({
        userId: user._id,
        department: user.department
      });
      return NextResponse.json(defaultConfig);
    }

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const configData = await request.json();

    const config = await Configuration.findOneAndUpdate(
      { userId: user._id },
      {
        ...configData,
        userId: user._id,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    // Log the configuration change
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'config_changed',
      details: configData
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}