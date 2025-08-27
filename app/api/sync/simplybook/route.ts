import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';
import { getSimplyBookAPI } from '@/lib/simplybook-api';
import { requireAdminAuth } from '@/lib/auth';

// Sync endpoint to pull updates from SimplyBook
export async function POST(req: NextRequest) {
  try {
    requireAdminAuth(req);
    
    const { syncType } = await req.json();
    
    switch (syncType) {
      case 'customers':
        return await syncCustomersFromSimplyBook();
      case 'appointments':
        return await syncAppointmentsFromSimplyBook();
      case 'full':
        return await performFullSync();
      default:
        return NextResponse.json(
          { error: 'Invalid sync type. Use: customers, appointments, or full' },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}

async function syncCustomersFromSimplyBook() {
  try {
    const settings = await customerManager.getSystemSettings();
    if (!settings.simplybookSyncEnabled) {
      return NextResponse.json(
        { error: 'SimplyBook sync is disabled' },
        { status: 400 }
      );
    }

    const api = getSimplyBookAPI();
    const adminToken = await api.getAdminToken();
    const adminClient = api.getAdminClient(adminToken);

    // Get all clients from SimplyBook
    const simplybookClients = await adminClient.call('getClientList', [{}]);
    
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const sbClient of simplybookClients) {
      try {
        // Check if customer exists locally
        const existingCustomer = await customerManager.getCustomerBySimplyBookId(sbClient.id);
        
        const customerData = {
          firstName: sbClient.name?.split(' ')[0] || 'Unknown',
          lastName: sbClient.name?.split(' ').slice(1).join(' ') || 'Unknown',
          email: sbClient.email || `unknown_${sbClient.id}@simplybook.import`,
          phone: sbClient.phone || '',
          simplybookId: sbClient.id,
          syncStatus: 'synced'
        };

        if (existingCustomer) {
          // Update existing customer
          await customerManager.updateCustomer(existingCustomer.id, customerData);
          updated++;
        } else {
          // Create new customer
          await customerManager.createCustomer({
            ...customerData,
            syncToSimplyBook: false // Already exists in SimplyBook
          });
          created++;
        }
      } catch (error) {
        console.error(`Error syncing customer ${sbClient.id}:`, error);
        errors++;
      }
    }

    // Update last sync date
    await customerManager.updateSystemSettings({
      lastSyncDate: new Date()
    });

    return NextResponse.json({
      message: 'Customer sync completed',
      stats: { created, updated, errors }
    });

  } catch (error) {
    console.error('Customer sync failed:', error);
    return NextResponse.json(
      { error: 'Customer sync failed' },
      { status: 500 }
    );
  }
}

async function syncAppointmentsFromSimplyBook() {
  try {
    const settings = await customerManager.getSystemSettings();
    if (!settings.simplybookSyncEnabled) {
      return NextResponse.json(
        { error: 'SimplyBook sync is disabled' },
        { status: 400 }
      );
    }

    const api = getSimplyBookAPI();
    const adminToken = await api.getAdminToken();
    const adminClient = api.getAdminClient(adminToken);

    // Get recent bookings from SimplyBook (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const bookingsFilter = {
      from: thirtyDaysAgo.toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0]
    };

    const simplybookBookings = await adminClient.call('getBookings', [bookingsFilter]);
    
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const sbBooking of simplybookBookings) {
      try {
        // Find local customer by SimplyBook ID
        const customer = await customerManager.getCustomerBySimplyBookId(sbBooking.client_id);
        if (!customer) {
          console.log(`Customer not found for booking ${sbBooking.id}, skipping`);
          continue;
        }

        // Check if appointment exists locally
        const existingAppointment = await customerManager.getAppointmentBySimplyBookId(sbBooking.id);
        
        const appointmentData = {
          customerId: customer.id,
          simplybookId: sbBooking.id,
          serviceId: sbBooking.event_id.toString(),
          serviceName: sbBooking.service_name || 'Unknown Service',
          providerId: sbBooking.unit_id.toString(),
          providerName: sbBooking.provider_name || 'Unknown Provider',
          appointmentDate: new Date(sbBooking.start_date_time),
          duration: sbBooking.duration || 60,
          price: sbBooking.price || 0,
          status: mapSimplyBookStatus(sbBooking.status),
          bookingCode: sbBooking.code || generateBookingCode(),
          notes: sbBooking.comment || null
        };

        if (existingAppointment) {
          // Update existing appointment
          await customerManager.updateAppointment(existingAppointment.id, appointmentData);
          updated++;
        } else {
          // Create new appointment
          await customerManager.createAppointmentFromSync(appointmentData);
          created++;
        }
      } catch (error) {
        console.error(`Error syncing appointment ${sbBooking.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      message: 'Appointment sync completed',
      stats: { created, updated, errors }
    });

  } catch (error) {
    console.error('Appointment sync failed:', error);
    return NextResponse.json(
      { error: 'Appointment sync failed' },
      { status: 500 }
    );
  }
}

async function performFullSync() {
  try {
    // First sync customers, then appointments
    const customerSync = await syncCustomersFromSimplyBook();
    const appointmentSync = await syncAppointmentsFromSimplyBook();

    return NextResponse.json({
      message: 'Full sync completed',
      customerSync: (await customerSync.json()).stats,
      appointmentSync: (await appointmentSync.json()).stats
    });
  } catch (error) {
    console.error('Full sync failed:', error);
    return NextResponse.json(
      { error: 'Full sync failed' },
      { status: 500 }
    );
  }
}

function mapSimplyBookStatus(status: string): string {
  // Map SimplyBook statuses to our local statuses
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'approved':
      return 'confirmed';
    case 'cancelled':
      return 'cancelled';
    case 'completed':
      return 'completed';
    case 'no_show':
      return 'no_show';
    default:
      return 'confirmed';
  }
}

function generateBookingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}