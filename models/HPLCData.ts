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