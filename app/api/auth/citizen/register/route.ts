import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Citizen from '@/lib/models/Citizen';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name, mobileNumber } = await request.json();

    if (!name || !mobileNumber) {
      return NextResponse.json({ error: 'Name and mobile number are required' }, { status: 400 });
    }

    // Check if mobile number already exists
    const existing = await Citizen.findOne({ mobileNumber });
    if (existing) {
      return NextResponse.json({ error: 'Mobile number already registered' }, { status: 400 });
    }

    const citizen = new Citizen({
      name,
      mobileNumber,
    });

    await citizen.save();

    return NextResponse.json({
      id: citizen._id.toString(),
      name: citizen.name,
      mobileNumber: citizen.mobileNumber,
      registeredAt: citizen.registeredAt,
    });
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
