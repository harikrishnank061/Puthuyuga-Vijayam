import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Citizen from '@/lib/models/Citizen';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { mobileNumber } = await request.json();

    if (!mobileNumber) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    const citizen = await Citizen.findOne({ mobileNumber });
    if (!citizen) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 404 });
    }

    return NextResponse.json({
      id: citizen._id.toString(),
      name: citizen.name,
      mobileNumber: citizen.mobileNumber,
      registeredAt: citizen.registeredAt,
    });
  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
