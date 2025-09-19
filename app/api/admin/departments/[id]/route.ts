import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Department from '@/models/Department';
import User from '@/models/User';
import Configuration from '@/models/Configuration';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, description, config } = await request.json();

    console.log('Received department update data:', { name, description, config });

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    // Check if another department with the same name exists
    const existingDepartment = await Department.findOne({
      name: name.trim(),
      _id: { $ne: params.id }
    });
    if (existingDepartment) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 });
    }

    // Log what we're about to update
    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      config: config,
      updatedAt: new Date()
    };
    console.log('About to update department with:', updateData);

    const department = await Department.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('Update result:', department ? 'Success' : 'Failed - department not found');

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    console.log('Department updated successfully:', {
      id: department._id,
      name: department.name,
      config: department.config
    });

    // Now update the configurations collection for users in this department
    // Find all users in this department
    const usersInDepartment = await User.find({ department: department.name });

    if (usersInDepartment.length > 0) {
      // Update or create Configuration records for each user in this department
      for (const departmentUser of usersInDepartment) {
        await Configuration.findOneAndUpdate(
          { userId: departmentUser._id.toString() },
          {
            userId: departmentUser._id.toString(),
            department: department.name,
            peakConfig: {
              defaultCount: config?.peakConfig?.defaultCount || 5,
              minCount: config?.peakConfig?.minCount || 1,
              maxCount: config?.peakConfig?.maxCount || 20,
              enableRange: config?.peakConfig?.enableRange !== false
            },
            fieldConfig: {
              enableArea: config?.fieldConfig?.enableArea !== false,
              enableHeight: config?.fieldConfig?.enableHeight !== false,
              enableConcentration: config?.fieldConfig?.enableConcentration !== false,
              areaLabel: config?.fieldConfig?.areaLabel || 'Area',
              heightLabel: config?.fieldConfig?.heightLabel || 'Height',
              concentrationLabel: config?.fieldConfig?.concentrationLabel || 'Conc.'
            },
            detectorSettings: {
              wavelength: config?.detectorSettings?.wavelength || 210,
              flowRate: config?.detectorSettings?.flowRate,
              temperature: config?.detectorSettings?.temperature,
              defaultUnits: config?.detectorSettings?.defaultUnits || 'mV'
            },
            reportTemplate: {
              title: 'HPLC Analysis Report',
              includeSystemSuitability: true,
              includePeakTable: true,
              includeGraph: true
            },
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      }

      console.log(`Updated ${usersInDepartment.length} user configurations for department ${department.name}`);
    }

    // Log department update
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'department_updated',
      details: {
        departmentName: department.name,
        affectedUsers: usersInDepartment.length
      }
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('Failed to update department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const department = await Department.findById(params.id);
    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Prevent deletion of Default department
    if (department.name === 'Default') {
      return NextResponse.json({
        error: 'Cannot delete the Default department. This is a system-required department.'
      }, { status: 400 });
    }

    // Check if there are users in this department
    const usersInDepartment = await User.find({ department: department.name });
    if (usersInDepartment.length > 0) {
      return NextResponse.json({
        error: `Cannot delete department. ${usersInDepartment.length} user(s) are assigned to this department.`
      }, { status: 400 });
    }

    await Department.findByIdAndDelete(params.id);

    // Log department deletion
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'department_deleted',
      details: { departmentName: department.name }
    });

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Failed to delete department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}