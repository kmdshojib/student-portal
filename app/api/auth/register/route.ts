import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import dbConnect from '@/db/db.config';
import Admin from '@/model/adminModel';

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();
    const { name, email, password } = body ?? {};
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: 'Email already registered' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email, password: hashed });

    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ id: admin._id.toString() })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    return NextResponse.json(
      {
        token,
        admin: { id: admin._id, name: admin.name, email: admin.email, createdAt: admin.createdAt },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ message: 'Server error', error: (err as Error).message }, { status: 500 });
  }
}