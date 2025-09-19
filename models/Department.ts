import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  config?: {
    peakConfig?: {
      defaultCount: number;
      maxCount: number;
    };
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
      defaultUnits: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      peakConfig: {
        defaultCount: 5,
        maxCount: 20
      },
      fieldConfig: {
        enableArea: true,
        enableHeight: true,
        enableConcentration: true,
        areaLabel: 'Area',
        heightLabel: 'Height',
        concentrationLabel: 'Conc.'
      },
      detectorSettings: {
        wavelength: 210,
        defaultUnits: 'mV'
      }
    }
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

// Middleware to mark config as modified when it changes (required for Mixed type)
DepartmentSchema.pre('save', function() {
  if (this.isModified('config')) {
    this.markModified('config');
  }
});

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);