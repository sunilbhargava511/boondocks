import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireProviderAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Get naughty list entries for a provider
export async function GET(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);

    const entries = await prisma.providerNaughtyList.findMany({
      where: { providerId: provider.providerId },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching naughty list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch naughty list' },
      { status: 500 }
    );
  }
}

// Add customer to naughty list
export async function POST(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);
    const { blockedEmail, blockedPhone, customerName, reason, notes, isAutomatic = false, customerId, noShowCount = 0 } = await req.json();

    if (!blockedEmail || !blockedPhone || !customerName || !reason) {
      return NextResponse.json(
        { error: 'Email, phone, customer name, and reason are required' },
        { status: 400 }
      );
    }

    // Validate email and phone formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(blockedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if customer is already blocked
    const existingEntry = await prisma.providerNaughtyList.findFirst({
      where: {
        providerId: provider.providerId,
        OR: [
          { blockedEmail },
          { blockedPhone }
        ]
      }
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Customer is already blocked' },
        { status: 409 }
      );
    }

    const newEntry = await prisma.providerNaughtyList.create({
      data: {
        providerId: provider.providerId,
        customerId: customerId || null,
        blockedEmail,
        blockedPhone,
        customerName,
        reason,
        notes,
        noShowCount,
        blockedBy: `${provider.firstName} ${provider.lastName}`,
        isAutomatic
      }
    });

    return NextResponse.json({
      entry: newEntry,
      message: `${customerName} has been blocked`
    });
  } catch (error) {
    console.error('Error adding to naughty list:', error);
    return NextResponse.json(
      { error: 'Failed to block customer' },
      { status: 500 }
    );
  }
}