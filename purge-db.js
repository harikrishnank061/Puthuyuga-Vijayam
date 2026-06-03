const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dns = require('dns');

// Force custom DNS to resolve Srv records on local networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

// Read env file
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found at', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/^MONGODB_URI=(.*)$/m);
if (!match || !match[1]) {
  console.error('Error: MONGODB_URI not found in .env.local');
  process.exit(1);
}

let uri = match[1].trim();

// Automatically URL-encode password if it contains special characters
if (uri.includes('@')) {
  const schemePrefix = uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
  const credentialsAndHost = uri.slice(schemePrefix.length);
  const lastAtIndex = credentialsAndHost.lastIndexOf('@');
  
  if (lastAtIndex !== -1) {
    const credentials = credentialsAndHost.slice(0, lastAtIndex);
    const hostAndQuery = credentialsAndHost.slice(lastAtIndex + 1);
    
    const colonIndex = credentials.indexOf(':');
    if (colonIndex !== -1) {
      const username = credentials.slice(0, colonIndex);
      const password = credentials.slice(colonIndex + 1);
      
      const encodedPassword = encodeURIComponent(decodeURIComponent(password)); 
      uri = `${schemePrefix}${username}:${encodedPassword}@${hostAndQuery}`;
    }
  }
}

async function purgeDatabase() {
  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected successfully!');

    // Initialize models
    const CitizenSchema = new mongoose.Schema({}, { strict: false });
    const ComplaintSchema = new mongoose.Schema({}, { strict: false });
    const NotificationSchema = new mongoose.Schema({}, { strict: false });

    const Citizen = mongoose.models.Citizen || mongoose.model('Citizen', CitizenSchema);
    const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
    const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

    // Delete collections
    console.log('Purging database collections...');
    
    const citizenDelete = await Citizen.deleteMany({});
    console.log(`🧹 Deleted ${citizenDelete.deletedCount} Citizen records.`);

    const complaintDelete = await Complaint.deleteMany({});
    console.log(`🧹 Deleted ${complaintDelete.deletedCount} Complaint records.`);

    const notificationDelete = await Notification.deleteMany({});
    console.log(`🧹 Deleted ${notificationDelete.deletedCount} Notification records.`);

    console.log('\n✨ Database fully cleared!');
  } catch (error) {
    console.error('❌ Error during purge:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

purgeDatabase();
