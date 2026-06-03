export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Complaint from '@/lib/models/Complaint';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const citizenId = searchParams.get('citizenId');

    const query = citizenId ? { citizenId } : {};
    
    // Fetch complaints sorted newest first
    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    const formatted = complaints.map(c => ({
      id: c._id.toString(),
      citizenId: c.citizenId,
      citizenName: c.citizenName,
      title: c.title,
      description: c.description,
      category: c.category,
      latitude: c.latitude,
      longitude: c.longitude,
      status: c.status,
      priority: c.priority,
      photoUrls: c.photoUrls,
      voiceNoteUrl: c.voiceNoteUrl,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      timeline: c.timeline,
      notes: c.notes,
      assignee: c.assignee,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch Complaints API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { citizenId, ...complaintData } = await request.json();

    if (!citizenId || !complaintData.title || !complaintData.description) {
      return NextResponse.json({ error: 'Citizen ID, title, and description are required' }, { status: 400 });
    }

    // Validate if it is within Rajapalayam bounds
    const lat = complaintData.latitude;
    const lng = complaintData.longitude;
    const isWithinRajapalayam = 
      lat >= 9.35 && lat <= 9.55 && 
      lng >= 77.45 && lng <= 77.65;

    if (!isWithinRajapalayam) {
      return NextResponse.json({ error: 'This application only supports reports within the Rajapalayam Constituency!' }, { status: 400 });
    }

    // Process and optimize photos
    // Process and optimize photos (strictly limited to max 5)
    const photoUrls: string[] = [];
    if (complaintData.photoUrls && Array.isArray(complaintData.photoUrls)) {
      const limitedPhotos = complaintData.photoUrls.slice(0, 5);
      for (const photo of limitedPhotos) {
        if (photo.startsWith('data:image/') || photo.length > 500) {
          // It's a base64 string, upload and optimize via Cloudinary (webp, compressed)
          const secureUrl = await uploadImageToCloudinary(photo);
          photoUrls.push(secureUrl);
        } else {
          // Already a URL or other string
          photoUrls.push(photo);
        }
      }
    }

    const complaint = new Complaint({
      citizenId,
      citizenName: complaintData.citizenName,
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      latitude: complaintData.latitude,
      longitude: complaintData.longitude,
      status: 'open',
      priority: complaintData.priority,
      photoUrls,
      voiceNoteUrl: complaintData.voiceNoteUrl,
      timeline: [
        {
          timestamp: new Date().toISOString(),
          status: 'open',
          note: 'Complaint registered',
        },
      ],
      notes: '',
    });

    await complaint.save();

    return NextResponse.json({
      id: complaint._id.toString(),
      citizenId: complaint.citizenId,
      citizenName: complaint.citizenName,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      status: complaint.status,
      priority: complaint.priority,
      photoUrls: complaint.photoUrls,
      voiceNoteUrl: complaint.voiceNoteUrl,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      timeline: complaint.timeline,
      notes: complaint.notes,
      assignee: complaint.assignee,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create Complaint API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
