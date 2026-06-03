export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Citizen from '@/lib/models/Citizen';

export async function GET() {
  try {
    await connectToDatabase();
    const citizens = await Citizen.find({}).sort({ registeredAt: -1 });

    const formatted = citizens.map(c => ({
      id: c._id.toString(),
      name: c.name,
      mobileNumber: c.mobileNumber,
      registeredAt: c.registeredAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Fetch Citizens API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Citizen ID is required' }, { status: 400 });
    }

    const citizen = await Citizen.findByIdAndDelete(id);
    if (!citizen) {
      return NextResponse.json({ error: 'Citizen not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Citizen deleted successfully' });
  } catch (error: any) {
    console.error('Delete Citizen API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
