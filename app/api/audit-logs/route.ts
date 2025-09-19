import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const query: { userId?: string } = {};
    if (user.role !== 'admin') {
      query.userId = String(user._id);
    }

    // Get the 10 most recent logs
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(10);

    // Clean up older logs (keep only the 10 most recent)
    const totalCount = await AuditLog.countDocuments(query);
    if (totalCount > 10) {
      // Get the 10th most recent log's timestamp
      const tenthLog = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(9)
        .limit(1)
        .select('timestamp');
      
      if (tenthLog.length > 0) {
        // Delete all logs older than the 10th most recent
        await AuditLog.deleteMany({
          ...query,
          timestamp: { $lt: tenthLog[0].timestamp }
        });
      }
    }

    return NextResponse.json({
      logs,
      total: logs.length
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}