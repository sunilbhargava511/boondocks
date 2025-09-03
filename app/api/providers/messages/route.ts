import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireProviderAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Send message to customer
export async function POST(req: NextRequest) {
  try {
    const provider = requireProviderAuth(req);
    const { appointmentId, type, subject, message } = await req.json();

    if (!appointmentId || !message || !type) {
      return NextResponse.json(
        { error: 'Appointment ID, message type, and message content are required' },
        { status: 400 }
      );
    }

    // Verify the appointment belongs to this provider
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        providerId: provider.providerId
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

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }

    // For now, we'll simulate sending the message and log it
    // In production, you would integrate with email/SMS services like:
    // - Resend/SendGrid for email
    // - Twilio/AWS SNS for SMS
    
    const messageData = {
      to: type === 'email' ? appointment.customer.email : appointment.customer.phone,
      type,
      subject: type === 'email' ? subject : undefined,
      content: message,
      fromProvider: `${provider.firstName} ${provider.lastName}`,
      appointmentDetails: {
        date: appointment.appointmentDate,
        service: appointment.serviceName,
        customer: `${appointment.customer.firstName} ${appointment.customer.lastName}`
      }
    };

    console.log('Message sent:', messageData);

    // Here you would call your email/SMS service
    if (type === 'email') {
      // Example with Resend or similar service:
      // await resend.emails.send({
      //   from: 'noreply@boondocks.com',
      //   to: appointment.customer.email,
      //   subject: subject,
      //   html: `
      //     <h3>Message from ${provider.firstName} ${provider.lastName}</h3>
      //     <p>Regarding your appointment: ${appointment.serviceName}</p>
      //     <p>Date: ${new Date(appointment.appointmentDate).toLocaleDateString()}</p>
      //     <p>Message:</p>
      //     <p>${message}</p>
      //   `
      // });
    } else if (type === 'sms') {
      // Example with Twilio or similar service:
      // await twilioClient.messages.create({
      //   body: `Message from ${provider.firstName} at Boondocks: ${message}`,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: appointment.customer.phone
      // });
    }

    // Log the communication attempt (optional - for tracking)
    // You could create a communications table to track all messages sent

    return NextResponse.json({ 
      success: true,
      message: `${type === 'email' ? 'Email' : 'SMS'} sent successfully to ${appointment.customer.firstName} ${appointment.customer.lastName}`
    });

  } catch (error) {
    console.error('Message sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}