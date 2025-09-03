import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireProviderAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Remove customer from naughty list
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const provider = requireProviderAuth(req);
    const entryId = params.id;

    // Verify the entry belongs to this provider
    const entry = await prisma.providerNaughtyList.findFirst({
      where: {
        id: entryId,
        providerId: provider.providerId
      }
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the entry
    await prisma.providerNaughtyList.delete({
      where: { id: entryId }
    });

    return NextResponse.json({
      success: true,
      message: `${entry.customerName} has been unblocked`
    });
  } catch (error) {
    console.error('Error removing from naughty list:', error);
    return NextResponse.json(
      { error: 'Failed to unblock customer' },
      { status: 500 }
    );
  }
}