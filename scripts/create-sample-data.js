const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kashiffareed2023_db_user:DMVRAAD9Z8avhKbn@main.82yfwpj.mongodb.net/hplc-reports?retryWrites=true&w=majority';

// Schemas
const HPLCDataSchema = new mongoose.Schema({
  sampleId: { type: String, required: true, unique: true },
  sampleName: { type: String, required: true },
  analystId: String,
  analystName: String,
  department: String,
  peaks: [{
    retentionTime: Number,
    area: Number,
    height: Number,
    concentration: Number,
    peakName: String
  }],
  systemSuitability: {
    resolution: Number,
    efficiency: Number,
    asymmetry: Number,
    repeatability: Number
  },
  instrumentSettings: {
    column: String,
    mobile_phase: String,
    flow_rate: Number,
    injection_volume: Number,
    detection_wavelength: Number,
    temperature: Number
  },
  analysisDate: Date,
  createdAt: { type: Date, default: Date.now },
  reportGenerated: { type: Boolean, default: false },
  lcmGenerated: { type: Boolean, default: false }
});

const AuditLogSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  action: String,
  sampleId: String,
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
  ipAddress: String
});

const HPLCData = mongoose.model('HPLCData', HPLCDataSchema);
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

async function createSampleData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Clear existing sample data
    await HPLCData.deleteMany({});
    await AuditLog.deleteMany({ action: { $in: ['data_uploaded', 'report_generated', 'lcm_generated'] } });

    // Sample HPLC Data 1: Caffeine Analysis
    const caffeineAnalysis = {
      sampleId: 'CAF001',
      sampleName: 'Caffeine Standard Solution',
      analystId: 'analyst_id_1',
      analystName: 'Dr. Sarah Johnson',
      department: 'Quality Control',
      peaks: [
        {
          retentionTime: 2.345,
          area: 1245678,
          height: 89234,
          concentration: 98.7,
          peakName: 'Caffeine'
        },
        {
          retentionTime: 4.567,
          area: 45123,
          height: 3245,
          concentration: 1.2,
          peakName: 'Impurity A'
        },
        {
          retentionTime: 6.789,
          area: 12456,
          height: 1234,
          concentration: 0.1,
          peakName: 'Impurity B'
        }
      ],
      systemSuitability: {
        resolution: 2.8,
        efficiency: 15234,
        asymmetry: 1.2,
        repeatability: 0.8
      },
      instrumentSettings: {
        column: 'C18, 250mm x 4.6mm, 5μm',
        mobile_phase: 'Water:Acetonitrile (70:30)',
        flow_rate: 1.0,
        injection_volume: 20,
        detection_wavelength: 254,
        temperature: 25
      },
      analysisDate: new Date('2024-01-15'),
      reportGenerated: true,
      lcmGenerated: true
    };

    // Sample HPLC Data 2: Pharmaceutical Assay
    const pharmaAssay = {
      sampleId: 'PHARM002',
      sampleName: 'Ibuprofen Tablet Extract',
      analystId: 'analyst_id_2',
      analystName: 'Dr. Michael Chen',
      department: 'Pharmaceutical Analysis',
      peaks: [
        {
          retentionTime: 8.234,
          area: 2345678,
          height: 156789,
          concentration: 199.8,
          peakName: 'Ibuprofen'
        },
        {
          retentionTime: 5.123,
          area: 23456,
          height: 2134,
          concentration: 0.2,
          peakName: 'Degradant'
        }
      ],
      systemSuitability: {
        resolution: 3.2,
        efficiency: 18567,
        asymmetry: 1.1,
        repeatability: 0.5
      },
      instrumentSettings: {
        column: 'C18, 150mm x 4.6mm, 3.5μm',
        mobile_phase: 'Phosphate Buffer:Methanol (40:60)',
        flow_rate: 1.2,
        injection_volume: 10,
        detection_wavelength: 220,
        temperature: 30
      },
      analysisDate: new Date('2024-01-20'),
      reportGenerated: true,
      lcmGenerated: false
    };

    // Sample HPLC Data 3: Environmental Sample
    const envSample = {
      sampleId: 'ENV003',
      sampleName: 'Groundwater Pesticide Analysis',
      analystId: 'analyst_id_3',
      analystName: 'Dr. Lisa Rodriguez',
      department: 'Environmental Testing',
      peaks: [
        {
          retentionTime: 12.456,
          area: 567890,
          height: 45678,
          concentration: 2.5,
          peakName: 'Atrazine'
        },
        {
          retentionTime: 15.789,
          area: 234567,
          height: 23456,
          concentration: 1.8,
          peakName: 'Simazine'
        },
        {
          retentionTime: 18.123,
          area: 123456,
          height: 12345,
          concentration: 0.9,
          peakName: 'Metolachlor'
        },
        {
          retentionTime: 20.567,
          area: 87654,
          height: 8765,
          concentration: 0.3,
          peakName: 'Alachlor'
        }
      ],
      systemSuitability: {
        resolution: 2.5,
        efficiency: 12345,
        asymmetry: 1.3,
        repeatability: 1.2
      },
      instrumentSettings: {
        column: 'C18, 250mm x 4.6mm, 5μm',
        mobile_phase: 'Water:Acetonitrile Gradient',
        flow_rate: 0.8,
        injection_volume: 50,
        detection_wavelength: 230,
        temperature: 35
      },
      analysisDate: new Date('2024-01-25'),
      reportGenerated: false,
      lcmGenerated: false
    };

    // Sample HPLC Data 4: Food Analysis
    const foodSample = {
      sampleId: 'FOOD004',
      sampleName: 'Vitamin C in Orange Juice',
      analystId: 'analyst_id_4',
      analystName: 'Dr. Ahmed Hassan',
      department: 'Food Safety',
      peaks: [
        {
          retentionTime: 3.789,
          area: 1876543,
          height: 123456,
          concentration: 58.9,
          peakName: 'Ascorbic Acid'
        },
        {
          retentionTime: 7.234,
          area: 45678,
          height: 4567,
          concentration: 1.5,
          peakName: 'Citric Acid'
        }
      ],
      systemSuitability: {
        resolution: 4.1,
        efficiency: 20123,
        asymmetry: 0.9,
        repeatability: 0.3
      },
      instrumentSettings: {
        column: 'C18, 150mm x 4.6mm, 3μm',
        mobile_phase: '0.1% TFA in Water',
        flow_rate: 0.6,
        injection_volume: 5,
        detection_wavelength: 245,
        temperature: 20
      },
      analysisDate: new Date('2024-01-30'),
      reportGenerated: true,
      lcmGenerated: true
    };

    // Sample HPLC Data 5: Protein Analysis
    const proteinSample = {
      sampleId: 'PROT005',
      sampleName: 'Monoclonal Antibody Purity',
      analystId: 'analyst_id_5',
      analystName: 'Dr. Jennifer Park',
      department: 'Biotechnology',
      peaks: [
        {
          retentionTime: 14.567,
          area: 3456789,
          height: 234567,
          concentration: 96.8,
          peakName: 'Main Peak'
        },
        {
          retentionTime: 16.234,
          area: 78901,
          height: 7890,
          concentration: 2.1,
          peakName: 'Aggregate'
        },
        {
          retentionTime: 11.789,
          area: 34567,
          height: 3456,
          concentration: 1.1,
          peakName: 'Fragment'
        }
      ],
      systemSuitability: {
        resolution: 1.8,
        efficiency: 8965,
        asymmetry: 1.4,
        repeatability: 2.1
      },
      instrumentSettings: {
        column: 'SEC, 300mm x 7.8mm',
        mobile_phase: 'Phosphate Buffer pH 7.0',
        flow_rate: 0.5,
        injection_volume: 25,
        detection_wavelength: 280,
        temperature: 25
      },
      analysisDate: new Date('2024-02-05'),
      reportGenerated: false,
      lcmGenerated: false
    };

    // Insert sample data
    const samples = [caffeineAnalysis, pharmaAssay, envSample, foodSample, proteinSample];

    for (const sample of samples) {
      await HPLCData.create(sample);
      console.log(`✅ Created sample: ${sample.sampleName} (${sample.sampleId})`);
    }

    // Create audit log entries
    const auditEntries = [
      {
        userId: 'analyst_id_1',
        userName: 'Dr. Sarah Johnson',
        action: 'data_uploaded',
        sampleId: 'CAF001',
        details: { peakCount: 3, method: 'manual_entry' },
        timestamp: new Date('2024-01-15T09:30:00Z')
      },
      {
        userId: 'analyst_id_1',
        userName: 'Dr. Sarah Johnson',
        action: 'report_generated',
        sampleId: 'CAF001',
        details: { format: 'pdf' },
        timestamp: new Date('2024-01-15T10:45:00Z')
      },
      {
        userId: 'analyst_id_1',
        userName: 'Dr. Sarah Johnson',
        action: 'lcm_generated',
        sampleId: 'CAF001',
        details: { fileSize: 2048 },
        timestamp: new Date('2024-01-15T11:00:00Z')
      },
      {
        userId: 'analyst_id_2',
        userName: 'Dr. Michael Chen',
        action: 'data_uploaded',
        sampleId: 'PHARM002',
        details: { peakCount: 2, method: 'csv_upload' },
        timestamp: new Date('2024-01-20T14:20:00Z')
      },
      {
        userId: 'analyst_id_2',
        userName: 'Dr. Michael Chen',
        action: 'report_generated',
        sampleId: 'PHARM002',
        details: { format: 'pdf' },
        timestamp: new Date('2024-01-20T15:30:00Z')
      },
      {
        userId: 'analyst_id_3',
        userName: 'Dr. Lisa Rodriguez',
        action: 'data_uploaded',
        sampleId: 'ENV003',
        details: { peakCount: 4, method: 'manual_entry' },
        timestamp: new Date('2024-01-25T11:15:00Z')
      },
      {
        userId: 'analyst_id_4',
        userName: 'Dr. Ahmed Hassan',
        action: 'data_uploaded',
        sampleId: 'FOOD004',
        details: { peakCount: 2, method: 'excel_upload' },
        timestamp: new Date('2024-01-30T08:45:00Z')
      },
      {
        userId: 'analyst_id_4',
        userName: 'Dr. Ahmed Hassan',
        action: 'report_generated',
        sampleId: 'FOOD004',
        details: { format: 'pdf' },
        timestamp: new Date('2024-01-30T09:30:00Z')
      },
      {
        userId: 'analyst_id_4',
        userName: 'Dr. Ahmed Hassan',
        action: 'lcm_generated',
        sampleId: 'FOOD004',
        details: { fileSize: 1536 },
        timestamp: new Date('2024-01-30T10:00:00Z')
      },
      {
        userId: 'analyst_id_5',
        userName: 'Dr. Jennifer Park',
        action: 'data_uploaded',
        sampleId: 'PROT005',
        details: { peakCount: 3, method: 'manual_entry' },
        timestamp: new Date('2024-02-05T16:20:00Z')
      }
    ];

    for (const entry of auditEntries) {
      await AuditLog.create(entry);
    }

    console.log(`✅ Created ${auditEntries.length} audit log entries`);

    console.log('\n🎉 Sample data created successfully!');
    console.log('\n📊 Summary:');
    console.log('- 5 HPLC samples with realistic data');
    console.log('- Various analysis types: Pharmaceutical, Environmental, Food, Biotechnology');
    console.log('- Peak data with retention times, areas, heights, and concentrations');
    console.log('- System suitability parameters');
    console.log('- Instrument settings');
    console.log('- Complete audit trail');
    console.log('\n🔬 Sample Types:');
    console.log('1. CAF001 - Caffeine Standard (3 peaks) ✅ PDF ✅ LCM');
    console.log('2. PHARM002 - Ibuprofen Tablet (2 peaks) ✅ PDF');
    console.log('3. ENV003 - Pesticide Analysis (4 peaks)');
    console.log('4. FOOD004 - Vitamin C Analysis (2 peaks) ✅ PDF ✅ LCM');
    console.log('5. PROT005 - Protein Purity (3 peaks)');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup
createSampleData();