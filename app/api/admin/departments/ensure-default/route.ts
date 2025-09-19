import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Department from '@/models/Department';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if default department already exists
    const existingDefault = await Department.findOne({ name: 'Default' });

    if (!existingDefault) {
      // Create default department with standard configuration
      const defaultDepartment = await Department.create({
        name: 'Default',
        description: 'Default department for admin users and users without specific departments',
        config: {
          peakConfig: {
            defaultCount: 5,
            maxCount: 20
          },
          detectorSettings: {
            wavelength: 210,
            defaultUnits: 'mV'
          },
          fieldConfig: {
            enableArea: true,
            areaLabel: 'Area',
            enableHeight: true,
            heightLabel: 'Height',
            enableConcentration: true,
            concentrationLabel: 'Conc.'
          }
        }
      });

      return NextResponse.json({
        message: 'Default department created successfully',
        department: defaultDepartment
      });
    }

    return NextResponse.json({
      message: 'Default department already exists',
      department: existingDefault
    });

  } catch (error) {
    console.error('Failed to ensure default department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}