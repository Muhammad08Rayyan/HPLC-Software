import mongoose, { Schema, Document } from 'mongoose';

export interface IPeak {
  retentionTime: number;
  area: number;
  height: number;
  concentration?: number;
  peakName?: string;
}

export interface IHPLCData extends Document {
  sampleId: string;
  sampleName: string;
  analystId: string;
  analystName: string;
  department?: string;
  analystDepartment?: string;
  departmentConfig?: {
    peakConfig?: {
      defaultCount: number;
      minCount: number;
      maxCount: number;
      enableRange: boolean;
    };
    fieldConfig?: {
      enableArea: boolean;
      enableHeight: boolean;
      enableConcentration: boolean;
      enablePercentArea: boolean;
      enableUSPPlateCount: boolean;
      enableUSPTailing: boolean;
      areaLabel: string;
      heightLabel: string;
      concentrationLabel: string;
      percentAreaLabel: string;
      uspPlateCountLabel: string;
      uspTailingLabel: string;
    };
    detectorSettings?: {
      wavelength?: number;
      flowRate?: number;
      temperature?: number;
      defaultUnits?: string;
    };
    reportTemplate?: {
      title: string;
      includeSystemSuitability: boolean;
      includePeakTable: boolean;
      includeGraph: boolean;
      includeUSPParameters: boolean;
      showMarkColumn: boolean;
    };
    concentrationSettings?: {
      defaultUnit: string;
      availableUnits: string[];
      showUnitColumn: boolean;
    };
  };
  peaks: IPeak[];
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

  // New comprehensive fields for report metadata
  projectName?: string;
  reportTitle?: string;
  reportMethodId?: string;
  reportedBy?: string;
  sampleSetName?: string;
  sampleType?: string;
  vialNumber?: string;
  level?: string;
  dateAcquired?: Date;
  acquiredBy?: string;
  dateProcessed?: Date;
  processedBy?: string;
  dataFilename?: string;
  methodFilename?: string;
  batchFilename?: string;
  acqMethodSet?: string;
  processingMethod?: string;
  channelDetector?: string;
  runTime?: number;
  injectionVolume?: number;
  injectionNumber?: number;

  analysisDate: Date;
  createdAt: Date;
  reportGenerated: boolean;
  lcmGenerated: boolean;
}

const PeakSchema = new Schema({
  retentionTime: { type: Number, required: true },
  area: { type: Number, required: true },
  height: { type: Number, required: true },
  concentration: { type: Number },
  peakName: { type: String }
});

const HPLCDataSchema = new Schema<IHPLCData>({
  sampleId: {
    type: String,
    required: true,
    unique: true
  },
  sampleName: {
    type: String,
    required: true
  },
  analystId: {
    type: String,
    required: true
  },
  analystName: {
    type: String,
    required: true
  },
  department: {
    type: String
  },
  analystDepartment: {
    type: String
  },
  departmentConfig: {
    peakConfig: {
      defaultCount: { type: Number, default: 5 },
      minCount: { type: Number, default: 1 },
      maxCount: { type: Number, default: 20 },
      enableRange: { type: Boolean, default: true }
    },
    fieldConfig: {
      enableArea: { type: Boolean, default: true },
      enableHeight: { type: Boolean, default: true },
      enableConcentration: { type: Boolean, default: true },
      enablePercentArea: { type: Boolean, default: true },
      enableUSPPlateCount: { type: Boolean, default: true },
      enableUSPTailing: { type: Boolean, default: true },
      areaLabel: { type: String, default: 'Area' },
      heightLabel: { type: String, default: 'Height' },
      concentrationLabel: { type: String, default: 'Conc.' },
      percentAreaLabel: { type: String, default: '% Area' },
      uspPlateCountLabel: { type: String, default: 'USP Plate Count' },
      uspTailingLabel: { type: String, default: 'USP Tailing' }
    },
    detectorSettings: {
      wavelength: { type: Number },
      flowRate: { type: Number },
      temperature: { type: Number },
      defaultUnits: { type: String, default: 'mV' }
    },
    reportTemplate: {
      title: { type: String, default: 'HPLC Analysis Report' },
      includeSystemSuitability: { type: Boolean, default: true },
      includePeakTable: { type: Boolean, default: true },
      includeGraph: { type: Boolean, default: true },
      includeUSPParameters: { type: Boolean, default: true },
      showMarkColumn: { type: Boolean, default: true }
    },
    concentrationSettings: {
      defaultUnit: { type: String, default: 'mg/L' },
      availableUnits: { type: [String], default: ['mg/L', 'μg/mL', 'ppm', '%'] },
      showUnitColumn: { type: Boolean, default: true }
    }
  },
  peaks: [PeakSchema],
  systemSuitability: {
    resolution: { type: Number },
    efficiency: { type: Number },
    asymmetry: { type: Number },
    repeatability: { type: Number }
  },
  instrumentSettings: {
    column: { type: String },
    mobile_phase: { type: String },
    flow_rate: { type: Number },
    injection_volume: { type: Number },
    detection_wavelength: { type: Number },
    temperature: { type: Number }
  },

  // New comprehensive fields for report metadata
  projectName: { type: String },
  reportTitle: { type: String },
  reportMethodId: { type: String },
  reportedBy: { type: String },
  sampleSetName: { type: String },
  sampleType: { type: String },
  vialNumber: { type: String },
  level: { type: String },
  dateAcquired: { type: Date },
  acquiredBy: { type: String },
  dateProcessed: { type: Date },
  processedBy: { type: String },
  dataFilename: { type: String },
  methodFilename: { type: String },
  batchFilename: { type: String },
  acqMethodSet: { type: String },
  processingMethod: { type: String },
  channelDetector: { type: String },
  runTime: { type: Number },
  injectionVolume: { type: Number },
  injectionNumber: { type: Number },

  analysisDate: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  reportGenerated: {
    type: Boolean,
    default: false
  },
  lcmGenerated: {
    type: Boolean,
    default: false
  }
});

export default mongoose.models.HPLCData || mongoose.model<IHPLCData>('HPLCData', HPLCDataSchema);