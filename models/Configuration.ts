import mongoose, { Schema, Document } from 'mongoose';

export interface IConfiguration extends Document {
  userId: string;
  department?: string;
  peakConfig: {
    defaultCount: number;
    minCount: number;
    maxCount: number;
    enableRange: boolean;
  };
  fieldConfig: {
    enableArea: boolean;
    enableHeight: boolean;
    enableConcentration: boolean;
    areaLabel: string;
    heightLabel: string;
    concentrationLabel: string;
  };
  detectorSettings: {
    wavelength?: number;
    flowRate?: number;
    temperature?: number;
    defaultUnits?: string;
  };
  reportTemplate: {
    title: string;
    includeSystemSuitability: boolean;
    includePeakTable: boolean;
    includeGraph: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ConfigurationSchema = new Schema<IConfiguration>({
  userId: {
    type: String,
    required: true
  },
  department: {
    type: String
  },
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
    areaLabel: { type: String, default: 'Area' },
    heightLabel: { type: String, default: 'Height' },
    concentrationLabel: { type: String, default: 'Concentration' }
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
    includeGraph: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Configuration || mongoose.model<IConfiguration>('Configuration', ConfigurationSchema);