import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SimplyBookAPI } from '@/lib/simplybook-api';

const prisma = new PrismaClient();

// Get current sync settings
export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });
    
    if (!settings) {
      // Create default settings if they don't exist
      const newSettings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          simplybookSyncEnabled: false,
          autoSyncNewCustomers: false,
          autoSyncAppointments: false
        }
      });
      return NextResponse.json(newSettings);
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching sync settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync settings' },
      { status: 500 }
    );
  }
}

// Update sync settings
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        simplybookSyncEnabled: data.simplybookSyncEnabled ?? undefined,
        autoSyncNewCustomers: data.autoSyncNewCustomers ?? undefined,
        autoSyncAppointments: data.autoSyncAppointments ?? undefined,
        updatedAt: new Date()
      },
      create: {
        id: 'default',
        simplybookSyncEnabled: data.simplybookSyncEnabled ?? false,
        autoSyncNewCustomers: data.autoSyncNewCustomers ?? false,
        autoSyncAppointments: data.autoSyncAppointments ?? false
      }
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating sync settings:', error);
    return NextResponse.json(
      { error: 'Failed to update sync settings' },
      { status: 500 }
    );
  }
}

// Perform manual sync from SimplyBook
export async function POST(req: NextRequest) {
  try {
    const companyLogin = process.env.NEXT_PUBLIC_SIMPLYBOOK_COMPANY_LOGIN;
    const apiKey = process.env.NEXT_PUBLIC_SIMPLYBOOK_API_KEY;
    
    if (!companyLogin || !apiKey) {
      return NextResponse.json(
        { error: 'SimplyBook credentials not configured' },
        { status: 400 }
      );
    }
    
    const api = new SimplyBookAPI(companyLogin, apiKey);
    
    // Fetch providers from SimplyBook
    const simplybookProviders = await api.getProviders();
    
    // Map SimplyBook providers to our database format
    let syncedCount = 0;
    let errors: string[] = [];
    
    for (const sbProvider of simplybookProviders) {
      try {
        // Check if provider exists in our database
        const existingProvider = await prisma.providerAccount.findFirst({
          where: {
            OR: [
              { providerId: sbProvider.id.toString() },
              { displayName: sbProvider.name }
            ]
          }
        });
        
        if (existingProvider) {
          // Update existing provider with SimplyBook data
          await prisma.providerAccount.update({
            where: { id: existingProvider.id },
            data: {
              providerId: sbProvider.id.toString(),
              displayName: sbProvider.name,
              updatedAt: new Date()
            }
          });
          syncedCount++;
        } else {
          // Log providers that don't exist in our database
          errors.push(`Provider "${sbProvider.name}" (ID: ${sbProvider.id}) not found in database`);
        }
      } catch (error) {
        errors.push(`Failed to sync provider ${sbProvider.name}: ${error}`);
      }
    }
    
    // Update last sync date
    await prisma.systemSettings.update({
      where: { id: 'default' },
      data: {
        lastSyncDate: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      syncedCount,
      totalProviders: simplybookProviders.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Synced ${syncedCount} of ${simplybookProviders.length} providers`
    });
    
  } catch (error) {
    console.error('Error syncing with SimplyBook:', error);
    return NextResponse.json(
      { error: 'Failed to sync with SimplyBook' },
      { status: 500 }
    );
  }
}