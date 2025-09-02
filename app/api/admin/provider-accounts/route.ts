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
        provider_id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        lastLogin: true
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    // Transform to match the expected format for the admin dropdown
    const providers = providerAccounts.map(account => ({
      id: account.provider_id || account.id,
      name: `${account.firstName} ${account.lastName}`,
      email: account.email,
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