import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Get all provider accounts (admin only)
export async function GET(req: NextRequest) {
  try {
    const providers = await prisma.providerAccount.findMany({
      select: {
        id: true,
        providerId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        role: true,
        lastLogin: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

// Create a new provider account
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validate required fields
    if (!data.providerId || !data.email || !data.password || !data.firstName || !data.lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if provider ID or email already exists
    const existing = await prisma.providerAccount.findFirst({
      where: {
        OR: [
          { providerId: data.providerId },
          { email: data.email.toLowerCase() }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Provider account already exists with this ID or email' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create provider account
    const provider = await prisma.providerAccount.create({
      data: {
        providerId: data.providerId,
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role || 'provider',
        isActive: true
      },
      select: {
        id: true,
        providerId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    console.error('Error creating provider account:', error);
    return NextResponse.json(
      { error: 'Failed to create provider account' },
      { status: 500 }
    );
  }
}

// Update provider account
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    // Only update provided fields
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.role) updateData.role = data.role;

    // If password is being changed
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const provider = await prisma.providerAccount.update({
      where: { providerId: data.providerId },
      data: updateData,
      select: {
        id: true,
        providerId: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        role: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Error updating provider account:', error);
    return NextResponse.json(
      { error: 'Failed to update provider account' },
      { status: 500 }
    );
  }
}