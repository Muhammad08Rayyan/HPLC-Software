const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kashiffareed2023_db_user:DMVRAAD9Z8avhKbn@main.82yfwpj.mongodb.net/hplc-reports?retryWrites=true&w=majority';

async function resetDemo() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Clear all collections except Users
    const collections = await mongoose.connection.db.listCollections().toArray();

    for (const collection of collections) {
      if (collection.name !== 'users') {
        await mongoose.connection.db.collection(collection.name).deleteMany({});
        console.log(`✅ Cleared collection: ${collection.name}`);
      }
    }

    console.log('\n🔄 Demo reset complete!');
    console.log('Run the following to restore demo data:');
    console.log('  node scripts/create-sample-data.js');

  } catch (error) {
    console.error('❌ Error resetting demo:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetDemo();