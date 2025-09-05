import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all provider accounts for admin password management
export async function GET(req: NextRequest) {
  try {
    const providerAccounts = await prisma.providerAccount.findMany({
      where: { isActive: true },
      select: {
        id: true,
        providerId: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        role: true,
        lastLogin: true
      },
      orderBy: [
        { role: 'asc' }, // Providers first, then admins
        { firstName: 'asc' }
      ]
    });

    // Transform to match the expected format for the admin dropdown
    const providers = providerAccounts.map(account => ({
      id: account.providerId || account.id,
      name: account.displayName || `${account.firstName} ${account.lastName}`,
      email: account.email,
      role: account.role,
      lastLogin: account.lastLogin
    }));

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('Error fetching provider accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider accounts' },
      { status: 500 }
    );
  }
}