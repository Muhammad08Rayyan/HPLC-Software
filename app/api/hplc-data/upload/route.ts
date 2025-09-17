import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import connectDB from '@/lib/mongodb';
import HPLCData from '@/models/HPLCData';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user || !['admin', 'analyst'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let data: any[] = [];

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Parse Excel file
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);
    } else if (file.name.endsWith('.csv')) {
      // Parse CSV file - simple implementation
      const csvText = buffer.toString();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });
    } else {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

    // Process and save data
    const processedData = [];
    for (const row of data) {
      const hplcData = {
        sampleId: row.sampleId || `SAMPLE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sampleName: row.sampleName || 'Unknown Sample',
        analystId: user._id,
        analystName: user.name,
        department: user.department,
        peaks: [
          {
            retentionTime: parseFloat(row.retentionTime) || 0,
            area: parseFloat(row.area) || 0,
            height: parseFloat(row.height) || 0,
            concentration: row.concentration ? parseFloat(row.concentration) : undefined,
            peakName: row.peakName || undefined
          }
        ],
        systemSuitability: {
          resolution: row.resolution ? parseFloat(row.resolution) : undefined,
          efficiency: row.efficiency ? parseFloat(row.efficiency) : undefined,
          asymmetry: row.asymmetry ? parseFloat(row.asymmetry) : undefined
        },
        instrumentSettings: {
          column: row.column || undefined,
          mobile_phase: row.mobile_phase || undefined,
          flow_rate: row.flow_rate ? parseFloat(row.flow_rate) : undefined,
          injection_volume: row.injection_volume ? parseFloat(row.injection_volume) : undefined,
          detection_wavelength: row.detection_wavelength ? parseFloat(row.detection_wavelength) : undefined,
          temperature: row.temperature ? parseFloat(row.temperature) : undefined
        },
        analysisDate: row.analysisDate ? new Date(row.analysisDate) : new Date()
      };

      const savedData = await HPLCData.create(hplcData);
      processedData.push(savedData);
    }

    // Log the batch upload
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'data_uploaded',
      details: {
        fileName: file.name,
        recordCount: processedData.length,
        fileSize: file.size
      }
    });

    return NextResponse.json({
      message: `Successfully uploaded ${processedData.length} records`,
      data: processedData
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}