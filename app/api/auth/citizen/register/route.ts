import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Citizen from '@/lib/models/Citizen';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name, mobileNumber, password } = await request.json();

    if (!name || !mobileNumber || !password) {
      return NextResponse.json({ error: 'Name, mobile number, and password are required' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    // Check if mobile number already exists
    const existing = await Citizen.findOne({ mobileNumber });
    if (existing) {
      return NextResponse.json({ error: 'Mobile number already registered' }, { status: 400 });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const citizen = new Citizen({
      name,
      mobileNumber,
      password: hashedPassword,
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
