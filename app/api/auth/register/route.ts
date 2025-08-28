import { NextRequest, NextResponse } from 'next/server';
import { customerManager } from '@/lib/services/customer-manager';
import { sendMagicLinkEmail } from '@/lib/email';
import crypto from 'crypto';

// Store magic link tokens temporarily (in production, use database) 
const registrationTokens = new Map<string, { email: string; customerData: any; expires: Date }>();

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, lastName, phone, conversationPreference } = await req.json();

    // Validate required fields
    if (!email || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await customerManager.getCustomerByEmail(email.toLowerCase());
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Create customer immediately (no password needed for magic links)
    const customer = await customerManager.createCustomer({
      email: email.toLowerCase(),
      firstName,
      lastName,
      phone,
      conversationPreference: conversationPreference || 2,
    });

    // Generate magic link token for immediate login
    const magicToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15); // 15 minute expiration

    // Store token with customer data
    registrationTokens.set(magicToken, { 
      email: customer.email,
      customerData: customer,
      expires 
    });

    // Create magic link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://boondocks-production.up.railway.app' 
        : 'http://localhost:3000');
    
    const magicLink = `${baseUrl}/customers/auth?token=${magicToken}&welcome=true`;

    // Send magic link email
    const emailSent = await sendMagicLinkEmail(customer.email, magicLink);
    
    if (!emailSent) {
      console.warn('Failed to send registration magic link email');
    }

    console.log('✅ Customer registered successfully:', customer.email);
    return NextResponse.json({
      success: true,
      message: 'Account created! Check your email for a magic link to sign in.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}