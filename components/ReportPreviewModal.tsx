'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

interface HPLCData {
  _id: string;
  sampleId: string;
  sampleName: string;
  analystName: string;
  analysisDate?: string;
  createdAt: string;
  departmentConfig?: {
    fieldConfig?: {
      enableArea: boolean;
      enableHeight: boolean;
      enableConcentration: boolean;
      areaLabel: string;
      heightLabel: string;
      concentrationLabel: string;
    };
    detectorSettings?: {
      wavelength?: number;
      defaultUnits?: string;
    };
    reportTemplate?: {
      showMarkColumn: boolean;
    };
    concentrationSettings?: {
      defaultUnit: string;
      showUnitColumn: boolean;
    };
  };
  peaks: Array<{
    retentionTime: number;
    area: number;
    height: number;
    concentration?: number;
    concentrationUnit?: string;
    peakName?: string;
    mark?: string;
  }>;
  instrumentSettings?: {
    detection_wavelength?: number;
    injection_volume?: string;
  };
  reportGenerated: boolean;
  lcmGenerated: boolean;
}

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: HPLCData | null;
  config: any;
  onGenerateReport: (sampleId: string, format: 'pdf' | 'lcm') => void;
  generating: string | null;
}

export default function ReportPreviewModal({
  isOpen,
  onClose,
  sample,
  config,
  onGenerateReport,
  generating
}: ReportPreviewModalProps) {
  if (!sample) return null;

  // Use stored department configuration or fallback to current config
  const storedConfig = sample.departmentConfig || config;

  const detectorWave = sample.instrumentSettings?.detection_wavelength || storedConfig?.detectorSettings?.wavelength || 210;
  const injVol = sample.instrumentSettings?.injection_volume || '10';

  // Calculate concentration based on peak area (same logic as PDF generation)
  const calculateConcentration = (peak: any, allPeaks: any[]) => {
    if (peak.concentration !== undefined && peak.concentration !== null) {
      return peak.concentration.toFixed(3);
    }

    // Calculate concentration based on area percentage and assumed total concentration
    const totalArea = allPeaks.reduce((sum: number, p: any) => sum + (p.area || 0), 0);
    if (totalArea === 0) return '0.000';

    const areaPercentage = (peak.area || 0) / totalArea;
    // Use a reasonable default concentration calculation
    // In practice, this would use calibration curve or response factor
    const estimatedConcentration = areaPercentage * 1.0; // Assuming 1.0 mg/L total
    return estimatedConcentration.toFixed(3);
  };

  // Format dates to match the original
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const analysisDate = formatDate(sample.analysisDate || sample.createdAt);
  const processedDate = new Date().toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Report Preview - {sample.sampleName}
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white border rounded-lg p-6 text-sm">
          {/* Header with date and page */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-xs font-bold">SHIMADZU</div>
              <div className="text-xs">LabSolutions</div>
            </div>
            <div className="text-xs text-right">
              {processedDate} Page 1 / 1
            </div>
          </div>

          {/* Main Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">Analysis Report</h1>
          </div>

          {/* Sample Information */}
          <div className="mb-8">
            <h2 className="text-sm font-bold mb-3">&lt;Sample Information&gt;</h2>
            <div className="border border-black p-3">
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                <div className="grid grid-cols-2 gap-x-2">
                  <span>Sample Name</span>
                  <span>: {sample.sampleName}</span>
                  <span>Sample ID</span>
                  <span>: {sample.sampleId}</span>
                  <span>Data Filename</span>
                  <span>: {sample.sampleId}.lcd</span>
                  <span>Method Filename</span>
                  <span>: {sample.sampleName}.lcm</span>
                  <span>Batch Filename</span>
                  <span>: {sample.sampleName}.lcb</span>
                  <span>Vial #</span>
                  <span>: 1-1</span>
                  <span>Injection Volume</span>
                  <span>: {injVol} uL</span>
                  <span>Date Acquired</span>
                  <span>: {analysisDate}</span>
                  <span>Date Processed</span>
                  <span>: {processedDate}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-2">
                  <span>Sample Type</span>
                  <span>: Standard</span>
                  <span>Level</span>
                  <span>: 1</span>
                  <span>Acquired by</span>
                  <span>: {sample.analystName}</span>
                  <span>Processed by</span>
                  <span>: {sample.analystName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chromatogram */}
          <div className="mb-8">
            <h2 className="text-sm font-bold mb-3">&lt;Chromatogram&gt;</h2>

            <div className="relative">
              <div className="text-xs mb-1">{storedConfig?.detectorSettings?.defaultUnits || 'mV'}</div>
              <div className="text-xs absolute top-0 right-12">Detector A {detectorWave}nm</div>

              <div className="border border-black bg-white relative" style={{ height: '300px', width: '100%' }}>
                {/* Grid background */}
                <svg width="100%" height="100%" viewBox="0 0 600 300" className="absolute inset-0">
                  {/* Horizontal grid lines */}
                  {(() => {
                    const signalUnits = storedConfig?.detectorSettings?.defaultUnits || 'mV';
                    const yAxisValues = signalUnits === 'AU' ? [0, 0.5, 1.0] : [0, 25, 50];
                    const maxValue = signalUnits === 'AU' ? 1.0 : 50;

                    return yAxisValues.map((value) => {
                    const y = 300 - (value / maxValue) * 280; // 280 is chart height, leaving 20px margins
                    return (
                      <line
                        key={`h-${value}`}
                        x1="40"
                        y1={y}
                        x2="580"
                        y2={y}
                        stroke={value === 0 ? "#000" : "#e0e0e0"}
                        strokeWidth={value === 0 ? "1" : "0.5"}
                      />
                    );
                    });
                  })()}
                  {/* Vertical grid lines */}
                  {[0.0, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0].map((value) => {
                    const x = 40 + (value / 15) * 540; // 540 is chart width
                    return (
                      <line
                        key={`v-${value}`}
                        x1={x}
                        y1="20"
                        x2={x}
                        y2="300"
                        stroke="#e0e0e0"
                        strokeWidth="0.5"
                      />
                    );
                  })}

                  {/* Y-axis ticks and labels */}
                  {(() => {
                    const signalUnits = storedConfig?.detectorSettings?.defaultUnits || 'mV';
                    const yAxisValues = signalUnits === 'AU' ? [0, 0.5, 1.0] : [0, 25, 50];
                    const maxValue = signalUnits === 'AU' ? 1.0 : 50;

                    return yAxisValues.map((value) => {
                    const y = 300 - (value / maxValue) * 280;
                    return (
                      <g key={`y-${value}`}>
                        <line
                          x1="35"
                          y1={y}
                          x2="40"
                          y2={y}
                          stroke="black"
                          strokeWidth="1"
                        />
                        <text
                          x="30"
                          y={y + 3}
                          textAnchor="end"
                          fontSize="12"
                          fill="black"
                        >
                          {value}
                        </text>
                      </g>
                    );
                    });
                  })()}

                  {/* X-axis ticks and labels */}
                  {[0.0, 2.5, 5.0, 7.5, 10.0, 12.5, 15.0].map((value) => {
                    const x = 40 + (value / 15) * 540;
                    return (
                      <g key={`x-${value}`}>
                        <line
                          x1={x}
                          y1="300"
                          x2={x}
                          y2="305"
                          stroke="black"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y="320"
                          textAnchor="middle"
                          fontSize="12"
                          fill="black"
                        >
                          {value.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Baseline */}
                  <line x1="40" y1="300" x2="580" y2="300" stroke="black" strokeWidth="2" />

                  {/* Draw peaks */}
                  {sample.peaks.map((peak, index) => {
                    const maxTime = 15.0;
                    const maxHeight = Math.max(...sample.peaks.map(p => p.height));
                    const peakX = 40 + (peak.retentionTime / maxTime) * 540;
                    const normalizedHeight = Math.min((peak.height / maxHeight) * 250, 250); // 250 is max chart height

                    // Generate Gaussian peak points
                    const points = [];
                    const width = 20; // Peak width in pixels
                    for (let i = -width; i <= width; i += 1) {
                      const x = peakX + i;
                      const gaussian = Math.exp(-(i * i) / (2 * (width/3) * (width/3)));
                      const y = 300 - (normalizedHeight * gaussian);
                      if (x >= 40 && x <= 580) { // Keep within chart bounds
                        points.push(`${x},${y}`);
                      }
                    }

                    return (
                      <g key={index}>
                        <polyline
                          points={points.join(' ')}
                          fill="none"
                          stroke="black"
                          strokeWidth="2"
                        />
                        {/* Peak label */}
                        <text
                          x={peakX}
                          y={300 - normalizedHeight - 15}
                          textAnchor="middle"
                          fontSize="12"
                          fill="black"
                        >
                          {peak.retentionTime.toFixed(3)}
                        </text>
                      </g>
                    );
                  })}
                  {/* Axis labels */}
                  <text x="15" y="150" textAnchor="middle" fontSize="12" fill="black" transform="rotate(-90, 15, 150)">
                    {storedConfig?.detectorSettings?.defaultUnits || 'mV'}
                  </text>
                  <text x="310" y="340" textAnchor="middle" fontSize="12" fill="black">
                    min
                  </text>
                  <text x="550" y="35" textAnchor="end" fontSize="12" fill="black">
                    Detector A {detectorWave}nm
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* Peak Table */}
          <div className="mb-6">
            <h2 className="text-sm font-bold mb-3">&lt;Peak Table&gt;</h2>
            <div className="text-xs mb-2">Detector A {detectorWave}nm ({storedConfig?.detectorSettings?.defaultUnits || 'mV'})</div>

            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr>
                  <th className="border border-black px-2 py-1 text-center">Peak#</th>
                  <th className="border border-black px-2 py-1 text-center">Ret. Time</th>
                  {storedConfig?.fieldConfig?.enableArea !== false && (
                    <th className="border border-black px-2 py-1 text-center">{storedConfig?.fieldConfig?.areaLabel || 'Area'}</th>
                  )}
                  {storedConfig?.fieldConfig?.enableHeight !== false && (
                    <th className="border border-black px-2 py-1 text-center">{storedConfig?.fieldConfig?.heightLabel || 'Height'}</th>
                  )}
                  {storedConfig?.fieldConfig?.enableConcentration !== false && (
                    <th className="border border-black px-2 py-1 text-center">{storedConfig?.fieldConfig?.concentrationLabel || 'Conc.'}</th>
                  )}
                  {storedConfig?.fieldConfig?.enableConcentration !== false && storedConfig?.concentrationSettings?.showUnitColumn !== false && (
                    <th className="border border-black px-2 py-1 text-center">Unit</th>
                  )}
                  {storedConfig?.reportTemplate?.showMarkColumn !== false && (
                    <th className="border border-black px-2 py-1 text-center">Mark</th>
                  )}
                  <th className="border border-black px-2 py-1 text-center">Name</th>
                </tr>
              </thead>
              <tbody>
                {sample.peaks.map((peak, index) => (
                  <tr key={index}>
                    <td className="border border-black px-2 py-1 text-center">{index + 1}</td>
                    <td className="border border-black px-2 py-1 text-center">{peak.retentionTime.toFixed(3)}</td>
                    {storedConfig?.fieldConfig?.enableArea !== false && (
                      <td className="border border-black px-2 py-1 text-right">{peak.area.toLocaleString()}</td>
                    )}
                    {storedConfig?.fieldConfig?.enableHeight !== false && (
                      <td className="border border-black px-2 py-1 text-right">{peak.height.toLocaleString()}</td>
                    )}
                    {storedConfig?.fieldConfig?.enableConcentration !== false && (
                      <td className="border border-black px-2 py-1 text-right">{calculateConcentration(peak, sample.peaks)}</td>
                    )}
                    {storedConfig?.fieldConfig?.enableConcentration !== false && storedConfig?.concentrationSettings?.showUnitColumn !== false && (
                      <td className="border border-black px-2 py-1 text-center">{peak.concentrationUnit || storedConfig?.concentrationSettings?.defaultUnit || 'mg/L'}</td>
                    )}
                    {storedConfig?.reportTemplate?.showMarkColumn !== false && (
                      <td className="border border-black px-2 py-1 text-center">{peak.mark || ''}</td>
                    )}
                    <td className="border border-black px-2 py-1 text-left">{peak.peakName || ''}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="border border-black px-2 py-1 text-center">Total</td>
                  <td className="border border-black px-2 py-1"></td>
                  {storedConfig?.fieldConfig?.enableArea !== false && (
                    <td className="border border-black px-2 py-1 text-right">
                      {sample.peaks.reduce((sum, peak) => sum + peak.area, 0).toLocaleString()}
                    </td>
                  )}
                  {storedConfig?.fieldConfig?.enableHeight !== false && (
                    <td className="border border-black px-2 py-1 text-right">
                      {sample.peaks.reduce((sum, peak) => sum + peak.height, 0).toLocaleString()}
                    </td>
                  )}
                  {storedConfig?.fieldConfig?.enableConcentration !== false && (
                    <td className="border border-black px-2 py-1"></td>
                  )}
                  {storedConfig?.fieldConfig?.enableConcentration !== false && storedConfig?.concentrationSettings?.showUnitColumn !== false && (
                    <td className="border border-black px-2 py-1"></td>
                  )}
                  {storedConfig?.reportTemplate?.showMarkColumn !== false && (
                    <td className="border border-black px-2 py-1"></td>
                  )}
                  <td className="border border-black px-2 py-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="text-center text-xs mt-8">
            {sample.sampleName} - 0-2/2-10 - {sample.sampleId}.lcd
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onGenerateReport(sample.sampleId, 'pdf')}
            disabled={generating === sample.sampleId}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            {generating === sample.sampleId ? 'Generating...' : 'Generate PDF'}
          </Button>
          <Button
            variant="outline"
            onClick={() => onGenerateReport(sample.sampleId, 'lcm')}
            disabled={generating === sample.sampleId}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            {generating === sample.sampleId ? 'Generating...' : 'Generate LCM'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}