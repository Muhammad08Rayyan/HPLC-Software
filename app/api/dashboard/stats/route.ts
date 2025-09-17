import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HPLCData from '@/models/HPLCData';
import User from '@/models/User';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total samples
    const totalSamples = await HPLCData.countDocuments(
      user.role === 'admin' ? {} : { analystId: user._id }
    );

    // Reports generated
    const reportsGenerated = await HPLCData.countDocuments(
      user.role === 'admin'
        ? { reportGenerated: true }
        : { analystId: user._id, reportGenerated: true }
    );

    // LCM files generated
    const lcmFilesGenerated = await HPLCData.countDocuments(
      user.role === 'admin'
        ? { lcmGenerated: true }
        : { analystId: user._id, lcmGenerated: true }
    );

    // Active users (users who logged in in the last 30 days)
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Recent data
    const recentData = await HPLCData.find(
      user.role === 'admin' ? {} : { analystId: user._id }
    )
      .sort({ createdAt: -1 })
      .limit(10)
      .select('sampleId sampleName analystName createdAt reportGenerated lcmGenerated');

    // Chart data for the last 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStart = new Date(date.setHours(0, 0, 0, 0));
      const dateEnd = new Date(date.setHours(23, 59, 59, 999));

      const samplesCount = await HPLCData.countDocuments({
        ...(user.role === 'admin' ? {} : { analystId: user._id }),
        createdAt: { $gte: dateStart, $lte: dateEnd }
      });

      const reportsCount = await HPLCData.countDocuments({
        ...(user.role === 'admin' ? {} : { analystId: user._id }),
        reportGenerated: true,
        createdAt: { $gte: dateStart, $lte: dateEnd }
      });

      chartData.push({
        date: dateStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        samples: samplesCount,
        reports: reportsCount
      });
    }

    return NextResponse.json({
      totalSamples,
      reportsGenerated,
      lcmFilesGenerated,
      activeUsers: user.role === 'admin' ? activeUsers : 1,
      recentData,
      chartData
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}