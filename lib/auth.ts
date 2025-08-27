import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'boondocks-provider-secret-2024';

export interface AuthUser {
  providerId?: string;
  customerId?: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export function getAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      providerId: decoded.providerId,
      customerId: decoded.customerId,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    };
  } catch {
    return null;
  }
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  const token = getAuthToken(req);
  if (!token) return null;
  return verifyToken(token);
}

export function requireProviderAuth(req: NextRequest): AuthUser {
  const user = getAuthUser(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  if (user.role !== 'provider' && user.role !== 'admin') {
    throw new Error('Provider access required');
  }
  return user;
}

export function requireAdminAuth(req: NextRequest): AuthUser {
  const user = getAuthUser(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}

export function requireCustomerAuth(req: NextRequest): AuthUser {
  const user = getAuthUser(req);
  if (!user) {
    throw new Error('Authentication required');
  }
  if (user.role !== 'customer') {
    throw new Error('Customer access required');
  }
  return user;
}