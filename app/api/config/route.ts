import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Configuration from '@/models/Configuration';
import Department from '@/models/Department';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin users should use default department settings if they don't have a department
    const departmentToUse = user.role === 'admin' && !user.department ? 'Default' : user.department;

    // Get both user configuration and department configuration
    const [userConfig, departmentInfo] = await Promise.all([
      Configuration.findOne({ userId: user._id }), // Only look for user-specific config
      departmentToUse ? Department.findOne({ name: departmentToUse }) : null
    ]);

    // Create merged configuration prioritizing user settings over department defaults
    const mergedConfig = {
      userId: user._id,
      department: departmentToUse,
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
        enablePercentArea: true,
        enableUSPPlateCount: true,
        enableUSPTailing: true,
        areaLabel: userConfig?.fieldConfig?.areaLabel || departmentInfo?.config?.fieldConfig?.areaLabel || 'Area',
        heightLabel: userConfig?.fieldConfig?.heightLabel || departmentInfo?.config?.fieldConfig?.heightLabel || 'Height',
        concentrationLabel: userConfig?.fieldConfig?.concentrationLabel || departmentInfo?.config?.fieldConfig?.concentrationLabel || 'Conc.',
        percentAreaLabel: '% Area',
        uspPlateCountLabel: 'USP Plate Count',
        uspTailingLabel: 'USP Tailing'
      },
      detectorSettings: {
        wavelength: userConfig?.detectorSettings?.wavelength || departmentInfo?.config?.detectorSettings?.wavelength || 210,
        flowRate: userConfig?.detectorSettings?.flowRate || 1.0,
        temperature: userConfig?.detectorSettings?.temperature || 25,
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
      },
      createdAt: userConfig?.createdAt || new Date(),
      updatedAt: userConfig?.updatedAt || new Date()
    };

    // If no user config exists, create one with the merged settings
    if (!userConfig) {
      const newConfig = await Configuration.create(mergedConfig);
      return NextResponse.json(newConfig);
    }

    return NextResponse.json(mergedConfig);
  } catch (error) {
    console.error('Config API error:', error);
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

    // Log the configuration change with readable details
    const readableDetails = {
      'Peak Settings': `Default Count: ${configData.peakConfig?.defaultCount || 5}, Max Count: ${configData.peakConfig?.maxCount || 20}`,
      'Field Configuration': [
        configData.fieldConfig?.enableArea ? `Area (${configData.fieldConfig?.areaLabel || 'Area'})` : null,
        configData.fieldConfig?.enableHeight ? `Height (${configData.fieldConfig?.heightLabel || 'Height'})` : null,
        configData.fieldConfig?.enableConcentration ? `Concentration (${configData.fieldConfig?.concentrationLabel || 'Conc.'})` : null
      ].filter(Boolean).join(', ') || 'None',
      'Detector Settings': `Wavelength: ${configData.detectorSettings?.wavelength || 'Not set'} nm, Units: ${configData.detectorSettings?.defaultUnits || 'mV'}`
    };

    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'config_changed',
      details: readableDetails
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}