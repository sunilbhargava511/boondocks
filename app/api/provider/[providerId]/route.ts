import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get provider information by provider ID (public access for calendar viewing)
export async function GET(
  req: NextRequest,
  { params }: { params: { providerId: string } }
) {
  try {
    const { providerId } = await params;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Find provider by providerId (this is the public-facing identifier)
    const provider = await prisma.providerAccount.findFirst({
      where: { 
        providerId: providerId,
        isActive: true
      },
      select: {
        providerId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        displayName: true,
        avatarInitials: true,
        bio: true,
        specialNotes: true,
        notAcceptingNewClients: true,
        cashOnly: true,
        noKidsUnder: true,
        conversationPreference: true,
        lastLogin: true,
        availability: {
          select: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true
          }
        }
      }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Generate avatar initials if not set
    if (!provider.avatarInitials) {
      provider.avatarInitials = `${provider.firstName.charAt(0)}${provider.lastName.charAt(0)}`.toUpperCase();
    }

    // Use display name if available, otherwise use first name
    const displayInfo = {
      ...provider,
      displayName: provider.displayName || provider.firstName,
    };

    return NextResponse.json({
      provider: displayInfo,
      success: true
    });

  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}