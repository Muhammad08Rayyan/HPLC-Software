import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import User, { IUser } from '@/models/User';
import connectDB from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch {
    return null;
  }
}

export async function getUser(request: NextRequest): Promise<IUser | null> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  await connectDB();
  return User.findById(decoded.userId);
}

export function requireAuth(allowedRoles?: string[]) {
  return async (request: NextRequest, user: IUser | null) => {
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return new Response('Forbidden', { status: 403 });
    }

    return null;
  };
}