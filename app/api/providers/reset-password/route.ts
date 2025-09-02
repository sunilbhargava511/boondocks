import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { providerId, newPassword } = await req.json();
    
    if (!providerId || !newPassword) {
      return NextResponse.json(
        { error: 'Provider ID and new password are required' },
        { status: 400 }
      );
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Find the provider account by provider_id (the CSV system ID)
    let providerAccount = await prisma.providerAccount.findUnique({
      where: { provider_id: providerId }
    });
    
    // If not found by provider_id, try finding by the actual database providerId field
    if (!providerAccount) {
      providerAccount = await prisma.providerAccount.findFirst({
        where: { 
          OR: [
            { provider_id: providerId },
            { id: providerId }
          ]
        }
      });
    }
    
    if (!providerAccount) {
      return NextResponse.json(
        { error: 'Provider account not found' },
        { status: 404 }
      );
    }
    
    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password in the database
    await prisma.providerAccount.update({
      where: { id: providerAccount.id },
      data: { 
        passwordHash,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Password updated successfully for ${providerAccount.firstName} ${providerAccount.lastName}` 
    });
  } catch (error) {
    console.error('Provider password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset provider password' },
      { status: 500 }
    );
  }
}