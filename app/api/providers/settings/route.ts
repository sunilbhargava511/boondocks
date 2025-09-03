import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireProviderAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Get provider settings
export async function GET(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);

    const providerAccount = await prisma.providerAccount.findUnique({
      where: { providerId: provider.providerId },
      select: {
        isSelective: true,
        isActive: true,
        enableNaughtyList: true,
        noShowThreshold: true
      }
    });

    if (!providerAccount) {
      return NextResponse.json(
        { error: 'Provider account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isSelective: providerAccount.isSelective,
      isActive: providerAccount.isActive,
      enableNaughtyList: providerAccount.enableNaughtyList,
      noShowThreshold: providerAccount.noShowThreshold
    });
  } catch (error) {
    console.error('Error fetching provider settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// Update provider settings
export async function PUT(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);
    const updateData = await req.json();

    // Validate the fields being updated
    const allowedFields = ['isSelective', 'enableNaughtyList', 'noShowThreshold'];
    const dataToUpdate: any = {};

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (key === 'isSelective' || key === 'enableNaughtyList') {
          if (typeof value !== 'boolean') {
            return NextResponse.json(
              { error: `${key} must be a boolean value` },
              { status: 400 }
            );
          }
        } else if (key === 'noShowThreshold') {
          if (typeof value !== 'number' || value < 1 || value > 10) {
            return NextResponse.json(
              { error: 'noShowThreshold must be a number between 1 and 10' },
              { status: 400 }
            );
          }
        }
        dataToUpdate[key] = value;
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedProvider = await prisma.providerAccount.update({
      where: { providerId: provider.providerId },
      data: dataToUpdate,
      select: {
        isSelective: true,
        enableNaughtyList: true,
        noShowThreshold: true,
        firstName: true,
        lastName: true
      }
    });

    return NextResponse.json({
      success: true,
      settings: {
        isSelective: updatedProvider.isSelective,
        enableNaughtyList: updatedProvider.enableNaughtyList,
        noShowThreshold: updatedProvider.noShowThreshold
      },
      message: `Settings updated for ${updatedProvider.firstName} ${updatedProvider.lastName}`
    });
  } catch (error) {
    console.error('Error updating provider settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}