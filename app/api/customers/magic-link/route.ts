import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';
import { sendMagicLinkEmail } from '@/lib/email';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Store magic link tokens temporarily (in production, use database)
const magicTokens = new Map<string, { email: string; expires: Date }>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if customer exists
    const customer = await customerManager.getCustomerByEmail(email.toLowerCase());
    if (!customer) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Generate magic link token
    const magicToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15); // 15 minute expiration

    // Store token
    magicTokens.set(magicToken, { 
      email: email.toLowerCase(), 
      expires 
    });

    // Create magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://boondocks-production.up.railway.app' 
        : 'http://localhost:3000');
    
    const magicLink = `${baseUrl}/customers/auth?token=${magicToken}`;

    // Send magic link email
    const emailSent = await sendMagicLinkEmail(email.toLowerCase(), magicLink);
    
    if (!emailSent) {
      console.warn('Failed to send magic link email');
    }

    // Clean up expired tokens
    cleanupExpiredTokens();

    return NextResponse.json({ 
      message: 'Magic link sent to your email' 
    });
  } catch (error) {
    console.error('Magic link generation error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    );
  }
}

// Verify magic link token and return JWT
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Check token
    const tokenData = magicTokens.get(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired magic link' },
        { status: 401 }
      );
    }

    // Check expiration
    if (new Date() > tokenData.expires) {
      magicTokens.delete(token);
      return NextResponse.json(
        { error: 'Magic link has expired' },
        { status: 401 }
      );
    }

    // Get customer
    const customer = await customerManager.getCustomerByEmail(tokenData.email);
    if (!customer) {
      magicTokens.delete(token);
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        userId: customer.id,
        email: customer.email,
        role: 'customer',
        name: `${customer.firstName} ${customer.lastName}`
      },
      process.env.JWT_SECRET || 'default-secret-key-change-in-production',
      { expiresIn: '30d' }
    );

    // Delete used token
    magicTokens.delete(token);

    // Set secure cookie and redirect
    const response = NextResponse.redirect(new URL('/customers/dashboard', req.url));
    response.cookies.set('customerToken', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify magic link' },
      { status: 500 }
    );
  }
}

// Clean up expired tokens periodically
function cleanupExpiredTokens() {
  const now = new Date();
  for (const [token, data] of magicTokens.entries()) {
    if (data.expires < now) {
      magicTokens.delete(token);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);