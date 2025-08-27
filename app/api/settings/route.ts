import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get or create default settings
    let settings = await prisma.systemSettings.findFirst({
      where: { id: 'default' }
    });
    
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          simplybookSyncEnabled: false,
          autoSyncNewCustomers: false,
          autoSyncAppointments: false,
        }
      });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Update settings
    const settings = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        simplybookSyncEnabled: data.simplybookSyncEnabled ?? undefined,
        autoSyncNewCustomers: data.autoSyncNewCustomers ?? undefined,
        autoSyncAppointments: data.autoSyncAppointments ?? undefined,
      },
      create: {
        id: 'default',
        simplybookSyncEnabled: data.simplybookSyncEnabled ?? false,
        autoSyncNewCustomers: data.autoSyncNewCustomers ?? false,
        autoSyncAppointments: data.autoSyncAppointments ?? false,
      }
    });
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}