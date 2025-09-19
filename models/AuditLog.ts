import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: string;
  userName: string;
  action: 'report_generated' | 'lcm_generated' | 'data_uploaded' | 'config_changed' | 'login' | 'logout' | 'department_created' | 'department_updated' | 'department_deleted';
  sampleId?: string;
  details: any;
  timestamp: Date;
  ipAddress?: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['report_generated', 'lcm_generated', 'data_uploaded', 'config_changed', 'login', 'logout', 'department_created', 'department_updated', 'department_deleted'],
    required: true
  },
  sampleId: {
    type: String
  },
  details: {
    type: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  }
});

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);