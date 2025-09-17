const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kashiffareed2023_db_user:DMVRAAD9Z8avhKbn@main.82yfwpj.mongodb.net/hplc-reports?retryWrites=true&w=majority';

// Define schemas (simplified versions)
const hplcDataSchema = new mongoose.Schema({
  sampleId: String,
  sampleName: String,
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

async function createTestSample() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

    const HPLCData = mongoose.model('HPLCData', hplcDataSchema);

    // Create a comprehensive test sample
    const testSample = {
      sampleId: 'TEST001',
      sampleName: 'Admin Configuration Test Sample',
      analystName: 'Test Analyst',
      department: 'Quality Control',
      peaks: [
        {
          retentionTime: 2.145,
          area: 1456789,
          height: 98456,
          concentration: 99.2,
          peakName: 'Main Compound'
        },
        {
          retentionTime: 3.987,
          area: 23456,
          height: 3421,
          concentration: 0.6,
          peakName: 'Impurity A'
        },
        {
          retentionTime: 5.234,
          area: 12345,
          height: 1876,
          concentration: 0.2,
          peakName: 'Impurity B'
        }
      ],
      systemSuitability: {
        resolution: 2.4,
        efficiency: 8765,
        asymmetry: 1.1,
        repeatability: 0.5
      },
      instrumentSettings: {
        column: 'C18, 4.6 x 250 mm, 5 μm',
        mobile_phase: 'Water:Acetonitrile (65:35)',
        flow_rate: 1.2,
        injection_volume: 20,
        detection_wavelength: 254,
        temperature: 25
      },
      analysisDate: new Date(),
      reportGenerated: false,
      lcmGenerated: false
    };

    // Check if sample already exists
    const existingSample = await HPLCData.findOne({ sampleId: 'TEST001' });
    if (existingSample) {
      console.log('Updating existing test sample...');
      await HPLCData.findByIdAndUpdate(existingSample._id, testSample);
      console.log('✅ Test sample updated successfully');
    } else {
      console.log('Creating new test sample...');
      await HPLCData.create(testSample);
      console.log('✅ Test sample created successfully');
    }

    console.log('\n📊 Test Sample Details:');
    console.log(`Sample ID: ${testSample.sampleId}`);
    console.log(`Sample Name: ${testSample.sampleName}`);
    console.log(`Peaks: ${testSample.peaks.length}`);
    console.log(`System Suitability: All parameters included`);
    console.log(`Instrument Settings: Complete configuration`);

    console.log('\n🔬 Peak Information:');
    testSample.peaks.forEach((peak, index) => {
      console.log(`  Peak ${index + 1}: ${peak.peakName} (RT: ${peak.retentionTime} min, Area: ${peak.area.toLocaleString()}, Conc: ${peak.concentration} mg/L)`);
    });

    console.log('\n⚙️ Instrument Settings:');
    console.log(`  Column: ${testSample.instrumentSettings.column}`);
    console.log(`  Mobile Phase: ${testSample.instrumentSettings.mobile_phase}`);
    console.log(`  Flow Rate: ${testSample.instrumentSettings.flow_rate} mL/min`);
    console.log(`  Detection: ${testSample.instrumentSettings.detection_wavelength} nm`);
    console.log(`  Temperature: ${testSample.instrumentSettings.temperature} °C`);

    console.log('\n📈 System Suitability:');
    console.log(`  Resolution: ${testSample.systemSuitability.resolution}`);
    console.log(`  Efficiency: ${testSample.systemSuitability.efficiency} plates`);
    console.log(`  Asymmetry: ${testSample.systemSuitability.asymmetry}`);
    console.log(`  Repeatability: ${testSample.systemSuitability.repeatability}%`);

    console.log('\n🎯 This sample is ready for testing:');
    console.log('  - Admin configuration functionality');
    console.log('  - PDF report generation');
    console.log('  - LCM file export');
    console.log('  - Preview consistency');
    console.log('  - Field configuration effects');

  } catch (error) {
    console.error('❌ Error creating test sample:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createTestSample();