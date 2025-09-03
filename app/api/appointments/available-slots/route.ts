import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');
    const serviceId = searchParams.get('serviceId');
    const date = searchParams.get('date');
    const serviceDuration = parseInt(searchParams.get('duration') || '30');

    if (!providerId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'Provider ID, service ID, and date are required' },
        { status: 400 }
      );
    }

    // Get the date range for the requested day
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing appointments for this provider on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        providerId: providerId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['confirmed', 'in_progress']
        }
      },
      orderBy: { appointmentDate: 'asc' }
    });

    // Get provider unavailability for this date
    const unavailablePeriods = await prisma.providerUnavailability.findMany({
      where: {
        providerId: providerId,
        OR: [
          {
            // All day unavailability
            allDay: true,
            startDate: {
              lte: endOfDay
            },
            endDate: {
              gte: startOfDay
            }
          },
          {
            // Partial day unavailability
            allDay: false,
            startDate: {
              lte: endOfDay
            },
            endDate: {
              gte: startOfDay
            }
          }
        ]
      }
    });

    // Generate possible time slots (every 30 minutes from 9 AM to 8 PM)
    const allSlots: string[] = [];
    for (let hour = 9; hour < 20; hour++) {
      for (const minute of [0, 30]) {
        // Skip lunch hour (1-2 PM)
        if (hour === 13) continue;
        
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        allSlots.push(timeSlot);
      }
    }

    // Filter out unavailable slots
    const availableSlots = allSlots.filter(slot => {
      const [hours, minutes] = slot.split(':');
      const slotStart = new Date(requestedDate);
      slotStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

      // Check if slot conflicts with existing appointments
      const conflictsWithAppointment = existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.appointmentDate);
        const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration * 60000);

        // Check for overlap: new slot overlaps if it starts before existing ends and ends after existing starts
        return (
          (slotStart < appointmentEnd) && (slotEnd > appointmentStart)
        );
      });

      if (conflictsWithAppointment) return false;

      // Check if slot conflicts with unavailable periods
      const conflictsWithUnavailability = unavailablePeriods.some(period => {
        if (period.allDay) {
          // If provider is unavailable all day
          const unavailableStart = new Date(period.startDate);
          const unavailableEnd = new Date(period.endDate);
          unavailableStart.setHours(0, 0, 0, 0);
          unavailableEnd.setHours(23, 59, 59, 999);
          
          return slotStart >= unavailableStart && slotStart <= unavailableEnd;
        } else {
          // Partial day unavailability
          const unavailableStart = new Date(period.startDate);
          const unavailableEnd = new Date(period.endDate);
          
          return (
            (slotStart < unavailableEnd) && (slotEnd > unavailableStart)
          );
        }
      });

      if (conflictsWithUnavailability) return false;

      // Check if there's enough time until the next appointment
      const nextAppointment = existingAppointments.find(appointment => {
        const appointmentStart = new Date(appointment.appointmentDate);
        return appointmentStart > slotEnd;
      });

      if (nextAppointment) {
        const nextAppointmentStart = new Date(nextAppointment.appointmentDate);
        const timeUntilNext = nextAppointmentStart.getTime() - slotStart.getTime();
        const requiredTime = serviceDuration * 60000;
        
        if (timeUntilNext < requiredTime) {
          return false;
        }
      }

      return true;
    });

    return NextResponse.json({
      date: date,
      providerId: providerId,
      serviceId: serviceId,
      serviceDuration: serviceDuration,
      availableSlots: availableSlots,
      existingAppointments: existingAppointments.map(apt => ({
        id: apt.id,
        startTime: apt.appointmentDate,
        endTime: new Date(apt.appointmentDate.getTime() + apt.duration * 60000),
        duration: apt.duration,
        serviceName: apt.serviceName
      }))
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}