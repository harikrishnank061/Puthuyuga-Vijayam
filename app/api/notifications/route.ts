export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Notification from '@/lib/models/Notification';
import Complaint from '@/lib/models/Complaint';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const citizenId = searchParams.get('citizenId');

    let query = {};
    if (citizenId) {
      // Find all complaints for this citizen
      const complaints = await Complaint.find({ citizenId }).select('_id');
      const complaintIds = complaints.map(c => c._id.toString());
      query = { complaintId: { $in: complaintIds } };
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    const formatted = notifications.map(n => ({
      id: n._id.toString(),
      complaintId: n.complaintId,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch Notifications API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { complaintId, message, type } = await request.json();

    if (!complaintId || !message || !type) {
      return NextResponse.json({ error: 'Complaint ID, message, and type are required' }, { status: 400 });
    }

    const notification = new Notification({
      complaintId,
      message,
      type,
    });

    await notification.save();

    return NextResponse.json({
      id: notification._id.toString(),
      complaintId: notification.complaintId,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create Notification API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    notification.read = true;
    await notification.save();

    return NextResponse.json({
      id: notification._id.toString(),
      complaintId: notification.complaintId,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt,
    });
  } catch (error: any) {
    console.error('Mark Notification Read API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
