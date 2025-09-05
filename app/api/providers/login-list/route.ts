import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all active providers for login page (no sensitive data)
export async function GET(req: NextRequest) {
  try {
    const providers = await prisma.providerAccount.findMany({
      where: { 
        isActive: true 
      },
      select: {
        id: true,
        providerId: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatarInitials: true,
        role: true,
        lastLogin: true
      },
      orderBy: [
        { role: 'asc' }, // Providers first, then admins
        { firstName: 'asc' }
      ]
    });

    // Transform to safe format for login page
    const loginProviders = providers.map(provider => ({
      id: provider.providerId,
      email: provider.email,
      name: provider.displayName || `${provider.firstName} ${provider.lastName}`,
      firstName: provider.firstName,
      lastName: provider.lastName,
      initials: provider.avatarInitials || provider.firstName.charAt(0) + provider.lastName.charAt(0),
      role: provider.role,
      lastLogin: provider.lastLogin
    }));

    return NextResponse.json({ providers: loginProviders });
  } catch (error) {
    console.error('Error fetching login providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}