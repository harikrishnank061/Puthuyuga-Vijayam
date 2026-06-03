import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Citizen from '@/lib/models/Citizen';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { mobileNumber, password } = await request.json();

    if (!mobileNumber) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const citizen = await Citizen.findOne({ mobileNumber });
    if (!citizen) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 404 });
    }

    // Handle legacy users who registered before password was required
    if (!citizen.password) {
      return NextResponse.json(
        { error: 'This account was created before password support. Please register again with a password.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, citizen.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
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
