'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Database } from 'lucide-react';
import { generateSampleId } from '@/lib/utils';
import { calculatePeakCharacteristics, calculatePercentAreas } from '@/lib/hplc-calculations';

interface Peak {
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
}

interface HPLCFormData {
  // A. Report Metadata
  projectName: string;
  reportTitle: string;
  reportMethodId: string;
  reportedBy: string;

  // B. Sample Information
  sampleId: string;
  sampleName: string;
  sampleSetName: string;
  sampleType: string;
  vialNumber: string;
  level: string;

  // C. Acquisition & Processing
  dateAcquired: string;
  acquiredBy: string;
  dateProcessed: string;
  processedBy: string;
  dataFilename: string;
  methodFilename: string;
  batchFilename: string;

  // D. Instrument / Method Parameters
  acqMethodSet: string;
  processingMethod: string;
  channelDetector: string;
  runTime: number;
  injectionVolume: number;
  injectionNumber: number;

  // E. Peak Data
  peaks: Peak[];

  // Legacy fields for compatibility
  analysisDate: string;
  analystName: string;
  instrumentSettings: {
    column?: string;
    mobile_phase?: string;
    flow_rate?: number;
    injection_volume?: number;
    detection_wavelength?: number;
    temperature?: number;
  };
}

export default function DataInputPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<HPLCFormData>({
    // A. Report Metadata
    projectName: '',
    reportTitle: '',
    reportMethodId: '',
    reportedBy: '',

    // B. Sample Information
    sampleId: '',
    sampleName: '',
    sampleSetName: '',
    sampleType: 'Standard',
    vialNumber: '',
    level: '',

    // C. Acquisition & Processing
    dateAcquired: '',
    acquiredBy: '',
    dateProcessed: '',
    processedBy: '',
    dataFilename: '',
    methodFilename: '',
    batchFilename: '',

    // D. Instrument / Method Parameters
    acqMethodSet: '',
    processingMethod: '',
    channelDetector: '',
    runTime: 0,
    injectionVolume: 0,
    injectionNumber: 0,

    // E. Peak Data
    peaks: [{ retentionTime: 0, area: 0, height: 0, concentration: 0, concentrationUnit: 'mg/L' }],

    // Legacy fields for compatibility
    analysisDate: '',
    analystName: '',
    instrumentSettings: {}
  });

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [message, setMessage] = useState('');
  

  // Load configuration on component mount
  useEffect(() => {
    // Check user role first
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.user) {
          router.push('/login');
          return;
        }
        if (data.user.role === 'viewer') {
          router.push('/reports');
          return;
        }
        // Allow admin and analyst access

        // Load config after role check
        loadConfig();
      })
      .catch(() => {
        router.push('/login');
      });

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
                detection_wavelength: configData.detectorSettings.wavelength || 210,
                flow_rate: configData.detectorSettings.flowRate || 1.0,
                temperature: configData.detectorSettings.temperature || 25
              },
              channelDetector: `Detector A ${configData.detectorSettings.wavelength || 210}nm`
            }));
          }

          // Initialize peaks with default count from config
          const defaultPeakCount = configData.peakConfig?.defaultCount || 1;
          const initialPeaks = Array.from({ length: defaultPeakCount }, () => ({
            retentionTime: 0,
            area: 0,
            height: 0,
            concentration: 0,
            concentrationUnit: 'mg/L'
          }));

          setFormData(prev => ({
            ...prev,
            peaks: initialPeaks
          }));
        }
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setConfigLoading(false);
      }
    };

  }, [router]);

  // Calculate % Area for all peaks
  const calculatePercentAreas = (peaks: Peak[]) => {
    const totalArea = peaks.reduce((sum, peak) => sum + (peak.area || 0), 0);
    if (totalArea === 0) return peaks;

    return peaks.map(peak => ({
      ...peak,
      percentArea: totalArea > 0 ? ((peak.area || 0) / totalArea) * 100 : 0
    }));
  };

  const addPeak = () => {
    const maxPeaks = config?.peakConfig?.maxCount || 20;
    if (formData.peaks.length < maxPeaks) {
      setFormData(prev => {
        const newPeaks = [...prev.peaks, {
          retentionTime: 0,
          area: 0,
          height: 0,
          concentration: 0,
          concentrationUnit: config?.concentrationSettings?.defaultUnit || 'mg/L'
        }];
        return {
          ...prev,
          peaks: calculatePercentAreas(newPeaks)
        };
      });
    }
  };

  const removePeak = (index: number) => {
    if (formData.peaks.length > 1) {
      setFormData(prev => {
        const newPeaks = prev.peaks.filter((_, i) => i !== index);
        return {
          ...prev,
          peaks: calculatePercentAreas(newPeaks)
        };
      });
    }
  };

  const updatePeak = (index: number, field: keyof Peak, value: string) => {
    setFormData(prev => {
      const updatedPeaks = prev.peaks.map((peak, i) => {
        if (i === index) {
          if (field === 'peakName' || field === 'concentrationUnit' || field === 'mark') {
            return { ...peak, [field]: value };
          } else {
            const updatedPeak = { ...peak, [field]: parseFloat(value) || 0 };

            // Auto-calculate USP parameters when area or height changes
            if ((field === 'area' || field === 'height') && updatedPeak.area > 0 && updatedPeak.height > 0) {
              const characteristics = calculatePeakCharacteristics({
                retentionTime: updatedPeak.retentionTime,
                area: updatedPeak.area,
                height: updatedPeak.height
              });

              updatedPeak.uspPlateCount = characteristics.uspPlateCount;
              updatedPeak.uspTailing = characteristics.uspTailing;
            }

            return updatedPeak;
          }
        }
        return peak;
      });

      // Recalculate % Area if area was changed
      const finalPeaks = field === 'area' ? calculatePercentAreas(updatedPeaks) : updatedPeaks;

      return {
        ...prev,
        peaks: finalPeaks
      };
    });
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
          // A. Report Metadata
          projectName: '',
          reportTitle: '',
          reportMethodId: '',
          reportedBy: '',

          // B. Sample Information
          sampleId: '',
          sampleName: '',
          sampleSetName: '',
          sampleType: 'Standard',
          vialNumber: '',
          level: '',

          // C. Acquisition & Processing
          dateAcquired: '',
          acquiredBy: '',
          dateProcessed: '',
          processedBy: '',
          dataFilename: '',
          methodFilename: '',
          batchFilename: '',

          // D. Instrument / Method Parameters
          acqMethodSet: '',
          processingMethod: '',
          channelDetector: '',
          runTime: 0,
          injectionVolume: 0,
          injectionNumber: 0,

          // E. Peak Data
          peaks: [{ retentionTime: 0, area: 0, height: 0, concentration: 0, concentrationUnit: 'mg/L' }],

          // Legacy fields for compatibility
          analysisDate: '',
          analystName: '',
          instrumentSettings: {}
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

          

          {/* Manual Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Manual Data Entry
              </CardTitle>
              <CardDescription>
                Enter HPLC analysis data manually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* A. Report Metadata */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    🧾 A. Report Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Project Name</label>
                      <Input
                        value={formData.projectName}
                        onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                        placeholder="Enter project name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Report Title/Method</label>
                      <Input
                        value={formData.reportTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, reportTitle: e.target.value }))}
                        placeholder="Enter report title"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Report Method ID</label>
                      <Input
                        value={formData.reportMethodId}
                        onChange={(e) => setFormData(prev => ({ ...prev, reportMethodId: e.target.value }))}
                        placeholder="0000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reported By / User</label>
                      <Input
                        value={formData.reportedBy}
                        onChange={(e) => setFormData(prev => ({ ...prev, reportedBy: e.target.value, analystName: e.target.value }))}
                        placeholder="User"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* B. Sample Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    B. Sample Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sample Name</label>
                      <Input
                        value={formData.sampleName}
                        onChange={(e) => setFormData(prev => ({ ...prev, sampleName: e.target.value }))}
                        placeholder="Sample Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sample ID</label>
                      <Input
                        value={formData.sampleId}
                        onChange={(e) => setFormData(prev => ({ ...prev, sampleId: e.target.value }))}
                        placeholder="Sample ID"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sample Set Name</label>
                      <Input
                        value={formData.sampleSetName}
                        onChange={(e) => setFormData(prev => ({ ...prev, sampleSetName: e.target.value }))}
                        placeholder="Sample Set"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sample Type</label>
                      <select
                        value={formData.sampleType}
                        onChange={(e) => setFormData(prev => ({ ...prev, sampleType: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2"
                      >
                        <option value="Standard">Standard</option>
                        <option value="Unknown">Unknown</option>
                        <option value="Blank">Blank</option>
                        <option value="QC">QC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vial #</label>
                      <Input
                        value={formData.vialNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, vialNumber: e.target.value }))}
                        placeholder="0-0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Level</label>
                      <Input
                        value={formData.level}
                        onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* C. Acquisition & Processing */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    ⚙ C. Acquisition & Processing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date Acquired</label>
                      <Input
                        type="datetime-local"
                        value={formData.dateAcquired}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateAcquired: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Acquired By</label>
                      <Input
                        value={formData.acquiredBy}
                        onChange={(e) => setFormData(prev => ({ ...prev, acquiredBy: e.target.value, analystName: e.target.value }))}
                        placeholder="Analyst Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date Processed</label>
                      <Input
                        type="datetime-local"
                        value={formData.dateProcessed}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateProcessed: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Processed By</label>
                      <Input
                        value={formData.processedBy}
                        onChange={(e) => setFormData(prev => ({ ...prev, processedBy: e.target.value, analystName: e.target.value }))}
                        placeholder="Analyst Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Data Filename</label>
                      <Input
                        value={formData.dataFilename}
                        onChange={(e) => setFormData(prev => ({ ...prev, dataFilename: e.target.value }))}
                        placeholder="Data000.lcd"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Method Filename</label>
                      <Input
                        value={formData.methodFilename}
                        onChange={(e) => setFormData(prev => ({ ...prev, methodFilename: e.target.value }))}
                        placeholder="Method000.lcm"
                        required
                      />
                    </div>
                    
                  </div>
                </div>

                {/* D. Instrument / Method Parameters */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    💻 D. Instrument / Method Parameters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Acq. Method Set</label>
                      <Input
                        value={formData.acqMethodSet}
                        onChange={(e) => setFormData(prev => ({ ...prev, acqMethodSet: e.target.value }))}
                        placeholder="Method Set"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Processing Method</label>
                      <Input
                        value={formData.processingMethod}
                        onChange={(e) => setFormData(prev => ({ ...prev, processingMethod: e.target.value }))}
                        placeholder="Sample Set"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Channel / Detector</label>
                      <Input
                        value={formData.channelDetector}
                        onChange={(e) => setFormData(prev => ({ ...prev, channelDetector: e.target.value }))}
                        placeholder="Detector A 000nm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Run Time (min)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.runTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, runTime: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Injection Volume (µL)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.injectionVolume}
                        onChange={(e) => setFormData(prev => ({ ...prev, injectionVolume: parseFloat(e.target.value) || 0, instrumentSettings: { ...prev.instrumentSettings, injection_volume: parseFloat(e.target.value) || 0 } }))}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Injection #</label>
                      <Input
                        type="number"
                        value={formData.injectionNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, injectionNumber: parseInt(e.target.value) || 1 }))}
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* E. Peak Data */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">📈 E. Chromatogram/Peak Data</h3>
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
                              placeholder="Enter retention time"
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
                                placeholder="Enter value"
                              />
                            </div>
                          )}

                          {/* % Area - configurable and auto-calculated */}
                          {config?.fieldConfig?.enablePercentArea !== false && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                {config?.fieldConfig?.percentAreaLabel || '% Area'}
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={peak.percentArea?.toFixed(2) || '0.00'}
                                disabled
                                placeholder="0.00"
                                className="bg-gray-50"
                              />
                              <p className="text-xs text-gray-500 mt-1">Auto-calculated from area values</p>
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
                                placeholder="Enter value"
                              />
                            </div>
                          )}

                          {/* Concentration - configurable */}
                          {config?.fieldConfig?.enableConcentration !== false && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                {config?.fieldConfig?.concentrationLabel || 'Conc.'}
                              </label>
                              <div className="flex space-x-2">
                                <Input
                                  type="number"
                                  step="0.001"
                                  value={peak.concentration || ''}
                                  onChange={(e) => updatePeak(index, 'concentration', e.target.value)}
                                  placeholder="0.000"
                                  className="flex-1"
                                />
                                {config?.concentrationSettings?.showUnitColumn && (
                                  <select
                                    value={peak.concentrationUnit || config?.concentrationSettings?.defaultUnit || 'mg/L'}
                                    onChange={(e) => updatePeak(index, 'concentrationUnit', e.target.value)}
                                    className="rounded-md border border-gray-300 px-2 py-1 text-sm min-w-[70px]"
                                  >
                                    {config?.concentrationSettings?.availableUnits?.map((unit: string) => (
                                      <option key={unit} value={unit}>{unit}</option>
                                    )) || <option value="mg/L">mg/L</option>}
                                  </select>
                                )}
                              </div>
                            </div>
                          )}

                          {/* USP Plate Count - configurable */}
                          {config?.fieldConfig?.enableUSPPlateCount !== false && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                {config?.fieldConfig?.uspPlateCountLabel || 'USP Plate Count'}
                              </label>
                              <Input
                                type="number"
                                step="1"
                                value={peak.uspPlateCount || ''}
                                disabled
                                placeholder="Auto-calculated"
                                className="bg-gray-50"
                              />
                              <p className="text-xs text-gray-500 mt-1">Auto-calculated from area and height</p>
                            </div>
                          )}

                          {/* USP Tailing - configurable */}
                          {config?.fieldConfig?.enableUSPTailing !== false && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                {config?.fieldConfig?.uspTailingLabel || 'USP Tailing'}
                              </label>
                              <Input
                                type="number"
                                step="0.001"
                                value={peak.uspTailing?.toFixed(3) || ''}
                                disabled
                                placeholder="Auto-calculated"
                                className="bg-gray-50"
                              />
                              <p className="text-xs text-gray-500 mt-1">Auto-calculated from peak characteristics</p>
                            </div>
                          )}

                          {/* Mark column */}
                          {config?.reportTemplate?.showMarkColumn !== false && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Mark</label>
                              <Input
                                value={peak.mark || ''}
                                onChange={(e) => updatePeak(index, 'mark', e.target.value)}
                                placeholder=""
                                maxLength={10}
                              />
                              <p className="text-xs text-gray-500 mt-1">Optional peak marker/identifier</p>
                            </div>
                          )}

                          {/* Peak Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Peak Name</label>
                            <Input
                              value={peak.peakName || ''}
                              onChange={(e) => updatePeak(index, 'peakName', e.target.value)}
                              placeholder="Peak Name"
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
                        placeholder="Column Type"
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
                        placeholder="Mobile Phase"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Flow Rate (mL/min)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.instrumentSettings.flow_rate || config?.detectorSettings?.flowRate || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instrumentSettings: { ...prev.instrumentSettings, flow_rate: parseFloat(e.target.value) || undefined }
                        }))}
                        placeholder={config?.detectorSettings?.flowRate?.toString() || "0.0"}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Detection Wavelength (nm)</label>
                      <Input
                        type="number"
                        value={formData.instrumentSettings.detection_wavelength || config?.detectorSettings?.wavelength || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instrumentSettings: { ...prev.instrumentSettings, detection_wavelength: parseFloat(e.target.value) || undefined },
                          channelDetector: `Detector A ${parseFloat(e.target.value) || config?.detectorSettings?.wavelength || 210}nm`
                        }))}
                        placeholder={config?.detectorSettings?.wavelength?.toString() || "000"}
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
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Column Temperature (°C)</label>
                      <Input
                        type="number"
                        value={formData.instrumentSettings.temperature || config?.detectorSettings?.temperature || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          instrumentSettings: { ...prev.instrumentSettings, temperature: parseFloat(e.target.value) || undefined }
                        }))}
                        placeholder={config?.detectorSettings?.temperature?.toString() || "00"}
                      />
                    </div>
                  </div>
                </div>


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