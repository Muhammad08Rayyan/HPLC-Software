import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HPLCData from '@/models/HPLCData';
import AuditLog from '@/models/AuditLog';
import Configuration from '@/models/Configuration';
import Department from '@/models/Department';
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

    // Admin users see ALL reports regardless of department
    // Other users only see their department's reports
    if (user.role === 'admin') {
      // Admin sees all reports
      query = {};
    } else if (user.department) {
      // Non-admin users with departments only see their department's reports
      query.analystDepartment = user.department;
    } else {
      // Fallback: users only see their own data
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

    // Admin users should use default department settings if they don't have a department
    const departmentToUse = user.role === 'admin' && !user.department ? 'Default' : user.department;

    // Fetch current user's configuration and department settings
    const [userConfig, departmentInfo] = await Promise.all([
      Configuration.findOne({ userId: user._id }), // Only look for user-specific config
      departmentToUse ? Department.findOne({ name: departmentToUse }) : null
    ]);

    // Create department configuration snapshot
    const departmentConfigSnapshot = {
      peakConfig: {
        defaultCount: userConfig?.peakConfig?.defaultCount || departmentInfo?.config?.peakConfig?.defaultCount || 5,
        minCount: userConfig?.peakConfig?.minCount || 1,
        maxCount: userConfig?.peakConfig?.maxCount || departmentInfo?.config?.peakConfig?.maxCount || 20,
        enableRange: userConfig?.peakConfig?.enableRange !== false
      },
      fieldConfig: {
        enableArea: userConfig?.fieldConfig?.enableArea !== false && departmentInfo?.config?.fieldConfig?.enableArea !== false,
        enableHeight: userConfig?.fieldConfig?.enableHeight !== false && departmentInfo?.config?.fieldConfig?.enableHeight !== false,
        enableConcentration: userConfig?.fieldConfig?.enableConcentration !== false && departmentInfo?.config?.fieldConfig?.enableConcentration !== false,
        enablePercentArea: true, // Generally always enabled
        enableUSPPlateCount: true, // Generally always enabled for calculations
        enableUSPTailing: true, // Generally always enabled for calculations
        areaLabel: userConfig?.fieldConfig?.areaLabel || departmentInfo?.config?.fieldConfig?.areaLabel || 'Area',
        heightLabel: userConfig?.fieldConfig?.heightLabel || departmentInfo?.config?.fieldConfig?.heightLabel || 'Height',
        concentrationLabel: userConfig?.fieldConfig?.concentrationLabel || departmentInfo?.config?.fieldConfig?.concentrationLabel || 'Conc.',
        percentAreaLabel: '% Area',
        uspPlateCountLabel: 'USP Plate Count',
        uspTailingLabel: 'USP Tailing'
      },
      detectorSettings: {
        wavelength: userConfig?.detectorSettings?.wavelength || departmentInfo?.config?.detectorSettings?.wavelength,
        flowRate: userConfig?.detectorSettings?.flowRate,
        temperature: userConfig?.detectorSettings?.temperature,
        defaultUnits: userConfig?.detectorSettings?.defaultUnits || departmentInfo?.config?.detectorSettings?.defaultUnits || 'mV'
      },
      reportTemplate: {
        title: userConfig?.reportTemplate?.title || 'HPLC Analysis Report',
        includeSystemSuitability: userConfig?.reportTemplate?.includeSystemSuitability !== false,
        includePeakTable: userConfig?.reportTemplate?.includePeakTable !== false,
        includeGraph: userConfig?.reportTemplate?.includeGraph !== false,
        includeUSPParameters: true,
        showMarkColumn: true
      },
      concentrationSettings: {
        defaultUnit: 'mg/L',
        availableUnits: ['mg/L', 'μg/mL', 'ppm', '%'],
        showUnitColumn: true
      }
    };

    // Use the same department logic as in config (already defined above)
    const analystDepartment = departmentToUse;

    const data = await HPLCData.create({
      ...hplcData,
      analystId: user._id,
      analystName: user.name,
      department: user.department,
      analystDepartment: analystDepartment,
      departmentConfig: departmentConfigSnapshot,
      // Ensure analysisDate is set if not provided
      analysisDate: hplcData.analysisDate || hplcData.dateAcquired || new Date()
    });

    // Log the data upload
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'data_uploaded',
      sampleId: data.sampleId,
      details: {
        peakCount: data.peaks.length,
        departmentConfigSnapshot: !!departmentConfigSnapshot
      }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('HPLC Data POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}