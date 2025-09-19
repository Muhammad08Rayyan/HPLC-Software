import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Department from '@/models/Department';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const departments = await Department.find({}).sort({ name: 1 });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error('Failed to fetch departments:', error);
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

    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({ name: name.trim() });
    if (existingDepartment) {
      return NextResponse.json({ error: 'Department already exists' }, { status: 400 });
    }

    const department = await Department.create({
      name: name.trim(),
      description: description?.trim() || '',
      config: {
        peakConfig: {
          defaultCount: 5,
          maxCount: 20
        },
        fieldConfig: {
          enableArea: true,
          enableHeight: true,
          enableConcentration: true,
          areaLabel: 'Area',
          heightLabel: 'Height',
          concentrationLabel: 'Conc.'
        },
        detectorSettings: {
          wavelength: 210,
          defaultUnits: 'mV'
        }
      }
    });

    // Log department creation
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'department_created',
      details: { departmentName: department.name }
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('Failed to create department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}