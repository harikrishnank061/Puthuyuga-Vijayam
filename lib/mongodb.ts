import dns from 'dns';

// Force Google & Cloudflare DNS servers to resolve Node.js DNS Srv lookup failures on local BSNL broadband connections
// Skip this on Vercel deployment to avoid network resolution issues in production serverless containers
if (!process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    if (typeof dns.setDefaultResultOrder === 'function') {
      dns.setDefaultResultOrder('ipv4first');
    }
  } catch (error) {
    console.warn('Could not set custom DNS servers, falling back:', error);
  }
}

import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    let MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    // Automatically URL-encode password if it contains special characters (like '@') to prevent connection failures
    if (MONGODB_URI.includes('@')) {
      const schemePrefix = MONGODB_URI.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
      const credentialsAndHost = MONGODB_URI.slice(schemePrefix.length);
      const lastAtIndex = credentialsAndHost.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        const credentials = credentialsAndHost.slice(0, lastAtIndex);
        const hostAndQuery = credentialsAndHost.slice(lastAtIndex + 1);
        
        const colonIndex = credentials.indexOf(':');
        if (colonIndex !== -1) {
          const username = credentials.slice(0, colonIndex);
          const password = credentials.slice(colonIndex + 1);
          
          // Safe URL-encode to handle special symbols in credentials
          const encodedPassword = encodeURIComponent(decodeURIComponent(password)); 
          MONGODB_URI = `${schemePrefix}${username}:${encodedPassword}@${hostAndQuery}`;
        }
      }
    }

    const opts = {
      bufferCommands: false,
      family: 4, // Force IPv4 to prevent connection hangs on VPNs / dual-stack networks
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
