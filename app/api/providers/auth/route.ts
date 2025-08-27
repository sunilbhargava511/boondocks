import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'boondocks-provider-secret-2024';

// Login endpoint
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find provider account
    const provider = await prisma.providerAccount.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!provider || !provider.isActive) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, provider.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.providerAccount.update({
      where: { id: provider.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        providerId: provider.providerId,
        email: provider.email,
        role: provider.role,
        firstName: provider.firstName,
        lastName: provider.lastName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return provider data (without password)
    const { passwordHash, ...providerData } = provider;

    return NextResponse.json({
      token,
      provider: providerData
    });
  } catch (error) {
    console.error('Provider login error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate' },
      { status: 500 }
    );
  }
}

// Verify token endpoint
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Get updated provider data
      const provider = await prisma.providerAccount.findUnique({
        where: { providerId: decoded.providerId },
        select: {
          id: true,
          providerId: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          role: true,
          lastLogin: true
        }
      });

      if (!provider || !provider.isActive) {
        return NextResponse.json(
          { error: 'Account not found or inactive' },
          { status: 401 }
        );
      }

      return NextResponse.json({ provider });
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}