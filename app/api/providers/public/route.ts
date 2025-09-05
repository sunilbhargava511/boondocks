import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all active providers for public booking page
export async function GET(req: NextRequest) {
  try {
    // Check if SimplyBook sync is enabled
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });
    
    // If SimplyBook sync is enabled, we could fetch from SimplyBook API here
    // For now, we'll always use database data
    
    const providers = await prisma.providerAccount.findMany({
      where: { 
        isActive: true 
      },
      select: {
        id: true,
        providerId: true,
        firstName: true,
        lastName: true,
        displayName: true,
        bio: true,
        avatarInitials: true,
        notAcceptingNewClients: true,
        cashOnly: true,
        noKidsUnder: true,
        conversationPreference: true,
        specialNotes: true,
        availability: true
      },
      orderBy: [
        { role: 'desc' }, // Admin (Michelle) last
        { firstName: 'asc' }
      ]
    });
    
    // Transform to match the expected format
    const transformedProviders = providers.map(provider => ({
      id: provider.providerId,
      name: provider.displayName || `${provider.firstName} ${provider.lastName}`,
      firstName: provider.firstName,
      lastName: provider.lastName,
      description: provider.bio || '',
      notes: provider.specialNotes || '',
      avatarInitials: provider.avatarInitials,
      availability: provider.availability ? {
        monday: provider.availability.monday,
        tuesday: provider.availability.tuesday,
        wednesday: provider.availability.wednesday,
        thursday: provider.availability.thursday,
        friday: provider.availability.friday,
        saturday: provider.availability.saturday,
        sunday: provider.availability.sunday
      } : {},
      restrictions: {
        notAcceptingNewClients: provider.notAcceptingNewClients,
        cashOnly: provider.cashOnly,
        noKidsUnder: provider.noKidsUnder,
        conversationPreference: provider.conversationPreference
      }
    }));
    
    return NextResponse.json({ 
      providers: transformedProviders,
      source: settings?.simplybookSyncEnabled ? 'simplybook' : 'database'
    });
  } catch (error) {
    console.error('Error fetching public providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}