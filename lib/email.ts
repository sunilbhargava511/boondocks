import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(
  to: string, 
  magicLink: string
): Promise<boolean> {
  try {
    console.log('📧 Attempting to send magic link email...');
    console.log('   To:', to);
    console.log('   Magic link:', magicLink);
    console.log('   API Key configured:', !!process.env.RESEND_API_KEY);
    
    // Skip sending in development if no API key
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️  Email service not configured - using console logging');
      console.log(`📧 Magic link email would be sent to: ${to}`);
      console.log(`🔗 Magic link: ${magicLink}`);
      return true;
    }
    
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: 'Sign in to Boondocks Barbershop',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sign in to Boondocks Barbershop</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%); padding: 30px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: #c41e3a; font-family: 'Arial Black', Arial, sans-serif; font-size: 36px; margin: 0; text-transform: uppercase; letter-spacing: 3px;">
                BOONDOCKS
              </h1>
              <p style="color: #f5f5f0; margin: 5px 0 0 0; font-size: 14px;">Traditional Barbershop • San Carlos</p>
            </div>
            
            <h2 style="color: #2c2c2c;">Your Magic Link</h2>
            
            <p>Hello!</p>
            
            <p>Click the button below to securely sign in to your Boondocks Barbershop account. No password needed!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" 
                 style="display: inline-block; background: #c41e3a; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-radius: 5px;">
                🪄 SIGN IN WITH MAGIC LINK
              </a>
            </div>
            
            <div style="background: #fff9e6; border: 1px solid #ffd700; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px;">
                <strong>⏰ Important:</strong> This link will expire in 15 minutes for security reasons.
              </p>
            </div>
            
            <p>If you can't click the button above, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; font-family: monospace; font-size: 12px;">
              ${magicLink}
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p style="font-size: 14px; color: #666;">
              <strong>Didn't request this?</strong> You can safely ignore this email. Your account remains secure.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p>Boondocks Barbershop<br>
              1152 Arroyo Ave, San Carlos, CA 94070<br>
              (650) 597-2454</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Magic link email sending failed:', JSON.stringify(error, null, 2));
      console.error('Error details:', error);
      return false;
    }

    console.log('✅ Magic link email sent successfully!');
    console.log('   Email ID:', data?.id);
    console.log('   Sent to:', to);
    return true;
  } catch (error) {
    console.error('Magic link email service error:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(
  to: string, 
  resetLink: string, 
  userRole: 'customer' | 'provider'
): Promise<boolean> {
  try {
    console.log('📧 Attempting to send password reset email...');
    console.log('   To:', to);
    console.log('   Role:', userRole);
    console.log('   API Key configured:', !!process.env.RESEND_API_KEY);
    console.log('   API Key length:', process.env.RESEND_API_KEY?.length);
    
    // Skip sending in development if no API key
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️  Email service not configured - using console logging');
      console.log(`📧 Password reset email would be sent to: ${to}`);
      console.log(`🔗 Reset link: ${resetLink}`);
      return true;
    }

    const roleText = userRole === 'customer' ? 'customer' : 'barber';
    
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Boondocks Barbershop <noreply@yourdomain.com>',
      to: [to],
      subject: `Reset Your ${roleText === 'customer' ? 'Customer' : 'Barber'} Password - Boondocks Barbershop`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%); padding: 30px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: #c41e3a; font-family: 'Arial Black', Arial, sans-serif; font-size: 36px; margin: 0; text-transform: uppercase; letter-spacing: 3px;">
                BOONDOCKS
              </h1>
              <p style="color: #f5f5f0; margin: 5px 0 0 0; font-size: 14px;">Traditional Barbershop • San Carlos</p>
            </div>
            
            <h2 style="color: #2c2c2c;">Password Reset Request</h2>
            
            <p>Hello,</p>
            
            <p>We received a request to reset the password for your ${roleText} account at Boondocks Barbershop.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="display: inline-block; background: #c41e3a; color: white; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                RESET PASSWORD
              </a>
            </div>
            
            <div style="background: #fff9e6; border: 1px solid #ffd700; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px;">
                <strong>⏰ Important:</strong> This link will expire in 1 hour for security reasons.
              </p>
            </div>
            
            <p>If you can't click the button above, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; font-family: monospace; font-size: 12px;">
              ${resetLink}
            </p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            
            <p style="font-size: 14px; color: #666;">
              <strong>Didn't request this?</strong> You can safely ignore this email. Your password will not be changed.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p>Boondocks Barbershop<br>
              1152 Arroyo Ave, San Carlos, CA 94070<br>
              (650) 597-2454</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Email sending failed:', JSON.stringify(error, null, 2));
      console.error('Error details:', error);
      return false;
    }

    console.log('✅ Password reset email sent successfully!');
    console.log('   Email ID:', data?.id);
    console.log('   Sent to:', to);
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

// Alternative email services (commented for reference)
/*
// Option 2: SendGrid
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendPasswordResetEmailSendGrid(to: string, resetLink: string) {
  const msg = {
    to,
    from: 'noreply@yourdomain.com',
    subject: 'Reset Your Password - Boondocks Barbershop',
    html: emailTemplate(resetLink),
  };
  
  await sgMail.send(msg);
}

// Option 3: AWS SES
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
const sesClient = new SESClient({ region: "us-east-1" });

export async function sendPasswordResetEmailSES(to: string, resetLink: string) {
  const command = new SendEmailCommand({
    Destination: { ToAddresses: [to] },
    Message: {
      Body: { Html: { Data: emailTemplate(resetLink) } },
      Subject: { Data: "Reset Your Password - Boondocks Barbershop" },
    },
    Source: "noreply@yourdomain.com",
  });
  
  await sesClient.send(command);
}
*/