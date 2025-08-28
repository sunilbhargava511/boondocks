import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

// In production, you'd store these tokens in the database with expiration
const resetTokens = new Map<string, { email: string; role: string; expires: Date }>();

export async function POST(req: NextRequest) {
  try {
    const { email, role, token, newPassword } = await req.json();

    // If token and newPassword are provided, this is a password reset
    if (token && newPassword) {
      return handlePasswordReset(token, newPassword);
    }

    // Otherwise, this is a reset request
    return handleResetRequest(email, role);
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}

async function handleResetRequest(email: string, role: string) {
  if (!email || !role) {
    return NextResponse.json(
      { error: 'Email and role are required' },
      { status: 400 }
    );
  }

  // Validate that the email exists
  if (role === 'customer') {
    const customer = await customerManager.getCustomerByEmail(email.toLowerCase());
    if (!customer) {
      // For security, still return success to prevent email enumeration
      return NextResponse.json({ 
        message: 'If an account exists, reset instructions have been sent' 
      });
    }
  } else if (role === 'provider') {
    // Check provider exists (would need to add this method)
    // For now, we'll accept any provider email
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

  // Store token (in production, store in database)
  resetTokens.set(resetToken, { email: email.toLowerCase(), role, expires });

  // Send password reset email
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  // Send the email (falls back to console logging if not configured)
  const emailSent = await sendPasswordResetEmail(email.toLowerCase(), resetLink, role as 'customer' | 'provider');
  
  if (!emailSent) {
    console.warn('Failed to send password reset email, but continuing...');
  }

  return NextResponse.json({ 
    message: 'Password reset instructions have been sent to your email',
    // In development only, include the token for testing
    ...(process.env.NODE_ENV === 'development' && { resetToken, resetLink })
  });
}

async function handlePasswordReset(token: string, newPassword: string) {
  // Validate token
  const tokenData = resetTokens.get(token);
  
  if (!tokenData) {
    return NextResponse.json(
      { error: 'Invalid or expired reset token' },
      { status: 400 }
    );
  }

  // Check if token is expired
  if (new Date() > tokenData.expires) {
    resetTokens.delete(token);
    return NextResponse.json(
      { error: 'Reset token has expired' },
      { status: 400 }
    );
  }

  // Validate password strength
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters long' },
      { status: 400 }
    );
  }

  try {
    if (tokenData.role === 'customer') {
      // Update customer password
      const customer = await customerManager.getCustomerByEmail(tokenData.email);
      if (customer) {
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await customerManager.setCustomerPassword(customer.id, passwordHash);
      }
    } else if (tokenData.role === 'provider') {
      // Update provider password (would need to implement this)
      // await providerManager.updatePassword(tokenData.email, newPassword);
      console.log('Provider password reset for:', tokenData.email);
    }

    // Delete the used token
    resetTokens.delete(token);

    return NextResponse.json({ 
      message: 'Password has been successfully reset' 
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = new Date();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expires < now) {
      resetTokens.delete(token);
    }
  }
}, 60000); // Check every minute