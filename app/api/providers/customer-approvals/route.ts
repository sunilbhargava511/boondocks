import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireProviderAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Get approved customers for a provider
export async function GET(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);

    const approvals = await prisma.providerCustomerApproval.findMany({
      where: { 
        providerId: provider.providerId,
        status: 'approved'
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            totalSpent: true,
            lastVisit: true
          }
        }
      },
      orderBy: { approvedAt: 'desc' }
    });

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error('Error fetching customer approvals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer approvals' },
      { status: 500 }
    );
  }
}

// Approve a customer
export async function POST(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);
    const { customerId, status, notes } = await req.json();

    if (!customerId || !status) {
      return NextResponse.json(
        { error: 'Customer ID and status are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'pending', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: approved, pending, or rejected' },
        { status: 400 }
      );
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if approval already exists
    const existingApproval = await prisma.providerCustomerApproval.findUnique({
      where: {
        providerId_customerId: {
          providerId: provider.providerId,
          customerId
        }
      }
    });

    if (existingApproval) {
      // Update existing approval
      const updatedApproval = await prisma.providerCustomerApproval.update({
        where: { id: existingApproval.id },
        data: {
          status,
          notes: notes || null,
          approvedAt: new Date(),
          approvedBy: `${provider.firstName} ${provider.lastName}`
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return NextResponse.json({
        approval: updatedApproval,
        message: `Customer approval updated to ${status}`
      });
    } else {
      // Create new approval
      const newApproval = await prisma.providerCustomerApproval.create({
        data: {
          providerId: provider.providerId,
          customerId,
          status,
          notes: notes || null,
          approvedBy: `${provider.firstName} ${provider.lastName}`
        },
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      return NextResponse.json({
        approval: newApproval,
        message: `Customer ${status} successfully`
      });
    }
  } catch (error) {
    console.error('Error managing customer approval:', error);
    return NextResponse.json(
      { error: 'Failed to manage customer approval' },
      { status: 500 }
    );
  }
}