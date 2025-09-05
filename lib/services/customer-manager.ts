import { PrismaClient } from '@prisma/client';
import { enhancedAPI } from '../enhanced-simplybook-api';
import { getSimplyBookAPI } from '../simplybook-api';
import { Customer, CustomerPreference, CustomerTag, Appointment, CSVCustomerRow } from '../types';

interface CreateCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  conversationPreference?: number;
  preferredProviderId?: string;
  notes?: string;
  marketingConsent?: boolean;
  smsConsent?: boolean;
  emailConsent?: boolean;
  preferences?: Partial<CustomerPreference>;
  tags?: string[];
  syncToSimplyBook?: boolean;
}

interface UpdateCustomerData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  conversationPreference?: number;
  preferredProviderId?: string;
  notes?: string;
  marketingConsent?: boolean;
  smsConsent?: boolean;
  emailConsent?: boolean;
  accountStatus?: 'active' | 'suspended' | 'blocked';
  preferences?: Partial<CustomerPreference>;
  tags?: string[];
}

export class CustomerManager {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    // Check system settings for auto-sync
    const settings = await this.getSystemSettings();
    const shouldSync = data.syncToSimplyBook ?? settings.autoSyncNewCustomers;
    
    const customer = await this.prisma.customer.create({
      data: {
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        conversationPreference: data.conversationPreference || 2,
        preferredProviderId: data.preferredProviderId,
        notes: data.notes,
        marketingConsent: data.marketingConsent || false,
        smsConsent: data.smsConsent || false,
        emailConsent: data.emailConsent !== false, // default to true unless explicitly false
        syncStatus: shouldSync && settings.simplybookSyncEnabled ? 'pending_simplybook_creation' : 'synced',
      },
      include: {
        preferences: true,
        tags: true,
        appointments: true,
      },
    });

    // Add preferences if provided
    if (data.preferences) {
      await this.updateCustomerPreferences(customer.id, data.preferences);
    }

    // Add tags if provided
    if (data.tags && data.tags.length > 0) {
      await this.addCustomerTags(customer.id, data.tags);
    }

    // Sync to SimplyBook if enabled and requested
    if (shouldSync && settings.simplybookSyncEnabled) {
      await this.syncToSimplyBook(customer.id);
    }

    return this.getCustomerById(customer.id);
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return await this.prisma.customer.findUnique({
      where: { id },
      include: {
        preferences: true,
        tags: true,
        appointments: {
          orderBy: { appointmentDate: 'desc' }
        },
      },
    });
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    return await this.prisma.customer.findUnique({
      where: { email },
      include: {
        preferences: true,
        tags: true,
        appointments: {
          orderBy: { appointmentDate: 'desc' }
        },
      },
    });
  }

  async getCustomerBySimplyBookId(simplybookId: number): Promise<Customer | null> {
    return await this.prisma.customer.findUnique({
      where: { simplybookId },
      include: {
        preferences: true,
        tags: true,
        appointments: {
          orderBy: { appointmentDate: 'desc' }
        },
      },
    });
  }

  async updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer | null> {
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        conversationPreference: data.conversationPreference,
        preferredProviderId: data.preferredProviderId,
        notes: data.notes,
        marketingConsent: data.marketingConsent,
        smsConsent: data.smsConsent,
        emailConsent: data.emailConsent,
        accountStatus: data.accountStatus,
        syncStatus: 'pending_sync', // Mark for sync when updated
      },
    });

    // Update preferences if provided
    if (data.preferences) {
      await this.updateCustomerPreferences(id, data.preferences);
    }

    // Update tags if provided
    if (data.tags !== undefined) {
      await this.replaceCustomerTags(id, data.tags);
    }

    // Sync changes to SimplyBook
    if (customer.simplybookId) {
      await this.syncToSimplyBook(id);
    }

    return this.getCustomerById(id);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const customer = await this.getCustomerById(id);
      
      // Cancel any future appointments first
      await this.prisma.appointment.updateMany({
        where: {
          customerId: id,
          appointmentDate: {
            gte: new Date()
          },
          status: {
            in: ['confirmed', 'in_progress']
          }
        },
        data: {
          status: 'cancelled'
        }
      });

      // Delete the customer (cascades will handle related records)
      await this.prisma.customer.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return false;
    }
  }

  async searchCustomers(
    query: string, 
    limit: number = 50, 
    offset: number = 0, 
    filters: any = {}
  ): Promise<{ customers: Customer[]; total: number }> {
    const baseWhere = {
      OR: [
        {
          firstName: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        {
          lastName: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        {
          email: {
            contains: query,
            mode: 'insensitive' as const,
          },
        },
        {
          phone: {
            contains: query,
          },
        },
      ],
    };

    // Apply additional filters
    const where = this.buildWhereClause(baseWhere, filters);

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          preferences: true,
          tags: true,
          appointments: {
            orderBy: { appointmentDate: 'desc' },
            take: 5,
          },
        },
        skip: offset,
        take: limit,
        orderBy: [
          { lastVisit: 'desc' },
          { createdAt: 'desc' }
        ],
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { customers, total };
  }

  async getCustomersWithFilters(
    filters: {
      accountStatus?: ('active' | 'suspended' | 'blocked')[];
      minLoyaltyPoints?: number;
      noShowThreshold?: number;
      tags?: string[];
      lastVisitAfter?: Date;
      lastVisitBefore?: Date;
      createdAfter?: Date;
      createdBefore?: Date;
      providerId?: string;
      activeOnly?: boolean;
      recentMonths?: number;
    }, 
    limit: number = 100, 
    offset: number = 0
  ): Promise<{ customers: Customer[]; total: number }> {
    const where = this.buildWhereClause({}, filters);

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          preferences: true,
          tags: true,
          appointments: {
            orderBy: { appointmentDate: 'desc' },
            take: 5,
            ...(filters.providerId && {
              where: { providerId: filters.providerId }
            })
          },
        },
        skip: offset,
        take: limit,
        orderBy: [
          { lastVisit: 'desc' },
          { createdAt: 'desc' }
        ],
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { customers, total };
  }

  private buildWhereClause(baseWhere: any = {}, filters: any): any {
    const where = { ...baseWhere };

    if (filters.accountStatus) {
      where.accountStatus = { in: filters.accountStatus };
    }

    if (filters.minLoyaltyPoints !== undefined) {
      where.loyaltyPoints = { gte: filters.minLoyaltyPoints };
    }

    if (filters.noShowThreshold !== undefined) {
      where.noShowCount = { gte: filters.noShowThreshold };
    }

    if (filters.lastVisitAfter || filters.lastVisitBefore) {
      where.lastVisit = {};
      if (filters.lastVisitAfter) where.lastVisit.gte = filters.lastVisitAfter;
      if (filters.lastVisitBefore) where.lastVisit.lte = filters.lastVisitBefore;
    }

    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {};
      if (filters.createdAfter) where.createdAt.gte = filters.createdAfter;
      if (filters.createdBefore) where.createdAt.lte = filters.createdBefore;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tagName: {
            in: filters.tags
          }
        }
      };
    }

    // Provider-specific filtering
    if (filters.providerId) {
      // Show customers who have appointments with this provider
      where.appointments = {
        some: {
          providerId: filters.providerId,
          ...(filters.activeOnly && filters.recentMonths && {
            appointmentDate: {
              gte: new Date(Date.now() - filters.recentMonths * 30 * 24 * 60 * 60 * 1000)
            }
          })
        }
      };
    }

    // Show only active customers for providers
    if (filters.activeOnly) {
      where.accountStatus = 'active';
      
      // If recentMonths is specified, show customers with recent activity
      if (filters.recentMonths) {
        const cutoffDate = new Date(Date.now() - filters.recentMonths * 30 * 24 * 60 * 60 * 1000);
        if (!where.appointments) {
          where.appointments = { some: {} };
        }
        if (!where.appointments.some.appointmentDate) {
          where.appointments.some.appointmentDate = {};
        }
        where.appointments.some.appointmentDate.gte = cutoffDate;
      }
    }

    return where;
  }

  // Preference management
  async updateCustomerPreferences(customerId: string, preferences: Partial<CustomerPreference>): Promise<void> {
    await this.prisma.customerPreference.upsert({
      where: { customerId },
      create: {
        customerId,
        preferredDays: preferences.preferredDays ? JSON.stringify(preferences.preferredDays) : null,
        preferredTimes: preferences.preferredTimes ? JSON.stringify(preferences.preferredTimes) : null,
        preferredServices: preferences.preferredServices ? JSON.stringify(preferences.preferredServices) : null,
        allergiesNotes: preferences.allergiesNotes,
        specialInstructions: preferences.specialInstructions,
      },
      update: {
        preferredDays: preferences.preferredDays ? JSON.stringify(preferences.preferredDays) : undefined,
        preferredTimes: preferences.preferredTimes ? JSON.stringify(preferences.preferredTimes) : undefined,
        preferredServices: preferences.preferredServices ? JSON.stringify(preferences.preferredServices) : undefined,
        allergiesNotes: preferences.allergiesNotes,
        specialInstructions: preferences.specialInstructions,
      },
    });
  }

  // Tag management
  async addCustomerTags(customerId: string, tagNames: string[]): Promise<void> {
    const tagData = tagNames.map(tagName => ({
      customerId,
      tagName,
    }));

    await this.prisma.customerTag.createMany({
      data: tagData,
      skipDuplicates: true,
    });
  }

  async removeCustomerTag(customerId: string, tagName: string): Promise<void> {
    await this.prisma.customerTag.deleteMany({
      where: {
        customerId,
        tagName,
      },
    });
  }

  async replaceCustomerTags(customerId: string, tagNames: string[]): Promise<void> {
    // Remove existing tags
    await this.prisma.customerTag.deleteMany({
      where: { customerId },
    });

    // Add new tags
    if (tagNames.length > 0) {
      await this.addCustomerTags(customerId, tagNames);
    }
  }

  // Appointment tracking
  async recordAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const settings = await this.getSystemSettings();
    
    const appointment = await this.prisma.appointment.create({
      data: appointmentData,
      include: {
        customer: true,
      },
    });

    // Update customer stats
    await this.updateCustomerStats(appointmentData.customerId, appointmentData.status);

    // Sync to SimplyBook if enabled
    if (settings.simplybookSyncEnabled && settings.autoSyncAppointments) {
      // TODO: Implement appointment sync to SimplyBook
      console.log('Would sync appointment to SimplyBook:', appointment.id);
    }

    return appointment;
  }

  async getAppointments(filters: any = {}, limit: number = 100): Promise<Appointment[]> {
    return await this.prisma.appointment.findMany({
      where: filters,
      include: {
        customer: true,
      },
      orderBy: { appointmentDate: 'desc' },
      take: limit,
    });
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    return await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });
  }

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        customer: true,
      },
    });

    // Update customer stats if status changed
    if (data.status) {
      await this.updateCustomerStats(appointment.customerId, data.status);
    }

    return appointment;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    try {
      await this.prisma.appointment.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
  }

  async findAppointmentByCode(bookingCode: string, email: string): Promise<any> {
    return await this.prisma.appointment.findFirst({
      where: {
        bookingCode,
        customer: {
          email: email.toLowerCase(),
        },
      },
      include: {
        customer: true,
      },
    });
  }


  async getCustomerAppointments(customerId: string): Promise<any[]> {
    return await this.prisma.appointment.findMany({
      where: { customerId },
      orderBy: { appointmentDate: 'desc' },
      include: {
        customer: true,
      },
    });
  }

  async getAppointmentBySimplyBookId(simplybookId: number): Promise<any> {
    return await this.prisma.appointment.findUnique({
      where: { simplybookId },
      include: {
        customer: true,
      },
    });
  }

  async createAppointmentFromSync(appointmentData: any): Promise<any> {
    return await this.prisma.appointment.create({
      data: appointmentData,
      include: {
        customer: true,
      },
    });
  }

  async updateSystemSettings(data: any): Promise<any> {
    return await this.prisma.systemSettings.update({
      where: { id: 'default' },
      data,
    });
  }

  async checkAppointmentConflict(params: {
    providerId: string;
    appointmentDate: Date;
    duration: number;
    excludeId?: string | null;
  }): Promise<boolean> {
    const { providerId, appointmentDate, duration, excludeId } = params;
    
    const appointmentEnd = new Date(appointmentDate.getTime() + duration * 60000);
    
    const conflicts = await this.prisma.appointment.findMany({
      where: {
        providerId,
        id: excludeId ? { not: excludeId } : undefined,
        status: {
          in: ['confirmed', 'in_progress'],
        },
        OR: [
          // New appointment starts during existing appointment
          {
            appointmentDate: { lte: appointmentDate },
            AND: {
              appointmentDate: {
                gte: new Date(appointmentDate.getTime() - 60 * 60000), // Within an hour for safety
              },
            },
          },
          // New appointment ends during existing appointment
          {
            appointmentDate: { gte: appointmentDate, lte: appointmentEnd },
          },
        ],
      },
    });

    return conflicts.length > 0;
  }

  async updateAppointmentStatus(appointmentId: string, status: Appointment['status'], notes?: string): Promise<void> {
    const appointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        status,
        notes: notes || undefined,
      },
    });

    // Update customer stats based on status change
    await this.updateCustomerStats(appointment.customerId, status);
  }

  async batchUpdateAppointmentStatus(appointmentIds: string[], status: Appointment['status'], notes?: string): Promise<{ updated: number; errors: string[] }> {
    const results = { updated: 0, errors: [] as string[] };

    for (const id of appointmentIds) {
      try {
        await this.updateAppointmentStatus(id, status, notes);
        results.updated++;
      } catch (error) {
        results.errors.push(`Failed to update appointment ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  async getDailyAppointmentStats(startDate: Date, endDate: Date): Promise<any> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const dailyStats: Record<string, any> = {};

    appointments.forEach(appointment => {
      const dateKey = appointment.appointmentDate.toISOString().split('T')[0];
      
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          total: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          no_show: 0,
          in_progress: 0,
          revenue: 0,
        };
      }

      dailyStats[dateKey].total++;
      dailyStats[dateKey][appointment.status]++;
      
      if (appointment.status === 'completed') {
        dailyStats[dateKey].revenue += Number(appointment.price);
      }
    });

    return Object.values(dailyStats);
  }

  private async updateCustomerStats(customerId: string, appointmentStatus: Appointment['status']): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { appointments: true },
    });

    if (!customer) return;

    const stats = {
      noShowCount: customer.appointments.filter(apt => apt.status === 'no_show').length,
      totalSpent: customer.appointments
        .filter(apt => apt.status === 'completed')
        .reduce((sum, apt) => sum + Number(apt.price), 0),
      lastVisit: customer.appointments
        .filter(apt => apt.status === 'completed')
        .sort((a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime())[0]?.appointmentDate,
    };

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        noShowCount: stats.noShowCount,
        totalSpent: stats.totalSpent,
        lastVisit: stats.lastVisit,
        loyaltyPoints: Math.floor(stats.totalSpent / 10), // 1 point per $10 spent
      },
    });
  }

  // System settings management
  async getSystemSettings() {
    let settings = await this.prisma.systemSettings.findFirst({
      where: { id: 'default' }
    });
    
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          id: 'default',
          simplybookSyncEnabled: false,
          autoSyncNewCustomers: false,
          autoSyncAppointments: false,
        }
      });
    }
    
    return settings;
  }

  // SimplyBook synchronization
  async syncToSimplyBook(customerId: string): Promise<boolean> {
    try {
      const settings = await this.getSystemSettings();
      
      // Check if SimplyBook sync is enabled
      if (!settings.simplybookSyncEnabled) {
        console.log('SimplyBook sync is disabled in system settings');
        return false;
      }
      
      const customer = await this.getCustomerById(customerId);
      if (!customer) return false;

      if (customer.simplybookId) {
        // Update existing SimplyBook client
        // Note: SimplyBook API doesn't have a direct update client method
        // This would need to be implemented based on API capabilities
        await this.prisma.customer.update({
          where: { id: customerId },
          data: { syncStatus: 'synced' },
        });
      } else {
        // Create new SimplyBook client
        try {
          const clientData = {
            name: `${customer.firstName} ${customer.lastName}`,
            email: customer.email,
            phone: customer.phone,
          };

          // Call SimplyBook API to create client
          if (settings.simplybookSyncEnabled) {
            const simplybookId = await this.syncCustomerToSimplyBook(customer);
            if (simplybookId) {
              await this.prisma.customer.update({
                where: { id: customerId },
                data: {
                  simplybookId: simplybookId,
                  syncStatus: 'synced',
                },
              });
              console.log(`Customer ${customer.email} synced to SimplyBook with ID: ${simplybookId}`);
            } else {
              await this.prisma.customer.update({
                where: { id: customerId },
                data: { syncStatus: 'error' },
              });
              return false;
            }
          }
        } catch (error) {
          await this.prisma.customer.update({
            where: { id: customerId },
            data: { syncStatus: 'error' },
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error syncing customer to SimplyBook:', error);
      return false;
    }
  }

  async syncAllPendingCustomers(): Promise<{ success: number; failed: number }> {
    const pendingCustomers = await this.prisma.customer.findMany({
      where: {
        syncStatus: {
          in: ['pending_simplybook_creation', 'pending_sync'],
        },
      },
    });

    let success = 0;
    let failed = 0;

    for (const customer of pendingCustomers) {
      const synced = await this.syncToSimplyBook(customer.id);
      if (synced) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  // CSV Import helper (basic structure - will be expanded in import service)
  async createCustomerFromCSVRow(row: CSVCustomerRow, importJobId: string): Promise<{ success: boolean; error?: string; customerId?: string }> {
    try {
      // Validate required fields
      if (!row.email || !row.firstName || !row.lastName) {
        return { success: false, error: 'Missing required fields: email, firstName, or lastName' };
      }

      // Check for existing customer
      const existing = await this.getCustomerByEmail(row.email);
      if (existing) {
        return { success: false, error: `Customer with email ${row.email} already exists` };
      }

      // Parse and validate data
      const customerData: CreateCustomerData = {
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        email: row.email.trim().toLowerCase(),
        phone: row.phone?.trim() || '',
        dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
        conversationPreference: row.conversationPreference ? parseInt(row.conversationPreference) : 2,
        notes: row.notes?.trim(),
        marketingConsent: row.marketingConsent?.toLowerCase() === 'true',
        smsConsent: row.smsConsent?.toLowerCase() === 'true',
        emailConsent: row.emailConsent?.toLowerCase() !== 'false', // default true
        loyaltyPoints: row.loyaltyPoints ? parseInt(row.loyaltyPoints) : 0,
        totalSpent: row.totalSpent ? parseFloat(row.totalSpent) : 0,
        preferences: {
          preferredDays: row.preferredDays ? row.preferredDays.split(',').map(d => d.trim()) : undefined,
          preferredTimes: row.preferredTimes ? row.preferredTimes.split(',').map(t => t.trim()) : undefined,
          preferredServices: row.preferredServices ? row.preferredServices.split(',').map(s => s.trim()) : undefined,
          allergiesNotes: row.allergiesNotes?.trim(),
          specialInstructions: row.specialInstructions?.trim(),
        },
        tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : undefined,
        syncToSimplyBook: false, // Don't sync during bulk import
      };

      const customer = await this.createCustomer(customerData);
      return { success: true, customerId: customer.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // SimplyBook appointment sync methods
  async syncAppointmentCancellation(appointmentId: string): Promise<boolean> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment?.simplybookId) {
        console.log('Appointment has no SimplyBook ID, skipping sync');
        return true;
      }

      const settings = await this.getSystemSettings();
      if (!settings.simplybookSyncEnabled) {
        console.log('SimplyBook sync disabled');
        return false;
      }

      const api = getSimplyBookAPI();
      await api.getToken();
      
      // Cancel booking in SimplyBook
      const result = await api.client.call('cancelBooking', [appointment.simplybookId]);
      console.log(`Cancelled appointment ${appointment.simplybookId} in SimplyBook`);
      
      return true;
    } catch (error) {
      console.error('Error syncing cancellation to SimplyBook:', error);
      return false;
    }
  }

  async syncAppointmentReschedule(appointmentId: string, newDateTime: Date): Promise<boolean> {
    try {
      const appointment = await this.getAppointmentById(appointmentId);
      if (!appointment?.simplybookId) {
        console.log('Appointment has no SimplyBook ID, skipping sync');
        return true;
      }

      const settings = await this.getSystemSettings();
      if (!settings.simplybookSyncEnabled) {
        console.log('SimplyBook sync disabled');
        return false;
      }

      const api = getSimplyBookAPI();
      await api.getToken();
      
      // Reschedule booking in SimplyBook
      const result = await api.client.call('rescheduleBook', [
        appointment.simplybookId,
        newDateTime.toISOString()
      ]);
      console.log(`Rescheduled appointment ${appointment.simplybookId} in SimplyBook`);
      
      return true;
    } catch (error) {
      console.error('Error syncing reschedule to SimplyBook:', error);
      return false;
    }
  }

  async syncCustomerToSimplyBook(customer: any): Promise<number | null> {
    try {
      const settings = await this.getSystemSettings();
      if (!settings.simplybookSyncEnabled) {
        console.log('SimplyBook sync disabled');
        return null;
      }

      const api = getSimplyBookAPI();
      await api.getToken();

      const clientData = {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
        // Add additional fields if needed
      };

      // Create client in SimplyBook (using admin API)
      const adminToken = await api.getAdminToken();
      const adminClient = api.getAdminClient(adminToken);
      
      const clientId = await adminClient.call('addClient', [clientData]);
      console.log(`Created SimplyBook client with ID: ${clientId}`);
      
      return clientId;
    } catch (error) {
      console.error('Error creating SimplyBook client:', error);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const customerManager = new CustomerManager();