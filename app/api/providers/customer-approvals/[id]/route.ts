import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireProviderAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Remove customer approval
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const provider = requireProviderAuth(req);
    const approvalId = params.id;

    // Verify the approval belongs to this provider
    const approval = await prisma.providerCustomerApproval.findFirst({
      where: {
        id: approvalId,
        providerId: provider.providerId
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the approval
    await prisma.providerCustomerApproval.delete({
      where: { id: approvalId }
    });

    return NextResponse.json({
      success: true,
      message: `Removed approval for ${approval.customer.firstName} ${approval.customer.lastName}`
    });
  } catch (error) {
    console.error('Error removing customer approval:', error);
    return NextResponse.json(
      { error: 'Failed to remove customer approval' },
      { status: 500 }
    );
  }
}