import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    requireAdminAuth(req);
    
    const settings = await customerManager.getSystemSettings();
    
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    requireAdminAuth(req);
    
    const updateData = await req.json();
    
    // Validate the settings
    const validSettings = {
      simplybookSyncEnabled: Boolean(updateData.simplybookSyncEnabled),
      autoSyncNewCustomers: Boolean(updateData.autoSyncNewCustomers),
      autoSyncAppointments: Boolean(updateData.autoSyncAppointments),
      updatedAt: new Date()
    };
    
    await customerManager.updateSystemSettings(validSettings);
    
    const updatedSettings = await customerManager.getSystemSettings();
    
    return NextResponse.json({ 
      message: 'Settings updated successfully',
      settings: updatedSettings 
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}