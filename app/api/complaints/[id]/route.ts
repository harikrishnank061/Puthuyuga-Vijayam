import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Complaint from '@/lib/models/Complaint';
import Notification from '@/lib/models/Notification';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const { status, adminName, note, assignee } = body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    if (status) {
      if (status === 'assigned' && (!assignee || !assignee.trim())) {
        return NextResponse.json({ error: 'Assignee name is required when status is assigned' }, { status: 400 });
      }

      complaint.status = status;
      
      // Append status change to timeline
      complaint.timeline.push({
        timestamp: new Date().toISOString(),
        status,
        note: note || `Status updated to ${status}`,
        adminName: adminName || 'ADMIN',
      });
    }

    if (assignee !== undefined) {
      complaint.assignee = assignee;
    }

    if (note && !status) {
      complaint.notes = note;
    }

    complaint.updatedAt = new Date().toISOString();

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
    });
  } catch (error: any) {
    console.error('Update Complaint API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    // Delete associated notifications first
    await Notification.deleteMany({ complaintId: id });

    // Delete the complaint
    const complaint = await Complaint.findByIdAndDelete(id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Complaint and associated notifications deleted successfully' });
  } catch (error: any) {
    console.error('Delete Complaint API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

