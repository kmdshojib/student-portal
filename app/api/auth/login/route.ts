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
    const { email, password } = body ?? {};
    if (!email || !password) {
      return NextResponse.json({ message: 'email and password are required' }, { status: 400 });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    if (!JWT_SECRET) {
      return NextResponse.json({ message: 'JWT secret not configured' }, { status: 500 });
    }

    // Generate the token using jose
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({ id: admin._id.toString() })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // Create response and set cookie with the JWT token
    const response = NextResponse.json(
      {
        token,
        admin: { id: admin._id, name: admin.name, email: admin.email, createdAt: admin.createdAt },
      },
      { status: 200 }
    );

    response.cookies.set('sessionToken', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err) {
    return NextResponse.json({ message: 'Server error', error: (err as Error).message }, { status: 500 });
  }
}