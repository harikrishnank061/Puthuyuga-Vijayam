import dns from 'dns';
import { execSync } from 'child_process';

// Dynamically extract system DNS servers on Windows to bypass Node c-ares defaulting to 127.0.0.1
if (!process.env.VERCEL) {
  try {
    let systemDns: string[] = [];
    if (process.platform === 'win32') {
      const output = execSync('powershell -Command "Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses -ne $null } | ForEach-Object { $_.ServerAddresses }"').toString().trim();
      if (output) {
        systemDns = output
          .split(/[\r\n\s,]+/)
          .map(s => s.trim())
          .filter(s => s && s !== '127.0.0.1' && s !== '::1');
      }
    }
    
    // Add public fallback DNS servers (like Google & Cloudflare) to the end of the list
    systemDns.push('8.8.8.8', '1.1.1.1', '8.8.4.4');
    
    // Deduplicate servers list
    const finalServers = Array.from(new Set(systemDns));
    dns.setServers(finalServers);
  } catch (error) {
    console.warn('Could not set system DNS servers, falling back to Node default:', error);
  }
}

if (typeof dns.setDefaultResultOrder === 'function') {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (error) {
    console.warn('Could not set default result order:', error);
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
