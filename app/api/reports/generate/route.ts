import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';
import connectDB from '@/lib/mongodb';
import HPLCData from '@/models/HPLCData';
import Configuration from '@/models/Configuration';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sampleId, format = 'pdf' } = await request.json();

    const hplcData = await HPLCData.findOne({ sampleId });
    if (!hplcData) {
      return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
    }

    const config = await Configuration.findOne({
      $or: [{ userId: user._id }, { department: user.department }]
    });

    if (format === 'pdf') {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let currentY = margin;

      // Date and pagination (top right)
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const dateStr = new Date().toLocaleString();
      doc.text(dateStr + ' Page 1 / 1', pageWidth - 80, 12);

      // Report title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('Analysis Report', pageWidth - 80, 25);

      // Sample Information Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('<Sample Information>', margin, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Left column
      const leftCol = margin;
      const rightCol = pageWidth / 2 + 10;
      let leftY = currentY;
      let rightY = currentY;

      doc.text(`Sample Name`, leftCol, leftY);
      doc.text(`: ${hplcData.sampleName}`, leftCol + 35, leftY);
      leftY += 5;

      doc.text(`Sample ID`, leftCol, leftY);
      doc.text(`: ${hplcData.sampleId}`, leftCol + 35, leftY);
      leftY += 5;

      doc.text(`Data Filename`, leftCol, leftY);
      doc.text(`: ${hplcData.sampleId}.lcd`, leftCol + 35, leftY);
      leftY += 5;

      doc.text(`Method Filename`, leftCol, leftY);
      doc.text(`: ${hplcData.sampleName}.lcm`, leftCol + 35, leftY);
      leftY += 5;

      doc.text(`Batch Filename`, leftCol, leftY);
      doc.text(`: `, leftCol + 35, leftY);
      leftY += 5;

      doc.text(`Vial #`, leftCol, leftY);
      doc.text(`: 1-1`, leftCol + 35, leftY);
      leftY += 5;

      doc.text(`Injection Volume`, leftCol, leftY);
      const injVol = hplcData.instrumentSettings?.injection_volume || '10';
      doc.text(`: ${injVol} uL`, leftCol + 35, leftY);
      leftY += 5;

      doc.text(`Date Acquired`, leftCol, leftY);
      doc.text(`: ${hplcData.analysisDate.toLocaleDateString()} ${hplcData.analysisDate.toLocaleTimeString()}`, leftCol + 35, leftY);
      leftY += 5;

      doc.text(`Date Processed`, leftCol, leftY);
      doc.text(`: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, leftCol + 35, leftY);

      // Right column
      doc.text(`Sample Type`, rightCol, rightY);
      doc.text(`: Unknown`, rightCol + 35, rightY);
      rightY += 10;

      doc.text(`Acquired by`, rightCol, rightY);
      doc.text(`: ${hplcData.analystName}`, rightCol + 35, rightY);
      rightY += 5;

      doc.text(`Processed by`, rightCol, rightY);
      doc.text(`: ${hplcData.analystName}`, rightCol + 35, rightY);

      currentY = Math.max(leftY, rightY) + 15;

      // Chromatogram Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('<Chromatogram>', margin, currentY);
      currentY += 8;

      // Draw chromatogram exactly like LabSolutions
      const chartX = margin;
      const chartY = currentY;
      const chartWidth = pageWidth - 2 * margin;
      const chartHeight = 80;

      // Y-axis label
      doc.setFontSize(10);
      doc.text('mV', chartX - 8, chartY + 5);

      // Detector label (top right)
      const detectorWave = hplcData.instrumentSettings?.detection_wavelength || '254';
      doc.text(`Detector A ${detectorWave}nm`, chartX + chartWidth - 40, chartY + 10);

      // Draw chart border
      doc.setLineWidth(0.5);
      doc.rect(chartX, chartY, chartWidth, chartHeight);

      // Draw horizontal grid lines
      doc.setLineWidth(0.2);
      doc.setDrawColor(200, 200, 200);
      for (let i = 1; i < 4; i++) {
        const y = chartY + (i * chartHeight / 4);
        doc.line(chartX, y, chartX + chartWidth, y);
      }

      // Y-axis scale (0, 250, 500, 750)
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      for (let i = 0; i <= 3; i++) {
        const y = chartY + chartHeight - (i * chartHeight / 3);
        const value = i * 250;
        doc.text(value.toString(), chartX - 15, y + 2);
      }

      // X-axis scale (0-8 minutes)
      const maxTime = 8;
      for (let i = 0; i <= 8; i++) {
        const x = chartX + (i / 8) * chartWidth;
        doc.text(i.toString(), x - 2, chartY + chartHeight + 10);
        // Draw tick marks
        doc.setLineWidth(0.3);
        doc.setDrawColor(0, 0, 0);
        doc.line(x, chartY + chartHeight, x, chartY + chartHeight + 2);
      }

      // X-axis label
      doc.text('min', chartX + chartWidth + 5, chartY + chartHeight + 10);

      // Draw baseline
      doc.setLineWidth(1);
      doc.setDrawColor(0, 0, 0);
      const baselineY = chartY + chartHeight - 5;
      doc.line(chartX, baselineY, chartX + chartWidth, baselineY);

      // Draw peaks
      if (hplcData.peaks.length > 0) {
        const maxHeight = 750; // mV scale
        hplcData.peaks.forEach((peak: any) => {
          if (peak.retentionTime <= maxTime) {
            const peakX = chartX + (peak.retentionTime / maxTime) * chartWidth;
            const peakHeight = Math.min((peak.height || 1000) / maxHeight, 1) * (chartHeight - 10);
            const peakY = chartY + chartHeight - 5 - peakHeight;

            // Draw Gaussian peak
            const points = [];
            const width = 12;
            for (let i = -width; i <= width; i++) {
              const x = peakX + i;
              const gaussian = Math.exp(-(i * i) / (2 * (width/4) * (width/4)));
              const y = baselineY - (peakHeight * gaussian);
              points.push([x, y]);
            }

            // Draw peak curve
            doc.setLineWidth(1.5);
            doc.setDrawColor(0, 0, 0);
            for (let i = 0; i < points.length - 1; i++) {
              if (points[i][0] >= chartX && points[i][0] <= chartX + chartWidth) {
                doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
              }
            }

            // Peak label at top
            doc.setFontSize(8);
            doc.text(peak.retentionTime.toFixed(3), peakX - 5, peakY - 2);
          }
        });
      }

      currentY += chartHeight + 20;

      // Peak Table Section - only if enabled in config
      if (config?.reportTemplate?.includePeakTable !== false) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('<Peak Table>', margin, currentY);
        currentY += 8;

        // Detector label for table
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const detectorLabel = `Detector A ${detectorWave}nm`;
        doc.text(detectorLabel, margin, currentY);
        currentY += 8;

        // Build table headers and data based on configuration
        const headers = ['Peak#', 'Ret. Time'];
        const columnStyles: any = {
          0: { halign: 'center', cellWidth: 15 },
          1: { halign: 'center', cellWidth: 20 }
        };
        let colIndex = 2;

        if (config?.fieldConfig?.enableArea !== false) {
          headers.push(config?.fieldConfig?.areaLabel || 'Area');
          columnStyles[colIndex] = { halign: 'right', cellWidth: 25 };
          colIndex++;
        }

        if (config?.fieldConfig?.enableHeight !== false) {
          headers.push(config?.fieldConfig?.heightLabel || 'Height');
          columnStyles[colIndex] = { halign: 'right', cellWidth: 20 };
          colIndex++;
        }

        if (config?.fieldConfig?.enableConcentration !== false) {
          headers.push(config?.fieldConfig?.concentrationLabel || 'Conc.');
          headers.push('Unit');
          columnStyles[colIndex] = { halign: 'right', cellWidth: 18 };
          columnStyles[colIndex + 1] = { halign: 'center', cellWidth: 15 };
          colIndex += 2;
        }

        headers.push('Mark', 'Name');
        columnStyles[colIndex] = { halign: 'center', cellWidth: 15 };
        columnStyles[colIndex + 1] = { halign: 'left', cellWidth: 40 };

        // Build table data
        const tableData = hplcData.peaks.map((peak: any, index: number) => {
          const row = [(index + 1).toString(), peak.retentionTime ? peak.retentionTime.toFixed(3) : '0.000'];

          if (config?.fieldConfig?.enableArea !== false) {
            row.push(peak.area ? peak.area.toString() : '0');
          }

          if (config?.fieldConfig?.enableHeight !== false) {
            row.push(peak.height ? peak.height.toString() : '0');
          }

          if (config?.fieldConfig?.enableConcentration !== false) {
            row.push(peak.concentration ? peak.concentration.toFixed(3) : '0.000');
            row.push('mg/L');
          }

          row.push('', peak.peakName || '');
          return row;
        });

        // Add total row
        const totalArea = hplcData.peaks.reduce((sum: number, peak: any) => sum + (peak.area || 0), 0);
        const totalHeight = hplcData.peaks.reduce((sum: number, peak: any) => sum + (peak.height || 0), 0);
        const totalRow = ['Total', ''];

        if (config?.fieldConfig?.enableArea !== false) {
          totalRow.push(totalArea.toString());
        }

        if (config?.fieldConfig?.enableHeight !== false) {
          totalRow.push(totalHeight.toString());
        }

        if (config?.fieldConfig?.enableConcentration !== false) {
          totalRow.push('', '');
        }

        totalRow.push('', '');
        tableData.push(totalRow);

        // @ts-ignore
        doc.autoTable({
          head: [headers],
          body: tableData,
          startY: currentY,
          theme: 'plain',
          styles: {
            fontSize: 9,
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.1
          },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineColor: [0, 0, 0],
            lineWidth: 0.5
          },
          columnStyles
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;
      }

      // Footer filename
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(`${hplcData.sampleName} ${hplcData.analysisDate.toLocaleDateString().replace(/\//g, '-')} - 2-3 - ${hplcData.sampleId}.lcd`,
               pageWidth/2 - 60, footerY);

      const pdfBuffer = doc.output('arraybuffer');

      // Update database
      await HPLCData.findByIdAndUpdate(hplcData._id, { reportGenerated: true });

      // Log report generation
      await AuditLog.create({
        userId: user._id,
        userName: user.name,
        action: 'report_generated',
        sampleId: hplcData.sampleId,
        details: { format: 'pdf' }
      });

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${hplcData.sampleId}.pdf"`
        }
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}