'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { FileText, Download, Eye, Search } from 'lucide-react';
import { downloadFile } from '@/lib/utils';

interface HPLCData {
  _id: string;
  sampleId: string;
  sampleName: string;
  analystName: string;
  peaks: Array<{
    retentionTime: number;
    area: number;
    height: number;
    concentration?: number;
    peakName?: string;
  }>;
  createdAt: string;
  reportGenerated: boolean;
  lcmGenerated: boolean;
}

export default function ReportsPage() {
  const [data, setData] = useState<HPLCData[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSample, setSelectedSample] = useState<HPLCData | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const configData = await response.json();
        setConfig(configData);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const response = await fetch('/api/hplc-data');
      const result = await response.json();
      setData(result.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (sampleId: string, format: 'pdf' | 'lcm') => {
    setGenerating(sampleId);

    try {
      const endpoint = format === 'pdf' ? '/api/reports/generate' : '/api/lcm/generate';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleId })
      });

      if (response.ok) {
        const blob = await response.blob();
        const filename = `${sampleId}.${format}`;
        downloadFile(blob, filename);

        // Refresh data to update generation status
        loadData();
      } else {
        alert('Failed to generate file');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Network error');
    } finally {
      setGenerating(null);
    }
  };

  const filteredData = data.filter(item =>
    item.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sampleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.analystName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = selectedSample?.peaks.map((peak, index) => ({
    peak: `Peak ${index + 1}`,
    retentionTime: peak.retentionTime,
    area: peak.area,
    height: peak.height
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Reports & Export</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sample List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    HPLC Samples
                  </CardTitle>
                  <CardDescription>
                    Select samples to generate reports or export LCM files
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search samples..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Sample List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredData.map((sample) => (
                      <div
                        key={sample._id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedSample?._id === sample._id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSample(sample)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{sample.sampleName}</h3>
                            <p className="text-sm text-gray-600">
                              {sample.sampleId} • {sample.analystName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(sample.createdAt).toLocaleDateString()} • {sample.peaks.length} peaks
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                generateReport(sample.sampleId, 'pdf');
                              }}
                              disabled={generating === sample.sampleId}
                              className="min-w-[60px]"
                            >
                              {generating === sample.sampleId ? '...' : 'PDF'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                generateReport(sample.sampleId, 'lcm');
                              }}
                              disabled={generating === sample.sampleId}
                              className="min-w-[60px]"
                            >
                              {generating === sample.sampleId ? '...' : 'LCM'}
                            </Button>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          {sample.reportGenerated && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              PDF Generated
                            </span>
                          )}
                          {sample.lcmGenerated && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              LCM Generated
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {filteredData.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No samples found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Sample Preview
                  </CardTitle>
                  <CardDescription>
                    Peak data visualization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSample ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium">{selectedSample.sampleName}</h3>
                        <p className="text-sm text-gray-600">{selectedSample.sampleId}</p>
                        <p className="text-xs text-gray-500">
                          Analyzed by {selectedSample.analystName}
                        </p>
                      </div>

                      {/* Chromatogram Preview */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Chromatogram</h4>
                        <div className="border rounded bg-white p-3">
                          <div className="text-xs text-gray-600 mb-1">mV</div>
                          <div className="relative h-32 border">
                            {/* Background grid */}
                            <div className="absolute inset-0 opacity-20">
                              <svg width="100%" height="100%">
                                {/* Horizontal grid lines */}
                                {[1, 2, 3].map(i => (
                                  <line
                                    key={`h-${i}`}
                                    x1="0"
                                    y1={`${(i * 100) / 4}%`}
                                    x2="100%"
                                    y2={`${(i * 100) / 4}%`}
                                    stroke="#ccc"
                                    strokeWidth="0.5"
                                  />
                                ))}
                                {/* Vertical grid lines */}
                                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                  <line
                                    key={`v-${i}`}
                                    x1={`${(i * 100) / 8}%`}
                                    y1="0"
                                    x2={`${(i * 100) / 8}%`}
                                    y2="100%"
                                    stroke="#ccc"
                                    strokeWidth="0.5"
                                  />
                                ))}
                              </svg>
                            </div>

                            {/* Chromatogram line and peaks */}
                            <svg width="100%" height="100%" className="absolute inset-0">
                              {/* Baseline */}
                              <line x1="0" y1="95%" x2="100%" y2="95%" stroke="black" strokeWidth="1" />

                              {/* Draw peaks */}
                              {selectedSample.peaks.map((peak, index) => {
                                const maxTime = 8;
                                const maxHeight = Math.max(...selectedSample.peaks.map(p => p.height));
                                const x = (peak.retentionTime / maxTime) * 100;
                                const height = Math.min((peak.height / maxHeight) * 80, 80);

                                // Generate Gaussian peak points
                                const points = [];
                                const width = 3; // Peak width percentage
                                for (let i = -width; i <= width; i += 0.2) {
                                  const px = x + i;
                                  const gaussian = Math.exp(-(i * i) / (2 * (width/3) * (width/3)));
                                  const py = 95 - (height * gaussian);
                                  points.push(`${px},${py}`);
                                }

                                return (
                                  <g key={index}>
                                    <polyline
                                      points={points.join(' ')}
                                      fill="none"
                                      stroke="black"
                                      strokeWidth="1.5"
                                    />
                                    {/* Peak label */}
                                    <text
                                      x={`${x}%`}
                                      y={95 - height - 5}
                                      textAnchor="middle"
                                      fontSize="8"
                                      fill="black"
                                    >
                                      {peak.retentionTime.toFixed(3)}
                                    </text>
                                  </g>
                                );
                              })}
                            </svg>

                            {/* Axis labels */}
                            <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-xs text-gray-600">
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <span key={i}>{i}</span>
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 text-center mt-1">min</div>
                        </div>
                      </div>

                      {/* Peak Table */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Peak Table</h4>
                        <div className="border rounded bg-white">
                          <div className="text-xs p-2 border-b bg-gray-50 font-medium">
                            Detector A {(selectedSample as any)?.instrumentSettings?.detection_wavelength || 254}nm
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-center py-1 px-1">Peak#</th>
                                  <th className="text-center py-1 px-1">Ret. Time</th>
                                  {config?.fieldConfig?.enableArea !== false && (
                                    <th className="text-center py-1 px-1">{config?.fieldConfig?.areaLabel || 'Area'}</th>
                                  )}
                                  {config?.fieldConfig?.enableHeight !== false && (
                                    <th className="text-center py-1 px-1">{config?.fieldConfig?.heightLabel || 'Height'}</th>
                                  )}
                                  {config?.fieldConfig?.enableConcentration !== false && (
                                    <>
                                      <th className="text-center py-1 px-1">{config?.fieldConfig?.concentrationLabel || 'Conc.'}</th>
                                      <th className="text-center py-1 px-1">Unit</th>
                                    </>
                                  )}
                                  <th className="text-center py-1 px-1">Name</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedSample.peaks.map((peak, index) => (
                                  <tr key={index} className="border-b">
                                    <td className="text-center py-1 px-1">{index + 1}</td>
                                    <td className="text-center py-1 px-1">{peak.retentionTime.toFixed(3)}</td>
                                    {config?.fieldConfig?.enableArea !== false && (
                                      <td className="text-right py-1 px-1">{peak.area.toLocaleString()}</td>
                                    )}
                                    {config?.fieldConfig?.enableHeight !== false && (
                                      <td className="text-right py-1 px-1">{peak.height.toLocaleString()}</td>
                                    )}
                                    {config?.fieldConfig?.enableConcentration !== false && (
                                      <>
                                        <td className="text-right py-1 px-1">{peak.concentration?.toFixed(3) || '0.000'}</td>
                                        <td className="text-center py-1 px-1">mg/L</td>
                                      </>
                                    )}
                                    <td className="text-left py-1 px-1">{peak.peakName || ''}</td>
                                  </tr>
                                ))}
                                <tr className="border-b font-medium">
                                  <td className="text-center py-1 px-1">Total</td>
                                  <td className="text-center py-1 px-1"></td>
                                  {config?.fieldConfig?.enableArea !== false && (
                                    <td className="text-right py-1 px-1">
                                      {selectedSample.peaks.reduce((sum, peak) => sum + peak.area, 0).toLocaleString()}
                                    </td>
                                  )}
                                  {config?.fieldConfig?.enableHeight !== false && (
                                    <td className="text-right py-1 px-1">
                                      {selectedSample.peaks.reduce((sum, peak) => sum + peak.height, 0).toLocaleString()}
                                    </td>
                                  )}
                                  {config?.fieldConfig?.enableConcentration !== false && (
                                    <>
                                      <td className="text-center py-1 px-1"></td>
                                      <td className="text-center py-1 px-1"></td>
                                    </>
                                  )}
                                  <td className="text-center py-1 px-1"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => generateReport(selectedSample.sampleId, 'pdf')}
                          disabled={generating === selectedSample.sampleId}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateReport(selectedSample.sampleId, 'lcm')}
                          disabled={generating === selectedSample.sampleId}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          LCM
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Select a sample to preview
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}