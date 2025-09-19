import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Configuration from '@/models/Configuration';
import Department from '@/models/Department';
import { getUser } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all relevant data for debugging
    const [userConfig, departmentInfo] = await Promise.all([
      Configuration.findOne({
        $or: [{ userId: user._id }, { department: user.department }]
      }),
      user.department ? Department.findOne({ name: user.department }) : null
    ]);

    const mergedConfig = (departmentInfo || userConfig)
      ? {
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
            areaLabel: userConfig?.fieldConfig?.areaLabel || departmentInfo?.config?.fieldConfig?.areaLabel || 'Area',
            heightLabel: userConfig?.fieldConfig?.heightLabel || departmentInfo?.config?.fieldConfig?.heightLabel || 'Height',
            concentrationLabel: userConfig?.fieldConfig?.concentrationLabel || departmentInfo?.config?.fieldConfig?.concentrationLabel || 'Conc.'
          },
          detectorSettings: {
            wavelength: userConfig?.detectorSettings?.wavelength || departmentInfo?.config?.detectorSettings?.wavelength || 210,
            defaultUnits: userConfig?.detectorSettings?.defaultUnits || departmentInfo?.config?.detectorSettings?.defaultUnits || 'mV'
          }
        }
      : null;

    const debugInfo = {
      currentUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role
      },
      userConfiguration: userConfig,
      departmentInfo: departmentInfo,
      mergedConfig
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Debug config error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 });
  }
}