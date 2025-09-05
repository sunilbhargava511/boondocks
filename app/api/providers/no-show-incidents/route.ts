import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireProviderAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Get no-show incidents for a provider
export async function GET(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);

    const incidents = await prisma.noShowIncident.findMany({
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

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('Error fetching no-show incidents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch no-show incidents' },
      { status: 500 }
    );
  }
}

// Create a no-show incident
export async function POST(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);
    const { customerId, appointmentId, notes, customerEmail, customerPhone, customerName } = await req.json();

    if (!customerId || !appointmentId) {
      return NextResponse.json(
        { error: 'Customer ID and appointment ID are required' },
        { status: 400 }
      );
    }

    // Create the no-show incident
    const incident = await prisma.noShowIncident.create({
      data: {
        providerId: provider.providerId,
        customerId,
        appointmentId,
        notes: notes || '',
        appointmentDate: new Date(),
        serviceName: 'Unknown',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        markedBy: `${provider.firstName} ${provider.lastName}`
      }
    });

    // Check provider settings for automatic naughty list placement
    const providerSettings = await prisma.providerAccount.findUnique({
      where: { providerId: provider.providerId },
      select: {
        enableNaughtyList: true,
        noShowThreshold: true
      }
    });

    if (providerSettings?.enableNaughtyList && providerSettings.noShowThreshold) {
      // Count total no-shows for this customer with this provider
      const totalNoShows = await prisma.noShowIncident.count({
        where: {
          providerId: provider.providerId,
          customerId
        }
      });

      // If threshold exceeded, add to naughty list automatically
      if (totalNoShows >= providerSettings.noShowThreshold) {
        // Check if already on naughty list
        const existingEntry = await prisma.providerNaughtyList.findFirst({
          where: {
            providerId: provider.providerId,
            OR: [
              { blockedEmail: customerEmail },
              { blockedPhone: customerPhone }
            ]
          }
        });

        if (!existingEntry) {
          await prisma.providerNaughtyList.create({
            data: {
              providerId: provider.providerId,
              customerId,
              blockedEmail: customerEmail,
              blockedPhone: customerPhone,
              customerName,
              reason: 'EXCESSIVE_NO_SHOWS',
              notes: `Automatically blocked after ${totalNoShows} no-shows`,
              noShowCount: totalNoShows,
              blockedBy: `${provider.firstName} ${provider.lastName}`,
              isAutomatic: true
            }
          });
        }
      }
    }

    return NextResponse.json({
      incident,
      message: 'No-show incident recorded successfully'
    });
  } catch (error) {
    console.error('Error creating no-show incident:', error);
    return NextResponse.json(
      { error: 'Failed to record no-show incident' },
      { status: 500 }
    );
  }
}