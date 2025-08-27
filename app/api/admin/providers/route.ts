import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { loadProviders } from '@/lib/data';

const prisma = new PrismaClient();

// Create provider accounts for all providers that don't have accounts yet
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Admin password is required' },
        { status: 400 }
      );
    }

    // Simple admin check - in production, use proper auth
    if (password !== 'admin123') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Load providers from JSON
    const providers = await loadProviders();
    const results = [];

    for (const provider of providers) {
      // Check if account already exists
      const existing = await prisma.providerAccount.findUnique({
        where: { providerId: provider.id }
      });

      if (existing) {
        results.push({
          providerId: provider.id,
          name: provider.name,
          status: 'already_exists'
        });
        continue;
      }

      // Create account with default password
      const defaultPassword = 'barber123'; // They should change this on first login
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      // Generate email from name
      const email = `${provider.name.toLowerCase().replace(/\s+/g, '.')}@boondocks.com`;

      try {
        await prisma.providerAccount.create({
          data: {
            providerId: provider.id,
            email,
            passwordHash,
            firstName: provider.name.split(' ')[0],
            lastName: provider.name.split(' ').slice(1).join(' ') || 'Barber',
            phone: null,
            isActive: true,
            role: 'provider'
          }
        });

        results.push({
          providerId: provider.id,
          name: provider.name,
          email,
          defaultPassword,
          status: 'created'
        });
      } catch (error) {
        results.push({
          providerId: provider.id,
          name: provider.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: 'Provider account creation completed',
      results
    });
  } catch (error) {
    console.error('Error creating provider accounts:', error);
    return NextResponse.json(
      { error: 'Failed to create provider accounts' },
      { status: 500 }
    );
  }
}