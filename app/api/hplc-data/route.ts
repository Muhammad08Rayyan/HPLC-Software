import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HPLCData from '@/models/HPLCData';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let query: any = {};
    if (user.role !== 'admin') {
      query.analystId = user._id;
    }

    const data = await HPLCData.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HPLCData.countDocuments(query);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user || !['admin', 'analyst'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hplcData = await request.json();

    const data = await HPLCData.create({
      ...hplcData,
      analystId: user._id,
      analystName: user.name,
      department: user.department
    });

    // Log the data upload
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'data_uploaded',
      sampleId: data.sampleId,
      details: { peakCount: data.peaks.length }
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}