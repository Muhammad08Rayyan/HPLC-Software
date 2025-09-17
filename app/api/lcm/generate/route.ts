import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import connectDB from '@/lib/mongodb';
import HPLCData from '@/models/HPLCData';
import Configuration from '@/models/Configuration';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';

// JavaScript implementation of LCM file generation
function generateLCMFile(data: any): Buffer {
  const buffers: Buffer[] = [];

  // File signature
  buffers.push(Buffer.from('LCM\x00'));

  // Version
  const version = Buffer.alloc(2);
  version.writeUInt16LE(100, 0);
  buffers.push(version);

  // Sample ID (32 bytes)
  const sampleId = Buffer.alloc(32);
  Buffer.from(data.sampleId.slice(0, 31)).copy(sampleId);
  buffers.push(sampleId);

  // Sample Name (64 bytes)
  const sampleName = Buffer.alloc(64);
  Buffer.from(data.sampleName.slice(0, 63)).copy(sampleName);
  buffers.push(sampleName);

  // Analysis Date (4 bytes timestamp)
  const timestamp = Buffer.alloc(4);
  timestamp.writeUInt32LE(Math.floor(new Date(data.analysisDate).getTime() / 1000), 0);
  buffers.push(timestamp);

  // Number of peaks (2 bytes)
  const peakCount = Buffer.alloc(2);
  peakCount.writeUInt16LE(data.peaks.length, 0);
  buffers.push(peakCount);

  // Reserved space (64 bytes)
  buffers.push(Buffer.alloc(64));

  // Peak data
  data.peaks.forEach((peak: any, index: number) => {
    // Peak number (2 bytes)
    const peakNum = Buffer.alloc(2);
    peakNum.writeUInt16LE(index + 1, 0);
    buffers.push(peakNum);

    // Retention time (4 bytes float)
    const rt = Buffer.alloc(4);
    rt.writeFloatLE(peak.retentionTime || 0, 0);
    buffers.push(rt);

    // Area (8 bytes double)
    const area = Buffer.alloc(8);
    area.writeDoubleLE(peak.area || 0, 0);
    buffers.push(area);

    // Height (8 bytes double)
    const height = Buffer.alloc(8);
    height.writeDoubleLE(peak.height || 0, 0);
    buffers.push(height);

    // Concentration (4 bytes float)
    const conc = Buffer.alloc(4);
    conc.writeFloatLE(peak.concentration || 0, 0);
    buffers.push(conc);

    // Peak name (32 bytes)
    const peakName = Buffer.alloc(32);
    Buffer.from((peak.peakName || `Peak_${index + 1}`).slice(0, 31)).copy(peakName);
    buffers.push(peakName);

    // Peak width (4 bytes)
    const width = Buffer.alloc(4);
    width.writeFloatLE(0.1, 0);
    buffers.push(width);

    // Peak asymmetry (4 bytes)
    const asymmetry = Buffer.alloc(4);
    asymmetry.writeFloatLE(1.0, 0);
    buffers.push(asymmetry);

    // Reserved (16 bytes)
    buffers.push(Buffer.alloc(16));
  });

  // Add chromatogram simulation data
  const dataPoints = 1000;
  const maxTime = Math.max(...data.peaks.map((p: any) => p.retentionTime || 0)) * 1.2 || 10;

  // Data points count (4 bytes)
  const pointCount = Buffer.alloc(4);
  pointCount.writeUInt32LE(dataPoints, 0);
  buffers.push(pointCount);

  // Max time (4 bytes)
  const maxTimeBuffer = Buffer.alloc(4);
  maxTimeBuffer.writeFloatLE(maxTime, 0);
  buffers.push(maxTimeBuffer);

  // Generate simulated chromatogram data points
  for (let i = 0; i < dataPoints; i++) {
    const timePoint = (i / dataPoints) * maxTime;
    let intensity = 50; // Baseline

    // Add Gaussian peaks
    data.peaks.forEach((peak: any) => {
      const rt = peak.retentionTime || 0;
      const height = peak.height || 0;
      const sigma = 0.05; // Peak width

      if (Math.abs(timePoint - rt) < 0.5) {
        const gaussian = height * Math.exp(-0.5 * Math.pow((timePoint - rt) / sigma, 2));
        intensity += gaussian;
      }
    });

    // Time point (4 bytes)
    const time = Buffer.alloc(4);
    time.writeFloatLE(timePoint, 0);
    buffers.push(time);

    // Intensity (4 bytes)
    const intensityBuffer = Buffer.alloc(4);
    intensityBuffer.writeFloatLE(Math.max(0, intensity), 0);
    buffers.push(intensityBuffer);
  }

  // Footer
  buffers.push(Buffer.from('LCMEND\x00'));

  return Buffer.concat(buffers);
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sampleId } = await request.json();

    const hplcData = await HPLCData.findOne({ sampleId });
    if (!hplcData) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
    }

    const config = await Configuration.findOne({
      $or: [{ userId: user._id }, { department: user.department }]
    });

    // Prepare data for Python script
    const pythonData = {
      sampleId: hplcData.sampleId,
      sampleName: hplcData.sampleName,
      peaks: hplcData.peaks,
      instrumentSettings: hplcData.instrumentSettings,
      analysisDate: hplcData.analysisDate.toISOString()
    };

    // Create temporary file for Python input
    const tempInputPath = path.join(process.cwd(), 'temp', `input_${Date.now()}.json`);
    const tempOutputPath = path.join(process.cwd(), 'temp', `${hplcData.sampleId}.lcm`);

    // Ensure temp directory exists
    await fs.mkdir(path.dirname(tempInputPath), { recursive: true });

    // Write input data
    await fs.writeFile(tempInputPath, JSON.stringify(pythonData, null, 2));

    // Generate LCM file directly in JavaScript (simplified version)
    const lcmData = generateLCMFile(pythonData);

    // Update database
    await HPLCData.findByIdAndUpdate(hplcData._id, { lcmGenerated: true });

    // Log LCM generation
    await AuditLog.create({
      userId: user._id,
      userName: user.name,
      action: 'lcm_generated',
      sampleId: hplcData.sampleId,
      details: { fileSize: lcmData.length }
    });

    // Cleanup input file
    await fs.unlink(tempInputPath).catch(() => {});

    return new NextResponse(new Uint8Array(lcmData), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${hplcData.sampleId}.lcm"`
      }
    });
  } catch (error) {
    console.error('LCM generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}