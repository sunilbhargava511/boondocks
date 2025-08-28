import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing email configuration...');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length);
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL);
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        error: 'RESEND_API_KEY not configured',
        hasKey: false,
      });
    }

    // Try to create Resend instance
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Try to send a test email
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: ['delivered@resend.dev'], // Resend's test email that always succeeds
      subject: 'Test Email from Boondocks',
      html: '<h1>Test Email</h1><p>If you receive this, email is working!</p>',
    });

    if (error) {
      console.error('Email test failed:', error);
      return NextResponse.json({
        error: 'Email sending failed',
        details: error,
        config: {
          hasKey: true,
          keyLength: process.env.RESEND_API_KEY.length,
          fromEmail: process.env.FROM_EMAIL || 'onboarding@resend.dev',
        }
      }, { status: 500 });
    }

    console.log('Test email sent successfully:', data);
    return NextResponse.json({
      success: true,
      emailId: data?.id,
      config: {
        hasKey: true,
        keyLength: process.env.RESEND_API_KEY.length,
        fromEmail: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      error: 'Test endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}