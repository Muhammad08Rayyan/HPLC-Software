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
import { FileText, Download, Search } from 'lucide-react';
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
    concentrationUnit?: string;
    peakName?: string;
    percentArea?: number;
    uspPlateCount?: number;
    uspTailing?: number;
    mark?: string;
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
        console.log('Loaded config in reports:', configData); // Debug log
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

          <div className="max-w-4xl mx-auto">
            {/* Sample List */}
            <div>
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
                        className="p-4 border rounded-lg"
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
          </div>
        </div>
      </div>

      
    </div>
  );
}