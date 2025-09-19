import jsPDF from 'jspdf';
import 'jspdf-autotable';
import fs from 'fs';
import path from 'path';

export function generatePerfectEmpowerReport(doc: any, hplcData: any, config: any): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // === HEADER AT TOP OF PAGE ===

  // Add Shimadzu logo from public/logo.jpg
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = logoData.toString('base64');
      doc.addImage(`data:image/jpeg;base64,${logoBase64}`, 'JPEG', 10, 10, 25, 15);
    }
  } catch (error) {
    console.log('Logo not found, using text fallback');
  }

  // Add Shimadzu text next to logo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Shimadzu Lab Solutions', 40, 18);

  // "Analysis Report" title (blue, right side) - positioned at top
  doc.setTextColor(0, 0, 204);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Analysis Report', 105, 18);

  // === SAMPLE INFORMATION SECTION ===

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('S A M P L E   I N F O R M A T I O N', 80, 35);

  // Sample info table - bordered section
  const sampleY = 40;
  doc.setLineWidth(0.5);
  doc.rect(10, sampleY, pageWidth - 20, 50);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  // Left column data
  let leftY = sampleY + 8;
  doc.text('Sample Name:', 15, leftY);
  doc.text('Standard 01', 50, leftY);
  leftY += 6;
  doc.text('Sample Type:', 15, leftY);
  doc.text('Unknown', 50, leftY);
  leftY += 6;
  doc.text('Vial:', 15, leftY);
  doc.text('1', 50, leftY);
  leftY += 6;
  doc.text('Injection #:', 15, leftY);
  doc.text('1', 50, leftY);
  leftY += 6;
  doc.text('Injection Volume:', 15, leftY);
  doc.text('10.00 ul', 50, leftY);
  leftY += 6;
  doc.text('Run Time:', 15, leftY);
  doc.text('10.0 Minutes', 50, leftY);

  // Right column data
  let rightY = sampleY + 8;
  doc.text('Acquired By:', 110, rightY);
  doc.text('System', 145, rightY);
  rightY += 6;
  doc.text('Sample Set Name:', 110, rightY);
  doc.text('T054 Assay Final Mix', 145, rightY);
  rightY += 6;
  doc.text('Acq. Method Set:', 110, rightY);
  doc.text('ALTONOX TABLET', 145, rightY);
  rightY += 6;
  doc.text('Processing Method:', 110, rightY);
  doc.text('T054 Assay Final Mix', 145, rightY);
  rightY += 6;
  doc.text('Channel Name:', 110, rightY);
  doc.text('484', 145, rightY);
  rightY += 6;
  doc.text('Proc. Chnl. Descr.:', 110, rightY);
  doc.text('PDA 484 nm', 145, rightY);

  // Date info at bottom of sample box - moved down to avoid overlap
  doc.text('Date Acquired:', 15, sampleY + 42);
  doc.text('10/25/2022 10:07:14 AM PKT', 52, sampleY + 42);
  doc.text('Date Processed:', 110, sampleY + 42);
  doc.text('10/25/2022 11:22:49 AM PKT', 148, sampleY + 42);

  // === CHROMATOGRAM SECTION ===

  const chromY = 100;

  // Peak identifier
  doc.setFontSize(9);
  doc.text('Etoricoxib - 6.506', 10, chromY);

  // Main chromatogram
  const chartY = chromY + 10;
  const chartHeight = 80;
  const chartWidth = pageWidth - 20;

  // Y-axis
  doc.setFontSize(7);
  doc.text('AU', 5, chartY + 20);

  // Chart border
  doc.setLineWidth(0.3);
  doc.rect(10, chartY, chartWidth, chartHeight);

  // Calculate dynamic Y-axis based on peak data with standard increments
  let maxPeakValue = 1.0; // Default minimum
  if (hplcData && hplcData.peaks && hplcData.peaks.length > 0) {
    // Find the maximum height from the peaks and add 20% buffer
    const maxHeight = Math.max(
      ...hplcData.peaks.map((peak: { height?: number }) => peak.height || 0)
    );
    // Convert height to AU (approximate conversion for display)
    const calculatedMax = (maxHeight / 1000000) * 1.2;

    // Round to standard increments: 0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1.0, 1.2, 1.5, 2.0, etc.
    const standardIncrements = [0.1, 0.2, 0.25, 0.4, 0.5, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];
    maxPeakValue = standardIncrements.find(val => val >= calculatedMax) || Math.ceil(calculatedMax);
  }

  // Generate standard Y-axis values based on max value
  const yValues: number[] = [];
  if (maxPeakValue <= 0.4) {
    // For small values: 0.0, 0.1, 0.2, 0.3, 0.4
    for (let i = 0; i <= maxPeakValue * 10; i++) {
      yValues.push(i / 10);
    }
  } else if (maxPeakValue <= 1.0) {
    // For medium values: 0.0, 0.2, 0.4, 0.6, 0.8, 1.0
    for (let i = 0; i <= 5; i++) {
      yValues.push((maxPeakValue / 5) * i);
    }
  } else {
    // For larger values: use appropriate increments
    const stepSize = maxPeakValue <= 2.0 ? 0.25 : (maxPeakValue <= 5.0 ? 0.5 : 1.0);
    for (let i = 0; i * stepSize <= maxPeakValue; i++) {
      yValues.push(i * stepSize);
    }
  }

  // Y-axis scale and grid
  doc.setFontSize(7);
  yValues.forEach((value, i) => {
    const y = chartY + chartHeight - (i * chartHeight / (yValues.length - 1));
    doc.text(value.toFixed(2), 2, y + 1);
    // Grid lines
    if (i > 0) {
      doc.setLineWidth(0.1);
      doc.setDrawColor(200, 200, 200);
      doc.line(10, y, 10 + chartWidth, y);
      doc.setDrawColor(0, 0, 0);
    }
    // Tick marks
    doc.setLineWidth(0.3);
    doc.line(8, y, 10, y);
  });

  // Calculate dynamic X-axis based on actual run length
  let maxRetentionTime = 10.0; // Default
  if (hplcData && hplcData.runTime) {
    // Use actual run time if available
    maxRetentionTime = Number(hplcData.runTime) || 10.0;
  } else if (hplcData && hplcData.peaks && hplcData.peaks.length > 0) {
    const maxRT = Math.max(
      ...hplcData.peaks.map((peak: { retentionTime?: number }) => peak.retentionTime || 0)
    );
    // Add 10% buffer to the maximum retention time
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
    maxRetentionTime = Math.ceil(maxRetentionTime / 10) * 10; // Round to nearest 10
  } else {
    maxRetentionTime = Math.ceil(maxRetentionTime / 30) * 30; // Round to nearest 30
  }

  // Generate X-axis values with appropriate step size
  let xStepSize;
  if (maxRetentionTime <= 10) {
    xStepSize = 1; // 1-minute intervals
  } else if (maxRetentionTime <= 30) {
    xStepSize = 5; // 5-minute intervals
  } else if (maxRetentionTime <= 60) {
    xStepSize = 10; // 10-minute intervals
  } else {
    xStepSize = 15; // 15-minute intervals
  }

  const xValues: number[] = [];
  for (let i = 0; i <= maxRetentionTime; i += xStepSize) {
    xValues.push(i);
  }

  // X-axis scale and grid
  xValues.forEach((value, i) => {
    const x = 10 + (i * chartWidth / (xValues.length - 1));
    doc.text(value.toFixed(2), x - 3, chartY + chartHeight + 8);
    // Grid lines
    if (i > 0 && i < xValues.length - 1) {
      doc.setLineWidth(0.1);
      doc.setDrawColor(200, 200, 200);
      doc.line(x, chartY, x, chartY + chartHeight);
      doc.setDrawColor(0, 0, 0);
    }
    // Tick marks
    doc.setLineWidth(0.3);
    doc.line(x, chartY + chartHeight, x, chartY + chartHeight + 2);
  });

  // X-axis label
  doc.text('Minutes', pageWidth/2 - 8, chartY + chartHeight + 18);

  // Draw peaks dynamically based on data
  if (hplcData && hplcData.peaks && hplcData.peaks.length > 0) {
    hplcData.peaks.forEach(
      (peak: { retentionTime: number; height: number; compound?: string }, index: number) => {
      const peakX = 10 + (peak.retentionTime / maxRetentionTime) * chartWidth;
      // Calculate peak height as proportion of max Y-axis value
      const peakHeightRatio = (peak.height / 1000000) / maxPeakValue; // Convert to AU ratio
      const peakHeight = chartHeight * peakHeightRatio;

      // Slimmer Gaussian curve
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);

      const points = [];
      const width = 2.5; // Slimmer peak width
      for (let i = -width; i <= width; i += 0.03) {
        const x = peakX + i;
        const gaussian = Math.exp(-(i * i) / (2 * (width/4) * (width/4))); // Sharper curve
        const y = chartY + chartHeight - (peakHeight * gaussian);
        points.push([x, y]);
      }

      // Draw smooth peak with proper line segments
      for (let i = 0; i < points.length - 1; i++) {
        if (points[i][0] >= 10 && points[i][0] <= 10 + chartWidth) {
          doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
        }
      }

      // Peak label at apex
      doc.setFontSize(8);
      const peakName = peak.compound || 'Etoricoxib';
      doc.text(`${peakName} - ${peak.retentionTime.toFixed(3)}`, peakX - 18, chartY + 5 + (index * 8));
    }
    );
  } else {
    // Fallback: Draw the default Etoricoxib peak for sample matching
    const peakX = 10 + (6.506 / maxRetentionTime) * chartWidth;
    const peakHeight = chartHeight * (1.0 / maxPeakValue); // Proportional to max Y

    doc.setLineWidth(0.5);
    doc.setDrawColor(5, 5, 5);

    const points = [];
    const width = 2.5; // Slimmer width
    for (let i = -width; i <= width; i += 0.03) {
      const x = peakX + i;
      const gaussian = Math.exp(-(i * i) / (2 * (width/4) * (width/4))); // Sharper
      const y = chartY + chartHeight - (peakHeight * gaussian);
      points.push([x, y]);
    }

    for (let i = 0; i < points.length - 1; i++) {
      if (points[i][0] >= 10 && points[i][0] <= 10 + chartWidth) {
        doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
      }
    }

    doc.setFontSize(8);
    doc.text('Etoricoxib - 6.506', peakX - 18, chartY + 5);
  }

  // === PEAK TABLE ===

  const tableY = chartY + chartHeight + 30;

  // Use jsPDF autoTable for perfect table formatting
  const tableData = [
    ['Etoricoxib', '6.506', '9855260', '100.00', '1056934', '1.119809e+004', '1.147820e+000']
  ];

  doc.autoTable({
    head: [['Peak Name', 'RT', 'Area', '% Area', 'Height', 'USP Plate Count', 'USP Tailing']],
    body: tableData,
    startY: tableY,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.3
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 25 },
      1: { halign: 'center', cellWidth: 15 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 30 },
      6: { halign: 'right', cellWidth: 30 }
    }
  });

  // === FOOTER ===

  const footerY = pageHeight - 25;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  doc.text('Reported by User: System', 10, footerY);
  doc.text('Project Name: ALTONOX TABLET 60MG', 120, footerY);
  doc.text('Report Method: Analysis Report', 10, footerY + 4);
  doc.text('Date Printed:', 120, footerY + 4);
  doc.text('Report Method ID: 1181', 10, footerY + 8);
  doc.text('5/22/2023', 120, footerY + 8);
  doc.text('Page: 1 of 1', 10, footerY + 12);
  doc.text('1:25:43 PM PKT', 120, footerY + 12);
}