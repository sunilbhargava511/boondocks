import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const providerManager = {
  async getProviderByEmail(email: string) {
    try {
      return await prisma.providerAccount.findUnique({
        where: { email: email.toLowerCase() }
      });
    } catch (error) {
      console.error('Error fetching provider:', error);
      return null;
    }
  },

  async updateProviderPassword(email: string, passwordHash: string) {
    try {
      return await prisma.providerAccount.update({
        where: { email: email.toLowerCase() },
        data: { passwordHash }
      });
    } catch (error) {
      console.error('Error updating provider password:', error);
      throw error;
    }
  },

  async createProvider(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    providerId: string;
    phone?: string;
  }) {
    try {
      const passwordHash = await bcrypt.hash(data.password, 10);
      
      return await prisma.providerAccount.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          providerId: data.providerId,
          phone: data.phone,
        }
      });
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  }
};