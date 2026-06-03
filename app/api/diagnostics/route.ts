export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// Configure Cloudinary explicitly for verification
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET() {
  const diagnostics: {
    status: 'ok' | 'error';
    mongodb: { status: 'connected' | 'failed'; host?: string; database?: string; error?: string };
    cloudinary: { status: 'authenticated' | 'failed'; cloudName?: string; error?: string };
  } = {
    status: 'ok',
    mongodb: { status: 'failed' },
    cloudinary: { status: 'failed' },
  };

  // 1. Verify MongoDB Connection
  try {
    const conn = await connectToDatabase();
    if (mongoose.connection.readyState === 1) {
      diagnostics.mongodb = {
        status: 'connected',
        host: mongoose.connection.host,
        database: mongoose.connection.db?.databaseName,
      };
    } else {
      throw new Error(`Connection readyState is ${mongoose.connection.readyState}`);
    }
  } catch (error: any) {
    diagnostics.status = 'error';
    diagnostics.mongodb = {
      status: 'failed',
      error: error.message || 'Failed to establish connection to online MongoDB',
    };
  }

  // 2. Verify Cloudinary Configuration & Authentication
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials are incomplete in environment variables');
    }

    // Call Cloudinary API's ping method to check connectivity and keys
    const result = await cloudinary.api.ping();
    if (result.status === 'ok') {
      diagnostics.cloudinary = {
        status: 'authenticated',
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      };
    } else {
      throw new Error('Cloudinary ping returned non-ok status');
    }
  } catch (error: any) {
    diagnostics.status = 'error';
    diagnostics.cloudinary = {
      status: 'failed',
      error: error.message || 'Failed to authenticate with Cloudinary',
    };
  }

  return NextResponse.json(diagnostics, { status: diagnostics.status === 'ok' ? 200 : 500 });
}
