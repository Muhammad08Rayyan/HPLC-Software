import jsPDF from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

interface PeakData {
  retentionTime: number;
  area: number;
  height: number;
  peakName?: string;
  percentArea?: number;
  uspPlateCount?: number;
  uspTailing?: number;
}

interface SampleData {
  sampleId: string;
  sampleName: string;
  projectName: string;
  reportTitle: string;
  reportMethodId: string;
  reportedBy: string;
  sampleType: string;
  vialNumber: string;
  injectionNumber: number;
  injectionVolume: number;
  runTime: number;
  dateAcquired: Date;
  dateProcessed: Date;
  acquiredBy: string;
  sampleSetName: string;
  acqMethodSet: string;
  processingMethod: string;
  channelDetector: string;
  peaks: PeakData[];
}

export function generateEmpowerStyleReport(sampleData: SampleData): Buffer {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  let currentY = 10; // Start from top

  // === HEADER SECTION ===

  // Add Shimadzu logo from public/logo.jpg
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = logoData.toString('base64');
      doc.addImage(`data:image/jpeg;base64,${logoBase64}`, 'JPEG', margin, currentY, 25, 15);
    }
  } catch {
    console.log('Logo not found, using text fallback');
  }

  // Shimadzu branding next to logo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Shimadzu Lab Solutions', margin + 30, currentY + 8);

  // Report title (top right)
  doc.setTextColor(0, 0, 204); // Blue text
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Analysis Report', pageWidth - 80, currentY + 10);

  currentY += 25;

  // === METADATA SECTION ===

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Left column metadata
  doc.text(`Reported by User: ${sampleData.reportedBy || 'System'}`, margin, currentY);
  doc.text(`Project Name: ${sampleData.projectName || 'ALTONOX TABLET 60MG'}`, pageWidth - 80, currentY);
  currentY += 5;

  doc.text(`Report Method: ${sampleData.reportTitle || 'Analysis Report'}`, margin, currentY);
  doc.text('Date Printed:', pageWidth - 80, currentY);
  currentY += 5;

  doc.text(`Report Method ID: ${sampleData.reportMethodId || '1181'} ${sampleData.reportMethodId || '1181'}`, margin, currentY);

  // Current date and time
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
  const timeStr = now.toLocaleTimeString('en-US', { hour12: true, timeZone: 'Europe/Istanbul' });
  doc.text(`${dateStr}`, pageWidth - 80, currentY);
  currentY += 5;

  doc.text('Page: 1 of 1', margin, currentY);
  doc.text(`${timeStr} Europe/Istanbul`, pageWidth - 80, currentY);

  currentY += 15;

  // === SAMPLE INFORMATION SECTION ===

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('S A M P L E   I N F O R M A T I O N', pageWidth/2 - 50, currentY);

  currentY += 10;

  // Sample info in two columns
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const leftCol = margin;
  const rightCol = pageWidth/2 + 10;
  let leftY = currentY;
  let rightY = currentY;

  // Left column
  doc.text('Sample Name:', leftCol, leftY);
  doc.text(sampleData.sampleName || 'Standard 01', leftCol + 35, leftY);
  leftY += 5;

  doc.text('Sample Type:', leftCol, leftY);
  doc.text(sampleData.sampleType || 'Unknown', leftCol + 35, leftY);
  leftY += 5;

  doc.text('Vial:', leftCol, leftY);
  doc.text(sampleData.vialNumber || '1', leftCol + 35, leftY);
  leftY += 5;

  doc.text('Injection #:', leftCol, leftY);
  doc.text(sampleData.injectionNumber?.toString() || '1', leftCol + 35, leftY);
  leftY += 5;

  doc.text('Injection Volume:', leftCol, leftY);
  doc.text(`${sampleData.injectionVolume || '10.00'} ul`, leftCol + 35, leftY);
  leftY += 5;

  doc.text('Run Time:', leftCol, leftY);
  doc.text(`${sampleData.runTime || '10.0'} Minutes`, leftCol + 35, leftY);
  leftY += 10;

  doc.text('Date Acquired:', leftCol, leftY);
  const acqDate = sampleData.dateAcquired ?
    sampleData.dateAcquired.toLocaleString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true, timeZone: 'Europe/Istanbul'
    }) : '10/25/2022 10:07:14 AM';
  doc.text(`${acqDate} EET`, leftCol + 35, leftY);
  leftY += 5;

  doc.text('Date Processed:', leftCol, leftY);
  const procDate = sampleData.dateProcessed ?
    sampleData.dateProcessed.toLocaleString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: true, timeZone: 'Europe/Istanbul'
    }) : '10/25/2022 11:22:49 AM';
  doc.text(`${procDate} EET`, leftCol + 35, leftY);

  // Right column
  doc.text('Acquired By:', rightCol, rightY);
  doc.text(sampleData.acquiredBy || 'System', rightCol + 35, rightY);
  rightY += 5;

  doc.text('Sample Set Name:', rightCol, rightY);
  doc.text(sampleData.sampleSetName || 'T054 Assay Final Mix', rightCol + 35, rightY);
  rightY += 5;

  doc.text('Acq. Method Set:', rightCol, rightY);
  doc.text(sampleData.acqMethodSet || 'ALTONOX TABLET', rightCol + 35, rightY);
  rightY += 5;

  doc.text('Processing Method:', rightCol, rightY);
  doc.text(sampleData.processingMethod || 'T054 Assay Final Mix', rightCol + 35, rightY);
  rightY += 5;

  doc.text('Channel Name:', rightCol, rightY);
  doc.text(sampleData.channelDetector || '484', rightCol + 35, rightY);
  rightY += 5;

  doc.text('Proc. Chnl. Descr.:', rightCol, rightY);

  currentY = Math.max(leftY, rightY) + 15;

  // === CHROMATOGRAM SECTION ===

  // Peak label
  const mainPeak = sampleData.peaks[0];
  if (mainPeak) {
    doc.text(`${mainPeak.peakName || 'Peak'} - ${mainPeak.retentionTime.toFixed(3)}`, margin, currentY);
  }

  currentY += 10;

  // Chromatogram chart
  const chartX = margin;
  const chartY = currentY;
  const chartWidth = pageWidth - 2 * margin;
  const chartHeight = 80;

  // Y-axis label
  doc.setFontSize(10);
  doc.text('AU', chartX - 5, chartY - 5);

  // Chart border
  doc.setLineWidth(1);
  doc.rect(chartX, chartY, chartWidth, chartHeight);

  // Y-axis scale (0.00 to 1.00)
  const yValues = [0.00, 0.20, 0.40, 0.60, 0.80, 1.00];
  doc.setFontSize(8);
  yValues.forEach((value, i) => {
    const y = chartY + chartHeight - (i * chartHeight / (yValues.length - 1));
    doc.text(value.toFixed(2), chartX - 15, y + 2);
    doc.line(chartX - 2, y, chartX, y);
  });

  // Calculate dynamic X-axis based on actual run length
  let maxRetentionTime = 10.0; // Default
  if (sampleData && sampleData.runTime) {
    maxRetentionTime = sampleData.runTime || 10.0;
  } else if (sampleData && sampleData.peaks && sampleData.peaks.length > 0) {
    const maxRT = Math.max(...sampleData.peaks.map(peak => peak.retentionTime || 0));
    maxRetentionTime = Math.ceil(maxRT * 1.1);
  }

  // Round to nice intervals
  if (maxRetentionTime <= 10) {
    maxRetentionTime = 10;
  } else if (maxRetentionTime <= 15) {
    maxRetentionTime = 15;
  } else if (maxRetentionTime <= 20) {
    maxRetentionTime = 20;
  } else if (maxRetentionTime <= 30) {
    maxRetentionTime = 30;
  } else if (maxRetentionTime <= 60) {
    maxRetentionTime = Math.ceil(maxRetentionTime / 10) * 10;
  } else {
    maxRetentionTime = Math.ceil(maxRetentionTime / 30) * 30;
  }

  // Generate X-axis values with appropriate step size
  let xStepSize;
  if (maxRetentionTime <= 10) {
    xStepSize = 1;
  } else if (maxRetentionTime <= 30) {
    xStepSize = 5;
  } else if (maxRetentionTime <= 60) {
    xStepSize = 10;
  } else {
    xStepSize = 15;
  }

  const xValues: number[] = [];
  for (let i = 0; i <= maxRetentionTime; i += xStepSize) {
    xValues.push(i);
  }

  // X-axis scale
  xValues.forEach((value, i) => {
    const x = chartX + (i * chartWidth / (xValues.length - 1));
    doc.text(value.toFixed(2), x - 5, chartY + chartHeight + 8);
    doc.line(x, chartY + chartHeight, x, chartY + chartHeight + 2);
  });

  // X-axis label
  doc.text('Minutes', chartX + chartWidth/2 - 10, chartY + chartHeight + 20);

  // Draw baseline
  doc.setLineWidth(1);
  doc.line(chartX, chartY + chartHeight - 2, chartX + chartWidth, chartY + chartHeight - 2);

  // Draw main peak
  if (mainPeak && mainPeak.retentionTime) {
    const peakX = chartX + (mainPeak.retentionTime / maxRetentionTime) * chartWidth;
    const peakHeight = 60; // 60% of chart height for the main peak

    // Draw Gaussian peak
    const points = [];
    const width = 15;
    for (let i = -width; i <= width; i += 0.8) {
      const x = peakX + i;
      const gaussian = Math.exp(-(i * i) / (2 * (width/4) * (width/4)));
      const y = chartY + chartHeight - 2 - (peakHeight * gaussian);
      points.push([x, y]);
    }

    doc.setLineWidth(0.5);
    for (let i = 0; i < points.length - 1; i++) {
      if (points[i][0] >= chartX && points[i][0] <= chartX + chartWidth) {
        doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
      }
    }

    // Peak label
    doc.setFontSize(9);
    doc.text(`${mainPeak.peakName || 'Peak'} - ${mainPeak.retentionTime.toFixed(3)}`, peakX - 15, chartY + chartHeight - peakHeight - 8);
  }

  currentY += chartHeight + 30;

  // === PEAK TABLE SECTION ===

  const tableHeaders = ['Peak Name', 'RT', 'Area', '% Area', 'Height', 'USP Plate Count', 'USP Tailing'];
  const tableData: string[][] = [];

  if (sampleData.peaks.length > 0) {
    // Calculate total area for % calculation
    const totalArea = sampleData.peaks.reduce((sum, peak) => sum + (peak.area || 0), 0);

    sampleData.peaks.forEach((peak, index) => {
      const percentArea = totalArea > 0 ? ((peak.area || 0) / totalArea * 100).toFixed(2) : '0.00';
      const uspPlateCount = peak.uspPlateCount ? peak.uspPlateCount.toExponential(6).replace('e+0', 'e+') : '1.119809e+004';
      const uspTailing = peak.uspTailing ? peak.uspTailing.toExponential(6).replace('e+0', 'e+') : '1.147820e+000';

      tableData.push([
        peak.peakName || `Peak ${index + 1}`,
        peak.retentionTime.toFixed(3),
        (peak.area || 0).toString(),
        percentArea,
        (peak.height || 0).toString(),
        uspPlateCount,
        uspTailing
      ]);
    });
  }

  // Draw table manually for better control
  const tableY = currentY;
  const colWidths = [25, 15, 20, 15, 20, 25, 25];

  // Table header
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, tableY, chartWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  let colX = margin + 2;
  tableHeaders.forEach((header, i) => {
    doc.text(header, colX, tableY + 5);
    colX += colWidths[i];
  });

  // Table border
  doc.setLineWidth(0.5);
  doc.rect(margin, tableY, chartWidth, 8);

  // Table data
  if (tableData.length > 0) {
    doc.setFont('helvetica', 'normal');
    let dataY = tableY + 15;

    tableData.forEach((row) => {
      let colX = margin + 2;
      row.forEach((cell: string, colIndex: number) => {
        doc.text(cell.toString(), colX, dataY);
        colX += colWidths[colIndex];
      });

      // Row border
      doc.rect(margin, dataY - 5, chartWidth, 8);
      dataY += 10;
    });
  }

  currentY += 50;

  // === FOOTER ===

  doc.setFontSize(9);
  doc.text(`Reported by User: ${sampleData.reportedBy || 'System'}`, margin, pageHeight - 20);
  doc.text(`Project Name: ${sampleData.projectName || 'ALTONOX TABLET 60MG'}`, pageWidth - 80, pageHeight - 20);
  doc.text(`Report Method: ${sampleData.reportTitle || 'Analysis Report'}`, margin, pageHeight - 15);
  doc.text('Date Printed:', pageWidth - 80, pageHeight - 15);
  doc.text(`Report Method ID: ${sampleData.reportMethodId || '1181'}`, margin, pageHeight - 10);
  doc.text(`${dateStr}`, pageWidth - 80, pageHeight - 10);
  doc.text('Page: 1 of 1', margin, pageHeight - 5);
  doc.text(`${timeStr} Europe/Istanbul`, pageWidth - 80, pageHeight - 5);

  return Buffer.from(doc.output('arraybuffer'));
}