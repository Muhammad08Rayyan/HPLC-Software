'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Plus, Trash2, FlaskConical } from 'lucide-react';
import { generateSampleId } from '@/lib/utils';

interface Peak {
  retentionTime: number;
  area: number;
  height: number;
  concentration?: number;
  peakName?: string;
}

interface HPLCFormData {
  sampleId: string;
  sampleName: string;
  peaks: Peak[];
  systemSuitability: {
    resolution?: number;
    efficiency?: number;
    asymmetry?: number;
    repeatability?: number;
  };
  instrumentSettings: {
    column?: string;
    mobile_phase?: string;
    flow_rate?: number;
    injection_volume?: number;
    detection_wavelength?: number;
    temperature?: number;
  };
  analysisDate: string;
}

export default function DataInputPage() {
  const [formData, setFormData] = useState<HPLCFormData>({
    sampleId: generateSampleId(),
    sampleName: '',
    peaks: [{ retentionTime: 0, area: 0, height: 0 }],
    systemSuitability: {},
    instrumentSettings: {},
    analysisDate: new Date().toISOString().split('T')[0]
  });

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Load configuration on component mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const configData = await response.json();
          setConfig(configData);

          // Pre-fill instrument settings with defaults from config
          if (configData.detectorSettings) {
            setFormData(prev => ({
              ...prev,
              instrumentSettings: {
                ...prev.instrumentSettings,
                detection_wavelength: configData.detectorSettings.wavelength || prev.instrumentSettings.detection_wavelength,
                flow_rate: configData.detectorSettings.flowRate || prev.instrumentSettings.flow_rate,
                temperature: configData.detectorSettings.temperature || prev.instrumentSettings.temperature
              }
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  const addPeak = () => {
    const maxPeaks = config?.peakConfig?.maxCount || 20;
    if (formData.peaks.length < maxPeaks) {
      setFormData(prev => ({
        ...prev,
        peaks: [...prev.peaks, { retentionTime: 0, area: 0, height: 0 }]
      }));
    }
  };

  const removePeak = (index: number) => {
    if (formData.peaks.length > 1) {
      setFormData(prev => ({
        ...prev,
        peaks: prev.peaks.filter((_, i) => i !== index)
      }));
    }
  };

  const updatePeak = (index: number, field: keyof Peak, value: string) => {
    setFormData(prev => ({
      ...prev,
      peaks: prev.peaks.map((peak, i) =>
        i === index ? { ...peak, [field]: field === 'peakName' ? value : parseFloat(value) || 0 } : peak
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/hplc-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('Data saved successfully!');
        setFormData({
          sampleId: generateSampleId(),
          sampleName: '',
          peaks: [{ retentionTime: 0, area: 0, height: 0 }],
          systemSuitability: {},
          instrumentSettings: {},
          analysisDate: new Date().toISOString().split('T')[0]
        });
      } else {
        const data = await response.json();
        setMessage(data.error || 'Failed to save data');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setLoading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await fetch('/api/hplc-data/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setUploadFile(null);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Upload failed');
      }
    } catch (err) {
      setMessage('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (configLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Data Input</h1>
            {config && (
              <div className="text-sm text-gray-600">
                Max peaks: {config.peakConfig?.maxCount || 20}
              </div>
            )}
          </div>

          {/* File Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Batch Upload
              </CardTitle>
              <CardDescription>
                Upload CSV or Excel files with HPLC data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                <Button onClick={handleFileUpload} disabled={!uploadFile || loading}>
                  Upload
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: CSV, Excel (.xlsx, .xls)
              </p>
            </CardContent>
          </Card>

          {/* Manual Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FlaskConical className="h-5 w-5 mr-2" />
                Manual Data Entry
              </CardTitle>
              <CardDescription>
                Enter HPLC analysis data manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sample Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sample ID</label>
                    <Input
                      value={formData.sampleId}
                      onChange={(e) => setFormData(prev => ({ ...prev, sampleId: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sample Name</label>
                    <Input
                      value={formData.sampleName}
                      onChange={(e) => setFormData(prev => ({ ...prev, sampleName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Analysis Date</label>
                  <Input
                    type="date"
                    value={formData.analysisDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, analysisDate: e.target.value }))}
                    required
                  />
                </div>

                {/* Peak Data */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Peak Data</h3>
                      <p className="text-sm text-gray-600">
                        {formData.peaks.length} of {config?.peakConfig?.maxCount || 20} peaks
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={addPeak}
                      size="sm"
                      disabled={formData.peaks.length >= (config?.peakConfig?.maxCount || 20)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Peak
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.peaks.map((peak, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900">Peak {index + 1}</h4>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removePeak(index)}
                            disabled={formData.peaks.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Retention Time - Always required */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Retention Time (min) *
                            </label>
                            <Input
                              type="number"
                              step="0.001"
                              value={peak.retentionTime || ''}
                              onChange={(e) => updatePeak(index, 'retentionTime', e.target.value)}
                              required
                              placeholder="0.000"
                            />
                          </div>

                          {/* Area - configurable */}
                          {config?.fieldConfig?.enableArea !== false && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                {config?.fieldConfig?.areaLabel || 'Area'} *
                              </label>
                              <Input
                                type="number"
                                value={peak.area || ''}
                                onChange={(e) => updatePeak(index, 'area', e.target.value)}
                                required={config?.fieldConfig?.enableArea !== false}
                                placeholder="0"
                              />
                            </div>
                          )}

                          {/* Height - configurable */}
                          {config?.fieldConfig?.enableHeight !== false && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                {config?.fieldConfig?.heightLabel || 'Height'} *
                              </label>
                              <Input
                                type="number"
                                value={peak.height || ''}
                                onChange={(e) => updatePeak(index, 'height', e.target.value)}
                                required={config?.fieldConfig?.enableHeight !== false}
                                placeholder="0"
                              />
                            </div>
                          )}

                          {/* Concentration - configurable */}
                          {config?.fieldConfig?.enableConcentration !== false && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                {config?.fieldConfig?.concentrationLabel || 'Concentration'}
                              </label>
                              <Input
                                type="number"
                                step="0.001"
                                value={peak.concentration || ''}
                                onChange={(e) => updatePeak(index, 'concentration', e.target.value)}
                                placeholder="0.000"
                              />
                            </div>
                          )}

                          {/* Peak Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Peak Name</label>
                            <Input
                              value={peak.peakName || ''}
                              onChange={(e) => updatePeak(index, 'peakName', e.target.value)}
                              placeholder="Peak identity"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instrument Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Instrument Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Column</label>
                      <Input
                        value={formData.instrumentSettings.column || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instrumentSettings: { ...prev.instrumentSettings, column: e.target.value }
                        }))}
                        placeholder="C18, 4.6 x 250 mm, 5 μm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mobile Phase</label>
                      <Input
                        value={formData.instrumentSettings.mobile_phase || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instrumentSettings: { ...prev.instrumentSettings, mobile_phase: e.target.value }
                        }))}
                        placeholder="Water:Acetonitrile (70:30)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Flow Rate (mL/min)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.instrumentSettings.flow_rate || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instrumentSettings: { ...prev.instrumentSettings, flow_rate: parseFloat(e.target.value) || undefined }
                        }))}
                        placeholder={config?.detectorSettings?.flowRate?.toString() || "1.0"}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Detection Wavelength (nm)</label>
                      <Input
                        type="number"
                        value={formData.instrumentSettings.detection_wavelength || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instrumentSettings: { ...prev.instrumentSettings, detection_wavelength: parseFloat(e.target.value) || undefined }
                        }))}
                        placeholder={config?.detectorSettings?.wavelength?.toString() || "254"}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Injection Volume (μL)</label>
                      <Input
                        type="number"
                        value={formData.instrumentSettings.injection_volume || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instrumentSettings: { ...prev.instrumentSettings, injection_volume: parseFloat(e.target.value) || undefined }
                        }))}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Column Temperature (°C)</label>
                      <Input
                        type="number"
                        value={formData.instrumentSettings.temperature || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instrumentSettings: { ...prev.instrumentSettings, temperature: parseFloat(e.target.value) || undefined }
                        }))}
                        placeholder={config?.detectorSettings?.temperature?.toString() || "30"}
                      />
                    </div>
                  </div>
                </div>

                {/* System Suitability - only show if enabled in config */}
                {config?.reportTemplate?.includeSystemSuitability !== false && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">System Suitability</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Resolution</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.systemSuitability.resolution || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            systemSuitability: { ...prev.systemSuitability, resolution: parseFloat(e.target.value) || undefined }
                          }))}
                          placeholder="≥ 1.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Efficiency (plates)</label>
                        <Input
                          type="number"
                          value={formData.systemSuitability.efficiency || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            systemSuitability: { ...prev.systemSuitability, efficiency: parseFloat(e.target.value) || undefined }
                          }))}
                          placeholder="≥ 2000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Asymmetry Factor</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.systemSuitability.asymmetry || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            systemSuitability: { ...prev.systemSuitability, asymmetry: parseFloat(e.target.value) || undefined }
                          }))}
                          placeholder="≤ 2.0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Repeatability (%)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.systemSuitability.repeatability || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            systemSuitability: { ...prev.systemSuitability, repeatability: parseFloat(e.target.value) || undefined }
                          }))}
                          placeholder="≤ 2.0"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      System suitability parameters help validate the reliability of the analytical method
                    </p>
                  </div>
                )}

                {message && (
                  <div className={`p-3 rounded-md ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {message}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Save Data'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}